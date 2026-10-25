'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Minus, CreditCard, LockKey, CheckCircle } from '@phosphor-icons/react';
import { useAuth } from '@/app/context/AuthContext';
import { PageContainer } from '@/app/components/Layout/AppShell';
import { SUBSCRIPTION_PLANS } from '@/app/components/subscriptionPlans';
import {
    TIERS,
    BILLING,
    planId,
    getPlan,
    parsePlanParam,
    planLabel,
    featureList,
    serverLimitLabel,
} from '@/app/components/planCatalog';
import { Button, ButtonArrow } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Reveal } from '@/components/ui/reveal';
import { cn } from '@/lib/utils';
import { countServers } from '@/lib/servers';

const STATUS_BADGE = {
    trial: { label: 'Trial', variant: 'warning' },
    active: { label: 'Active', variant: 'success' },
    expired: { label: 'Expired', variant: 'destructive' },
    cancelled: { label: 'Cancelled', variant: 'secondary' },
    unlimited: { label: 'Unlimited', variant: 'default' },
};

const COMPARE_ROWS = [
    { label: 'Servers', get: (f) => serverLimitLabel(f.maxServers) },
    { label: 'Fastest check interval', get: (f) => `${f.minCheckFrequency} min` },
    { label: 'Historical reporting', get: (f) => f.historicalReporting },
    { label: 'Advanced alerts', get: (f) => f.advancedAlerts },
    { label: 'Webhook integrations', get: (f) => f.webhookIntegrations },
    { label: 'API access', get: (f) => f.apiAccess },
    { label: 'Priority support', get: (f) => f.prioritySupport },
    { label: 'Support response', get: (f) => f.supportResponseTime },
];

const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : null;

// American Express card numbers start with 34 or 37 and use a 4-digit security code.
const isAmex = (cardNumber = '') => /^3[47]/.test(cardNumber.replace(/\D/g, ''));

function validateField(name, value, cardNumber) {
    const digits = value.replace(/\D/g, '');
    switch (name) {
        case 'cardName':
            return value.trim().length < 2 ? 'Enter the name on the card.' : '';
        case 'cardNumber':
            return digits.length < 15 ? 'Enter the full card number.' : '';
        case 'expiry': {
            const m = /^(\d{2})\/(\d{2})$/.exec(value);
            if (!m) return 'Use MM/YY.';
            const month = Number(m[1]);
            if (month < 1 || month > 12) return 'Month must be 01 to 12.';
            const end = new Date(2000 + Number(m[2]), month, 1);
            return end <= new Date() ? 'This card has expired.' : '';
        }
        case 'cvv':
            return digits.length < (isAmex(cardNumber) ? 4 : 3) ? `Enter the ${isAmex(cardNumber) ? 4 : 3}-digit code.` : '';
        default:
            return '';
    }
}

function CellValue({ value }) {
    if (value === true) return <><Check weight="light" className="mx-auto size-[18px] text-primary" aria-hidden="true" /><span className="sr-only">Included</span></>;
    if (value === false) return <><Minus weight="light" className="mx-auto size-[18px] text-muted-foreground/50" aria-hidden="true" /><span className="sr-only">Not included</span></>;
    return <span className="tabular-nums">{value}</span>;
}

