'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Server, AlertTriangle, Check, MailCheck, RefreshCw, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { getApiUrl } from '@/lib/apiConfig';

export default function VerifyEmailPage() {
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, verifyEmail, resendVerificationEmail } = useAuth();

    // Get token and userId from URL params
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    // Add success parameter detection
    const isSuccess = searchParams.get('success') === 'true';

    // Show success if directed from verify-token route
    useEffect(() => {
        if (isSuccess) {
            setSuccess(true);
            setLoading(false);
        }
    }, [isSuccess]);

    // Verify email token on page load
    useEffect(() => {
        const verifyEmailToken = async () => {
            if (isSuccess) return; // Skip verification if success is in URL

            setLoading(true);

            if (!token || !userId) {
                // No token - just showing the verification needed page
                setLoading(false);
                return;
            }

            try {
                console.log('Attempting to verify email with:', { token, userId });
                // Use the verifyEmail function from AuthContext
                await verifyEmail(token, userId);
                setSuccess(true);
            } catch (err) {
                console.error('Email verification error details:', err);
                setError('Failed to verify email. The link may have expired or is invalid.');
            } finally {
                setLoading(false);
            }
        };

        if ((token && userId) && !isSuccess) {
            verifyEmailToken();
        } else if (!isSuccess) {
            setLoading(false);
        }
    }, [token, userId, isSuccess, verifyEmail]);

    // Function to resend verification email
    const handleResendVerification = async () => {
        if (!user) {
            router.push('/auth');
            return;
        }

        setVerifying(true);
        setError(null);

        try {
            await resendVerificationEmail();
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
                    {token && userId ? 'Email Verification' : 'Verification Required'}
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
                                        {token && userId
                                            ? 'Your email has been successfully verified! You can now access all features of your account.'
                                            : 'Verification email sent! Please check your inbox to confirm your email address.'}
                                    </p>
                                </div>

                                <Link
                                    href="/auth"
                                    className="w-full bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-900 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center block mb-3"
                                >
                                    <div className="flex justify-center items-center">
                                        <LogIn size={16} className="mr-2" />
                                        Go to Login
                                    </div>
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="text-gray-400 mb-6">
                                    {token && userId
                                        ? "We're having trouble verifying your email. Please try again or request a new verification link."
                                        : "Please verify your email address to access all features. Check your inbox for the verification link."}
                                </p>

                                <button
                                    onClick={handleResendVerification}
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