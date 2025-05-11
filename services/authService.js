// services/authService.js
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    getIdToken,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// Sign in with email and password
export const signIn = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Get the JWT token
        const token = await getIdToken(userCredential.user);

        // Store token in localStorage
        localStorage.setItem('authToken', token);

        // Get additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

        return {
            user: userCredential.user,
            userData: userDoc.exists() ? userDoc.data() : null,
            token
        };
    } catch (error) {
        throw error;
    }
};

// Sign up with email and password
export const signUp = async (email, password, name) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Send email verification
        await sendEmailVerification(userCredential.user);

        // Get the JWT token
        const token = await getIdToken(userCredential.user);

        // Store token in localStorage
        localStorage.setItem('authToken', token);

        // Add user to Firestore with default role
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            name,
            email,
            role: 'user',
            createdAt: new Date().toISOString()
        });

        return {
            user: userCredential.user,
            token
        };
    } catch (error) {
        throw error;
    }
};

// Sign out
export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
        // Remove token from localStorage
        localStorage.removeItem('authToken');
    } catch (error) {
        throw error;
    }
};

// Get current user with refresh token
export const getCurrentUser = () => {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(
            auth,
            async (user) => {
                unsubscribe();

                if (user) {
                    try {
                        // Refresh the token
                        const token = await getIdToken(user, true);
                        localStorage.setItem('authToken', token);

                        // Get user data from Firestore
                        const userDoc = await getDoc(doc(db, 'users', user.uid));

                        resolve({
                            user,
                            userData: userDoc.exists() ? userDoc.data() : null,
                            token
                        });
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    resolve(null);
                }
            },
            reject
        );
    });
};

// Send password reset email
export const resetPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        throw error;
    }
};

// Get current auth token
export const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

// Check if token is valid (simple check - not a full verification)
export const isTokenValid = () => {
    const token = getAuthToken();
    if (!token) return false;

    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
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