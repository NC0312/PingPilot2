'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CircleNotch, ArrowUpRight } from '@phosphor-icons/react';
import { useAuth } from '@/app/context/AuthContext';
import { PageContainer } from '@/app/components/Layout/AppShell';
import { planLabel } from '@/app/components/planCatalog';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';
import { Dialog } from '@/components/ui/dialog';
import { Reveal } from '@/components/ui/reveal';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// One block of the page: a title and what it is for on the left, the controls on the right.
function Section({ title, description, children }) {
    return (
        <Reveal>
            <section className="bezel-sm" aria-labelledby={`acc-${title.toLowerCase().replace(/\W+/g, '-')}`}>
                <div className="bezel-sm-core grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,260px)_1fr] lg:gap-12">
                    <div className="space-y-1.5">
                        <h2 id={`acc-${title.toLowerCase().replace(/\W+/g, '-')}`} className="font-display text-xl font-medium tracking-tight">{title}</h2>
                        {description && <p className="max-w-[40ch] text-sm leading-relaxed text-muted-foreground">{description}</p>}
                    </div>
                    <div className="min-w-0">{children}</div>
                </div>
            </section>
        </Reveal>
    );
}

export default function AccountPage() {
    const { user, updateUserProfile, changePassword, login, logout, apiRequest } = useAuth();
    const isAdmin = user?.role === 'admin';

    // Profile
    const [name, setName] = useState(user?.displayName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [profileMsg, setProfileMsg] = useState(null);
    const [profileBusy, setProfileBusy] = useState(false);

    // Password
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [pwMsg, setPwMsg] = useState(null);
    const [pwBusy, setPwBusy] = useState(false);

    // Delete
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletePw, setDeletePw] = useState('');
    const [deleteErr, setDeleteErr] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // The form fills in once the signed-in user has loaded
    const loadedFor = React.useRef(null);
    React.useEffect(() => {
        const uid = user?.id || user?._id;
        if (user && loadedFor.current !== uid) {
            loadedFor.current = uid;
            setName(user.displayName || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const emailTrimmed = email.trim();
    const emailError = emailTrimmed && !EMAIL_REGEX.test(emailTrimmed) ? 'Enter a valid email address.' : null;
    const profileDirty = name.trim() !== (user?.displayName || '') || emailTrimmed.toLowerCase() !== (user?.email || '').toLowerCase();

    const saveProfile = async (e) => {
        e.preventDefault();
        if (emailError || !profileDirty) return;
        setProfileBusy(true);
        setProfileMsg(null);
        try {
            const payload = { name: name.trim() };
            if (emailTrimmed.toLowerCase() !== (user?.email || '').toLowerCase()) payload.email = emailTrimmed;
            await updateUserProfile(payload);
            setProfileMsg({ tone: 'success', text: 'Saved.' });
        } catch (err) {
            setProfileMsg({ tone: 'error', text: err.message || 'We couldn’t save your changes. Try again.' });
        } finally {
            setProfileBusy(false);
        }
    };

    const pwErrors = {
        next: next && next.length < 6 ? 'Use at least 6 characters.' : null,
        confirm: confirm && confirm !== next ? 'The passwords don’t match.' : null,
    };
    const pwReady = current && next.length >= 6 && confirm === next && next !== current;

    const savePassword = async (e) => {
        e.preventDefault();
        if (!pwReady) return;
        setPwBusy(true);
        setPwMsg(null);
        try {
            await changePassword(current, next);
            // Changing a password ends every existing session, this one included. Sign straight back in
            // with the new one so the user isn't thrown to the sign-in page.
            try {
                await login(user.email, next);
                setPwMsg({ tone: 'success', text: 'Password updated. Other devices were signed out.' });
            } catch {
                await logout('/auth');
                return;
            }
            setCurrent('');
            setNext('');
            setConfirm('');
        } catch (err) {
            setPwMsg({ tone: 'error', text: err.message || 'We couldn’t update your password. Try again.' });
        } finally {
            setPwBusy(false);
        }
    };

    const deleteAccount = async () => {
        if (!deletePw) {
            setDeleteErr('Enter your password to confirm.');
            return;
        }
        setDeleting(true);
        setDeleteErr(null);
        try {
            await apiRequest('/api/users/me', { method: 'DELETE', body: JSON.stringify({ password: deletePw }) });
            await logout('/');
        } catch (err) {
            setDeleteErr(err.message || 'We couldn’t delete your account. Try again.');
            setDeleting(false);
        }
    };

    const plan = user?.subscription;
    const planName = isAdmin ? 'Admin' : planLabel(plan?.plan);

    return (
        <PageContainer className="space-y-8">
            <PageHeader eyebrow="Account" title="Your account" description="Your details, your password and your plan." />

            <div className="max-w-4xl space-y-6">
                <Section title="Profile" description="How you appear in Ping Pilott and where we reach you.">
                    <form onSubmit={saveProfile} noValidate className="space-y-5">
                        <Field id="acc-name" label="Name">
                            <Input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                        </Field>
                        <Field id="acc-email" label="Email" error={emailError} hint="Used to sign in. Alerts go to the addresses you set on each server.">
                            <Input
                                id="acc-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                aria-invalid={!!emailError}
                                aria-describedby="acc-email-msg"
                            />
                        </Field>
                        {profileMsg && <Alert tone={profileMsg.tone}>{profileMsg.text}</Alert>}
                        <Button type="submit" disabled={!profileDirty || !!emailError || profileBusy}>
                            {profileBusy ? (<><CircleNotch weight="light" className="animate-spin" />Saving</>) : 'Save changes'}
                        </Button>
                    </form>
                </Section>

                <Section title="Password" description="Changing it signs you out everywhere else.">
                    <form onSubmit={savePassword} noValidate className="space-y-5">
                        <Field id="acc-current" label="Current password">
                            <Input id="acc-current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
                        </Field>
                        <Field id="acc-new" label="New password" error={pwErrors.next} hint="At least 6 characters.">
                            <Input id="acc-new" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" aria-invalid={!!pwErrors.next} aria-describedby="acc-new-msg" />
                        </Field>
                        <Field id="acc-confirm" label="Confirm new password" error={pwErrors.confirm}>
                            <Input id="acc-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" aria-invalid={!!pwErrors.confirm} aria-describedby="acc-confirm-msg" />
                        </Field>
                        {pwMsg && <Alert tone={pwMsg.tone}>{pwMsg.text}</Alert>}
                        <Button type="submit" disabled={!pwReady || pwBusy}>
                            {pwBusy ? (<><CircleNotch weight="light" className="animate-spin" />Updating</>) : 'Update password'}
                        </Button>
                    </form>
                </Section>

                <Section title="Plan" description={isAdmin ? 'Admin accounts have no limits.' : 'What you can monitor, and how often.'}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="font-display text-2xl font-medium tracking-tight">{planName}</p>
                            {!isAdmin && plan?.status && <p className="mt-1 text-sm capitalize text-muted-foreground">{plan.status}</p>}
                        </div>
                        {!isAdmin && (
                            <Button asChild variant="outline">
                                <Link href="/subscription">
                                    Plan & billing
                                    <ArrowUpRight weight="light" />
                                </Link>
                            </Button>
                        )}
                    </div>
                </Section>

                <Section title="Delete account" description="Removes your account, your servers and their history. This can’t be undone.">
                    <Button variant="destructive" onClick={() => { setDeletePw(''); setDeleteErr(null); setDeleteOpen(true); }}>
                        Delete my account
                    </Button>
                </Section>
            </div>

            <Dialog
                open={deleteOpen}
                onClose={() => !deleting && setDeleteOpen(false)}
                title="Delete your account?"
                description="All your servers and their check history are removed and monitoring stops. Enter your password to confirm."
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleting}>Keep my account</Button>
                        <Button variant="destructive" onClick={deleteAccount} disabled={deleting}>
                            {deleting ? 'Deleting' : 'Delete account'}
                        </Button>
                    </>
                }
            >
                <Field id="acc-delete-pw" label="Password" error={deleteErr}>
                    <Input
                        id="acc-delete-pw"
                        type="password"
                        value={deletePw}
                        onChange={(e) => setDeletePw(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') deleteAccount(); }}
                        autoComplete="current-password"
                        aria-invalid={!!deleteErr}
                        aria-describedby="acc-delete-pw-msg"
                    />
                </Field>
            </Dialog>
        </PageContainer>
    );
}
