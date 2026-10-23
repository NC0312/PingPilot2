'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Envelope, ArrowLeft, PaperPlaneTilt, Key } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { Alert } from '@/components/ui/alert';
import { Button, ButtonArrow } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import AuthShell, { AuthHeading } from '../AuthShell';
import { IconInput, SubmitButton } from '../AuthFields';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [sentTo, setSentTo] = useState('');

    const router = useRouter();
    const { user, resetPassword } = useAuth();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            router.push('/dashboard');
        }
    }, [user, router]);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        defaultValues: { email: '' }
    });

    const onSubmit = async (data) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Use the resetPassword function from AuthContext
            await resetPassword(data.email);

            // If no error was thrown, show success message
            setSentTo(data.email);
            setSuccess(true);
        } catch (err) {
            console.error('Password reset error:', err);
            setError(err.message || 'We couldn’t send reset instructions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell>
            {success ? (
                <div className="space-y-6">
                    <AuthHeading icon={PaperPlaneTilt} title="Check your inbox" />
                    <Alert tone="success">
                        If an account exists for <span className="font-medium text-foreground">{sentTo}</span>, we&apos;ve sent instructions to reset your password. The email can take a minute to arrive.
                    </Alert>
                    <Button asChild size="lg" className="w-full justify-between pl-6">
                        <Link href="/auth">
                            Back to sign in
                            <ButtonArrow />
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    <AuthHeading
                        icon={Key}
                        title="Reset your password"
                        description="Enter your email and we'll send you a link to choose a new password."
                    />

                    {error && <Alert tone="error" title="We couldn't send the email">{error}</Alert>}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                        <Field id="email" label="Email" error={errors.email?.message}>
                            <IconInput
                                id="email"
                                icon={Envelope}
                                type="email"
                                autoComplete="email"
                                inputMode="email"
                                placeholder="name@company.com"
                                aria-invalid={errors.email ? true : undefined}
                                aria-describedby={errors.email ? 'email-msg' : undefined}
                                {...register('email', {
                                    required: 'Enter your email address',
                                    pattern: {
                                        value: EMAIL_REGEX,
                                        message: 'Enter a valid email, like name@company.com'
                                    }
                                })}
                            />
                        </Field>

                        <SubmitButton loading={loading} loadingText="Sending">Send reset link</SubmitButton>
                    </form>

                    <Link
                        href="/auth"
                        className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm text-muted-foreground transition-colors duration-300 ease-fluid hover:text-foreground"
                    >
                        <ArrowLeft weight="light" className="size-4" />
                        Back to sign in
                    </Link>
                </div>
            )}
        </AuthShell>
    );
}
