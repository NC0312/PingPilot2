// app/auth/verify-email/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Server, AlertTriangle, Check, MailCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const USERS_COLLECTION = 'users';

export default function VerifyEmailPage() {
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();

    // Get token and userId from URL params
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    // Verify email token on page load
    useEffect(() => {
        const verifyEmail = async () => {
            setLoading(true);

            if (!token || !userId) {
                setError('Invalid verification link. Please try again or request a new verification email.');
                setLoading(false);
                return;
            }

            try {
                // Get user data
                const userRef = doc(db, USERS_COLLECTION, userId);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    setError('User not found. Please check your verification link.');
                    setLoading(false);
                    return;
                }

                const userData = userSnap.data();

                // Check if token matches and is not expired
                if (userData.verificationToken !== token) {
                    setError('Invalid verification token. Please request a new verification email.');
                    setLoading(false);
                    return;
                }

                if (!userData.verificationTokenExpiry || userData.verificationTokenExpiry < Date.now()) {
                    setError('Verification link has expired. Please request a new verification email.');
                    setLoading(false);
                    return;
                }

                // Update user as verified
                await updateDoc(userRef, {
                    emailVerified: true,
                    verificationToken: null,
                    verificationTokenExpiry: null
                });

                setSuccess(true);
            } catch (err) {
                console.error('Email verification error:', err);
                setError('Failed to verify email. The link may have expired or is invalid.');
            } finally {
                setLoading(false);
            }
        };

        if (token && userId) {
            verifyEmail();
        } else {
            setLoading(false);
        }
    }, [token, userId]);

    // Function to resend verification email
    const resendVerification = async () => {
        if (!user) {
            setError('You need to be logged in to resend verification.');
            return;
        }

        setVerifying(true);
        setError(null);

        try {
            // Call the API to resend verification email
            const response = await fetch('/api/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: user.email,
                    name: user.displayName || '',
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send verification email');
            }

            setSuccess(true);
        } catch (err) {
            console.error('Resend verification error:', err);
            setError('Failed to send verification email. Please try again.');
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-[#031D27] px-4 py-12">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Server size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Ping Pilot</h1>
            <p className="text-blue-300 mb-8">Server monitoring made simple</p>

            <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-8">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center">
                        <MailCheck size={32} className="text-blue-400" />
                    </div>
                </div>

                <h2 className="text-xl font-semibold text-white text-center mb-2">
                    Email Verification
                </h2>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-gray-300">Verifying your email address...</p>
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-3 mb-4 flex items-start">
                                <AlertTriangle className="text-red-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                                <p className="text-red-200 text-sm">{error}</p>
                            </div>
                        )}

                        {success ? (
                            <div className="text-center">
                                <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-4 mb-6">
                                    <Check className="text-green-500 mx-auto mb-2" size={24} />
                                    <p className="text-green-200 text-sm">
                                        Your email has been successfully verified!
                                        You can now access all features of your account.
                                    </p>
                                </div>

                                <Link
                                    href="/"
                                    className="w-full bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-900 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center block mb-3"
                                >
                                    Go to Dashboard
                                </Link>

                                <Link
                                    href="/auth"
                                    className="text-blue-400 hover:text-blue-300 text-sm"
                                >
                                    Return to Login
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="text-gray-400 mb-6">
                                    {token && userId
                                        ? "We're having trouble verifying your email. Please try again or request a new verification link."
                                        : "Please verify your email address to access all features."}
                                </p>

                                <button
                                    onClick={resendVerification}
                                    disabled={verifying}
                                    className={`w-full ${verifying ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} 
                                    focus:ring-4 focus:ring-blue-900 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors mb-4`}
                                >
                                    {verifying ? (
                                        <div className="flex justify-center items-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Sending...
                                        </div>
                                    ) : (
                                        <div className="flex justify-center items-center">
                                            <RefreshCw size={16} className="mr-2" />
                                            Resend Verification Email
                                        </div>
                                    )}
                                </button>

                                <Link
                                    href="/auth"
                                    className="text-blue-400 hover:text-blue-300 text-sm"
                                >
                                    Return to Login
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}