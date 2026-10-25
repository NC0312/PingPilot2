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
    const [unverifiedEmail, setUnverifiedEmail] = useState(null);
    const [resendingVerification, setResendingVerification] = useState(false);
    const [resendError, setResendError] = useState(null);

    const router = useRouter();
    const { user, login, signup, resendVerificationEmail } = useAuth();

    // Where to go once signed in: the page they were sent away from, if it is a local path.
    const isLocalPath = (v) => !!v && v.startsWith('/') && !v.startsWith('//');
    const rawNext = searchParams.get('next');
    const urlNext = isLocalPath(rawNext) ? rawNext : null;

    // Sign-up is followed by an email round trip, so remember the destination across it.
    useEffect(() => {
        try {
            if (urlNext) localStorage.setItem('pp.afterAuth', JSON.stringify({ path: urlNext, at: Date.now() }));
            // A fresh sign-up with no destination (e.g. the free plan) shouldn't inherit an old paid-plan choice.
            else if (searchParams.get('mode') === 'signup') localStorage.removeItem('pp.afterAuth');
        } catch { /* storage unavailable */ }
    }, [urlNext, searchParams]);

    // The remembered destination expires after a day, the lifetime of the verification email's link.
    const getStoredNext = () => {
        try {
            const saved = JSON.parse(localStorage.getItem('pp.afterAuth') || 'null');
            return saved && Date.now() - saved.at < 24 * 60 * 60 * 1000 && isLocalPath(saved.path) ? saved.path : null;
        } catch {
            return null;
        }
    };
    const nextPath = urlNext || getStoredNext() || '/dashboard';

    // Redirect once signed in (covers both a fresh login and visiting this page while already signed in)
    useEffect(() => {
        if (user) {
            try { localStorage.removeItem('pp.afterAuth'); } catch { /* ignore */ }
            router.replace(nextPath);
        }
    }, [user, router, nextPath]);

    const {
        register: loginRegister,
        handleSubmit: handleLoginSubmit,
        formState: { errors: loginErrors }
    } = useForm({
        defaultValues: { email: '', password: '' }
    });

    const {
        register: registerRegister,
        handleSubmit: handleRegisterSubmit,
        formState: { errors: registerErrors },
        watch
    } = useForm({
        defaultValues: { name: '', email: '', password: '', confirmPassword: '', consent: false }
    });

    const passwordValue = watch('password', '');

    // Follow the address too: a link to /auth?mode=signup while already on this page should switch the tab.
    const urlWantsLogin = searchParams.get('mode') !== 'signup';
    useEffect(() => {
        setIsLogin(urlWantsLogin);
        setAuthError(null);
        setSuccessMessage(null);
        setUnverifiedEmail(null);
        setResendError(null);
    }, [urlWantsLogin]);

    const setMode = (login) => {
        if (login === isLogin) return;
        setIsLogin(login);
        setAuthError(null);
        setSuccessMessage(null);
        setUnverifiedEmail(null);
        setResendError(null);
    };

    const toggleFormMode = () => setMode(!isLogin);

    const handleAuthError = (error) => {
        // fetch rejects with a TypeError when the server can't be reached at all
        if (error instanceof TypeError) {
            setAuthError('We can’t reach the server. Check your connection and try again.');
            return;
        }
        const message = error.message || 'Authentication failed';
        setAuthError(ERROR_MESSAGES[message] || message);
    };

    const resendVerification = async () => {
        if (!unverifiedEmail) return;
        try {
            setResendingVerification(true);
            setResendError(null);
            await resendVerificationEmail(unverifiedEmail);
            setSuccessMessage('Verification email sent. Check your inbox.');
        } catch (error) {
            console.error('Resend verification error:', error);
            setResendError('We couldn’t resend the verification email. Please try again.');
        } finally {
            setResendingVerification(false);
        }
    };

    const onLoginSubmit = async (data) => {
        setLoading(true);
        setAuthError(null);
        setSuccessMessage(null);
        setResendError(null);
        setUnverifiedEmail(null);

        try {
            await login(data.email, data.password);
            // The effect above redirects once the user is set
        } catch (error) {
            console.error('Login error:', error);
            if (error.message === 'email_not_verified') {
                setUnverifiedEmail(data.email);
            } else {
                handleAuthError(error);
            }
        } finally {
            setLoading(false); // Component controls its own loading
        }
    };

    const onRegisterSubmit = async (data) => {
        setLoading(true);
        setAuthError(null);
        setResendError(null);

        try {
            const created = await signup(data.email, data.password, data.name);
            // When the server doesn't ask for email verification it signs the new user in, and the effect above redirects
            if (created?.emailVerified) return;
            setUnverifiedEmail(data.email);
            setSuccessMessage('Account created. Check your email to verify your account.');
        } catch (error) {
            console.error('Registration error:', error);
            handleAuthError(error);
        } finally {
            setLoading(false); // Component controls its own loading
        }
    };

    const showVerifyNotice = !!unverifiedEmail;

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
            We sent a link to {unverifiedEmail}. Open it, then sign in.
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
                description={isLogin ? (rawNext ? 'Sign in to continue.' : 'Welcome back. Pick up where you left off.') : 'Start free. No setup needed.'}
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

                {resendError && <Alert tone="error" title={resendError} />}
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
                ) : unverifiedEmail ? null : (
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

                        <div className="space-y-1.5">
                            <label className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                                <input
                                    type="checkbox"
                                    className="mt-1 size-4 shrink-0 accent-[var(--primary)]"
                                    aria-invalid={registerErrors.consent ? 'true' : undefined}
                                    {...registerRegister('consent', { required: 'Tick this box to create your account' })}
                                />
                                <span>
                                    I am 18 or older, and I agree to the{' '}
                                    <Link href="/terms" target="_blank" className="text-foreground underline-offset-4 hover:underline">Terms of Service</Link>
                                    {' '}and consent to my personal data being processed as described in the{' '}
                                    <Link href="/privacy" target="_blank" className="text-foreground underline-offset-4 hover:underline">Privacy Policy</Link>.
                                </span>
                            </label>
                            {registerErrors.consent && <p role="alert" className="text-[13px] text-destructive">{registerErrors.consent.message}</p>}
                        </div>

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
