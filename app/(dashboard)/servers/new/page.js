'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { ServerForm } from '@/app/components/Servers/ServerForm';
import { MonitoringForm, getDefaultMonitoring } from '@/app/components/Servers/MonitoringForm';
import { ArrowLeft, CheckCircle, Check, PencilSimple, Bell, ClockCountdown, Gauge, Lock, CircleNotch } from '@phosphor-icons/react';
import Link from 'next/link';
import { getPlanLimits } from '@/app/components/subscriptionPlans';
import { planLabel } from '@/app/components/planCatalog';
import SubscriptionPopup from '@/app/components/SubscriptionPopup';
import { PageContainer } from '@/app/components/Layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Button, ButtonArrow } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import { Reveal } from '@/components/ui/reveal';
import { displayUrl } from '@/lib/time';
import { cn } from '@/lib/utils';
import { countServers } from '@/lib/servers';
import { keywordPayload, supportsKeyword } from '@/lib/keyword';

const slots = (n) => `${n} ${n === 1 ? 'server' : 'servers'}`;

// Plan and slots: the context the user needs while filling in the form.
function PlanPanel({ plan, isAdmin, serverCount, maxServers }) {
    const limited = !isAdmin && Number.isFinite(maxServers);
    const pct = limited ? Math.min(100, Math.round((serverCount / maxServers) * 100)) : 0;
    const full = limited && serverCount >= maxServers;

    return (
        <aside aria-label="Your plan" className="bezel-sm">
            <div className="bezel-sm-core space-y-5 p-6">
                <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Your plan</p>
                    <p className="font-display text-lg font-medium tracking-tight">{isAdmin ? 'Admin' : planLabel(plan)}</p>
                </div>

                <div>
                    <div className="flex items-baseline justify-between text-sm">
                        <span className="text-muted-foreground">Servers</span>
                        <span className="font-mono tabular-nums">{limited ? `${serverCount} of ${maxServers} used` : `${serverCount}, no limit`}</span>
                    </div>
                    {limited && (
                        <div
                            className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]"
                            role="progressbar"
                            aria-label="Server slots used"
                            aria-valuemin={0}
                            aria-valuemax={maxServers}
                            aria-valuenow={serverCount}
                        >
                            <div
                                className={cn('h-full origin-left rounded-full transition-transform duration-700 ease-fluid', full ? 'bg-warning' : 'bg-primary')}
                                style={{ width: '100%', transform: `scaleX(${pct / 100})` }}
                            />
                        </div>
                    )}
                </div>

                <Link href="/subscription" className="inline-flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline">
                    Compare plans
                </Link>
            </div>
        </aside>
    );
}

