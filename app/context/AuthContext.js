// app/context/AuthContext.js
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    onAuthStateChanged,
    getIdToken
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authToken, setAuthToken] = useState(null);
    const router = useRouter();

    // Initialize auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    // Get the JWT token
                    const token = await getIdToken(firebaseUser);
                    setAuthToken(token);

                    // Store token in localStorage for API requests
                    localStorage.setItem('authToken', token);

                    // Get additional user data from Firestore
                    const userRef = doc(db, 'users', firebaseUser.uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            emailVerified: firebaseUser.emailVerified,
                            role: userSnap.data().role || 'user',
                            ...userSnap.data()
                        });
                    } else {
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            emailVerified: firebaseUser.emailVerified,
                            role: 'user'
                        });
                    }
                } else {
                    // No user is signed in
                    setUser(null);
                    setAuthToken(null);
                    localStorage.removeItem('authToken');
                }
            } catch (error) {
                console.error('Auth state error:', error);
                setUser(null);
                setAuthToken(null);
                localStorage.removeItem('authToken');
            } finally {
                setLoading(false);
            }
        });

        // Cleanup subscription
        return () => unsubscribe();
    }, []);

    // Login function
    const login = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Token is handled in the onAuthStateChanged listener
            return userCredential.user;
        } catch (error) {
            throw error;
        }
    };

    // Signup function
    const signup = async (email, password, name) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Send email verification
            await sendEmailVerification(userCredential.user);

            // Add user to Firestore with default role
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                name,
                email,
                role: 'user',
                createdAt: new Date().toISOString()
            });

            return userCredential.user;
        } catch (error) {
            throw error;
        }
    };

    // Logout function
    const logout = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
            setAuthToken(null);
            localStorage.removeItem('authToken');
            router.push('/auth');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Send password reset email
    const sendPasswordReset = async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            return true;
        } catch (error) {
            throw error;
        }
    };

    // Check if user is authenticated
    const isAuthenticated = () => {
        return !!user && !!authToken;
    };

    // Check if token is valid (simple check - not a full verification)
    const isTokenValid = () => {
        if (!authToken) return false;

        // JWT tokens have 3 parts separated by dots
        const parts = authToken.split('.');
        if (parts.length !== 3) return false;

        try {
            // Decode the payload (middle part)
            const payload = JSON.parse(atob(parts[1]));

            // Check expiration
            const expiryTime = payload.exp * 1000; // Convert to milliseconds
            const currentTime = Date.now();

            return currentTime < expiryTime;
        } catch (e) {
            return false;
        }
    };

    // Get current auth token for API requests
    const getToken = () => authToken;

    // Context value
    const value = {
        user,
        loading,
        login,
        signup,
        logout,
        sendPasswordReset,
        isAuthenticated,
        isTokenValid,
        getToken
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};