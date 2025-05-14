'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    setDoc,
    getDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

const USERS_COLLECTION = 'users';
const SESSIONS_COLLECTION = 'sessions';
const SESSION_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const route = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const sessionId = localStorage.getItem('sessionId');

                if (!sessionId) {
                    setLoading(false);
                    return;
                }

                const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
                const sessionSnap = await getDoc(sessionRef);

                if (!sessionSnap.exists()) {
                    localStorage.removeItem('sessionId');
                    setLoading(false);
                    return;
                }

                const sessionData = sessionSnap.data();

                if (sessionData.expiresAt < Date.now()) {
                    await deleteDoc(sessionRef);
                    localStorage.removeItem('sessionId');
                    setLoading(false);
                    return;
                }

                const userRef = doc(db, USERS_COLLECTION, sessionData.userId);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    localStorage.removeItem('sessionId');
                    setLoading(false);
                    return;
                }

                const userData = userSnap.data();
                delete userData.password;

                setUser(userData);
            } catch (err) {
                console.error('Error checking session:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    const createSession = async (userId) => {
        const sessionId = uuidv4();
        const sessionData = {
            sessionId,
            userId,
            createdAt: Date.now(),
            expiresAt: Date.now() + SESSION_EXPIRY,
        };

        await setDoc(doc(db, SESSIONS_COLLECTION, sessionId), sessionData);
        localStorage.setItem('sessionId', sessionId);
        return sessionId;
    };

    // Send verification email
    const sendVerificationEmail = async (userId, email, name = '') => {
        try {
            const verificationToken = uuidv4();
            const expiryTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

            // Update user with verification token
            const userRef = doc(db, USERS_COLLECTION, userId);
            await updateDoc(userRef, {
                verificationToken,
                verificationTokenExpiry: expiryTime
            });

            // Call the API to send verification email
            const response = await fetch('/api/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    name,
                    userId
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send verification email');
            }

            return true;
        } catch (err) {
            console.error('Error sending verification email:', err);
            throw err;
        }
    };

    // Verify email with token
    const verifyEmail = async (token, userId) => {
        try {
            const userRef = doc(db, USERS_COLLECTION, userId);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                throw new Error('User not found');
            }

            const userData = userSnap.data();

            if (userData.verificationToken !== token) {
                throw new Error('Invalid verification token');
            }

            if (!userData.verificationTokenExpiry || userData.verificationTokenExpiry < Date.now()) {
                throw new Error('Verification token has expired');
            }

            await updateDoc(userRef, {
                emailVerified: true,
                verificationToken: null,
                verificationTokenExpiry: null
            });

            // Update user state if this is the current user
            if (user && user.uid === userId) {
                setUser({
                    ...user,
                    emailVerified: true
                });
            }

            return true;
        } catch (err) {
            console.error('Error verifying email:', err);
            throw err;
        }
    };

    // Sign up function
    const signup = async (email, password, name = '') => {
        setError(null);
        try {
            const usersRef = collection(db, USERS_COLLECTION);
            const q = query(usersRef, where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                throw new Error('Email already in use');
            }

            const hashedPassword = await bcryptjs.hash(password, 10);
            const uid = uuidv4();
            const userData = {
                uid,
                email,
                password: hashedPassword,
                displayName: name,
                emailVerified: false,
                createdAt: Date.now(),
                role: 'user', // Default role is 'user'
                subscription: 'free' // Default subscription
            };

            await setDoc(doc(db, USERS_COLLECTION, uid), userData);
            await createSession(uid);

            // Send verification email
            await sendVerificationEmail(uid, email, name);

            const userDataToReturn = { ...userData };
            delete userDataToReturn.password;
            setUser(userDataToReturn);

            return userDataToReturn;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const login = async (email, password) => {
        setError(null);
        try {
            const usersRef = collection(db, USERS_COLLECTION);
            const q = query(usersRef, where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error('No user found with this email');
            }

            const userData = querySnapshot.docs[0].data();

            if (!await bcryptjs.compare(password, userData.password)) {
                throw new Error('Incorrect password');
            }

            // Check if the email is verified
            if (!userData.emailVerified) {
                throw new Error('email_not_verified');
            }

            await createSession(userData.uid);

            const userDataToReturn = { ...userData };
            delete userDataToReturn.password;
            setUser(userDataToReturn);
            route.push('/dashboard'); // Redirect to dashboard after login
            return userDataToReturn;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const loginWithoutVerification = async (email, password) => {
        setError(null);
        try {
            const usersRef = collection(db, USERS_COLLECTION);
            const q = query(usersRef, where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error('No user found with this email');
            }

            const userData = querySnapshot.docs[0].data();

            if (!await bcryptjs.compare(password, userData.password)) {
                throw new Error('Incorrect password');
            }

            // Set user without creating a session
            const userDataToReturn = { ...userData };
            delete userDataToReturn.password;
            setUser(userDataToReturn);

            return userDataToReturn;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const loginWithGoogle = async () => {
        setError('Google sign-in not implemented with custom auth solution');
        throw new Error('Google sign-in not implemented with custom auth solution');
    };

    const resetPassword = async (email) => {
        setError(null);
        try {
            const usersRef = collection(db, USERS_COLLECTION);
            const q = query(usersRef, where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error('No user found with this email');
            }

            const userData = querySnapshot.docs[0].data();
            const userId = userData.uid;

            // Generate reset token and expiry
            const resetToken = uuidv4();
            const resetTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

            // Update user with reset token
            await updateDoc(querySnapshot.docs[0].ref, {
                resetToken,
                resetTokenExpiry
            });

            // Call the API to send reset email
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send reset email');
            }

            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const updateUserProfile = async (userData) => {
        setError(null);
        try {
            if (!user) {
                throw new Error('No authenticated user');
            }

            const userRef = doc(db, USERS_COLLECTION, user.uid);
            delete userData.password;

            await updateDoc(userRef, userData);
            setUser({ ...user, ...userData });

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

            await sendVerificationEmail(user.uid, user.email, user.displayName || '');
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

    // Enhanced logout function with proper cleanup
    const logout = async () => {
        setError(null);
        try {
            const sessionId = localStorage.getItem('sessionId');

            if (sessionId) {
                // Delete session from Firestore
                await deleteDoc(doc(db, SESSIONS_COLLECTION, sessionId));
                // Remove session from localStorage
                localStorage.removeItem('sessionId');
            }

            // Clear user state
            setUser(null);
            return true;
        } catch (err) {
            console.error('Logout error:', err);
            setError(err.message);
            throw err;
        }
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

            const userRef = doc(db, USERS_COLLECTION, userId);
            await updateDoc(userRef, { role: newRole });

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
            loginWithGoogle,
            logout,
            resetPassword,
            getCurrentUser: () => user,
            updateUserProfile,
            isAuthenticated: () => !!user,
            sendVerificationEmail,
            verifyEmail,
            resendVerificationEmail,
            checkEmailVerification,
            loginWithoutVerification,
            hasRole,
            isAdmin,
            updateUserRole
        }}>
            {!loading ? children : <div>Loading...</div>}
        </AuthContext.Provider>
    );
};