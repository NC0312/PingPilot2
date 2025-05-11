// app/auth/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Server, AlertTriangle, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const router = useRouter();
    const { user, login, signup } = useAuth();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            router.push('/dashboard');
        }
    }, [user, router]);

    const loginForm = useForm({
        defaultValues: {
            email: '',
            password: ''
        }
    });

    const registerForm = useForm({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: ''
        }
    });

    const { register: registerLoginField, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors } } = loginForm;
    const { register: registerRegisterField, handleSubmit: handleRegisterSubmit, formState: { errors: registerErrors }, watch } = registerForm;

    const passwordValue = watch('password', '');

    const toggleFormMode = () => {
        setIsLogin(!isLogin);
        setAuthError(null);
        setSuccessMessage(null);
    };

    const onLoginSubmit = async (data) => {
        setLoading(true);
        setAuthError(null);

        try {
            await login(data.email, data.password);
            // Auth context will handle redirect
        } catch (error) {
            console.error('Login error:', error);
            handleAuthError(error);
        } finally {
            setLoading(false);
        }
    };

    const onRegisterSubmit = async (data) => {
        setLoading(true);
        setAuthError(null);

        try {
            await signup(data.email, data.password, data.name);
            setSuccessMessage('Account created! Please check your email for verification.');
            // Clear form fields
            registerForm.reset();
        } catch (error) {
            console.error('Registration error:', error);
            handleAuthError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAuthError = (error) => {
        let errorMessage = 'Authentication failed';

        if (error.code) {
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = 'Invalid email or password';
                    break;
                case 'auth/email-already-in-use':
                    errorMessage = 'Email is already in use';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email format';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Please check your connection';
                    break;
                default:
                    errorMessage = error.message || 'Authentication failed';
            }
        }

        setAuthError(errorMessage);
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
                    <div className="flex p-1 rounded-lg bg-gray-700">
                        <button
                            type="button"
                            onClick={() => setIsLogin(true)}
                            className={`py-2 px-4 rounded-md transition-colors ${isLogin ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
                                }`}
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsLogin(false)}
                            className={`py-2 px-4 rounded-md transition-colors ${!isLogin ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>
                </div>

                <h2 className="text-xl font-semibold text-white mb-6">
                    {isLogin ? 'Sign in to your account' : 'Create your account'}
                </h2>

                {authError && (
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

                {isLogin ? (
                    // Login Form
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="login-email" className="block mb-1 text-sm font-medium text-gray-300">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="login-email"
                                    type="email"
                                    className={`bg-gray-700 border ${loginErrors.email ? 'border-red-500' : 'border-gray-600'
                                        } text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5`}
                                    placeholder="name@company.com"
                                    {...registerLoginField('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                            message: 'Invalid email format'
                                        }
                                    })}
                                />
                            </div>
                            {loginErrors.email && (
                                <p className="mt-1 text-sm text-red-500">{loginErrors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="login-password" className="block mb-1 text-sm font-medium text-gray-300">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="login-password"
                                    type={showPassword ? "text" : "password"}
                                    className={`bg-gray-700 border ${loginErrors.password ? 'border-red-500' : 'border-gray-600'
                                        } text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5`}
                                    placeholder="••••••••"
                                    {...registerLoginField('password', {
                                        required: 'Password is required'
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
                            {loginErrors.password && (
                                <p className="mt-1 text-sm text-red-500">{loginErrors.password.message}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-end">
                            <a href="/auth/forgot-password" className="text-sm text-blue-400 hover:underline">
                                Forgot password?
                            </a>
                        </div>

                        <button
                            type="button"
                            onClick={handleLoginSubmit(onLoginSubmit)}
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
                                    Signing In...
                                </div>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </div>
                ) : (
                    // Register Form
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="register-name" className="block mb-1 text-sm font-medium text-gray-300">
                                Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="register-name"
                                    type="text"
                                    className={`bg-gray-700 border ${registerErrors.name ? 'border-red-500' : 'border-gray-600'
                                        } text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5`}
                                    placeholder="Your name"
                                    {...registerRegisterField('name', {
                                        required: 'Name is required',
                                        minLength: {
                                            value: 2,
                                            message: 'Name must be at least 2 characters'
                                        }
                                    })}
                                />
                            </div>
                            {registerErrors.name && (
                                <p className="mt-1 text-sm text-red-500">{registerErrors.name.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="register-email" className="block mb-1 text-sm font-medium text-gray-300">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="register-email"
                                    type="email"
                                    className={`bg-gray-700 border ${registerErrors.email ? 'border-red-500' : 'border-gray-600'
                                        } text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5`}
                                    placeholder="name@company.com"
                                    {...registerRegisterField('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                            message: 'Invalid email format'
                                        }
                                    })}
                                />
                            </div>
                            {registerErrors.email && (
                                <p className="mt-1 text-sm text-red-500">{registerErrors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="register-password" className="block mb-1 text-sm font-medium text-gray-300">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="register-password"
                                    type={showPassword ? "text" : "password"}
                                    className={`bg-gray-700 border ${registerErrors.password ? 'border-red-500' : 'border-gray-600'
                                        } text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5`}
                                    placeholder="••••••••"
                                    {...registerRegisterField('password', {
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
                            {registerErrors.password && (
                                <p className="mt-1 text-sm text-red-500">{registerErrors.password.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="register-confirm-password" className="block mb-1 text-sm font-medium text-gray-300">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="register-confirm-password"
                                    type={showPassword ? "text" : "password"}
                                    className={`bg-gray-700 border ${registerErrors.confirmPassword ? 'border-red-500' : 'border-gray-600'
                                        } text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5`}
                                    placeholder="••••••••"
                                    {...registerRegisterField('confirmPassword', {
                                        required: 'Please confirm your password',
                                        validate: value => value === passwordValue || 'Passwords do not match'
                                    })}
                                />
                            </div>
                            {registerErrors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-500">{registerErrors.confirmPassword.message}</p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleRegisterSubmit(onRegisterSubmit)}
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
                                    Creating Account...
                                </div>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </div>
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