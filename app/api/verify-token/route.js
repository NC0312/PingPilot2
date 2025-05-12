// app/api/verify-token/route.js
import { NextResponse } from 'next/server';
import { db } from '../../firebase/config';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    getDoc
} from 'firebase/firestore';

export async function GET(request) {
    try {
        // Parse the URL to extract the token
        const url = new URL(request.url);
        const token = url.searchParams.get('token');
        const userId = url.searchParams.get('userId');

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required', type: 'missing_token' },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required', type: 'missing_user_id' },
                { status: 400 }
            );
        }

        // Check if the verification record exists
        const verificationQuery = query(
            collection(db, 'emailVerifications'),
            where('token', '==', token),
            where('userId', '==', userId)
        );

        const verificationSnapshot = await getDocs(verificationQuery);

        if (verificationSnapshot.empty) {
            return NextResponse.json(
                { error: 'Invalid verification token', type: 'invalid_token' },
                { status: 400 }
            );
        }

        const verificationDoc = verificationSnapshot.docs[0];
        const verificationData = verificationDoc.data();

        // Check if the token has already been used
        if (verificationData.used) {
            return NextResponse.json(
                { error: 'This verification link has already been used', type: 'token_used' },
                { status: 400 }
            );
        }

        // Check if the token has expired
        const expiresAt = new Date(verificationData.expiresAt).getTime();
        if (expiresAt < Date.now()) {
            return NextResponse.json(
                { error: 'Verification link has expired', type: 'token_expired' },
                { status: 400 }
            );
        }

        // Mark the token as used
        await updateDoc(verificationDoc.ref, {
            used: true,
            usedAt: new Date().toISOString()
        });

        // Update the user's emailVerified status in Firestore
        try {
            // Get user from Firestore
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                // Update user data with verified email status
                await updateDoc(userRef, {
                    emailVerified: true,
                    updatedAt: new Date().toISOString()
                });
                console.log(`User ${userId} email verified successfully`);
            } else {
                console.warn(`User ${userId} not found but verification processed`);
                // Still return success as the verification itself was valid
            }
        } catch (userUpdateError) {
            console.error('Error updating user:', userUpdateError);
            // We'll still return success, as the verification itself was successful
        }

        // Redirect to the email verification success page
        const successPageUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/auth/verify-email`;

        // Return a redirect response
        return NextResponse.redirect(successPageUrl);
    } catch (error) {
        console.error('Error verifying token:', error);
        return NextResponse.json(
            { error: 'Token verification failed', type: 'verification_error', details: error.message },
            { status: 500 }
        );
    }
}