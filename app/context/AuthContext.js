'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/apiConfig';

// Create context
const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

// Responses from a proxy or a crashed server may not be JSON; never let that surface as a parse error.
const readJson = async (response) => {
    try {
        return await response.json();
    } catch {
        return {};
    }
};

// The signed-in user is kept for a few minutes so a reload does not have to ask the server who is signed in.
// It only drives what the page shows: the token still decides what the API allows. After the window the user is
// re-read in the background, so a changed plan or role shows up without blocking the page.
const USER_CACHE_KEY = 'user';
const USER_CACHE_MS = 5 * 60 * 1000;

const readCachedUser = () => {
    try {
        const cached = JSON.parse(localStorage.getItem(USER_CACHE_KEY));
        return cached?.user && typeof cached.at === 'number' ? cached : null;
    } catch {
        return null;
    }
};

const clearTokens = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem(USER_CACHE_KEY);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    // Whether a saved session exists, known the moment the page mounts (null before that, during server rendering).
    // The /me check below takes a network round trip; this lets signed-out and signed-in pages show the right state
    // straight away instead of showing signed-out until that check finishes.
    const [hasSavedSession, setHasSavedSession] = useState(null);
    const [error, setError] = useState(null);
    const router = useRouter();

    // Lets the stable callbacks below read the latest user without being recreated.
    const userRef = useRef(null);
    userRef.current = user;
    const refreshInFlight = useRef(null);
    // The user object that came out of the saved copy: writing it back would restart its five minutes
    const restoredUser = useRef(null);
    // True between an explicit sign-out and the next sign-in, so route guards don't hijack the redirect.
    const signedOutByUser = useRef(false);

    // Token refresh helper. Concurrent callers share one request, so a rotated refresh token is never spent twice.
    const refreshToken = useCallback(() => {
        if (refreshInFlight.current) return refreshInFlight.current;

        const run = async () => {
            const stored = localStorage.getItem('refreshToken');
            if (!stored) throw new Error('No refresh token available');

            const response = await fetch(getApiUrl('/api/auth/refresh-token'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: stored }),
            });

            const data = await readJson(response);
            if (!response.ok) {
                // Only a rejected token ends the session; a server hiccup (5xx) should not sign the user out.
                if (response.status >= 400 && response.status < 500) clearTokens();
                throw new Error(data.message || 'Failed to refresh token');
            }

            localStorage.setItem('token', data.data.token);
            if (data.data.refreshToken) {
                localStorage.setItem('refreshToken', data.data.refreshToken);
            }
            return data.data;
        };

        refreshInFlight.current = run().finally(() => {
            refreshInFlight.current = null;
        });
        return refreshInFlight.current;
    }, []);

    // Ask the server who is signed in. Refreshes an expired token once; ends the session if that fails.
    const fetchCurrentUser = useCallback(async () => {
        const me = (token) => fetch(getApiUrl('/api/auth/me'), { headers: { 'Authorization': `Bearer ${token}` } });

        let response = await me(localStorage.getItem('token'));
        if (!response.ok) {
            try {
                await refreshToken();
            } catch {
                // refreshToken() already cleared the tokens if the server rejected them
                return null;
            }
            response = await me(localStorage.getItem('token'));
            if (!response.ok) {
                clearTokens();
                return null;
            }
        }
        return (await response.json()).data.user;
    }, [refreshToken]);

    // Check for existing token on app load
    useEffect(() => {
        let cancelled = false;
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                setHasSavedSession(!!token);

                if (!token) {
                    return;
                }

                // A recent copy of the user: show it now and skip the request
                const cached = readCachedUser();
                if (cached) {
                    restoredUser.current = cached.user;
                    setUser(cached.user);
                    setLoading(false);
                    if (Date.now() - cached.at < USER_CACHE_MS) return;
                }

                const fresh = await fetchCurrentUser();
                if (cancelled) return;
                // A failed check ends the session (tokens cleared) only when we have no user to fall back on
                // after a network error; an explicit rejection comes back as null with the tokens already gone.
                if (fresh) setUser(fresh);
                else if (!localStorage.getItem('token')) setUser(null);
            } catch (err) {
                console.error('Auth check error:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        checkAuth();
        return () => {
            cancelled = true;
        };
    }, [fetchCurrentUser]);

    // Keep the saved copy of the user in step with every change (sign-in, profile edit, plan change...)
    useEffect(() => {
        if (!user || user === restoredUser.current) return;
        try {
            localStorage.setItem(USER_CACHE_KEY, JSON.stringify({ user, at: Date.now() }));
        } catch {
            // storage full or blocked: the copy is only a shortcut
        }
    }, [user]);

    // API request helper with token handling
    const apiRequest = useCallback(async (endpoint, options = {}) => {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) headers['Authorization'] = `Bearer ${token}`;

        let response = await fetch(getApiUrl(endpoint), { ...options, headers });

        // Handle token refresh
        if (response.status === 401 && token) {
            try {
                await refreshToken();
                const newToken = localStorage.getItem('token');
                headers['Authorization'] = `Bearer ${newToken}`;
                response = await fetch(getApiUrl(endpoint), { ...options, headers });
            } catch (err) {
                clearTokens();
                setUser(null);
                router.push('/auth');
                throw new Error('Session expired. Please login again.');
            }
        }

        const data = await readJson(response);
        if (!response.ok) throw new Error(data.message || 'Request failed');
        return data;
    }, [refreshToken, router]);

    // Re-read the signed-in user from the server (e.g. after a plan change).
    const refreshUser = useCallback(async () => {
        const data = await apiRequest('/api/auth/me', { method: 'GET' });
        setUser(data.data.user);
        return data.data.user;
    }, [apiRequest]);

    // Sign up function. The API creates an unverified account and returns no session,
    // so nothing is stored and the user stays signed out until they verify and log in.
    const signup = useCallback(async (email, password, name = '') => {
        setError(null);

        const response = await fetch(getApiUrl('/api/auth/register'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name }),
        });

        const data = await readJson(response);
        if (!response.ok) throw new Error(data.message || 'Registration failed');

        if (data.data?.token && data.data?.refreshToken) {
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('refreshToken', data.data.refreshToken);
            setUser(data.data.user);
        }
        return data.data?.user;
    }, []);

    // Login function. Navigation after sign-in is left to the caller (it knows where the user was headed).
    const login = useCallback(async (email, password) => {
        setError(null);

        const response = await fetch(getApiUrl('/api/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await readJson(response);
        if (!response.ok) {
            if (data.code === 'email_not_verified') {
                throw new Error('email_not_verified');
            }
            throw new Error(data.message || 'Authentication failed');
        }

        localStorage.setItem('token', data.data.token);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        signedOutByUser.current = false;
        setUser(data.data.user);
        return data.data.user;
    }, []);

    // Logout function
    const logout = useCallback(async (redirectTo = '/auth') => {
        signedOutByUser.current = true;
        clearTokens();
        setUser(null);
        router.push(redirectTo);
    }, [router]);

    // Request password reset (forgot password)
    const resetPassword = useCallback(async (email) => {
        setError(null);

        try {
            const response = await fetch(getApiUrl('/api/auth/forgot-password'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await readJson(response);

            if (!response.ok) {
                throw new Error(data.message || 'Failed to initiate password reset');
            }

            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Complete password reset with token
    const completePasswordReset = useCallback(async (token, userId, password) => {
        setError(null);

        try {
            const response = await fetch(getApiUrl('/api/auth/reset-password'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, userId, password }),
            });

            const data = await readJson(response);

            if (!response.ok) {
                throw new Error(data.message || 'Failed to reset password');
            }

            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Update user profile
    const updateUserProfile = async (userData) => {
        setError(null);

        try {
            if (!user) {
                throw new Error('No authenticated user');
            }

            const data = await apiRequest('/api/users/me', {
                method: 'PATCH',
                body: JSON.stringify(userData)
            });

            setUser({ ...user, ...data.data.user });
            return data.data.user;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Change password
    const changePassword = async (currentPassword, newPassword) => {
        setError(null);

        try {
            if (!user) {
                throw new Error('No authenticated user');
            }

            await apiRequest('/api/users/change-password', {
                method: 'PATCH',
                body: JSON.stringify({ currentPassword, newPassword })
            });

            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Request email verification resend. The endpoint only needs an email address, so this works
    // for signed-out users too: pass the address they typed, or it falls back to the signed-in user's.
    const resendVerificationEmail = useCallback(async (email) => {
        setError(null);

        try {
            const target = email || userRef.current?.email;
            if (!target) {
                throw new Error('No email address to send to');
            }

            const response = await fetch(getApiUrl('/api/auth/resend-verification'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: target }),
            });

            const data = await readJson(response);

            if (!response.ok) {
                throw new Error(data.message || 'Failed to resend verification email');
            }

            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Verify email with token
    const verifyEmail = useCallback(async (token, userId) => {
        try {
            // Properly append query parameters to the URL
            const base = getApiUrl('/api/auth/verify-email');
            const url = new URL(base, window.location.origin);
            url.searchParams.append('token', token);
            url.searchParams.append('userId', userId);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await readJson(response);

            if (!response.ok) {
                throw new Error(data.message || 'Failed to verify email');
            }

            // Update user state if this is the current user
            const current = userRef.current;
            if (current && current.id === userId) {
                setUser({ ...current, emailVerified: true });
            }

            return true;
        } catch (err) {
            // Deliberately not stored in context state: updating state here re-renders every consumer,
            // and the page already shows its own message.
            throw err;
        }
    }, []);

    // Check if email needs verification
    const checkEmailVerification = () => {
        return user && !user.emailVerified;
    };

    // Role-based authorization helpers
    const hasRole = (role) => {
        return user && user.role === role;
    };

    const isAdmin = () => {
        return hasRole('admin');
    };

    // Update user role - only admin can change roles
    const updateUserRole = async (userId, newRole) => {
        setError(null);

        try {
            if (!user || user.role !== 'admin') {
                throw new Error('Unauthorized: Only admins can change roles');
            }

            if (!['user', 'admin'].includes(newRole)) {
                throw new Error('Invalid role');
            }

            await apiRequest(`/api/users/${userId}`, {
                method: 'PATCH',
                body: JSON.stringify({ role: newRole })
            });

            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Make admin (for admin creation endpoint)
    const makeAdmin = async (email, password, displayName, existingUserId = null) => {
        setError(null);

        try {
            if (!user || user.role !== 'admin') {
                throw new Error('Unauthorized: Only admins can create other admins');
            }

            const requestBody = existingUserId
                ? { existingUserId }
                : { email, password, displayName };

            const data = await apiRequest('/api/admin/create', {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return data.data.user;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Initial admin setup (first admin setup)
    const setupInitialAdmin = async (email, password, displayName, setupToken) => {
        setError(null);

        try {
            const response = await fetch(getApiUrl('/api/admin/initial-setup'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    displayName,
                    setupToken
                }),
            });

            const data = await readJson(response);

            if (!response.ok) {
                throw new Error(data.message || 'Initial admin setup failed');
            }

            // Store tokens if they were returned
            if (data.data.token) {
                localStorage.setItem('token', data.data.token);
            }
            if (data.data.refreshToken) {
                localStorage.setItem('refreshToken', data.data.refreshToken);
            }

            setUser(data.data.user);
            return data.data.user;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Get list of admins
    const getAdminList = async () => {
        setError(null);

        try {
            if (!user || user.role !== 'admin') {
                throw new Error('Unauthorized: Only admins can view admin list');
            }

            const data = await apiRequest('/api/admin/list', {
                method: 'GET'
            });

            return data.data.admins;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Revoke admin privileges
    const revokeAdmin = async (userId) => {
        setError(null);

        try {
            if (!user || user.role !== 'admin') {
                throw new Error('Unauthorized: Only admins can revoke admin privileges');
            }

            if (userId === user.id) {
                throw new Error('You cannot revoke your own admin privileges');
            }

            await apiRequest(`/api/admin/revoke/${userId}`, {
                method: 'PATCH'
            });

            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const value = {
        user,
        loading,
        error,
        signup,
        login,
        logout,
        resetPassword,
        completePasswordReset,
        getCurrentUser: () => user,
        updateUserProfile,
        changePassword,
        isAuthenticated: () => !!user,
        verifyEmail,
        resendVerificationEmail,
        checkEmailVerification,
        hasRole,
        isAdmin,
        updateUserRole,
        apiRequest, // Expose apiRequest for other components to use
        refreshUser,
        hasSignedOut: () => signedOutByUser.current,
        // 'in' | 'out' | 'pending' for UI that differs by sign-in state without waiting for the server to confirm it.
        // A saved session counts as 'in' until the check says otherwise; 'pending' only before the page has mounted.
        authView: user ? 'in' : !loading ? 'out' : hasSavedSession === null ? 'pending' : hasSavedSession ? 'in' : 'out',
        // New admin management functions
        makeAdmin,
        setupInitialAdmin,
        getAdminList,
        revokeAdmin
    };

    // Children always render: each protected area shows its own skeleton while `loading` is true,
    // so public pages (landing, auth) are server-rendered instead of replaced by a bare "Loading...".
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
