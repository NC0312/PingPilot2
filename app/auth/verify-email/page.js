// app/auth/verify-email/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Mail, CheckCircle, AlertTriangle, Loader } from 'lucide-react';

export default function VerifyEmailPage() {
    const [verifying, setVerifying] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const searchParams = useSearchParams();
    const router = useRouter();
    const { verifyEmailCode } = useAuth();

    useEffect(() => {
        const verifyEmail = async () => {
            const oobCode = searchParams.get('oobCode');

            if (!oobCode) {
                setError('Invalid verification link. No verification code found.');
                setVerifying(false);
                return;
            }

            try {
                await verifyEmailCode(oobCode);
                setSuccess(true);
                // Redirect to dashboard after 3 seconds
                setTimeout(() => {
                    router.push('/dashboard');
                }, 3000);
            } catch (error) {
                console.error('Error verifying email:', error);
                let errorMessage = 'Failed to verify your email. The link may have expired or already been used.';

                if (error.code) {
                    switch (error.code) {
                        case 'auth/invalid-action-code':
                            errorMessage = 'The verification link is invalid or has expired.';
                            break;
                        case 'auth/user-not-found':
                            errorMessage = 'User account not found.';
                            break;
                        default:
                            errorMessage = error.message || 'Failed to verify your email.';
                    }
                }

                setError(errorMessage);
            } finally {
                setVerifying(false);
            }
        };

        verifyEmail();
    }, [searchParams, verifyEmailCode, router]);

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-[#031D27] px-4 py-12">
            <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-8 text-center">
                {verifying && (
                    <div className="flex flex-col items-center justify-center">
                        <Loader className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                        <h2 className="text-xl font-semibold text-white mb-2">
                            Verifying your email
                        </h2>
                        <p className="text-gray-400">
                            Please wait while we verify your email address...
                        </p>
                    </div>
                )}

                {!verifying && success && (
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-10 w-10 text-green-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">
                            Email Verified!
                        </h2>
                        <p className="text-gray-400 mb-4">
                            Your email has been successfully verified. You can now access all features of Ping Pilot.
                        </p>
                        <p className="text-blue-400 text-sm">
                            Redirecting to dashboard in a few seconds...
                        </p>
                    </div>
                )}

                {!verifying && error && (
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="h-10 w-10 text-red-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">
                            Verification Failed
                        </h2>
                        <p className="text-gray-400 mb-6">
                            {error}
                        </p>
                        <div className="flex flex-col space-y-3">
                            <button
                                onClick={() => router.push('/auth')}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                            >
                                Return to Login
                            </button>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}