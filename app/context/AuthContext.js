'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/apiConfig';

// Create context
const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    // Check for existing token on app load
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('token');

                if (!token) {
                    setLoading(false);
                    return;
                }

                const response = await fetch(getApiUrl('/api/auth/me'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUser(data.data.user);
                } else {
                    // Try refreshing token
                    try {
                        await refreshToken();
                        const newToken = localStorage.getItem('token');
                        const newResponse = await fetch(getApiUrl('/api/auth/me'), {
                            headers: { 'Authorization': `Bearer ${newToken}` }
                        });

                        if (newResponse.ok) {
                            const data = await newResponse.json();
                            setUser(data.data.user);
                        } else {
                            localStorage.removeItem('token');
                            localStorage.removeItem('refreshToken');
                        }
                    } catch (err) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('refreshToken');
                    }
                }
            } catch (err) {
                console.error('Auth check error:', err);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Token refresh helper
    const refreshToken = async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token available');

        const response = await fetch(getApiUrl('/api/auth/refresh-token'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        const data = await response.json();
        if (!response.ok) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            throw new Error(data.message || 'Failed to refresh token');
        }

        localStorage.setItem('token', data.data.token);
        if (data.data.refreshToken) {
            localStorage.setItem('refreshToken', data.data.refreshToken);
        }
        return data.data;
    };


    // API request helper with token handling
    const apiRequest = async (endpoint, options = {}) => {
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
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                setUser(null);
                router.push('/auth');
                throw new Error('Session expired. Please login again.');
            }
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Request failed');
        return data;
    };

    // Sign up function
    const signup = async (email, password, name = '') => {
        setError(null);

        const response = await fetch(getApiUrl('/api/auth/register'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Registration failed');

        localStorage.setItem('token', data.data.token);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        setUser(data.data.user);
        return data.data.user;
    };

    // Login function
    const login = async (email, password) => {
        setError(null);

        const response = await fetch(getApiUrl('/api/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (!response.ok) {
            if (data.code === 'email_not_verified') {
                throw new Error('email_not_verified');
            }
            throw new Error(data.message || 'Authentication failed');
        }

        localStorage.setItem('token', data.data.token);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        setUser(data.data.user);
        router.push('/dashboard');
        return data.data.user;
    };

    // Logout function
    const logout = async () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setUser(null);
        router.push('/auth');
    };

    // Login without verification (for resending verification email)
    const loginWithoutVerification = async (email, password) => {
        setError(null);

        try {
            // Try to login but catch email_not_verified error
            const response = await fetch(getApiUrl('/api/auth/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            // If it's the email_not_verified error, we can proceed
            if (!response.ok) {
                if (data.code === 'email_not_verified' && data.data?.user) {
                    // Set the user without saving the token
                    setUser(data.data.user);
                    return data.data.user;
                }

                throw new Error(data.message || 'Authentication failed');
            }

            // If we get here, the login succeeded normally
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('refreshToken', data.data.refreshToken);

            setUser(data.data.user);
            return data.data.user;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Request password reset (forgot password)
    const resetPassword = async (email) => {
        setError(null);

        try {
            const response = await fetch(getApiUrl('/api/auth/forgot-password'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to initiate password reset');
            }

            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Complete password reset with token
    const completePasswordReset = async (token, userId, password) => {
        setError(null);

        try {
            const response = await fetch(getApiUrl('/api/auth/reset-password'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, userId, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to reset password');
            }

            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

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

    // Request email verification resend
    const resendVerificationEmail = async () => {
        setError(null);

        try {
            if (!user) {
                throw new Error('No authenticated user');
            }

            const response = await fetch(getApiUrl('/api/auth/resend-verification'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: user.email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to resend verification email');
            }

            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Verify email with token
    const verifyEmail = async (token, userId) => {
        setError(null);

        try {
            // Properly append query parameters to the URL
            const url = new URL(getApiUrl('/api/auth/verify-email'));
            url.searchParams.append('token', token);
            url.searchParams.append('userId', userId);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to verify email');
            }

            // Update user state if this is the current user
            if (user && user.id === userId) {
                setUser({
                    ...user,
                    emailVerified: true
                });
            }

            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

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
        setLoading(true);

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

            const data = await response.json();

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
        } finally {
            setLoading(false);
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

    return (
        <AuthContext.Provider value={{
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
            loginWithoutVerification,
            hasRole,
            isAdmin,
            updateUserRole,
            apiRequest, // Expose apiRequest for other components to use
            // New admin management functions
            makeAdmin,
            setupInitialAdmin,
            getAdminList,
            revokeAdmin
        }}>
            {!loading ? children : <div>Loading...</div>}
        </AuthContext.Provider>
    );
};