// Modified app/auth/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Server, AlertTriangle, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const ERROR_MESSAGES = {
    'Email already in use': 'Email is already in use',
    'No user found with this email': 'Invalid email or password',
    'Incorrect password': 'Invalid email or password',
    'email_not_verified': 'Please verify your email before logging in',
    default: 'Authentication failed'
};

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [unverifiedUser, setUnverifiedUser] = useState(null);
    const [resendingVerification, setResendingVerification] = useState(false);

    const router = useRouter();
    const { user, login, loginWithoutVerification, signup, resendVerificationEmail } = useAuth();

    // Redirect if already logged in
    useEffect(() => {
        if (user && user.emailVerified) {
            router.push('/');
        }
    }, [user, router]);

    const {
        register: loginRegister,
        handleSubmit: handleLoginSubmit,
        formState: { errors: loginErrors },
        getValues: getLoginValues
    } = useForm({
        defaultValues: { email: '', password: '' }
    });

    const {
        register: registerRegister,
        handleSubmit: handleRegisterSubmit,
        formState: { errors: registerErrors },
        watch
    } = useForm({
        defaultValues: { name: '', email: '', password: '', confirmPassword: '' }
    });

    const passwordValue = watch('password', '');

    const toggleFormMode = () => {
        setIsLogin(!isLogin);
        setAuthError(null);
        setSuccessMessage(null);
        setUnverifiedUser(null);
    };

    const handleAuthError = (error) => {
        if (error.message === 'email_not_verified') {
            // Handle unverified email specially
            setAuthError(ERROR_MESSAGES[error.message]);
            return true;
        } else {
            const message = error.message || 'Authentication failed';
            setAuthError(ERROR_MESSAGES[message] || message);
            return false;
        }
    };

    const resendVerification = async () => {
        try {
            setResendingVerification(true);

            // If we have an unverified user, use that data
            if (unverifiedUser) {
                await resendVerificationEmail();
                setSuccessMessage('Verification email sent! Please check your inbox.');
            } else {
                // Otherwise, try to login without verification to get the user data
                const values = getLoginValues();
                await loginWithoutVerification(values.email, values.password);
                await resendVerificationEmail();
                setSuccessMessage('Verification email sent! Please check your inbox.');
            }
        } catch (error) {
            console.error('Resend verification error:', error);
            setAuthError('Failed to resend verification email. Please try again.');
        } finally {
            setResendingVerification(false);
        }
    };

    const onLoginSubmit = async (data) => {
        setLoading(true);
        setAuthError(null);
        setUnverifiedUser(null);

        try {
            await login(data.email, data.password);
            // Auth context will handle redirect
        } catch (error) {
            console.error('Login error:', error);
            if (error.message === 'email_not_verified') {
                try {
                    // Try to get user data without verification check to resend verification later
                    const userData = await loginWithoutVerification(data.email, data.password);
                    setUnverifiedUser(userData);
                } catch (innerError) {
                    console.error('Secondary login error:', innerError);
                }
            }
            handleAuthError(error);
        } finally {
            setLoading(false);
        }
    };

    const onRegisterSubmit = async (data) => {
        setLoading(true);
        setAuthError(null);

        try {
            const userData = await signup(data.email, data.password, data.name);
            setUnverifiedUser(userData);
            setSuccessMessage('Account created successfully! Please check your email to verify your account.');
        } catch (error) {
            console.error('Registration error:', error);
            handleAuthError(error);
        } finally {
            setLoading(false);
        }
    };

    const renderFormInput = (id, label, type, icon, register, errors, options = {}) => (
        <div>
            <label htmlFor={id} className="block mb-1 text-sm font-medium text-gray-300">
                {label}
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    {icon}
                </div>
                <input
                    id={id}
                    type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
                    className={`bg-gray-700 border ${errors[id.split('-').pop()] ? 'border-red-500' : 'border-gray-600'} 
                    text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5`}
                    placeholder={options.placeholder}
                    {...register(id.split('-').pop(), options.validation)}
                />
                {type === 'password' && (
                    <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                )}
            </div>
            {errors[id.split('-').pop()] && (
                <p className="mt-1 text-sm text-red-500">{errors[id.split('-').pop()].message}</p>
            )}
        </div>
    );

    const renderButton = (text, loadingText) => (
        <button
            type="submit"
            disabled={loading}
            className={`w-full ${loading ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} 
            focus:ring-4 focus:ring-blue-900 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors`}
        >
            {loading ? (
                <div className="flex justify-center items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {loadingText}
                </div>
            ) : (
                text
            )}
        </button>
    );

    // Render verification notification
    const renderVerificationNotification = () => (
        <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-3 mb-4">
            <div className="flex items-start">
                <AlertCircle className="text-blue-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                <div className="text-blue-200 text-sm">
                    <p className="mb-2">Please verify your email address before logging in. Check your inbox for the verification link.</p>
                    <button
                        onClick={resendVerification}
                        disabled={resendingVerification}
                        className={`w-full ${resendingVerification ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} 
                        text-white font-medium rounded-lg text-xs px-3 py-1.5 text-center transition-colors mt-1`}
                    >
                        {resendingVerification ? (
                            <div className="flex justify-center items-center">
                                <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending...
                            </div>
                        ) : (
                            'Resend Verification Email'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#031D27] px-4 py-12">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Server size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Ping Pilot</h1>
            <p className="text-blue-300 mb-8">Server monitoring made simple</p>

            <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-8">
                <div className="flex justify-center mb-6">
                    <div className="flex p-1 rounded-lg bg-gray-700">
                        <button
                            type="button"
                            onClick={() => setIsLogin(true)}
                            className={`py-2 px-4 rounded-md transition-colors ${isLogin ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`}
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsLogin(false)}
                            className={`py-2 px-4 rounded-md transition-colors ${!isLogin ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`}
                        >
                            Sign Up
                        </button>
                    </div>
                </div>

                <h2 className="text-xl font-semibold text-white mb-6">
                    {isLogin ? 'Sign in to your account' : 'Create your account'}
                </h2>

                {authError && authError === ERROR_MESSAGES['email_not_verified'] ? (
                    renderVerificationNotification()
                ) : authError && (
                    <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-3 mb-4 flex items-start">
                        <AlertTriangle className="text-red-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                        <p className="text-red-200 text-sm">{authError}</p>
                    </div>
                )}

                {successMessage && (
                    <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-3 mb-4 flex items-start">
                        <Check className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                        <p className="text-green-200 text-sm">{successMessage}</p>
                    </div>
                )}

                {unverifiedUser && !authError && (
                    renderVerificationNotification()
                )}

                {isLogin ? (
                    <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
                        {renderFormInput(
                            'login-email',
                            'Email',
                            'email',
                            <Mail className="h-5 w-5 text-gray-400" />,
                            loginRegister,
                            loginErrors,
                            {
                                placeholder: 'name@company.com',
                                validation: {
                                    required: 'Email is required',
                                    pattern: {
                                        value: EMAIL_REGEX,
                                        message: 'Invalid email format'
                                    }
                                }
                            }
                        )}

                        {renderFormInput(
                            'login-password',
                            'Password',
                            'password',
                            <Lock className="h-5 w-5 text-gray-400" />,
                            loginRegister,
                            loginErrors,
                            {
                                placeholder: '••••••••',
                                validation: {
                                    required: 'Password is required'
                                }
                            }
                        )}

                        <div className="flex items-center justify-end">
                            <Link href="/auth/forgot-password" className="text-sm text-blue-400 hover:underline">
                                Forgot password?
                            </Link>
                        </div>

                        {renderButton('Sign In', 'Signing In...')}
                    </form>
                ) : (
                    <form onSubmit={handleRegisterSubmit(onRegisterSubmit)} className="space-y-4">
                        {renderFormInput(
                            'register-name',
                            'Name',
                            'text',
                            <User className="h-5 w-5 text-gray-400" />,
                            registerRegister,
                            registerErrors,
                            {
                                placeholder: 'Your name',
                                validation: {
                                    required: 'Name is required',
                                    minLength: {
                                        value: 2,
                                        message: 'Name must be at least 2 characters'
                                    }
                                }
                            }
                        )}

                        {renderFormInput(
                            'register-email',
                            'Email',
                            'email',
                            <Mail className="h-5 w-5 text-gray-400" />,
                            registerRegister,
                            registerErrors,
                            {
                                placeholder: 'name@company.com',
                                validation: {
                                    required: 'Email is required',
                                    pattern: {
                                        value: EMAIL_REGEX,
                                        message: 'Invalid email format'
                                    }
                                }
                            }
                        )}

                        {renderFormInput(
                            'register-password',
                            'Password',
                            'password',
                            <Lock className="h-5 w-5 text-gray-400" />,
                            registerRegister,
                            registerErrors,
                            {
                                placeholder: '••••••••',
                                validation: {
                                    required: 'Password is required',
                                    minLength: {
                                        value: 6,
                                        message: 'Password must be at least 6 characters'
                                    }
                                }
                            }
                        )}

                        {renderFormInput(
                            'register-confirmPassword',
                            'Confirm Password',
                            'password',
                            <Lock className="h-5 w-5 text-gray-400" />,
                            registerRegister,
                            registerErrors,
                            {
                                placeholder: '••••••••',
                                validation: {
                                    required: 'Please confirm your password',
                                    validate: value => value === passwordValue || 'Passwords do not match'
                                }
                            }
                        )}

                        {renderButton('Create Account', 'Creating Account...')}
                    </form>
                )}

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-400">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            type="button"
                            onClick={toggleFormMode}
                            className="text-blue-400 hover:underline focus:outline-none"
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}