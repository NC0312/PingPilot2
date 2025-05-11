// context/AuthContext.js
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config'; // Adjust the path as necessary

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Get user role from Firestore
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    setUser({
                        uid: user.uid,
                        email: user.email,
                        emailVerified: user.emailVerified,
                        role: userSnap.data().role || 'user',
                        ...userSnap.data()
                    });
                } else {
                    setUser({
                        uid: user.uid,
                        email: user.email,
                        emailVerified: user.emailVerified,
                        role: 'user'
                    });
                }
            } else {
                setUser(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signup = async (email, password, name) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Add user to Firestore with default role
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                name,
                email,
                role: 'user',
                createdAt: new Date().toISOString()
            });

            // Send email verification
            await sendEmailVerification(userCredential.user);

            return userCredential.user;
        } catch (error) {
            throw error;
        }
    };

    const login = async (email, password) => {
        try {
            return await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        setUser(null);
        await signOut(auth);
    };

    const sendVerificationEmail = async () => {
        if (auth.currentUser) {
            await sendEmailVerification(auth.currentUser);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, sendVerificationEmail }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};