function SubscriptionContent() {
    const [billing, setBilling] = useState('monthly');
    const [tier, setTier] = useState('pro');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [serverCount, setServerCount] = useState(null);
    const [formData, setFormData] = useState({ cardName: '', cardNumber: '', expiry: '', cvv: '' });
    const [errors, setErrors] = useState({});
    const redirectRef = useRef(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, apiRequest, isAdmin, refreshUser } = useAuth();

    const selectedPlan = planId(tier, billing);
    const plan = getPlan(selectedPlan);
    const currentPlanId = user?.subscription?.plan || 'free';
    const currentPlan = getPlan(currentPlanId);
    const isCurrent = currentPlanId === selectedPlan;
    const admin = isAdmin();

    // Plan from the URL (e.g. coming from the "add server" upgrade prompt)
    useEffect(() => {
        const parsed = parsePlanParam(searchParams.get('plan'));
        if (parsed) {
            setTier(parsed.tier);
            setBilling(parsed.billing);
            return;
        }
        // No plan requested: default to the recommended tier, or the next one up if already on it
        const cur = parsePlanParam(user?.subscription?.plan);
        if (cur) {
            setBilling(cur.billing);
            if (cur.tier === 'pro') setTier('business');
        }
    }, [searchParams, user?.subscription?.plan]);

    // Usage against the plan limit
    useEffect(() => {
        if (!user || admin) return;
        let live = true;
        countServers(apiRequest)
            .then((count) => live && setServerCount(count))
            .catch(() => live && setServerCount(null));
        return () => { live = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    useEffect(() => () => clearTimeout(redirectRef.current), []);

    const limits = user?.subscription?.features || currentPlan?.features;
    const maxServers = admin ? -1 : limits?.maxServers ?? 1;
    const unlimited = maxServers === -1 || maxServers === Infinity;
    const usagePct = !unlimited && serverCount !== null ? Math.min(100, Math.round((serverCount / maxServers) * 100)) : 0;
    const statusInfo = STATUS_BADGE[user?.subscription?.status] || STATUS_BADGE.trial;
    const endDate = formatDate(user?.subscription?.endDate);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let next = value;

        if (name === 'cardNumber') {
            next = value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
        } else if (name === 'expiry') {
            const d = value.replace(/\D/g, '').slice(0, 4);
            next = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
        } else if (name === 'cvv') {
            next = value.replace(/\D/g, '').slice(0, isAmex(formData.cardNumber) ? 4 : 3);
        }

        setFormData((f) => ({ ...f, [name]: next }));
        if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setErrors((er) => ({ ...er, [name]: validateField(name, value, formData.cardNumber) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const nextErrors = Object.fromEntries(Object.keys(formData).map((k) => [k, validateField(k, formData[k], formData.cardNumber)]));
        setErrors(nextErrors);
        if (Object.values(nextErrors).some(Boolean)) return;

        setLoading(true);
        setError(null);

        try {
            await apiRequest('/api/users/me', {
                method: 'PATCH',
                body: JSON.stringify({
                    subscription: {
                        plan: selectedPlan,
                        status: 'active',
                        startDate: new Date(),
                        endDate: null,
                    },
                }),
            });

            // Only report success once the server says the plan changed. Re-reading the user also
            // refreshes the plan limits used everywhere else in the app (add-server, frequency, webhooks).
            const updated = await refreshUser();
            if (updated?.subscription?.plan !== selectedPlan) {
                throw new Error(
                    'Online upgrades aren’t available yet, so your plan has not changed and you have not been charged. Contact support to change your plan.'
                );
            }

            setSuccess(true);
            redirectRef.current = setTimeout(() => router.push('/servers'), 8000);
        } catch (err) {
            console.error('Error processing subscription:', err);
            setError(err.message || 'We couldn’t process your upgrade. Check your details and try again.');
        } finally {
            setLoading(false);
        }
    };

    const compareCols = useMemo(
        () => [
            { id: 'free', name: 'Free' },
            ...TIERS.map((t) => ({ id: planId(t.key, billing), name: t.name, key: t.key })),
        ],
        [billing]
    );

    if (success) {
        const f = plan.features;
        return (
            <PageContainer>
                <Reveal className="mx-auto max-w-xl">
                    <div className="bezel">
                        <div className="bezel-core space-y-6 p-8 text-center sm:p-12" role="status">
                            <span className="mx-auto grid size-14 place-items-center rounded-full bg-success/12 text-success ring-1 ring-success/25">
                                <CheckCircle weight="light" className="size-8" />
                            </span>
                            <div className="space-y-3">
                                <h1 className="font-display text-3xl font-medium tracking-tight">Your plan is now {planLabel(selectedPlan)}</h1>
                                <p className="mx-auto max-w-[44ch] text-[15px] leading-relaxed text-muted-foreground">
                                    You can monitor up to {f.maxServers} servers, with checks as often as every {f.minCheckFrequency} min.
                                    We&apos;ll take you to your servers in a few seconds.
                                </p>
                            </div>
                            <div className="flex flex-col justify-center gap-3 sm:flex-row">
                                <Button asChild size="lg">
                                    <Link href="/dashboard">
                                        Go to dashboard
                                        <ButtonArrow />
                                    </Link>
                                </Button>
                                <Button asChild size="lg" variant="outline">
                                    <Link href="/servers/new">Add a server</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </PageContainer>
        );
    }

    return (
        <PageContainer className="space-y-10">
            <PageHeader
                eyebrow="Plan"
                title="Plans and billing"
                description="See what your current plan includes and move to one that fits the servers you monitor."
                actions={
                    <Button asChild variant="outline">
                        <Link href="/servers">
                            <ArrowLeft weight="light" />
                            Back to servers
                        </Link>
                    </Button>
                }
            />

            {/* Current plan */}
            <Reveal>
                <section aria-labelledby="current-plan" className="bezel-sm">
                    <div className="bezel-sm-core grid gap-6 p-6 sm:grid-cols-[1fr_1.2fr] sm:items-center sm:p-7">
                        <div className="space-y-3">
                            <p id="current-plan" className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Current plan</p>
                            <div className="flex flex-wrap items-center gap-3">
                                <p className="font-display text-3xl font-medium tracking-tight">{planLabel(admin ? 'admin' : currentPlanId)}</p>
                                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {admin
                                    ? 'Admin accounts have no server limit.'
                                    : endDate
                                        ? `${user?.subscription?.status === 'trial' ? 'Trial ends' : user?.subscription?.status === 'expired' ? 'Ended' : 'Active until'} ${endDate}.`
                                        : user?.subscription?.status === 'active'
                                            ? 'Active with no end date.'
                                            : 'Upgrade to keep monitoring beyond the trial.'}
                            </p>
                        </div>
                        <div>
                            <div className="flex items-baseline justify-between text-sm">
                                <span className="text-muted-foreground">Servers in use</span>
                                {serverCount === null && !admin ? (
                                    <Skeleton className="h-5 w-16" />
                                ) : (
                                    <span className="font-mono tabular-nums">
                                        {serverCount ?? 0} / {serverLimitLabel(maxServers)}
                                    </span>
                                )}
                            </div>
                            <div
                                className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.08]"
                                role="progressbar"
                                aria-label="Server slots used"
                                aria-valuemin={0}
                                aria-valuemax={unlimited ? undefined : maxServers}
                                aria-valuenow={serverCount ?? 0}
                            >
                                <div
                                    className={cn('h-full origin-left rounded-full transition-transform duration-700 ease-fluid', usagePct >= 90 ? 'bg-warning' : 'bg-primary')}
                                    style={{ width: unlimited ? '8%' : '100%', transform: `scaleX(${unlimited ? 1 : usagePct / 100})` }}
                                />
                            </div>
                            {limits && (
                                <p className="mt-3 text-xs text-muted-foreground">
                                    Fastest check interval: {limits.minCheckFrequency} min
                                </p>
                            )}
                        </div>
                    </div>
                </section>
            </Reveal>

            {admin && (
                <Alert tone="info" title="You are signed in as an admin">
                    The plans below are for customer accounts. Changing plan here would replace your admin subscription.
                </Alert>
            )}

            <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
                <div className="min-w-0 space-y-12">
                    {/* Plan choice */}
                    <section aria-labelledby="choose-plan" className="space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <h2 id="choose-plan" className="font-display text-xl font-medium tracking-tight">Choose a plan</h2>
                            <div
                                role="radiogroup"
                                aria-label="Billing period"
                                className="relative inline-grid grid-cols-2 rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.08]"
                            >
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-primary shadow-[0_8px_20px_-8px_oklch(0.7_0.13_220/0.7)] transition-transform duration-500 ease-fluid"
                                    style={{ transform: billing === 'yearly' ? 'translateX(100%)' : 'translateX(0)' }}
                                />
                                {BILLING.map((v) => (
                                    <button
                                        key={v}
                                        type="button"
                                        role="radio"
                                        aria-checked={billing === v}
                                        onClick={() => setBilling(v)}
                                        className={cn('relative min-h-10 rounded-full px-6 py-2 text-sm font-medium capitalize transition-colors duration-500 ease-fluid', billing === v ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                            {TIERS.map((t, i) => {
                                const id = planId(t.key, billing);
                                const p = getPlan(id);
                                const selected = tier === t.key;
                                const current = currentPlanId === id;
                                return (
                                    <Reveal key={t.key} delay={i * 80} className="h-full">
                                        <div
                                            onClick={() => setTier(t.key)}
                                            className={cn(
                                                'h-full cursor-pointer rounded-[1.75rem] p-1.5 ring-1 transition-[background-color,box-shadow,transform] duration-700 ease-fluid',
                                                selected
                                                    ? 'bg-primary/[0.08] ring-primary/40 shadow-[0_30px_70px_-34px_oklch(0.7_0.13_220/0.7)]'
                                                    : 'bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.05]'
                                            )}
                                        >
                                            <div className="flex h-full flex-col rounded-[calc(1.75rem-0.375rem)] bg-card p-5 shadow-[inset_0_1px_1px_oklch(1_0_0/0.07)]">
                                                <div className="flex h-6 items-center justify-between">
                                                    <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{t.name}</h3>
                                                    {current ? (
                                                        <Badge variant="secondary">Current plan</Badge>
                                                    ) : t.recommended ? (
                                                        <Badge>Most popular</Badge>
                                                    ) : null}
                                                </div>
                                                <div className="mt-5 h-[4.25rem]">
                                                    <p className="font-display text-4xl font-medium tracking-tight tabular-nums">{p.price}</p>
                                                    <p className="mt-1 text-[13px] text-muted-foreground">{p.period}</p>
                                                </div>
                                                <p className="mt-4 min-h-5 text-sm text-muted-foreground">{p.description}</p>
                                                <ul className="mt-5 flex-1 space-y-2.5 border-t border-white/[0.07] pt-5">
                                                    {featureList(id).map((text) => (
                                                        <li key={text} className="flex items-start gap-2.5 text-[13px] text-foreground/90">
                                                            <Check weight="light" className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                                                            {text}
                                                        </li>
                                                    ))}
                                                </ul>
                                                <Button
                                                    type="button"
                                                    variant={selected ? 'default' : 'outline'}
                                                    size="lg"
                                                    aria-pressed={selected}
                                                    disabled={current}
                                                    onClick={(e) => { e.stopPropagation(); setTier(t.key); }}
                                                    className="mt-6 w-full"
                                                >
                                                    {current ? 'Current plan' : selected ? <><Check weight="light" /> Selected</> : `Choose ${t.name}`}
                                                </Button>
                                            </div>
                                        </div>
                                    </Reveal>
                                );
                            })}
                        </div>
                        <p className="text-[13px] text-muted-foreground">
                            Free is a {SUBSCRIPTION_PLANS.free.trialDays}-day trial with {SUBSCRIPTION_PLANS.free.features.maxServers} server.
                        </p>
                    </section>

                    {/* Comparison */}
                    <section aria-labelledby="compare" className="space-y-5">
                        <h2 id="compare" className="font-display text-xl font-medium tracking-tight">Compare plans</h2>

                        <div className="bezel-sm hidden md:block">
                            <div className="bezel-sm-core overflow-hidden">
                                <table className="w-full text-sm">
                                    <caption className="sr-only">Plan limits and features, {billing} billing</caption>
                                    <thead className="border-b border-white/[0.06]">
                                        <tr>
                                            <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Feature</th>
                                            {compareCols.map((c) => (
                                                <th key={c.id} scope="col" className={cn('px-4 py-3.5 text-center text-[11px] font-medium uppercase tracking-[0.14em]', c.key === tier ? 'text-primary' : 'text-muted-foreground')}>
                                                    {c.name}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.05]">
                                        {COMPARE_ROWS.map((row) => (
                                            <tr key={row.label}>
                                                <th scope="row" className="px-5 py-3.5 text-left font-normal text-muted-foreground">{row.label}</th>
                                                {compareCols.map((c) => (
                                                    <td key={c.id} className={cn('px-4 py-3.5 text-center', c.key === tier && 'bg-primary/[0.04]')}>
                                                        <CellValue value={row.get(getPlan(c.id).features)} />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                        <tr>
                                            <th scope="row" className="px-5 py-3.5 text-left font-normal text-muted-foreground">Service period</th>
                                            {compareCols.map((c) => {
                                                const p = getPlan(c.id);
                                                return (
                                                    <td key={c.id} className={cn('px-4 py-3.5 text-center', c.key === tier && 'bg-primary/[0.04]')}>
                                                        {p.trialDays ? `${p.trialDays}-day trial` : `${p.durationDays} days`}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="space-y-4 md:hidden">
                            {compareCols.map((c) => {
                                const p = getPlan(c.id);
                                return (
                                    <div key={c.id} className="bezel-sm">
                                        <div className="bezel-sm-core p-5">
                                            <h3 className={cn('text-xs font-medium uppercase tracking-[0.2em]', c.key === tier ? 'text-primary' : 'text-muted-foreground')}>{c.name}</h3>
                                            <dl className="mt-4 divide-y divide-white/[0.05] text-sm">
                                                {COMPARE_ROWS.map((row) => (
                                                    <div key={row.label} className="flex items-center justify-between gap-4 py-2.5">
                                                        <dt className="text-muted-foreground">{row.label}</dt>
                                                        <dd className="text-right"><CellValue value={row.get(p.features)} /></dd>
                                                    </div>
                                                ))}
                                                <div className="flex items-center justify-between gap-4 py-2.5">
                                                    <dt className="text-muted-foreground">Service period</dt>
                                                    <dd className="text-right">{p.trialDays ? `${p.trialDays}-day trial` : `${p.durationDays} days`}</dd>
                                                </div>
                                            </dl>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>

                {/* Checkout */}
                <aside aria-labelledby="checkout" className="lg:sticky lg:top-8">
                    <Reveal delay={120}>
                        <div className="bezel">
                            <div className="bezel-core p-6 sm:p-7">
                                <h2 id="checkout" className="font-display text-xl font-medium tracking-tight">Payment details</h2>

                                <div className="mt-5 rounded-2xl bg-black/20 p-4 ring-1 ring-white/[0.05]">
                                    <div className="flex items-baseline justify-between gap-3">
                                        <p className="font-medium">{planLabel(selectedPlan)}</p>
                                        <p className="font-display text-2xl font-medium tabular-nums">{plan.price}</p>
                                    </div>
                                    <p className="mt-1 text-right text-[13px] text-muted-foreground">{plan.period}</p>
                                </div>

                                {error && <Alert tone="error" className="mt-5" title="Payment didn&rsquo;t go through">{error}</Alert>}
                                {isCurrent && (
                                    <Alert tone="info" className="mt-5">You are already on this plan. Pick a different one to upgrade.</Alert>
                                )}

                                <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
                                    <Field id="cardName" label="Name on card" error={errors.cardName}>
                                        <Input id="cardName" name="cardName" autoComplete="cc-name" value={formData.cardName} onChange={handleInputChange} onBlur={handleBlur} placeholder="Name as shown on card" aria-invalid={!!errors.cardName} aria-describedby={errors.cardName ? 'cardName-msg' : undefined} />
                                    </Field>

                                    <Field id="cardNumber" label="Card number" error={errors.cardNumber}>
                                        <div className="relative">
                                            <CreditCard weight="light" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
                                            <Input id="cardNumber" name="cardNumber" inputMode="numeric" autoComplete="cc-number" value={formData.cardNumber} onChange={handleInputChange} onBlur={handleBlur} placeholder="1234 5678 9012 3456" maxLength={19} className="pl-10 font-mono tabular-nums" aria-invalid={!!errors.cardNumber} aria-describedby={errors.cardNumber ? 'cardNumber-msg' : undefined} />
                                        </div>
                                    </Field>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Field id="expiry" label="Expiry" error={errors.expiry}>
                                            <Input id="expiry" name="expiry" inputMode="numeric" autoComplete="cc-exp" value={formData.expiry} onChange={handleInputChange} onBlur={handleBlur} placeholder="MM/YY" maxLength={5} className="font-mono tabular-nums" aria-invalid={!!errors.expiry} aria-describedby={errors.expiry ? 'expiry-msg' : undefined} />
                                        </Field>
                                        <Field id="cvv" label="CVV" error={errors.cvv}>
                                            <Input id="cvv" name="cvv" inputMode="numeric" autoComplete="cc-csc" value={formData.cvv} onChange={handleInputChange} onBlur={handleBlur} placeholder={isAmex(formData.cardNumber) ? '1234' : '123'} maxLength={4} className="font-mono tabular-nums" aria-invalid={!!errors.cvv} aria-describedby={errors.cvv ? 'cvv-msg' : undefined} />
                                        </Field>
                                    </div>

                                    <Button type="submit" size="lg" disabled={loading || isCurrent} className="w-full justify-between pl-6">
                                        {loading ? 'Processing payment' : `Upgrade to ${planLabel(selectedPlan)}`}
                                        {!loading && <ButtonArrow />}
                                    </Button>
                                </form>

                                <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                                    <LockKey weight="light" className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                    Card details are used for this payment only and are not stored.
                                </p>
                            </div>
                        </div>
                    </Reveal>
                </aside>
            </div>
        </PageContainer>
    );
}

export default function SubscriptionPage() {
    return (
        <Suspense
            fallback={
                <PageContainer className="space-y-6">
                    <Skeleton className="h-12 w-72" />
                    <Skeleton className="h-40 rounded-3xl" />
                    <Skeleton className="h-96 rounded-3xl" />
                </PageContainer>
            }
        >
            <SubscriptionContent />
        </Suspense>
    );
}
