'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { DotsThreeVertical, LockSimple, Cpu, ArrowsClockwise, Trash, Bell } from '@phosphor-icons/react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { timeAgo } from '@/lib/time';
import {
    DEFAULT_PERIOD, PERIODS, agentState, diskRows, disksToChart, formatPercent, formatRate, hostMetricsAllowance, installOptions, isPeriod,
    limitsFromServer, periodWords, readMetrics
} from '@/lib/hostMetrics';
import { cn } from '@/lib/utils';
import { CurrentValues, HostChart, ProcessList } from './HostCharts';
import { ConfirmDialog, InstallDialog, LimitsDialog } from './HostDialogs';

const POLL_MS = 30 * 1000;
const POLL_WHILE_INSTALLING_MS = 5 * 1000;

const idOf = (s) => s?._id || s?.id;

// Same look as the other panels on this page
function Panel({ children, className }) {
    return (
        <section className={cn('bezel-sm', className)} aria-labelledby="host-metrics-heading">
            <div className="bezel-sm-core h-full space-y-6 p-6 sm:p-7">{children}</div>
        </section>
    );
}

function Heading({ children, right }) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 id="host-metrics-heading" className="flex items-center gap-2.5 font-display text-xl font-medium tracking-tight">
                {children}
            </h3>
            {right}
        </div>
    );
}

const percent = (v) => `${Math.round(v)}%`;
const PERCENT_TICKS = [0, 25, 50, 75, 100];
const TONE_BADGE = { success: 'success', warning: 'warning', muted: 'outline' };

/**
 * Host metrics for one server: set up the agent, see what the machine is doing, and manage it.
 * Give it `key={server id}` so it starts fresh for each server. The backend decides what a plan may do; this only avoids offering what
 * it will refuse.
 */
