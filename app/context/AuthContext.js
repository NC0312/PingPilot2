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

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

const USERS_COLLECTION = 'users';
const SESSIONS_COLLECTION = 'sessions';
const SESSION_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                photoURL: null,
                emailVerified: false,
                createdAt: Date.now(),
            };

            await setDoc(doc(db, USERS_COLLECTION, uid), userData);
            await createSession(uid);

            // Send verification email
            // await sendVerificationEmail(uid, email);

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

            await createSession(userData.uid);

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

            const newPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcryptjs.hash(newPassword, 10);

            await updateDoc(querySnapshot.docs[0].ref, {
                password: hashedPassword
            });

            console.log('New password:', newPassword);
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
            // sendVerificationEmail,
            // verifyEmail
        }}>
            {!loading ? children : <div>Loading...</div>}
        </AuthContext.Provider>
    );
};