export default function NewServerPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [serverData, setServerData] = useState(null);
    const [monitoringData, setMonitoringData] = useState(null);
    const [customize, setCustomize] = useState(false);
    const [userPlan, setUserPlan] = useState('free');
    const [serverCount, setServerCount] = useState(0);
    const [maxServers, setMaxServers] = useState(1);
    const [fetchingUserData, setFetchingUserData] = useState(true);

    const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);

    const { user, apiRequest } = useAuth();
    const errorRef = useRef(null);

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;

            try {
                setFetchingUserData(true);

                const planType = user.subscription?.plan || 'free';
                setUserPlan(planType);

                const planLimits = getPlanLimits(user);
                setMaxServers(user.role === 'admin' ? Infinity : planLimits.maxServers);

                // Count current servers
                try {
                    const count = await countServers(apiRequest);

                    setServerCount(count);
                } catch (err) {
                    console.error('Error fetching servers:', err);
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('We couldn’t load your account details. Refresh the page to try again.');
            } finally {
                setFetchingUserData(false);
            }
        };

        fetchUserData();
    }, [user, apiRequest]);

    // A failed save leaves the user on step 2; make sure they see why.
    useEffect(() => {
        if (error && step === 2) {
            errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [error, step]);

    const atLimit = !isAdmin && Number.isFinite(maxServers) && serverCount >= maxServers;

    // What "Start monitoring" uses when the user doesn't customise: the plan's allowed range wins over the 5-minute default.
    const defaultMonitoring = (() => {
        const base = getDefaultMonitoring(user);
        const limits = isAdmin ? { minCheckFrequency: 1, maxCheckFrequency: 60 } : getPlanLimits(user);
        return {
            ...base,
            checkFrequency: Math.min(limits.maxCheckFrequency, Math.max(limits.minCheckFrequency, base.checkFrequency)),
        };
    })();

    const handleServerFormSubmit = (data) => {
        if (atLimit) {
            setShowSubscriptionPopup(true);
            return;
        }

        setServerData(data);
        setError(null);
        setStep(2);
    };

    const handleMonitoringFormSubmit = async (data) => {
        setMonitoringData(data);
        await createServer(serverData, data);
    };

    const createServer = async (serverFormData, monitoringFormData) => {
        setLoading(true);
        setError(null);

        try {
            // First, check if user has reached their server limit
            if (atLimit) {
                throw new Error(`You've reached your plan's limit of ${maxServers} servers. Please upgrade to add more servers.`);
            }

            // Prepare server document
            const payload = {
                name: serverFormData.name,
                url: serverFormData.url,
                type: serverFormData.type || 'website',
                description: serverFormData.description || '',
                priority: serverFormData.priority || 'medium',
                // Check days/hours and alert hours are read on the user's own clock
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                monitoring: {
                    frequency: monitoringFormData.checkFrequency || 5,
                    daysOfWeek: monitoringFormData.monitoringDays || [0, 1, 2, 3, 4, 5, 6],
                    timeWindows: [
                        {
                            start: monitoringFormData.checkTimeRange?.start || '00:00',
                            end: monitoringFormData.checkTimeRange?.end || '23:59'
                        }
                    ],
                    alerts: {
                        // Alerts are on when any channel is: email, or a chat or webhook address. (Email alone used to decide, so a
                        // server alerting only to Slack or a webhook never sent anything.)
                        enabled: monitoringFormData.alertPreferences?.email || !!monitoringFormData.webhookUrl || false,
                        email: monitoringFormData.alertPreferences?.email || false,
                        phone: false, // phone-call alerts were removed; the field stays so the API payload shape is unchanged
                        webhookUrl: monitoringFormData.webhookUrl || '',
                        responseThreshold: monitoringFormData.responseThreshold || 1000,
                        timeWindow: {
                            start: monitoringFormData.alertTimeRange?.start || '00:00',
                            end: monitoringFormData.alertTimeRange?.end || '23:59'
                        }
                    }
                },
                contactEmails: monitoringFormData.emails || [],
                contactPhones: [],
            };

            // A page content check only for websites and APIs, and only when the text is filled in
            const keyword = supportsKeyword(payload.type) ? keywordPayload(monitoringFormData.keyword, { clearable: false }) : undefined;
            if (keyword) payload.monitoring.keyword = keyword;

            const response = await apiRequest('/api/servers', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (response.status === 'success') {
                setServerCount((n) => n + 1);
                setSuccess(true);
            } else {
                throw new Error(response.message || 'Failed to add server');
            }
        } catch (err) {
            console.error('Error adding server:', err);

            // If error is about server limit, show subscription popup
            if (err.message && err.message.includes("plan's limit")) {
                setShowSubscriptionPopup(true);
            } else {
                // Stay on this step: the user's choices are all still here, and "Edit" is one click away.
                setError(err.message || 'Failed to add server');
            }
        } finally {
            setLoading(false);
        }
    };

    const addAnother = () => {
        setSuccess(false);
        setServerData(null);
        setMonitoringData(null);
        setCustomize(false);
        setError(null);
        setStep(1);
    };

    const steps = [
        { number: 1, title: 'What to watch' },
        { number: 2, title: 'Checks and alerts' },
    ];

    const backAction = (
        <Button asChild variant="ghost" size="sm">
            <Link href="/servers">
                <ArrowLeft weight="light" />
                Back to servers
            </Link>
        </Button>
    );

    if (fetchingUserData) {
        return (
            <PageContainer>
                <div className="mx-auto max-w-5xl space-y-8" role="status" aria-label="Loading">
                    <Skeleton className="h-12 w-72" />
                    <Skeleton className="h-10 w-full max-w-md" />
                    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
                        <Skeleton className="h-[26rem] rounded-[1.375rem]" />
                        <Skeleton className="h-56 rounded-[1.375rem]" />
                    </div>
                </div>
            </PageContainer>
        );
    }

    // The full monitoring form needs the width, so the plan panel steps aside while customising;
    // at the limit the main panel already says everything the plan panel would.
    const showAside = !customize && !atLimit;

    return (
        <PageContainer>
            <div className={cn('mx-auto space-y-8', showAside ? 'max-w-5xl' : customize && step === 2 && !success ? 'max-w-6xl' : 'max-w-3xl')}>
                <SubscriptionPopup
                    isOpen={showSubscriptionPopup}
                    onClose={() => setShowSubscriptionPopup(false)}
                    currentPlan={userPlan}
                    serverCount={serverCount}
                    maxServers={maxServers}
                />

                <PageHeader
                    eyebrow="New monitor"
                    title="Add a server"
                    description={
                        success
                            ? 'Your server is added.'
                            : atLimit
                                ? 'You’ve used every server slot on your plan.'
                                : step === 1
                                    ? 'Step 1 of 2. Tell us what to check.'
                                    : 'Step 2 of 2. Confirm how it is checked, then start.'
                    }
                    actions={backAction}
                />

                {(!atLimit || success) && (
                    <nav aria-label="Progress">
                        <ol className="flex items-center gap-3">
                            {steps.map((s, i) => {
                                const current = !success && step === s.number;
                                const done = success || (s.number === 1 && step === 2);
                                return (
                                    <React.Fragment key={s.number}>
                                        <li aria-current={current ? 'step' : undefined} className="flex items-center gap-3">
                                            <span
                                                className={cn(
                                                    'grid size-8 place-items-center rounded-full text-sm font-medium tabular-nums ring-1 transition-[background-color,color,box-shadow] duration-500 ease-fluid',
                                                    current && 'bg-primary text-primary-foreground ring-primary',
                                                    done && 'bg-success/15 text-success ring-success/40',
                                                    !current && !done && 'bg-white/[0.04] text-muted-foreground ring-white/10'
                                                )}
                                            >
                                                {done ? <Check weight="bold" className="size-4" /> : s.number}
                                            </span>
                                            <span className={cn('text-sm font-medium', current ? 'text-foreground' : 'text-muted-foreground')}>
                                                {s.title}
                                                <span className="sr-only">{done ? ' (completed)' : current ? ' (current step)' : ''}</span>
                                            </span>
                                        </li>
                                        {i < steps.length - 1 && (
                                            <li aria-hidden="true" className="h-px flex-1 bg-white/10">
                                                <span className={cn('block h-px origin-left bg-success transition-transform duration-700 ease-fluid', step === 2 || success ? 'scale-x-100' : 'scale-x-0')} />
                                            </li>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </ol>
                    </nav>
                )}

                <div className={cn('grid gap-8', showAside && 'xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start')}>
                    <div className="min-w-0 space-y-6">
                        {success ? (
                            <Reveal>
                                <div className="bezel-sm" role="status">
                                    <div className="bezel-sm-core flex flex-col items-center px-6 py-14 text-center">
                                        <CheckCircle weight="light" className="size-12 text-success" />
                                        <h2 className="mt-5 font-display text-2xl font-medium tracking-tight">{serverData?.name} is being monitored</h2>
                                        <p className="mt-2 max-w-[44ch] text-sm leading-relaxed text-muted-foreground">
                                            Its first results will show up on your Servers page shortly. We email you if it stops answering.
                                        </p>
                                        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                                            <Button asChild size="lg">
                                                <Link href="/servers">
                                                    View servers
                                                    <ButtonArrow />
                                                </Link>
                                            </Button>
                                            {!atLimit && (
                                                <Button size="lg" variant="outline" onClick={addAnother}>
                                                    Add another server
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Reveal>
                        ) : atLimit ? (
                            <Reveal>
                                <div className="bezel-sm">
                                    <div className="bezel-sm-core flex flex-col items-center px-6 py-14 text-center">
                                        <Lock weight="light" className="size-10 text-muted-foreground" />
                                        <h2 className="mt-5 font-display text-2xl font-medium tracking-tight">
                                            {userPlan === 'free' ? 'The free plan includes' : 'Your plan includes'} {slots(maxServers)}
                                        </h2>
                                        <p className="mt-2 max-w-[44ch] text-sm leading-relaxed text-muted-foreground">
                                            You’re using {serverCount === 1 ? 'it' : `all ${serverCount}`}. Move to a bigger plan to monitor more, or remove one you no longer need.
                                        </p>
                                        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                                            <Button asChild size="lg">
                                                <Link href="/subscription">
                                                    See plans
                                                    <ButtonArrow />
                                                </Link>
                                            </Button>
                                            <Button asChild size="lg" variant="outline">
                                                <Link href="/servers">Manage servers</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Reveal>
                        ) : step === 1 ? (
                            <Reveal>
                                <ServerForm
                                    onSubmit={handleServerFormSubmit}
                                    loading={loading}
                                    error={null}
                                    userPlan={userPlan}
                                    serverCount={serverCount}
                                    maxServers={maxServers}
                                    initialData={serverData}
                                    submitLabel="Continue"
                                    cancelHref="/servers"
                                />
                            </Reveal>
                        ) : (
                            serverData && (
                                <div className="space-y-6">
                                    {/* What is being added, with a way back to change it */}
                                    <div className="flex items-start justify-between gap-4 rounded-2xl bg-white/[0.03] px-5 py-4 ring-1 ring-white/[0.08]">
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">{serverData.name}</p>
                                            <p className="truncate font-mono text-xs text-muted-foreground">{displayUrl(serverData.url)}</p>
                                            {serverData.description && (
                                                <p className="mt-1.5 text-sm text-muted-foreground">{serverData.description}</p>
                                            )}
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setStep(1)} disabled={loading}>
                                            <PencilSimple weight="light" />
                                            Edit
                                        </Button>
                                    </div>

                                    {error && (
                                        <div ref={errorRef} className="scroll-mt-24">
                                            <Alert tone="error" title="We couldn’t add this server">{error}</Alert>
                                        </div>
                                    )}

                                    {customize ? (
                                        <Reveal>
                                            <MonitoringForm
                                                serverType={serverData?.type || 'website'}
                                                onSave={handleMonitoringFormSubmit}
                                                isLoading={loading}
                                                initialData={monitoringData || defaultMonitoring}
                                                submitLabel="Start monitoring"
                                                loadingLabel="Adding server"
                                                onBack={() => setCustomize(false)}
                                                backLabel="Use the defaults"
                                            />
                                        </Reveal>
                                    ) : (
                                        <Reveal>
                                            <section aria-labelledby="defaults-heading" className="bezel-sm">
                                                <div className="bezel-sm-core space-y-7 p-6 sm:p-8">
                                                    <div className="space-y-1.5">
                                                        <h2 id="defaults-heading" className="font-display text-xl font-medium tracking-tight">Ready to start</h2>
                                                        <p className="text-sm text-muted-foreground">
                                                            These settings suit most servers. You can change any of them later in the server’s settings.
                                                        </p>
                                                    </div>

                                                    <dl className="divide-y divide-white/[0.06] rounded-2xl bg-white/[0.02] ring-1 ring-white/[0.06]">
                                                        {[
                                                            { icon: ClockCountdown, term: 'Checks', detail: `Every ${defaultMonitoring.checkFrequency} min, every day, all day` },
                                                            { icon: Bell, term: 'Alerts', detail: user?.email ? `Email to ${user.email} when it stops answering` : 'Email when it stops answering' },
                                                            { icon: Gauge, term: 'Slow responses', detail: `Alert when a check takes over ${defaultMonitoring.responseThreshold.toLocaleString()} ms` },
                                                        ].map(({ icon: Icon, term, detail }) => (
                                                            <div key={term} className="flex items-start gap-4 px-5 py-4">
                                                                <Icon weight="light" className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                                                                <div className="min-w-0">
                                                                    <dt className="text-sm font-medium">{term}</dt>
                                                                    <dd className="mt-0.5 text-sm text-muted-foreground">{detail}</dd>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </dl>

                                                    <div className="flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-between">
                                                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                                                            <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={loading}>
                                                                <ArrowLeft weight="light" />
                                                                Back
                                                            </Button>
                                                            <Button type="button" variant="ghost" onClick={() => setCustomize(true)} disabled={loading}>
                                                                Customize
                                                            </Button>
                                                        </div>
                                                        <Button type="button" size="lg" onClick={() => createServer(serverData, defaultMonitoring)} disabled={loading}>
                                                            {loading ? (
                                                                <>
                                                                    <CircleNotch weight="light" className="animate-spin" />
                                                                    Adding server
                                                                </>
                                                            ) : (
                                                                'Start monitoring'
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </section>
                                        </Reveal>
                                    )}
                                </div>
                            )
                        )}
                    </div>

                    {showAside && !success && (
                        <div className="xl:sticky xl:top-8">
                            <PlanPanel plan={userPlan} isAdmin={isAdmin} serverCount={serverCount} maxServers={maxServers} />
                        </div>
                    )}
                </div>
            </div>
        </PageContainer>
    );
}
