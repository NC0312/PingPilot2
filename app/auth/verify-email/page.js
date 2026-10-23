'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EnvelopeSimple, CheckCircle, SignIn, LinkBreak, ArrowsClockwise } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { Alert } from '@/components/ui/alert';
import { Button, ButtonArrow } from '@/components/ui/button';
import AuthShell, { AuthHeading } from '../AuthShell';
import { Verifying } from '../AuthFields';

function VerifyEmail() {
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
    const hasLink = !!(token && userId);

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
                // Use the verifyEmail function from AuthContext
                await verifyEmail(token, userId);
                setSuccess(true);
            } catch (err) {
                console.error('Email verification error details:', err);
                setError('We couldn’t verify your email. The link may have expired or already been used.');
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
            setError('We couldn’t send the verification email. Please try again.');
        } finally {
            setVerifying(false);
        }
    };

    const signInButton = (
        <Button asChild size="lg" className="w-full justify-between pl-6">
            <Link href="/auth">
                Go to sign in
                <ButtonArrow />
            </Link>
        </Button>
    );

    return (
        <AuthShell>
            {loading ? (
                <Verifying>Verifying your email address</Verifying>
            ) : success ? (
                <div className="space-y-6">
                    <AuthHeading icon={CheckCircle} title={hasLink || isSuccess ? 'Email verified' : 'Email sent'} />
                    <Alert tone="success">
                        {hasLink || isSuccess
                            ? 'Your email address is confirmed. Sign in to start monitoring.'
                            : 'We sent a new verification link. Check your inbox, then sign in.'}
                    </Alert>
                    {signInButton}
                </div>
            ) : (
                <div className="space-y-6">
                    <AuthHeading
                        icon={hasLink ? LinkBreak : EnvelopeSimple}
                        title={hasLink ? 'Link can’t be used' : 'Verify your email'}
                        description={
                            hasLink
                                ? 'Request a fresh verification email and try again.'
                                : 'Open the verification link we sent to your inbox to unlock your account.'
                        }
                    />

                    {error && <Alert tone="error">{error}</Alert>}

                    <Button type="button" size="lg" className="w-full" onClick={handleResendVerification} disabled={verifying}>
                        {!verifying && <ArrowsClockwise weight="light" />}
                        {verifying ? 'Sending' : 'Resend verification email'}
                    </Button>

                    <Link
                        href="/auth"
                        className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm text-muted-foreground transition-colors duration-300 ease-fluid hover:text-foreground"
                    >
                        <SignIn weight="light" className="size-4" />
                        Back to sign in
                    </Link>
                </div>
            )}
        </AuthShell>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<AuthShell><Verifying>Verifying your email address</Verifying></AuthShell>}>
            <VerifyEmail />
        </Suspense>
    );
}
