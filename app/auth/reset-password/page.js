'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Lock, Server, AlertTriangle, Check, KeyRound, EyeOff, Eye } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [tokenValid, setTokenValid] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();

    // Get token and userId from URL params
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch
    } = useForm({
        defaultValues: {
            password: '',
            confirmPassword: ''
        }
    });

    const passwordValue = watch('password', '');

    // Verify token on page load
    useEffect(() => {
        const verifyToken = async () => {
            setLoading(true);
            setError(null);

            if (!token || !userId) {
                setError('Invalid reset link. Please request a new password reset link.');
                setLoading(false);
                return;
            }

            try {
                // We don't need to verify the token on the client side immediately
                // Our backend will do that when we submit the form
                // But we can do a basic validation that the token and userId exist
                setTokenValid(true);
                setLoading(false);
            } catch (err) {
                console.error('Error verifying reset token:', err);
                setError('An error occurred. Please try again or request a new reset link.');
                setLoading(false);
            }
        };

        verifyToken();
    }, [token, userId]);

    const onSubmit = async (data) => {
        setProcessing(true);
        setError(null);

        try {
            if (!tokenValid || !token || !userId) {
                throw new Error('Invalid reset token');
            }

            // Make API request to reset password
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    userId,
                    password: data.password
                }),
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to reset password');
            }

            setSuccess(true);
        } catch (err) {
            console.error('Password reset error:', err);
            setError(err.message || 'Failed to reset password. Please try again.');
        } finally {
            setProcessing(false);
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
                        <KeyRound size={32} className="text-blue-400" />
                    </div>
                </div>

                <h2 className="text-xl font-semibold text-white text-center mb-2">
                    Reset Your Password
                </h2>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-gray-300">Verifying your reset link...</p>
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
                                        Your password has been successfully reset!
                                        You can now login with your new password.
                                    </p>
                                </div>

                                <Link
                                    href="/auth"
                                    className="w-full bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-900 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center block"
                                >
                                    Go to Login
                                </Link>
                            </div>
                        ) : tokenValid ? (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <p className="text-gray-400 mb-4">
                                    Create a new password for your account. Make sure it's at least 6 characters long.
                                </p>

                                <div>
                                    <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-300">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            className={`bg-gray-700 border ${errors.password ? 'border-red-500' : 'border-gray-600'} 
                                            text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5`}
                                            placeholder="••••••••"
                                            {...register('password', {
                                                required: 'Password is required',
                                                minLength: {
                                                    value: 6,
                                                    message: 'Password must be at least 6 characters'
                                                }
                                            })}
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-gray-300">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="confirmPassword"
                                            type={showPassword ? "text" : "password"}
                                            className={`bg-gray-700 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-600'} 
                                            text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5`}
                                            placeholder="••••••••"
                                            {...register('confirmPassword', {
                                                required: 'Please confirm your password',
                                                validate: value => value === passwordValue || 'Passwords do not match'
                                            })}
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && (
                                        <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={`w-full ${processing ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} 
                                    focus:ring-4 focus:ring-blue-900 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors`}
                                >
                                    {processing ? (
                                        <div className="flex justify-center items-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Resetting Password...
                                        </div>
                                    ) : (
                                        'Reset Password'
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center py-4">
                                <Link
                                    href="/auth/forgot-password"
                                    className="w-full bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-900 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center block"
                                >
                                    Request New Reset Link
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}