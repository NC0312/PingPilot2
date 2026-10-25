'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { ServerForm } from '@/app/components/Servers/ServerForm';
import { MonitoringForm } from '@/app/components/Servers/MonitoringForm';
import TrialNotice from '@/app/components/TrialNotice';
import { ArrowLeft, ArrowSquareOut, ArrowsClockwise, ChartLineUp, Trash, CircleNotch, WarningCircle } from '@phosphor-icons/react';
import Link from 'next/link';
import { PageContainer } from '@/app/components/Layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status';
import { EmptyState } from '@/components/ui/empty-state';
import { Reveal } from '@/components/ui/reveal';
import { displayUrl, toHref, formatDateTime, timeAgo } from '@/lib/time';
import { cn } from '@/lib/utils';

// Deleting is not a settings section, so it sits below the tabs instead of hiding in one.
const TABS = [
    { id: 'general', label: 'General' },
    { id: 'monitoring', label: 'Checks and alerts' },
];

export default function ServerSettingsPage() {
    const [server, setServer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('general');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteInput, setDeleteInput] = useState('');
    // Which tabs hold edits that haven't been saved, and a counter the forms use to reset after a save.
    const [dirty, setDirty] = useState({ general: false, monitoring: false });
    const [savedKey, setSavedKey] = useState({ general: 0, monitoring: 0 });
    const tabRefs = useRef({});
    const feedbackRef = useRef(null);

    const router = useRouter();
    const params = useParams();
    const serverId = params.id;
    const { user, apiRequest } = useAuth();

    const setGeneralDirty = useCallback((v) => setDirty((d) => (d.general === v ? d : { ...d, general: v })), []);
    const setMonitoringDirty = useCallback((v) => setDirty((d) => (d.monitoring === v ? d : { ...d, monitoring: v })), []);

    useEffect(() => {
        let redirecting = false;

        const fetchServer = async () => {
            if (!serverId || !user) return;

            try {
                setLoading(true);

                const response = await apiRequest(`/api/servers/${serverId}`, {
                    method: 'GET'
                });

                if (response.status !== 'success' || !response.data.server) {
                    throw new Error('Server not found');
                }

                const serverData = response.data.server;

                // Check if user is authorized to access this server (convert to strings for comparison)
                const currentUserId = user._id || user.id; // Support both _id and id
                if (String(serverData.uploadedBy) !== String(currentUserId) && user.role !== 'admin') {
                    // Keep the skeleton up while leaving, instead of flashing an empty page
                    redirecting = true;
                    router.push('/servers');
                    return;
                }

                setServer(serverData);
            } catch (err) {
                console.error('Error fetching server:', err);
                setError(err.message || 'Failed to load server details');
            } finally {
                if (!redirecting) setLoading(false);
            }
        };

        fetchServer();
    }, [serverId, user, router, apiRequest]);

    // The save buttons sit far below the page header, so bring the result message into view.
    useEffect(() => {
        if (successMessage || error) {
            feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [successMessage, error]);

    // Leaving with unsaved edits loses them, so ask the browser to confirm.
    const hasUnsaved = dirty.general || dirty.monitoring;
    useEffect(() => {
        if (!hasUnsaved) return;
        const warn = (e) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [hasUnsaved]);

    const handleServerUpdate = async (updatedData) => {
        if (!server) return;

        try {
            setSaving(true);
            setError(null);
            setSuccessMessage(null);

            const data = {
                name: updatedData.name,
                url: updatedData.url,
                type: updatedData.type,
                description: updatedData.description,
                priority: updatedData.priority
            };

            const response = await apiRequest(`/api/servers/${serverId}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });

            if (response.status !== 'success') {
                throw new Error(response.message || 'Failed to update server');
            }

            setServer({
                ...server,
                ...data
            });
            setSavedKey((k) => ({ ...k, general: k.general + 1 }));

            setSuccessMessage('Server details saved.');
        } catch (err) {
            console.error('Error updating server:', err);
            setError(err.message || 'Failed to update server');
        } finally {
            setSaving(false);
        }
    };

    const handleMonitoringUpdate = async (updatedData) => {
        if (!server) return;

        try {
            setSaving(true);
            setError(null);
            setSuccessMessage(null);

            const data = {
                // Servers created before timezones existed get the browser's now, so their hours mean something
                timezone: server.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                monitoring: {
                    frequency: updatedData.checkFrequency,
                    daysOfWeek: updatedData.monitoringDays,
                    timeWindows: [
                        {
                            start: updatedData.checkTimeRange?.start || '00:00',
                            end: updatedData.checkTimeRange?.end || '23:59'
                        }
                    ],
                    alerts: {
                        enabled: updatedData.alertPreferences?.email || false,
                        email: updatedData.alertPreferences?.email || false,
                        phone: false, // phone-call alerts were removed; the field stays so the API payload shape is unchanged
                        webhookUrl: updatedData.webhookUrl || '',
                        responseThreshold: updatedData.responseThreshold || 1000,
                        timeWindow: {
                            start: updatedData.alertTimeRange?.start || '00:00',
                            end: updatedData.alertTimeRange?.end || '23:59'
                        }
                    }
                },
                contactEmails: updatedData.emails || [],
                contactPhones: []
            };

            const response = await apiRequest(`/api/servers/${serverId}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });

            if (response.status !== 'success') {
                throw new Error(response.message || 'Failed to update monitoring settings');
            }

            // Merge rather than replace: fields the form doesn't edit (like the trial end date) must survive.
            setServer({
                ...server,
                ...data,
                monitoring: {
                    ...server.monitoring,
                    ...data.monitoring,
                    alerts: { ...server.monitoring?.alerts, ...data.monitoring.alerts },
                },
            });
            setSavedKey((k) => ({ ...k, monitoring: k.monitoring + 1 }));

            setSuccessMessage('Checks and alerts saved.');
        } catch (err) {
            console.error('Error updating monitoring settings:', err);
            setError(err.message || 'Failed to update monitoring settings');
        } finally {
            setSaving(false);
        }
    };

    // Run a check right now, so a change can be tried without leaving this page.
    const handleCheckNow = async () => {
        if (!server) return;
        try {
            setChecking(true);
            setError(null);
            setSuccessMessage(null);
            const response = await apiRequest(`/api/servers/${serverId}/check`, { method: 'POST' });
            if (response.status === 'success') {
                const check = response.data.check;
                setServer((s) => ({ ...s, status: check.status, responseTime: check.responseTime, error: check.error, lastChecked: check.timestamp }));
            }
        } catch (err) {
            console.error('Error checking server:', err);
            setError('That check didn’t go through. Try again in a moment.');
        } finally {
            setChecking(false);
        }
    };

    // Stable identity: the Dialog re-focuses its panel whenever onClose changes
    const closeDeleteDialog = useCallback(() => {
        if (saving) return;
        setDeleteConfirmOpen(false);
        setDeleteInput('');
    }, [saving]);

    const handleDeleteServer = async (e) => {
        e?.preventDefault();
        if (!server || deleteInput !== server.name) return;

        try {
            setSaving(true);
            setError(null);

            const response = await apiRequest(`/api/servers/${serverId}`, {
                method: 'DELETE'
            });

            if (response.status !== 'success') {
                throw new Error(response.message || 'Failed to delete server');
            }

            // The server is gone, so there is nothing left to warn about losing.
            setDirty({ general: false, monitoring: false });
            router.push('/servers');
        } catch (err) {
            console.error('Error deleting server:', err);
            setError(err.message || 'Failed to delete server');
            setSaving(false);
            setDeleteConfirmOpen(false);
            setDeleteInput('');
        }
    };

    // Prepare initial form data for server form
    const getServerFormData = () => {
        if (!server) return null;

        return {
            name: server.name,
            // The API stores addresses without a protocol; the form needs a full URL for websites and APIs.
            url: ['tcp', 'database'].includes(server.type) ? server.url : toHref(server.url),
            type: server.type || 'website',
            description: server.description || '',
            priority: server.priority || 'medium'
        };
    };

    // Prepare initial form data for monitoring form
    const getMonitoringFormData = () => {
        if (!server) return null;

        return {
            alertPreferences: {
                email: server.monitoring?.alerts?.email || false
            },
            monitoringDays: server.monitoring?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
            alertTimeRange: server.monitoring?.alerts?.timeWindow || {
                start: '00:00',
                end: '23:59'
            },
            checkTimeRange: server.monitoring?.timeWindows?.[0] || {
                start: '00:00',
                end: '23:59'
            },
            checkFrequency: server.monitoring?.frequency || 5,
            timezone: server.timezone,
            responseThreshold: server.monitoring?.alerts?.responseThreshold || 1000,
            webhookUrl: server.monitoring?.alerts?.webhookUrl || '',
            emails: server.contactEmails || []
        };
    };

    // Arrow keys move between tabs, as in the WAI-ARIA tabs pattern
    const onTabKeyDown = (e, index) => {
        let next = null;
        if (e.key === 'ArrowRight') next = (index + 1) % TABS.length;
        if (e.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = TABS.length - 1;
        if (next === null) return;
        e.preventDefault();
        setActiveTab(TABS[next].id);
        tabRefs.current[TABS[next].id]?.focus();
    };

    const switchTab = (id) => {
        setActiveTab(id);
        setSuccessMessage(null);
    };

    const backLink = (
        <Button asChild variant="ghost" size="sm">
            <Link href="/servers">
                <ArrowLeft weight="light" />
                Back to servers
            </Link>
        </Button>
    );

    if (loading) {
        return (
            <PageContainer>
                <div className="mx-auto max-w-3xl space-y-8" role="status" aria-label="Loading server">
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-14 w-80" />
                    <Skeleton className="h-24 rounded-[1.375rem]" />
                    <Skeleton className="h-11 w-full max-w-md rounded-full" />
                    <Skeleton className="h-[26rem] rounded-[1.375rem]" />
                </div>
            </PageContainer>
        );
    }

    if (error && !server) {
        return (
            <PageContainer>
                <div className="mx-auto max-w-3xl">
                    <div className="bezel-sm">
                        <div className="bezel-sm-core">
                            <EmptyState
                                icon={WarningCircle}
                                title="We couldn’t load this server"
                                description={error}
                                action={
                                    <Button asChild variant="outline">
                                        <Link href="/servers">
                                            <ArrowLeft weight="light" />
                                            Back to servers
                                        </Link>
                                    </Button>
                                }
                            />
                        </div>
                    </div>
                </div>
            </PageContainer>
        );
    }

    const status = server?.status === 'up' || server?.status === 'down' ? server.status : 'unknown';

    return (
        <PageContainer>
            <div className="mx-auto max-w-3xl space-y-8">
                <PageHeader
                    eyebrow="Server settings"
                    title={server?.name}
                    description={
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <a
                                href={toHref(server?.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-mono text-[13px] transition-colors duration-300 ease-fluid hover:text-primary"
                            >
                                {displayUrl(server?.url)}
                                <ArrowSquareOut weight="light" className="size-3.5" />
                                <span className="sr-only">(opens in a new tab)</span>
                            </a>
                            {(server?.uploadedAt || server?.createdAt) && (
                                <>
                                    <span aria-hidden="true">·</span>
                                    <span>Added {formatDateTime(server?.uploadedAt || server?.createdAt)}</span>
                                </>
                            )}
                        </span>
                    }
                    actions={backLink}
                />

                {/* Where this server stands right now, so a setting can be judged against it */}
                <section aria-label="Current status" className="bezel-sm">
                    <div className="bezel-sm-core flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                        <div className="min-w-0 space-y-2">
                            <StatusBadge
                                status={status}
                                label={status === 'up' ? 'Operational' : status === 'down' ? 'Down' : 'Waiting for first check'}
                            />
                            <p className="text-sm text-muted-foreground">
                                {status === 'unknown' && 'No result yet. Run a check to see how it responds.'}
                                {status === 'up' && (
                                    <>
                                        Responding{server.responseTime ? <> in <span className="font-mono tabular-nums text-foreground">{server.responseTime} ms</span></> : null}
                                        {server.lastChecked ? ` · checked ${timeAgo(server.lastChecked)}` : ''}
                                    </>
                                )}
                                {status === 'down' && (
                                    <>
                                        {server.error ? <span className="font-mono text-[13px] text-destructive">{server.error}</span> : 'Not answering'}
                                        {server.lastChecked ? ` · checked ${timeAgo(server.lastChecked)}` : ''}
                                    </>
                                )}
                            </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleCheckNow} disabled={checking}>
                                <ArrowsClockwise weight="light" className={checking ? 'animate-spin' : ''} />
                                {checking ? 'Checking' : 'Check now'}
                            </Button>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/servers">
                                    <ChartLineUp weight="light" />
                                    Live data
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {server && <TrialNotice servers={[server]} />}

                <div ref={feedbackRef} className="scroll-mt-24 space-y-4 empty:hidden">
                    {successMessage && <Alert tone="success">{successMessage}</Alert>}
                    {error && (
                        <Alert tone="error" title="Something went wrong">
                            {error}
                        </Alert>
                    )}
                </div>

                {/* Tabs */}
                <div role="tablist" aria-label="Server settings sections" className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.08] sm:inline-flex">
                    {TABS.map((tab, i) => {
                        const on = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                ref={(el) => { tabRefs.current[tab.id] = el; }}
                                id={`tab-${tab.id}`}
                                role="tab"
                                type="button"
                                aria-selected={on}
                                aria-controls={`panel-${tab.id}`}
                                tabIndex={on ? 0 : -1}
                                onClick={() => switchTab(tab.id)}
                                onKeyDown={(e) => onTabKeyDown(e, i)}
                                className={cn(
                                    'inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-[background-color,color] duration-500 ease-fluid',
                                    on ? 'bg-white/[0.1] text-foreground' : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                {tab.label}
                                {dirty[tab.id] && (
                                    <>
                                        <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />
                                        <span className="sr-only">(unsaved changes)</span>
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Tab panels. Both stay mounted and the inactive one is hidden, so edits survive switching tabs. */}
                <div role="tabpanel" id="panel-general" aria-labelledby="tab-general" tabIndex={0} hidden={activeTab !== 'general'} className="outline-none">
                    <Reveal>
                        <ServerForm
                            onSubmit={handleServerUpdate}
                            loading={saving}
                            error={null}
                            initialData={getServerFormData()}
                            userPlan={user?.subscription?.plan || 'free'}
                            serverCount={1}
                            maxServers={10}
                            isEdit={true}
                            onDirtyChange={setGeneralDirty}
                            savedKey={savedKey.general}
                        />
                    </Reveal>
                </div>

                <div role="tabpanel" id="panel-monitoring" aria-labelledby="tab-monitoring" tabIndex={0} hidden={activeTab !== 'monitoring'} className="outline-none">
                    <Reveal>
                        <MonitoringForm
                            onSave={handleMonitoringUpdate}
                            initialData={getMonitoringFormData()}
                            isLoading={saving}
                            submitLabel="Save changes"
                            onDirtyChange={setMonitoringDirty}
                            savedKey={savedKey.monitoring}
                        />
                    </Reveal>
                </div>

                {/* Deleting: separate from the settings above, visible but not loud */}
                <section aria-labelledby="delete-heading" className="flex flex-col gap-5 border-t border-white/[0.07] pt-8 sm:flex-row sm:items-center sm:justify-between">
                    <div className="max-w-[52ch] space-y-1.5">
                        <h2 id="delete-heading" className="font-display text-lg font-medium tracking-tight">Delete this server</h2>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            Monitoring stops immediately and the check history for {server?.name} is removed for good.
                        </p>
                    </div>
                    <Button variant="destructive" onClick={() => setDeleteConfirmOpen(true)} className="shrink-0">
                        <Trash weight="light" />
                        Delete server
                    </Button>
                </section>

                <Dialog
                    open={deleteConfirmOpen}
                    onClose={closeDeleteDialog}
                    title="Delete this server?"
                    description="All monitoring data for this server will be permanently deleted. This can’t be undone."
                    footer={
                        <>
                            <Button type="button" variant="ghost" onClick={closeDeleteDialog} disabled={saving}>
                                Keep server
                            </Button>
                            <Button type="submit" form="delete-server-form" variant="destructive" disabled={deleteInput !== server?.name || saving}>
                                {saving ? (
                                    <>
                                        <CircleNotch weight="light" className="animate-spin" />
                                        Deleting
                                    </>
                                ) : (
                                    <>
                                        <Trash weight="light" />
                                        Delete permanently
                                    </>
                                )}
                            </Button>
                        </>
                    }
                >
                    <form id="delete-server-form" onSubmit={handleDeleteServer}>
                        <Field
                            id="delete-confirm"
                            label={
                                <>
                                    Type <span className="rounded-md bg-white/[0.07] px-1.5 py-0.5 font-mono text-[13px]">{server?.name}</span> to confirm
                                </>
                            }
                        >
                            <Input
                                id="delete-confirm"
                                value={deleteInput}
                                onChange={(e) => setDeleteInput(e.target.value)}
                                placeholder="Server name"
                                autoComplete="off"
                            />
                        </Field>
                    </form>
                </Dialog>
            </div>
        </PageContainer>
    );
}
