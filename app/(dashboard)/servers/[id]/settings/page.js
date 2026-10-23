'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { ServerForm } from '@/app/components/Servers/ServerForm';
import { MonitoringForm } from '@/app/components/Servers/MonitoringForm';
import { ArrowLeft, ArrowSquareOut, Trash, CircleNotch, WarningCircle } from '@phosphor-icons/react';
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
import { displayUrl, toHref, formatDateTime } from '@/lib/time';
import { cn } from '@/lib/utils';

const TABS = [
    { id: 'general', label: 'General' },
    { id: 'monitoring', label: 'Monitoring and alerts' },
    { id: 'danger', label: 'Danger zone', danger: true },
];

export default function ServerSettingsPage() {
    const [server, setServer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('general');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteInput, setDeleteInput] = useState('');
    const tabRefs = useRef({});

    const router = useRouter();
    const params = useParams();
    const serverId = params.id;
    const { user, apiRequest } = useAuth();

    useEffect(() => {
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
                    router.push('/servers');
                    return;
                }

                setServer(serverData);
            } catch (err) {
                console.error('Error fetching server:', err);
                setError(err.message || 'Failed to load server details');
            } finally {
                setLoading(false);
            }
        };

        fetchServer();
    }, [serverId, user, router, apiRequest]);

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
                        enabled: updatedData.alertPreferences?.email || updatedData.alertPreferences?.phone || false,
                        email: updatedData.alertPreferences?.email || false,
                        phone: updatedData.alertPreferences?.phone || false,
                        responseThreshold: updatedData.responseThreshold || 1000,
                        timeWindow: {
                            start: updatedData.alertTimeRange?.start || '00:00',
                            end: updatedData.alertTimeRange?.end || '23:59'
                        }
                    }
                },
                contactEmails: updatedData.emails || [],
                contactPhones: updatedData.phones || []
            };

            const response = await apiRequest(`/api/servers/${serverId}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });

            if (response.status !== 'success') {
                throw new Error(response.message || 'Failed to update monitoring settings');
            }

            setServer({
                ...server,
                ...data
            });

            setSuccessMessage('Monitoring settings saved.');
        } catch (err) {
            console.error('Error updating monitoring settings:', err);
            setError(err.message || 'Failed to update monitoring settings');
        } finally {
            setSaving(false);
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
            url: server.url,
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
                email: server.monitoring?.alerts?.email || false,
                phone: server.monitoring?.alerts?.phone || false
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
            responseThreshold: server.monitoring?.alerts?.responseThreshold || 1000,
            emails: server.contactEmails || [],
            phones: server.contactPhones || []
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
                    actions={
                        <>
                            {server?.status && <StatusBadge status={server.status} />}
                            {backLink}
                        </>
                    }
                />

                {successMessage && <Alert tone="success">{successMessage}</Alert>}
                {error && (
                    <Alert tone="error" title="Something went wrong">
                        {error}
                    </Alert>
                )}

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
                                    'min-h-10 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-[background-color,color] duration-500 ease-fluid',
                                    on
                                        ? tab.danger
                                            ? 'bg-destructive/15 text-destructive'
                                            : 'bg-white/[0.1] text-foreground'
                                        : tab.danger
                                            ? 'text-destructive/80 hover:text-destructive'
                                            : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab panels */}
                <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} tabIndex={0} className="outline-none">
                    {activeTab === 'general' && (
                        <Reveal key="general">
                            <ServerForm
                                onSubmit={handleServerUpdate}
                                loading={saving}
                                error={null}
                                initialData={getServerFormData()}
                                userPlan={user?.subscription?.plan || 'free'}
                                serverCount={1}
                                maxServers={10}
                                isEdit={true}
                            />
                        </Reveal>
                    )}

                    {activeTab === 'monitoring' && (
                        <Reveal key="monitoring">
                            <MonitoringForm
                                onSave={handleMonitoringUpdate}
                                initialData={getMonitoringFormData()}
                                isLoading={saving}
                                submitLabel="Save changes"
                            />
                        </Reveal>
                    )}

                    {activeTab === 'danger' && (
                        <Reveal key="danger">
                            <div className="rounded-[1.375rem] bg-destructive/[0.04] p-1 ring-1 ring-destructive/25">
                                <div className="rounded-[calc(1.375rem-0.25rem)] bg-card p-6 shadow-[inset_0_1px_1px_oklch(1_0_0/0.06)] sm:p-8">
                                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="max-w-[52ch] space-y-1.5">
                                            <h2 className="font-display text-xl font-medium tracking-tight">Delete this server</h2>
                                            <p className="text-sm leading-relaxed text-muted-foreground">
                                                Monitoring stops immediately and all check history for {server?.name} is permanently removed. This can’t be undone.
                                            </p>
                                        </div>
                                        <Button variant="destructive" size="lg" onClick={() => setDeleteConfirmOpen(true)} className="shrink-0">
                                            <Trash weight="light" />
                                            Delete server
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    )}
                </div>

                <Dialog
                    open={deleteConfirmOpen}
                    onClose={closeDeleteDialog}
                    title="Delete this server?"
                    description="All monitoring data for this server will be permanently deleted."
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
