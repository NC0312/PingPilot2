// app/auth/forgot-password/page.js
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft, AlertTriangle, Check } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const { resetPassword } = useAuth();

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            email: ''
        }
    });

    const onSubmit = async (data) => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            await resetPassword(data.email);
            setSuccessMessage('Password reset email sent! Check your inbox for further instructions.');
        } catch (error) {
            console.error('Reset password error:', error);
            let errorMessage = 'Failed to send reset email';

            if (error.code) {
                switch (error.code) {
                    case 'auth/user-not-found':
                        errorMessage = 'No account found with this email address';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Invalid email format';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Too many requests. Please try again later';
                        break;
                    default:
                        errorMessage = error.message || 'Failed to send reset email';
                }
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-[#031D27] px-4 py-12">
            <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-8">
                <div className="mb-6">
                    <Link href="/auth" className="flex items-center text-blue-400 hover:text-blue-300 mb-6">
                        <ArrowLeft size={16} className="mr-2" />
                        Back to login
                    </Link>
                    <h2 className="text-xl font-semibold text-white mb-2">
                        Reset your password
                    </h2>
                    <p className="text-gray-400 text-sm">
                        Enter your email address and we'll send you instructions to reset your password.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-3 mb-4 flex items-start">
                        <AlertTriangle className="text-red-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                        <p className="text-red-200 text-sm">{error}</p>
                    </div>
                )}

                {successMessage && (
                    <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-3 mb-4 flex items-start">
                        <Check className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                        <p className="text-green-200 text-sm">{successMessage}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-300">
                            Email
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="email"
                                type="email"
                                className={`bg-gray-700 border ${errors.email ? 'border-red-500' : 'border-gray-600'
                                    } text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5`}
                                placeholder="name@company.com"
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                        message: 'Invalid email format'
                                    }
                                })}
                            />
                        </div>
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full ${loading ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'
                            } focus:ring-4 focus:ring-blue-900 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors`}
                    >
                        {loading ? (
                            <div className="flex justify-center items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending...
                            </div>
                        ) : (
                            'Send reset instructions'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}