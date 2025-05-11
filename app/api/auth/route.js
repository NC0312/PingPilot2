// app/api/auth/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase/config';

// Login API route
export async function POST(request) {
    try {
        const { email, password, action } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
        }

        // Login
        if (action === 'login') {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const token = await userCredential.user.getIdToken();

            // Get user data from Firestore
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
            const userData = userDoc.exists() ? userDoc.data() : {};

            // Set cookie with token
            cookies().set({
                name: 'authToken',
                value: token,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            });

            return NextResponse.json({
                success: true,
                user: {
                    uid: userCredential.user.uid,
                    email: userCredential.user.email,
                    emailVerified: userCredential.user.emailVerified,
                    ...userData
                }
            });
        }

        // Register
        if (action === 'register') {
            const { name } = await request.json();

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);
            const token = await userCredential.user.getIdToken();

            // Add user to Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                name,
                email,
                role: 'user',
                createdAt: new Date().toISOString()
            });

            // Set cookie with token
            cookies().set({
                name: 'authToken',
                value: token,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            });

            return NextResponse.json({
                success: true,
                user: {
                    uid: userCredential.user.uid,
                    email: userCredential.user.email,
                    emailVerified: userCredential.user.emailVerified,
                    name
                }
            });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Authentication error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
}

// Logout API route
export async function DELETE(request) {
    // Clear auth cookie
    cookies().delete('authToken');

    return NextResponse.json({ success: true });
}