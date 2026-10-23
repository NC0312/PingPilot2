'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Envelope, Lock, User } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import AuthShell, { AuthHeading } from './AuthShell';
import { IconInput, PasswordInput, SubmitButton } from './AuthFields';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const ERROR_MESSAGES = {
    'Email already in use': 'That email is already registered. Sign in instead, or use a different address.',
    'No user found with this email': 'Invalid email or password',
    'Incorrect password': 'Invalid email or password',
    'email_not_verified': 'Please verify your email before logging in',
    default: 'Authentication failed'
};

const emailRules = {
    required: 'Enter your email address',
    pattern: { value: EMAIL_REGEX, message: 'Enter a valid email, like name@company.com' }
};

function AuthForm() {
    const searchParams = useSearchParams();
    const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
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

    const setMode = (login) => {
        if (login === isLogin) return;
        setIsLogin(login);
        setAuthError(null);
        setSuccessMessage(null);
        setUnverifiedUser(null);
    };

    const toggleFormMode = () => setMode(!isLogin);

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
                setSuccessMessage('Verification email sent. Check your inbox.');
            } else {
                // Otherwise, try to login without verification to get the user data
                const values = getLoginValues();
                await loginWithoutVerification(values.email, values.password);
                await resendVerificationEmail();
                setSuccessMessage('Verification email sent. Check your inbox.');
            }
        } catch (error) {
            console.error('Resend verification error:', error);
            setAuthError('We couldn’t resend the verification email. Please try again.');
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
            // AuthContext handles redirect
        } catch (error) {
            console.error('Login error:', error);
            if (error.message === 'email_not_verified') {
                try {
                    const userData = await loginWithoutVerification(data.email, data.password);
                    setUnverifiedUser(userData);
                } catch (innerError) {
                    console.error('Secondary login error:', innerError);
                }
            }
            handleAuthError(error);
        } finally {
            setLoading(false); // Component controls its own loading
        }
    };

    const onRegisterSubmit = async (data) => {
        setLoading(true);
        setAuthError(null);

        try {
            const userData = await signup(data.email, data.password, data.name);
            setUnverifiedUser(userData);
            setSuccessMessage('Account created. Check your email to verify your account.');
        } catch (error) {
            console.error('Registration error:', error);
            handleAuthError(error);
        } finally {
            setLoading(false); // Component controls its own loading
        }
    };

    const showVerifyNotice = authError === ERROR_MESSAGES['email_not_verified'] || (unverifiedUser && !authError);

    const verificationNotice = (
        <Alert
            tone="info"
            title="Verify your email to continue"
            action={
                <Button type="button" size="sm" variant="outline" onClick={resendVerification} disabled={resendingVerification}>
                    {resendingVerification ? 'Sending' : 'Resend verification email'}
                </Button>
            }
        >
            We sent a link to your inbox. Open it, then sign in.
        </Alert>
    );

    const field = (errors, name) => ({
        'aria-invalid': errors[name] ? true : undefined,
        'aria-describedby': errors[name] ? `${isLogin ? 'login' : 'register'}-${name}-msg` : undefined,
    });

    return (
        <AuthShell>
            <AuthHeading
                title={isLogin ? 'Sign in' : 'Create your account'}
                description={isLogin ? 'Welcome back. Pick up where you left off.' : 'Start your free trial. No setup needed.'}
            />

            <div
                role="tablist"
                aria-label="Account"
                className="mt-6 grid grid-cols-2 rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.08]"
            >
                {[
                    { id: 'login', label: 'Sign in', on: isLogin },
                    { id: 'register', label: 'Sign up', on: !isLogin },
                ].map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        role="tab"
                        id={`tab-${t.id}`}
                        aria-selected={t.on}
                        aria-controls="auth-panel"
                        onClick={() => setMode(t.id === 'login')}
                        className={`min-h-10 rounded-full px-4 text-sm font-medium transition-[background-color,color] duration-500 ease-fluid ${t.on ? 'bg-white/[0.1] text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div id="auth-panel" role="tabpanel" aria-labelledby={isLogin ? 'tab-login' : 'tab-register'} className="mt-6 space-y-5">
                {showVerifyNotice ? (
                    verificationNotice
                ) : authError ? (
                    <Alert tone="error" title={authError} />
                ) : null}

                {successMessage && <Alert tone="success">{successMessage}</Alert>}

                {isLogin ? (
                    <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-5" noValidate>
                        <Field id="login-email" label="Email" error={loginErrors.email?.message}>
                            <IconInput
                                id="login-email"
                                icon={Envelope}
                                type="email"
                                autoComplete="email"
                                inputMode="email"
                                placeholder="name@company.com"
                                {...field(loginErrors, 'email')}
                                {...loginRegister('email', emailRules)}
                            />
                        </Field>

                        <Field id="login-password" label="Password" error={loginErrors.password?.message}>
                            <PasswordInput
                                id="login-password"
                                icon={Lock}
                                autoComplete="current-password"
                                placeholder="Your password"
                                {...field(loginErrors, 'password')}
                                {...loginRegister('password', { required: 'Enter your password' })}
                            />
                        </Field>

                        <div className="flex justify-end">
                            <Link href="/auth/forgot-password" className="rounded-sm text-sm text-primary underline-offset-4 hover:underline">
                                Forgot password?
                            </Link>
                        </div>

                        <SubmitButton loading={loading} loadingText="Signing in">Sign in</SubmitButton>
                    </form>
                ) : (
                    <form onSubmit={handleRegisterSubmit(onRegisterSubmit)} className="space-y-5" noValidate>
                        <Field id="register-name" label="Name" error={registerErrors.name?.message}>
                            <IconInput
                                id="register-name"
                                icon={User}
                                type="text"
                                autoComplete="name"
                                placeholder="Your name"
                                {...field(registerErrors, 'name')}
                                {...registerRegister('name', {
                                    required: 'Enter your name',
                                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                                })}
                            />
                        </Field>

                        <Field id="register-email" label="Email" error={registerErrors.email?.message}>
                            <IconInput
                                id="register-email"
                                icon={Envelope}
                                type="email"
                                autoComplete="email"
                                inputMode="email"
                                placeholder="name@company.com"
                                {...field(registerErrors, 'email')}
                                {...registerRegister('email', emailRules)}
                            />
                        </Field>

                        <Field
                            id="register-password"
                            label="Password"
                            hint="At least 6 characters."
                            error={registerErrors.password?.message}
                        >
                            <PasswordInput
                                id="register-password"
                                icon={Lock}
                                autoComplete="new-password"
                                placeholder="Create a password"
                                {...field(registerErrors, 'password')}
                                {...registerRegister('password', {
                                    required: 'Create a password',
                                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                                })}
                            />
                        </Field>

                        <Field id="register-confirmPassword" label="Confirm password" error={registerErrors.confirmPassword?.message}>
                            <PasswordInput
                                id="register-confirmPassword"
                                icon={Lock}
                                autoComplete="new-password"
                                placeholder="Repeat your password"
                                {...field(registerErrors, 'confirmPassword')}
                                {...registerRegister('confirmPassword', {
                                    required: 'Confirm your password',
                                    validate: value => value === passwordValue || 'Passwords do not match'
                                })}
                            />
                        </Field>

                        <SubmitButton loading={loading} loadingText="Creating account">Create account</SubmitButton>
                    </form>
                )}
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                {isLogin ? 'New to Ping Pilott? ' : 'Already have an account? '}
                <button
                    type="button"
                    onClick={toggleFormMode}
                    className="rounded-sm text-primary underline-offset-4 hover:underline"
                >
                    {isLogin ? 'Create an account' : 'Sign in'}
                </button>
            </p>
        </AuthShell>
    );
}

export default function AuthPage() {
    return (
        <Suspense
            fallback={
                <div className="grid min-h-[100dvh] place-items-center px-4">
                    <Skeleton className="h-[34rem] w-full max-w-md rounded-[1.75rem]" />
                </div>
            }
        >
            <AuthForm />
        </Suspense>
    );
}
