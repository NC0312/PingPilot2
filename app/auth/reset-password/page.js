'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Lock, Key, CheckCircle, LinkBreak } from '@phosphor-icons/react';
import Link from 'next/link';
import { Alert } from '@/components/ui/alert';
import { Button, ButtonArrow } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import AuthShell, { AuthHeading } from '../AuthShell';
import { PasswordInput, SubmitButton, Verifying } from '../AuthFields';

function ResetPasswordForm() {
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState(false);

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
                setError('This reset link is incomplete. Request a new one to continue.');
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
                setError('Something went wrong checking this link. Try again or request a new one.');
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://ping-pilott-backend.onrender.com'}/api/auth/reset-password`, {
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
            setError(err.message || 'We couldn’t reset your password. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const requestNew = (
        <Button asChild size="lg" className="w-full justify-between pl-6">
            <Link href="/auth/forgot-password">
                Request a new link
                <ButtonArrow />
            </Link>
        </Button>
    );

    return (
        <AuthShell>
            {loading ? (
                <Verifying>Checking your reset link</Verifying>
            ) : success ? (
                <div className="space-y-6">
                    <AuthHeading icon={CheckCircle} title="Password updated" />
                    <Alert tone="success">Your password has been reset. Sign in with the new one.</Alert>
                    <Button asChild size="lg" className="w-full justify-between pl-6">
                        <Link href="/auth">
                            Go to sign in
                            <ButtonArrow />
                        </Link>
                    </Button>
                </div>
            ) : !tokenValid ? (
                <div className="space-y-6">
                    <AuthHeading icon={LinkBreak} title="Link can't be used" />
                    {error && <Alert tone="error">{error}</Alert>}
                    {requestNew}
                </div>
            ) : (
                <div className="space-y-6">
                    <AuthHeading icon={Key} title="Choose a new password" description="Use at least 6 characters." />

                    {error && (
                        <Alert
                            tone="error"
                            title="Couldn't reset your password"
                            action={<Link href="/auth/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">Request a new link</Link>}
                        >
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                        <Field id="password" label="New password" error={errors.password?.message}>
                            <PasswordInput
                                id="password"
                                icon={Lock}
                                autoComplete="new-password"
                                placeholder="New password"
                                aria-invalid={errors.password ? true : undefined}
                                aria-describedby={errors.password ? 'password-msg' : undefined}
                                {...register('password', {
                                    required: 'Enter a new password',
                                    minLength: {
                                        value: 6,
                                        message: 'Password must be at least 6 characters'
                                    }
                                })}
                            />
                        </Field>

                        <Field id="confirmPassword" label="Confirm password" error={errors.confirmPassword?.message}>
                            <PasswordInput
                                id="confirmPassword"
                                icon={Lock}
                                autoComplete="new-password"
                                placeholder="Repeat the new password"
                                aria-invalid={errors.confirmPassword ? true : undefined}
                                aria-describedby={errors.confirmPassword ? 'confirmPassword-msg' : undefined}
                                {...register('confirmPassword', {
                                    required: 'Confirm your new password',
                                    validate: value => value === passwordValue || 'Passwords do not match'
                                })}
                            />
                        </Field>

                        <SubmitButton loading={processing} loadingText="Resetting password">Reset password</SubmitButton>
                    </form>
                </div>
            )}
        </AuthShell>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<AuthShell><Verifying>Checking your reset link</Verifying></AuthShell>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