export default function HostMetricsPanel({ server, apiRequest, user }) {
    const id = idOf(server);
    const allowance = hostMetricsAllowance(user);

    const [period, setPeriod] = useState(DEFAULT_PERIOD);
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(allowance.enabled);
    const [loadError, setLoadError] = useState(null);
    const [limits, setLimits] = useState(() => limitsFromServer(server?.monitoring?.hostAlerts));
    const [dialog, setDialog] = useState(null); // 'install' | 'rotate' | 'off' | 'limits'
    const [issued, setIssued] = useState(null); // { token, options, replacing }: the token lives here only until the dialog is closed
    const [busy, setBusy] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [now, setNow] = useState(() => Date.now());

    const latestRequest = useRef(0);
    const mounted = useRef(true);
    // set on every mount, not only cleared on unmount: React's development mode mounts, unmounts and mounts again, and a ref that is
    // only ever cleared would stay cleared, so every answer would be ignored
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    const load = useCallback(async (wanted, { quiet = false } = {}) => {
        const request = ++latestRequest.current;
        if (!quiet) setLoading(true);
        try {
            const response = await apiRequest(`/api/servers/${id}/metrics?period=${isPeriod(wanted) ? wanted : DEFAULT_PERIOD}`, { method: 'GET' });
            if (!mounted.current || request !== latestRequest.current) return; // a newer request owns the page now
            setMetrics(readMetrics(response));
            setLoadError(null);
        } catch (err) {
            if (!mounted.current || request !== latestRequest.current) return;
            setLoadError(err?.message || 'Could not load host metrics');
        } finally {
            if (mounted.current && request === latestRequest.current) setLoading(false);
            if (mounted.current) setNow(Date.now());
        }
    }, [apiRequest, id]);

    useEffect(() => {
        if (allowance.enabled) load(period);
    }, [allowance.enabled, period, load]);

    // Keep it live while it is on: slowly, and quickly while someone is installing and waiting for the first reading
    const enabled = metrics?.agent.enabled === true;
    const installing = dialog === 'install' && metrics?.agent.status !== 'connected';
    useEffect(() => {
        if (!allowance.enabled || !enabled) return undefined;
        const timer = setInterval(() => {
            if (document.visibilityState === 'visible') load(period, { quiet: true });
        }, installing ? POLL_WHILE_INSTALLING_MS : POLL_MS);
        return () => clearInterval(timer);
    }, [allowance.enabled, enabled, installing, period, load]);

    const run = async (work) => {
        setBusy(true);
        setActionError(null);
        try {
            await work();
            return true;
        } catch (err) {
            setActionError(err?.message || 'Something went wrong. Try again.');
            return false;
        } finally {
            if (mounted.current) setBusy(false);
        }
    };

    const issue = (path, replacing) => run(async () => {
        const response = await apiRequest(`/api/servers/${id}/agent${path}`, { method: 'POST' });
        const token = response?.data?.token;
        if (typeof token !== 'string' || !token) throw new Error('The server did not return a token. Try again.');
        setIssued({ token, options: installOptions(response.data.install), replacing });
        setDialog('install');
        await load(period, { quiet: true });
    });

    const turnOff = () => run(async () => {
        await apiRequest(`/api/servers/${id}/agent`, { method: 'DELETE' });
        setIssued(null);
        setDialog(null);
        setMetrics(null);
        await load(period);
    });

    const saveLimits = (hostAlerts) => run(async () => {
        await apiRequest(`/api/servers/${id}`, { method: 'PATCH', body: JSON.stringify({ monitoring: { hostAlerts } }) });
        setLimits(limitsFromServer(hostAlerts));
        setDialog(null);
    });

    const closeDialog = () => {
        setDialog(null);
        setActionError(null);
        if (dialog === 'install') setIssued(null); // the token is not kept: that is what "shown once" means
    };

    const state = useMemo(() => agentState(metrics?.agent, now, timeAgo), [metrics, now]);
    const showMax = (metrics?.binSeconds ?? 0) > 0;
    const diskLines = useMemo(() => (metrics ? disksToChart(metrics.series, metrics.mounts).map((m) => ({ key: m, label: m })) : []), [metrics]);
    const rows = metrics?.series ?? [];
    const diskData = useMemo(() => diskRows(rows), [rows]);

    // The dialogs sit in one fixed place in every state, so a state change (not set up -> waiting) does not remount them
    const dialogs = (
        <>
            <InstallDialog open={dialog === 'install'} onClose={closeDialog} token={issued?.token ?? ''} options={issued?.options ?? []} status={metrics?.agent.status} replacing={issued?.replacing} />
            <ConfirmDialog
                open={dialog === 'rotate'}
                onClose={closeDialog}
                title="Replace the token?"
                description="You get a new install command, and the agent on this server stops reporting until it is given the new token. The old token stops working at once."
                confirmLabel="Replace token"
                busy={busy}
                error={dialog === 'rotate' ? actionError : null}
                onConfirm={() => issue('/rotate', true)}
            />
            <ConfirmDialog
                open={dialog === 'off'}
                onClose={closeDialog}
                title="Turn off host metrics?"
                description="The agent is refused from now on, and everything it sent for this server is deleted. The agent itself stays installed on the server until you remove it (run the installer with --uninstall)."
                confirmLabel="Turn off and delete data"
                destructive
                busy={busy}
                error={dialog === 'off' ? actionError : null}
                onConfirm={turnOff}
            />
            <LimitsDialog open={dialog === 'limits'} onClose={closeDialog} limits={limits} onSave={saveLimits} busy={busy} error={dialog === 'limits' ? actionError : null} />
        </>
    );

    // ── a plan without it ──
    if (!allowance.enabled) {
        return (
            <Panel>
                <Heading><Cpu weight="light" className="size-6 text-muted-foreground" aria-hidden="true" />Host metrics</Heading>
                <div className="flex items-start gap-3">
                    <LockSimple weight="light" className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="space-y-3">
                        <p className="max-w-[60ch] text-sm text-muted-foreground">
                            See CPU, memory, disk and network on this server, and get an alert when one runs out, so you know why it is slow or down before you log in. It is part of the paid plans.
                        </p>
                        <Button asChild><Link href="/subscription">See plans</Link></Button>
                    </div>
                </div>
                {server?.agent?.enabled && <p className="text-[13px] text-muted-foreground">An agent is installed on this server. It stays idle until you upgrade.</p>}
            </Panel>
        );
    }

    // ── first load ──
    if (loading && !metrics) {
        return (
            <Panel>
                <Heading><Cpu weight="light" className="size-6 text-muted-foreground" aria-hidden="true" />Host metrics</Heading>
                <Skeleton className="h-[180px] rounded-2xl" role="status" aria-label="Loading host metrics" />
            </Panel>
        );
    }

    if (!metrics) {
        return (
            <Panel>
                <Heading><Cpu weight="light" className="size-6 text-muted-foreground" aria-hidden="true" />Host metrics</Heading>
                <Alert tone="error" title="Could not load host metrics" action={<Button size="sm" variant="outline" onClick={() => load(period)}>Try again</Button>}>
                    {loadError}
                </Alert>
            </Panel>
        );
    }

    // ── not turned on ──
    if (!enabled) {
        return (
            <>
                <Panel>
                    <Heading><Cpu weight="light" className="size-6 text-muted-foreground" aria-hidden="true" />Host metrics</Heading>
                    <div className="space-y-4">
                        <p className="max-w-[60ch] text-sm text-muted-foreground">
                            Install a small agent on this server to see its CPU, memory, disk and network over time, and get an alert when one runs out. It takes about a minute.
                        </p>
                        <Button onClick={() => issue('', false)} disabled={busy} className="min-h-12 sm:min-h-10">{busy ? 'Setting up…' : 'Set up host metrics'}</Button>
                        {actionError && <Alert tone="error" title="Could not set it up">{actionError}</Alert>}
                        <p className="text-[13px] text-muted-foreground">
                            The agent sends CPU, memory, disk, network and the names of the busiest processes, once a minute. It never sends command lines or files, and never takes commands.
                        </p>
                    </div>
                </Panel>
                {dialogs}
            </>
        );
    }

    // ── turned on ──
    const waiting = metrics.agent.status === 'waiting';
    const latestLabel = metrics.agent.status === 'connected' ? 'Right now' : 'Last reading';

    return (
        <>
            <Panel>
                <Heading
                    right={
                        <div className="flex items-center gap-2">
                            <Badge variant={TONE_BADGE[state.tone]} aria-label={`Agent status: ${state.label}`}>{state.label}</Badge>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="min-h-12 sm:min-h-8" aria-label="Manage host metrics">
                                        <DotsThreeVertical weight="bold" aria-hidden="true" />
                                        Manage
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => { setActionError(null); setDialog('limits'); }}><Bell weight="light" />Alert limits</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => { setActionError(null); setDialog('rotate'); }}><ArrowsClockwise weight="light" />Replace token</DropdownMenuItem>
                                    <DropdownMenuItem variant="destructive" onSelect={() => { setActionError(null); setDialog('off'); }}><Trash weight="light" />Turn off</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    }>
                    <Cpu weight="light" className="size-6 text-muted-foreground" aria-hidden="true" />Host metrics
                </Heading>

                {loadError && <Alert tone="warning" title="Could not refresh">{loadError}. Showing what was loaded before.</Alert>}

                {waiting && (
                    <Alert tone="info" title={state.label}>
                        {state.hint} Lost the command? Choose <span className="text-foreground/90">Manage → Replace token</span> for a new one.
                    </Alert>
                )}
                {metrics.agent.status === 'offline' && <Alert tone="warning" title={state.label}>{state.hint}</Alert>}

                {metrics.latest && (
                    <div className="space-y-6">
                        <h4 className="sr-only">{latestLabel}</h4>
                        <CurrentValues latest={metrics.latest} />
                    </div>
                )}

                {!waiting && (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-6">
                            <h4 className="text-sm font-medium">History, {periodWords(period).replace('the ', '')}</h4>
                            <div role="group" aria-label="Time range" className="flex flex-wrap gap-1">
                                {PERIODS.map((p) => (
                                    <button
                                        key={p.value}
                                        type="button"
                                        aria-pressed={period === p.value}
                                        onClick={() => setPeriod(p.value)}
                                        className={cn(
                                            'min-h-12 rounded-full px-3.5 text-sm outline-none transition-colors duration-300 ease-fluid focus-visible:ring-2 focus-visible:ring-ring sm:min-h-8',
                                            period === p.value ? 'bg-white/[0.1] text-foreground ring-1 ring-white/15' : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground'
                                        )}>
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-x-8 gap-y-8 lg:grid-cols-2">
                            <HostChart
                                title="CPU" rows={rows} period={period} yMax={100} yTicks={PERCENT_TICKS} format={percent} unit="%" summaryKey="cpu"
                                lines={[{ key: 'cpu', label: showMax ? 'Average' : 'CPU' }, ...(showMax ? [{ key: 'cpuMax', label: 'Highest', dashed: true }] : [])]}
                            />
                            <HostChart
                                title="Memory" rows={rows} period={period} yMax={100} yTicks={PERCENT_TICKS} format={percent} unit="%" summaryKey="memPct"
                                lines={[{ key: 'memPct', label: showMax ? 'Average' : 'Memory', color: 'var(--chart-2)' }, ...(showMax ? [{ key: 'memPctMax', label: 'Highest', color: 'var(--chart-2)', dashed: true }] : [])]}
                            />
                            {diskLines.length > 0 && (
                                <HostChart title="Disk space used" rows={diskData} period={period} yMax={100} yTicks={PERCENT_TICKS} format={percent} unit="%" summaryKey={diskLines[0].key} lines={diskLines} />
                            )}
                            <HostChart
                                title="Network" rows={rows} period={period} yWidth={70} format={formatRate} unit=" B/s" summaryKey="rxBps"
                                lines={[{ key: 'rxBps', label: 'In' }, { key: 'txBps', label: 'Out', color: 'var(--chart-3)' }]}
                            />
                        </div>

                        <div className="border-t border-white/[0.07] pt-6">
                            <ProcessList procs={metrics.latest?.procs} />
                        </div>
                    </>
                )}

                <p className="border-t border-white/[0.07] pt-4 text-xs text-muted-foreground">
                    {[
                        metrics.agent.version && `Agent ${metrics.agent.version}`,
                        metrics.agent.hostname && `on ${metrics.agent.hostname}`,
                        metrics.agent.os && `(${metrics.agent.os}${metrics.agent.arch ? `/${metrics.agent.arch}` : ''})`,
                        metrics.agent.lastSeenAt && `· last reading ${timeAgo(metrics.agent.lastSeenAt, now)}`,
                        `· CPU alerts at ${formatPercent(limits.cpu.percent)} for ${limits.cpu.minutes} min`,
                    ].filter(Boolean).join(' ')}
                    {!limits.enabled && ' · host alerts are off'}
                </p>
            </Panel>

            {dialogs}
        </>
    );
}
