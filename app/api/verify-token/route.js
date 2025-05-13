// Debug version of app/api/verify-token/route.js
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
            console.error('Token is required but missing');
            return NextResponse.json(
                { error: 'Token is required', type: 'missing_token' },
                { status: 400 }
            );
        }

        if (!userId) {
            console.error('User ID is required but missing');
            return NextResponse.json(
                { error: 'User ID is required', type: 'missing_user_id' },
                { status: 400 }
            );
        }

        // First, check for verification token in users collection directly
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();

            // Check if this is a verification token - check both possible property names
            if (userData.verificationToken === token || userData.token === token) {
                const tokenProperty = userData.verificationToken === token ? 'verificationToken' : 'token';

                // Check if token is expired
                const verificationExpiry = userData.verificationTokenExpiry;
                if (verificationExpiry && verificationExpiry < Date.now()) {
                    return NextResponse.json(
                        { error: 'Verification link has expired', type: 'token_expired' },
                        { status: 400 }
                    );
                }

                // Mark email as verified and clear verification tokens
                const updateData = {
                    emailVerified: true,
                    updatedAt: new Date().toISOString()
                };

                // Clear both possible token property names
                updateData.verificationToken = null;
                updateData.token = null;
                updateData.verificationTokenExpiry = null;

                await updateDoc(userRef, updateData);

                // Redirect to the email verification success page
                const successPageUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/auth/verify-email?success=true`;
                return NextResponse.redirect(successPageUrl);
            }

            // Check if this is a password reset token
            if (userData.resetToken === token) {
                // Check if token is expired
                if (userData.resetTokenExpiry && userData.resetTokenExpiry < Date.now()) {
                    return NextResponse.json(
                        { error: 'Reset token has expired', type: 'token_expired' },
                        { status: 400 }
                    );
                }

                // Redirect to the password reset page (the token will be verified again there)
                const resetPageUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/auth/reset-password?token=${token}&userId=${userId}`;
                return NextResponse.redirect(resetPageUrl);
            }

            console.error('Token did not match any known token type');
        } else {
            console.error('User not found:', userId);
        }

        // If we get here, check the emailVerifications collection as fallback (for backward compatibility)
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

        await updateDoc(verificationDoc.ref, {
            used: true,
            usedAt: new Date().toISOString()
        });

        // Update the user's emailVerified status in Firestore
        try {
            await updateDoc(userRef, {
                emailVerified: true,
                updatedAt: new Date().toISOString()
            });
        } catch (userUpdateError) {
            console.error('Error updating user:', userUpdateError);
            // Still return success as the verification itself was successful
        }

        // Redirect to the email verification success page
        const successPageUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/auth/verify-email?success=true`;

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