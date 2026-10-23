'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { ServerForm } from '@/app/components/Servers/ServerForm';
import { MonitoringForm } from '@/app/components/Servers/MonitoringForm';
import { ArrowLeft, CheckCircle, Check, PencilSimple } from '@phosphor-icons/react';
import Link from 'next/link';
import { getPlanLimits } from '@/app/components/subscriptionPlans';
import SubscriptionPopup from '@/app/components/SubscriptionPopup';
import { PageContainer } from '@/app/components/Layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Button, ButtonArrow } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import { Reveal } from '@/components/ui/reveal';
import { displayUrl } from '@/lib/time';
import { cn } from '@/lib/utils';

export default function NewServerPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [serverData, setServerData] = useState(null);
    const [monitoringData, setMonitoringData] = useState(null);
    const [userPlan, setUserPlan] = useState('free');
    const [serverCount, setServerCount] = useState(0);
    const [maxServers, setMaxServers] = useState(1);
    const [fetchingUserData, setFetchingUserData] = useState(true);

    const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);

    const router = useRouter();
    const { user, apiRequest } = useAuth();

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;

            try {
                setFetchingUserData(true);

                const userData = user;

                // Set plan type from subscription
                const planType = userData.subscription?.plan || 'free';
                setUserPlan(planType);

                const planLimits = getPlanLimits(userData);

                // Set max servers based on user role and plan
                if (userData.role === 'admin') {
                    setMaxServers(Infinity);
                } else {
                    setMaxServers(planLimits.maxServers);
                }

                // Count current servers
                try {
                    const response = await apiRequest('/api/servers', {
                        method: 'GET'
                    });

                    if (response.status === 'success' && response.data.servers) {
                        setServerCount(response.data.servers.length);

                        if (planType === 'free' && response.data.servers.length >= planLimits.maxServers) {
                            setShowSubscriptionPopup(true);
                        }
                    }
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

    const handleServerFormSubmit = (data) => {
        // Check if user has reached their server limit
        if (serverCount >= maxServers && user.role !== 'admin') {
            setShowSubscriptionPopup(true);
            return;
        }

        setServerData(data);
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
            if (serverCount >= maxServers && user.role !== 'admin') {
                throw new Error(`You've reached your plan's limit of ${maxServers} servers. Please upgrade to add more servers.`);
            }

            // Prepare server document
            const serverData = {
                name: serverFormData.name,
                url: serverFormData.url,
                type: serverFormData.type || 'website',
                description: serverFormData.description || '',
                priority: serverFormData.priority || 'medium',
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
                        enabled: monitoringFormData.alertPreferences?.email || monitoringFormData.alertPreferences?.phone || false,
                        email: monitoringFormData.alertPreferences?.email || false,
                        phone: monitoringFormData.alertPreferences?.phone || false,
                        responseThreshold: monitoringFormData.responseThreshold || 1000,
                        timeWindow: {
                            start: monitoringFormData.alertTimeRange?.start || '00:00',
                            end: monitoringFormData.alertTimeRange?.end || '23:59'
                        }
                    }
                },
                contactEmails: monitoringFormData.emails || [],
                contactPhones: monitoringFormData.phones || [],
            };

            // Send to API
            const response = await apiRequest('/api/servers', {
                method: 'POST',
                body: JSON.stringify(serverData)
            });

            if (response.status === 'success') {
                setSuccess(true);

                // Redirect to the servers list after 2 seconds
                setTimeout(() => {
                    router.push('/servers');
                }, 2000);
            } else {
                throw new Error(response.message || 'Failed to add server');
            }
        } catch (err) {
            console.error('Error adding server:', err);

            // If error is about server limit, show subscription popup
            if (err.message && err.message.includes("plan's limit")) {
                setShowSubscriptionPopup(true);
            } else {
                setError(err.message || 'Failed to add server');
            }

            setStep(1); // Go back to first step on error
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { number: 1, title: 'Server details', completed: !!serverData },
        { number: 2, title: 'Monitoring', completed: !!monitoringData },
    ];

    const handleCloseSubscriptionPopup = () => {
        setShowSubscriptionPopup(false);
    };

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
                <div className="mx-auto max-w-3xl space-y-8" role="status" aria-label="Loading">
                    <Skeleton className="h-12 w-72" />
                    <Skeleton className="h-10 w-full max-w-md" />
                    <Skeleton className="h-[28rem] rounded-[1.375rem]" />
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <div className="mx-auto max-w-3xl space-y-8">
                <SubscriptionPopup
                    isOpen={showSubscriptionPopup}
                    onClose={handleCloseSubscriptionPopup}
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
                            : step === 1
                                ? 'Step 1 of 2. Tell us what to check.'
                                : 'Step 2 of 2. Choose when to check and who to alert.'
                    }
                    actions={backAction}
                />

                {/* Step indicator */}
                <nav aria-label="Progress">
                    <ol className="flex items-center gap-3">
                        {steps.map((s, i) => {
                            const current = !success && step === s.number;
                            const done = success || (s.completed && step !== s.number);
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
                                            <span className={cn('block h-px origin-left bg-success transition-transform duration-700 ease-fluid', steps[i].completed || success ? 'scale-x-100' : 'scale-x-0')} />
                                        </li>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </ol>
                </nav>

                {success ? (
                    <Reveal>
                        <div className="bezel-sm" role="status">
                            <div className="bezel-sm-core flex flex-col items-center px-6 py-14 text-center">
                                <CheckCircle weight="light" className="size-12 text-success" />
                                <h2 className="mt-5 font-display text-2xl font-medium tracking-tight">Server added</h2>
                                <p className="mt-2 max-w-[44ch] text-sm leading-relaxed text-muted-foreground">
                                    {serverData?.name} is now being monitored. Taking you to your servers.
                                </p>
                                <Button asChild className="mt-6">
                                    <Link href="/servers">
                                        Go to servers
                                        <ButtonArrow />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </Reveal>
                ) : (
                    <>
                        {step === 1 && (
                            <Reveal>
                                <ServerForm
                                    onSubmit={handleServerFormSubmit}
                                    loading={loading}
                                    error={error}
                                    userPlan={userPlan}
                                    serverCount={serverCount}
                                    maxServers={maxServers}
                                    initialData={serverData}
                                    submitLabel="Continue to monitoring"
                                    cancelHref="/servers"
                                />
                            </Reveal>
                        )}

                        {step === 2 && serverData && (
                            <div className="space-y-6">
                                {/* Server summary */}
                                <div className="flex items-start justify-between gap-4 rounded-2xl bg-white/[0.03] px-5 py-4 ring-1 ring-white/[0.08]">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium">{serverData.name}</p>
                                        <p className="truncate font-mono text-xs text-muted-foreground">{displayUrl(serverData.url)}</p>
                                        {serverData.description && (
                                            <p className="mt-1.5 text-sm text-muted-foreground">{serverData.description}</p>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                                        <PencilSimple weight="light" />
                                        Edit
                                    </Button>
                                </div>

                                {error && <Alert tone="error" title="We couldn’t add this server">{error}</Alert>}

                                <Reveal>
                                    <MonitoringForm
                                        onSave={handleMonitoringFormSubmit}
                                        isLoading={loading}
                                        initialData={monitoringData}
                                        submitLabel="Start monitoring"
                                        loadingLabel="Adding server"
                                        onBack={() => setStep(1)}
                                        backLabel="Back to details"
                                    />
                                </Reveal>
                            </div>
                        )}
                    </>
                )}
            </div>
        </PageContainer>
    );
}
