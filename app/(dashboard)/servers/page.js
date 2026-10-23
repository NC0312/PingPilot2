'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus,
    HardDrives,
    ArrowsClockwise,
    ArrowSquareOut,
    Gear,
    EnvelopeSimple,
    Phone,
    Check,
    Minus,
    WarningCircle,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useSocket } from '@/app/components/providers/SocketProvider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatTimestamp } from '@/app/components/dateTimeUtils';
import { PageContainer } from '@/app/components/Layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Button, ButtonArrow } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge, StatusDot } from '@/components/ui/status';
import { Reveal } from '@/components/ui/reveal';
import { displayUrl, toHref, timeAgo } from '@/lib/time';
import { cn } from '@/lib/utils';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'monitoring', label: 'Response time' },
    { id: 'settings', label: 'Details' },
];

const PRIORITY_BADGE = { high: 'destructive', medium: 'warning', low: 'default' };

const idOf = (s) => s._id || s.id;

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Glass tooltip for the response-time chart
function ChartTooltip({ active, payload }) {
    if (!active || !payload || !payload.length) return null;
    const point = payload[0]?.payload;
    const status = point?.status || 'unknown';
    const when = point?.time instanceof Date ? formatTimestamp(point.time, null, 'D MMM, HH:mm:ss') : 'Unknown time';

    return (
        <div className="glass rounded-2xl px-4 py-3">
            <p className="font-mono text-xs text-muted-foreground">{when}</p>
            <p className="mt-1 font-display text-xl font-medium tabular-nums">
                {payload[0].value}
                <span className="ml-1 text-sm font-normal text-muted-foreground">ms</span>
            </p>
            <div className="mt-2">
                <StatusBadge status={status === 'up' ? 'up' : status === 'down' ? 'down' : 'unknown'} label={status === 'up' ? 'Online' : status === 'down' ? 'Down' : 'Pending'} />
            </div>
        </div>
    );
}

// Response-time line chart. Colours come from the design tokens; failed checks get a red dot.
function ResponseChart({ data, height, summary }) {
    const chartData = useMemo(
        () =>
            data.map((item) => ({
                ...item,
                timestamp: item.time.getTime(),
                formattedTime: formatTimestamp(item.time, null, 'HH:mm:ss'),
            })),
        [data]
    );

    const ticks = useMemo(() => {
        if (data.length === 0) return [];
        const times = data.map((d) => d.time.getTime());
        const hour = 3600000;
        const start = Math.floor(Math.min(...times) / hour) * hour;
        const end = Math.ceil(Math.max(...times) / hour) * hour;
        const span = (end - start) / hour;
        const step = span > 12 ? 4 : span > 6 ? 2 : 1;
        const out = [];
        for (let t = start; t <= end; t += step * hour) out.push(t);
        return out;
    }, [data]);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
                No check history for this period yet.
            </div>
        );
    }

    return (
        <div role="img" aria-label={summary} style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 4 }}>
                    <CartesianGrid vertical={false} stroke="oklch(1 0 0 / 0.06)" />
                    <XAxis
                        dataKey="timestamp"
                        type="number"
                        domain={(domain) => {
                            const niceMin = Math.floor(domain[0] / 3600000) * 3600000;
                            const niceMax = Math.ceil(domain[1] / 3600000) * 3600000;
                            return [niceMin, Math.max(niceMax, niceMin + 3600000)];
                        }}
                        ticks={ticks}
                        tickFormatter={(unixTime) => formatTimestamp(new Date(unixTime), null, 'HH:mm')}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={10}
                    />
                    <YAxis
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                        tickFormatter={(v) => `${v}`}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'oklch(1 0 0 / 0.14)' }} />
                    <Line
                        type="monotone"
                        dataKey="avgTime"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        isAnimationActive={false}
                        activeDot={{ r: 5, fill: 'var(--chart-1)', stroke: 'var(--card)', strokeWidth: 2 }}
                        dot={(props) => {
                            const { cx, cy, payload, index } = props;
                            if (payload.status === 'up') return <g key={`dot-${index}`} />;
                            return <circle key={`dot-${index}`} cx={cx} cy={cy} r={4} fill="var(--destructive)" />;
                        }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

// Label/value pair for the info panels
function Fact({ label, children }) {
    return (
        <div>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-sm">{children}</dd>
        </div>
    );
}

function Panel({ children, className, coreClassName }) {
    return (
        <div className={cn('bezel-sm', className)}>
            <div className={cn('bezel-sm-core h-full p-6 sm:p-7', coreClassName)}>{children}</div>
        </div>
    );
}

function Legend() {
    return (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded-full bg-[var(--chart-1)]" aria-hidden="true" />Response time (ms)</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-destructive" aria-hidden="true" />Failed check</span>
        </div>
    );
}

export default function EnhancedServersPage() {
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedServer, setSelectedServer] = useState(null);
    const [responseTimeData, setResponseTimeData] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const { user, apiRequest } = useAuth();

    // Fetch servers from API
    const fetchServers = async (isInitialLoad = true) => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            if (isInitialLoad) setLoading(true);

            const response = await apiRequest('/api/servers', {
                method: 'GET'
            });

            if (response.status === 'success' && response.data.servers) {
                const serversList = response.data.servers;

                setError(null);
                setServers(serversList);

                // If we have servers, select the first one by default
                if (serversList.length > 0 && !selectedServer) {
                    setSelectedServer(serversList[0]);
                    fetchServerHistory(idOf(serversList[0]), serversList[0]);
                } else if (selectedServer) {
                    // Update selected server if it's in the list
                    const serverId = idOf(selectedServer);
                    const updatedServer = serversList.find(s => (s._id === serverId || s.id === serverId));
                    if (updatedServer) {
                        setSelectedServer(updatedServer);
                        fetchServerHistory(serverId, updatedServer);
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching servers:', err);
            setError('We couldn’t load your servers. Check your connection and try again.');
        } finally {
            if (isInitialLoad) setLoading(false);
        }
    };

    // Set up initial data loading and WebSocket updates
    const { socket } = useSocket();

    useEffect(() => {
        if (user) {
            fetchServers(true);

            // The socket pushes live updates; this interval is a fallback sync
            // (e.g. if the socket reconnects or misses a message)
            const intervalId = setInterval(() => {
                fetchServers(false);
            }, 60 * 1000);

            if (socket) {
                const handleUpdate = (data) => {
                    // Update servers list state
                    setServers(prevServers => {
                        return prevServers.map(server => {
                            if (server._id === data.serverId || server.id === data.serverId) {
                                return {
                                    ...server,
                                    status: data.status,
                                    responseTime: data.latency,
                                    lastChecked: data.lastChecked
                                };
                            }
                            return server;
                        });
                    });

                    // Update selected server if it matches
                    if (selectedServer && (selectedServer._id === data.serverId || selectedServer.id === data.serverId)) {
                        setSelectedServer(prev => ({
                            ...prev,
                            status: data.status,
                            responseTime: data.latency,
                            lastChecked: data.lastChecked
                        }));

                        // Append the new point to the history (avoids a full refetch)
                        setResponseTimeData(prevHistory => {
                            const newPoint = {
                                time: new Date(data.lastChecked),
                                avgTime: data.latency || 0,
                                status: data.status || 'unknown',
                                day: new Date(data.lastChecked).getDay(),
                                hour: new Date(data.lastChecked).getHours(),
                                minute: new Date(data.lastChecked).getMinutes(),
                                formattedTime: formatTimestamp(new Date(data.lastChecked), null, 'HH:mm:ss')
                            };

                            // Prevent duplicates (socket might emit twice)
                            const exists = prevHistory.some(p => p.time.getTime() === newPoint.time.getTime());
                            if (exists) return prevHistory;

                            const updated = [...prevHistory, newPoint].sort((a, b) => a.time - b.time);

                            // Keep roughly the last 24h so long sessions don't leak memory
                            if (updated.length > 500) {
                                return updated.slice(updated.length - 500);
                            }
                            return updated;
                        });
                    }
                };

                socket.on('server:update', handleUpdate);

                // Immediate sync on reconnection
                socket.on('connect', () => {
                    fetchServers(false);
                });

                return () => {
                    socket.off('server:update', handleUpdate);
                    socket.off('connect');
                    clearInterval(intervalId);
                };
            }

            return () => clearInterval(intervalId);
        }
    }, [user, socket, selectedServer?._id]); // Re-bind if selected server changes to ensure closure has correct ID

    // Fetch server history data. `forServer` carries the monitoring schedule used to filter points.
    const fetchServerHistory = async (serverId, forServer = selectedServer) => {
        try {
            // Get the last 24 hours of history data
            const response = await apiRequest(`/api/servers/${serverId}/history?period=24h&limit=500`, {
                method: 'GET'
            });

            if (response.status === 'success' && response.data.history) {
                let historicalData = response.data.history.map(check => {
                    const date = new Date(check.timestamp);
                    return {
                        time: date,
                        avgTime: check.responseTime || 0,
                        status: check.status || 'unknown',
                        // Save original date components for filtering
                        day: date.getDay(), // 0-6 (Sun-Sat)
                        hour: date.getHours(),
                        minute: date.getMinutes()
                    };
                }).sort((a, b) => a.time - b.time); // Sort chronologically

                // Filter the data by the server's monitoring schedule
                if (forServer && forServer.monitoring) {
                    const { daysOfWeek, timeWindows } = forServer.monitoring;

                    if (daysOfWeek && daysOfWeek.length > 0) {
                        historicalData = historicalData.filter(item => daysOfWeek.includes(item.day));
                    }

                    if (timeWindows && timeWindows.length > 0) {
                        // 24/7 monitoring is stored as 00:00-00:00 or 00:00-23:59
                        const has24x7Window = timeWindows.some(window =>
                            (window.start === "00:00" && window.end === "00:00") ||
                            (window.start === "00:00" && window.end === "23:59"));

                        if (!has24x7Window) {
                            historicalData = historicalData.filter(item => {
                                return timeWindows.some(window => {
                                    const [startHour, startMinute] = window.start.split(':').map(Number);
                                    const [endHour, endMinute] = window.end.split(':').map(Number);

                                    const startMinutes = startHour * 60 + startMinute;
                                    const endMinutes = endHour * 60 + endMinute;
                                    const itemMinutes = item.hour * 60 + item.minute;

                                    if (endMinutes < startMinutes) {
                                        // Overnight window (e.g. 22:00 to 06:00)
                                        return itemMinutes >= startMinutes || itemMinutes <= endMinutes;
                                    }
                                    return itemMinutes >= startMinutes && itemMinutes <= endMinutes;
                                });
                            });
                        }
                    }
                }

                setResponseTimeData(historicalData);
            }
        } catch (err) {
            console.error('Error fetching server history:', err);
            setError('We couldn’t load the check history for this server.');
        }
    };

    // Run a check now
    const handleRefresh = async () => {
        if (!selectedServer) return;

        try {
            setRefreshing(true);
            const serverId = idOf(selectedServer);

            const response = await apiRequest(`/api/servers/${serverId}/check`, {
                method: 'POST'
            });

            if (response.status === 'success') {
                const checkData = response.data.check;
                setError(null);

                setSelectedServer(prev => ({
                    ...prev,
                    status: checkData.status,
                    responseTime: checkData.responseTime,
                    error: checkData.error,
                    lastChecked: checkData.timestamp
                }));

                setServers(prev => prev.map(server =>
                    (server._id === serverId || server.id === serverId)
                        ? {
                            ...server,
                            status: checkData.status,
                            responseTime: checkData.responseTime,
                            error: checkData.error,
                            lastChecked: checkData.timestamp
                        }
                        : server
                ));

                // Add to history immediately
                setResponseTimeData(prevHistory => {
                    const newPoint = {
                        time: new Date(checkData.timestamp),
                        avgTime: checkData.responseTime || 0,
                        status: checkData.status || 'unknown',
                        day: new Date(checkData.timestamp).getDay(),
                        hour: new Date(checkData.timestamp).getHours(),
                        minute: new Date(checkData.timestamp).getMinutes(),
                        formattedTime: formatTimestamp(new Date(checkData.timestamp), null, 'HH:mm:ss')
                    };
                    return [...prevHistory, newPoint].sort((a, b) => a.time - b.time);
                });

                fetchServerHistory(serverId);
            }
        } catch (err) {
            console.error('Error refreshing server:', err);
            setError('That check didn’t go through. Try again in a moment.');
        } finally {
            setRefreshing(false);
        }
    };

    const handleServerSelect = (server) => {
        setSelectedServer(server);
        fetchServerHistory(idOf(server), server);
    };

    // Uptime over the last N hours, or null when there is no data in that window
    const calculateUptime = (periodHours) => {
        if (!responseTimeData || responseTimeData.length === 0) return null;

        const startTime = new Date(Date.now() - periodHours * 60 * 60 * 1000);
        const relevantData = responseTimeData.filter(point => point.time >= startTime);
        if (relevantData.length === 0) return null;

        const upCount = relevantData.filter(point => point.status === 'up').length;
        return ((upCount / relevantData.length) * 100).toFixed(1);
    };

    const countIncidents = (periodHours) => {
        if (!responseTimeData || responseTimeData.length === 0) return 0;

        const startTime = new Date(Date.now() - periodHours * 60 * 60 * 1000);
        const relevantData = responseTimeData.filter(point => point.time >= startTime);

        let incidents = 0;
        let previousStatus = relevantData[0]?.status || 'up';

        for (let i = 0; i < relevantData.length; i++) {
            if (i === 0 && relevantData[i].status === 'down') {
                incidents++;
            } else if (previousStatus === 'up' && relevantData[i].status === 'down') {
                incidents++;
            }
            previousStatus = relevantData[i].status;
        }

        return incidents;
    };

    const calculateDowntime = (periodHours) => {
        if (!responseTimeData || !selectedServer) return 0;

        // Check interval from server settings (default 5 minutes)
        const checkInterval = selectedServer.monitoring?.frequency || 5;
        const startTime = new Date(Date.now() - periodHours * 60 * 60 * 1000);

        const relevantData = responseTimeData.filter(point => point.time >= startTime);
        const downCount = relevantData.filter(point => point.status === 'down').length;

        return downCount * checkInterval;
    };

    const responseStats = useMemo(() => {
        if (responseTimeData.length === 0) return null;
        const values = responseTimeData.map((p) => p.avgTime);
        return {
            avg: Math.round(values.reduce((sum, v) => sum + v, 0) / values.length),
            max: Math.max(...values),
            min: Math.min(...values),
        };
    }, [responseTimeData]);

    const chartSummary = responseStats
        ? `Response time over the last 24 hours. Average ${responseStats.avg} milliseconds, fastest ${responseStats.min}, slowest ${responseStats.max}, ${plural(countIncidents(24), 'incident')}.`
        : 'No response time data yet.';

    const addButton = (
        <Button asChild>
            <Link href="/servers/new">
                <Plus weight="light" />
                Add server
            </Link>
        </Button>
    );

    const upCount = servers.filter((s) => s.status === 'up').length;
    const downCount = servers.filter((s) => s.status === 'down').length;

    // ── Loading
    if (loading && servers.length === 0) {
        return (
            <PageContainer className="space-y-10">
                <PageHeader eyebrow="Monitoring" title="Servers" description="Loading your monitors." actions={addButton} />
                <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]" role="status" aria-label="Loading servers">
                    <div className="space-y-2">
                        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[4.5rem] rounded-2xl" />)}
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-52 rounded-[1.375rem]" />
                        <Skeleton className="h-28 rounded-[1.375rem]" />
                        <Skeleton className="h-80 rounded-[1.375rem]" />
                    </div>
                </div>
            </PageContainer>
        );
    }

    // ── Load failed and nothing to show
    if (error && servers.length === 0) {
        return (
            <PageContainer className="space-y-10">
                <PageHeader eyebrow="Monitoring" title="Servers" actions={addButton} />
                <div className="bezel-sm">
                    <div className="bezel-sm-core">
                        <EmptyState
                            icon={WarningCircle}
                            title="We couldn’t load your servers"
                            description={error}
                            action={
                                <Button onClick={() => fetchServers()}>
                                    <ArrowsClockwise weight="light" />
                                    Try again
                                </Button>
                            }
                        />
                    </div>
                </div>
            </PageContainer>
        );
    }

    // ── Empty
    if (servers.length === 0) {
        return (
            <PageContainer className="space-y-10">
                <PageHeader eyebrow="Monitoring" title="Servers" description="Websites, APIs and services you monitor appear here." />
                <div className="bezel-sm">
                    <div className="bezel-sm-core">
                        <EmptyState
                            icon={HardDrives}
                            title="Add your first server"
                            description="Paste a website or API address and Ping Pilott starts checking it right away."
                            action={
                                <Button asChild size="lg">
                                    <Link href="/servers/new">
                                        Add server
                                        <ButtonArrow />
                                    </Link>
                                </Button>
                            }
                        />
                    </div>
                </div>
            </PageContainer>
        );
    }

    const s = selectedServer;
    const sStatus = s?.status === 'up' || s?.status === 'down' ? s.status : 'unknown';
    const monitoring = s?.monitoring;
    const alerts = monitoring?.alerts;
    const stateSince = s?.lastStatusChange || s?.lastChecked;

    return (
        <PageContainer className="space-y-10">
            <PageHeader
                eyebrow="Monitoring"
                title="Servers"
                description={
                    downCount > 0
                        ? `${plural(downCount, 'server')} down, ${upCount} operational.`
                        : `${plural(servers.length, 'server')} monitored, ${upCount} operational.`
                }
                actions={addButton}
            />

            {error && (
                <Alert tone="error" title="Something went wrong" action={<Button size="sm" variant="outline" onClick={() => fetchServers(false)}>Try again</Button>}>
                    {error}
                </Alert>
            )}

            <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
                {/* Server picker: horizontal strip on mobile, list on desktop */}
                <nav aria-label="Servers" className="-mx-4 min-w-0 px-4 sm:-mx-8 sm:px-8 lg:sticky lg:top-6 lg:mx-0 lg:px-0">
                    <ul className="flex snap-x gap-2.5 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
                        {servers.map((server) => {
                            const active = s && idOf(server) === idOf(s);
                            return (
                                <li key={idOf(server)} className="w-[230px] shrink-0 snap-start lg:w-auto">
                                    <button
                                        type="button"
                                        onClick={() => handleServerSelect(server)}
                                        aria-current={active ? 'true' : undefined}
                                        className={cn(
                                            'flex min-h-[4.5rem] w-full items-center gap-3 rounded-2xl px-4 py-3 text-left ring-1 transition-[background-color,box-shadow] duration-500 ease-fluid',
                                            active
                                                ? 'bg-primary/10 ring-2 ring-primary/50'
                                                : 'bg-white/[0.03] ring-white/[0.08] hover:bg-white/[0.06] hover:ring-white/20'
                                        )}
                                    >
                                        <StatusDot status={server.status} />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium">{server.name}</span>
                                            <span className="block truncate font-mono text-xs text-muted-foreground">{displayUrl(server.url)}</span>
                                        </span>
                                        <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                                            {server.responseTime ? `${server.responseTime} ms` : '—'}
                                        </span>
                                        <span className="sr-only">{server.status === 'up' ? 'Operational' : server.status === 'down' ? 'Down' : 'Pending'}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {s && (
                    <div className="min-w-0 space-y-6">
                        {/* Status hero */}
                        <Reveal>
                            <Panel
                                className={cn(
                                    sStatus === 'down' && 'shadow-[0_0_0_1px_oklch(0.72_0.17_22/0.35),0_30px_60px_-40px_oklch(0.72_0.17_22/0.5)]'
                                )}
                                coreClassName="space-y-6"
                            >
                                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0 space-y-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <StatusBadge
                                                status={sStatus}
                                                label={sStatus === 'up' ? 'Operational' : sStatus === 'down' ? 'Down' : 'Waiting for first check'}
                                            />
                                            {s.priority && (
                                                <Badge variant={PRIORITY_BADGE[s.priority] || 'secondary'} className="capitalize">
                                                    {s.priority} priority
                                                </Badge>
                                            )}
                                        </div>
                                        <h2 className="font-display text-3xl font-medium tracking-tight">{s.name}</h2>
                                        <a
                                            href={toHref(s.url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex max-w-full items-center gap-1.5 font-mono text-[13px] text-muted-foreground transition-colors duration-300 ease-fluid hover:text-primary"
                                        >
                                            <span className="truncate">{displayUrl(s.url)}</span>
                                            <ArrowSquareOut weight="light" className="size-4 shrink-0" />
                                            <span className="sr-only">(opens in a new tab)</span>
                                        </a>
                                        <p className="text-sm text-muted-foreground">
                                            {sStatus === 'up' && `Online since ${formatTimestamp(stateSince, null, 'D MMM, HH:mm')}.`}
                                            {sStatus === 'down' && `Down since ${formatTimestamp(stateSince, null, 'D MMM, HH:mm')}.`}
                                            {sStatus === 'unknown' && 'No result yet. Run a check to see the current status.'}
                                        </p>
                                    </div>

                                    <div className="sm:text-right">
                                        <p className={cn('font-display text-5xl font-medium tracking-tight tabular-nums', !s.responseTime && 'text-muted-foreground')}>
                                            {s.responseTime ? s.responseTime : '—'}
                                            {s.responseTime ? <span className="ml-1 text-lg font-normal text-muted-foreground">ms</span> : null}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Last response{s.lastChecked ? ` · checked ${timeAgo(s.lastChecked)}` : ''}
                                        </p>
                                    </div>
                                </div>

                                {sStatus === 'down' && s.error && (
                                    <Alert tone="error" title="Last check failed">
                                        <span className="font-mono text-[13px]">{s.error}</span>
                                    </Alert>
                                )}

                                <div className="flex flex-wrap items-center gap-2.5 border-t border-white/[0.07] pt-5">
                                    <Button onClick={handleRefresh} disabled={refreshing}>
                                        <ArrowsClockwise weight="light" className={refreshing ? 'animate-spin' : ''} />
                                        {refreshing ? 'Checking' : 'Check now'}
                                    </Button>
                                    <Button asChild variant="outline">
                                        <Link href={`/servers/${idOf(s)}/settings`}>
                                            <Gear weight="light" />
                                            Manage server
                                        </Link>
                                    </Button>
                                </div>
                            </Panel>
                        </Reveal>

                        {/* Uptime by window */}
                        <Reveal delay={80}>
                            <div className="bezel-sm">
                                <div className="bezel-sm-core grid divide-y divide-white/[0.06] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                                    {[8, 16, 24].map((hours) => {
                                        const uptime = calculateUptime(hours);
                                        const incidents = countIncidents(hours);
                                        const downtime = calculateDowntime(hours);
                                        return (
                                            <div key={hours} className="p-6">
                                                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Last {hours} hours</p>
                                                <p
                                                    className={cn(
                                                        'mt-3 font-display text-4xl font-medium tracking-tight tabular-nums',
                                                        uptime === null ? 'text-muted-foreground' : parseFloat(uptime) >= 99.9 ? 'text-success' : 'text-warning'
                                                    )}
                                                >
                                                    {uptime === null ? '—' : `${uptime}%`}
                                                </p>
                                                <p className="mt-2 text-[13px] text-muted-foreground">
                                                    {plural(incidents, 'incident')}, {downtime} min downtime
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </Reveal>

                        {/* Tabs */}
                        <div role="tablist" aria-label="Server views" className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.08] sm:inline-flex">
                            {TABS.map((tab, i) => {
                                const on = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        id={`srv-tab-${tab.id}`}
                                        role="tab"
                                        type="button"
                                        aria-selected={on}
                                        aria-controls={`srv-panel-${tab.id}`}
                                        tabIndex={on ? 0 : -1}
                                        onClick={() => setActiveTab(tab.id)}
                                        onKeyDown={(e) => {
                                            let next = null;
                                            if (e.key === 'ArrowRight') next = (i + 1) % TABS.length;
                                            if (e.key === 'ArrowLeft') next = (i - 1 + TABS.length) % TABS.length;
                                            if (next === null) return;
                                            e.preventDefault();
                                            setActiveTab(TABS[next].id);
                                            document.getElementById(`srv-tab-${TABS[next].id}`)?.focus();
                                        }}
                                        className={cn(
                                            'min-h-10 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-[background-color,color] duration-500 ease-fluid',
                                            on ? 'bg-white/[0.1] text-foreground' : 'text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div role="tabpanel" id={`srv-panel-${activeTab}`} aria-labelledby={`srv-tab-${activeTab}`} tabIndex={0} className="space-y-6 outline-none">
                            {activeTab === 'overview' && (
                                <Reveal key="overview" className="space-y-6">
                                    <Panel>
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <h3 className="font-display text-lg font-medium tracking-tight">Response time</h3>
                                            <Legend />
                                        </div>
                                        {monitoring && (
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                Schedule:{' '}
                                                {monitoring.daysOfWeek && monitoring.daysOfWeek.length > 0 && monitoring.daysOfWeek.length < 7
                                                    ? monitoring.daysOfWeek.map((day) => DAY_NAMES[day]).join(', ')
                                                    : 'every day'}
                                                {monitoring.timeWindows && monitoring.timeWindows.length > 0
                                                    ? `, ${monitoring.timeWindows[0].start} to ${monitoring.timeWindows[0].end}`
                                                    : ', all day'}
                                            </p>
                                        )}
                                        <div className="mt-6">
                                            <ResponseChart data={responseTimeData} height={288} summary={chartSummary} />
                                        </div>
                                        {responseTimeData.length > 0 && (
                                            <p className="mt-4 text-xs text-muted-foreground">
                                                The chart only shows checks inside the monitoring schedule.
                                            </p>
                                        )}
                                    </Panel>

                                    <div className="bezel-sm">
                                        <div className="bezel-sm-core grid divide-y divide-white/[0.06] md:grid-cols-2 md:divide-x md:divide-y-0">
                                            <div className="p-6 sm:p-7">
                                                <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Server</h3>
                                                <dl className="space-y-4">
                                                    <Fact label="URL"><span className="break-all font-mono text-[13px]">{s.url}</span></Fact>
                                                    <Fact label="Type"><span className="capitalize">{s.type || 'website'}</span></Fact>
                                                    <Fact label="Added">{formatTimestamp(s.uploadedAt || s.createdAt, null, 'D MMM YYYY, HH:mm')}</Fact>
                                                    {s.description && <Fact label="Description">{s.description}</Fact>}
                                                </dl>
                                            </div>
                                            <div className="p-6 sm:p-7">
                                                <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Latest check</h3>
                                                <dl className="space-y-4">
                                                    <Fact label="Status">
                                                        <StatusBadge status={sStatus} label={sStatus === 'up' ? 'Online' : sStatus === 'down' ? 'Down' : 'Pending'} />
                                                    </Fact>
                                                    <Fact label="Checked">{s.lastChecked ? formatTimestamp(s.lastChecked, null, 'D MMM, HH:mm:ss') : 'Never'}</Fact>
                                                    <Fact label="Response time">
                                                        <span className="font-mono tabular-nums">{s.responseTime ? `${s.responseTime} ms` : 'N/A'}</span>
                                                    </Fact>
                                                    {s.error && <Fact label="Error"><span className="font-mono text-[13px] text-destructive">{s.error}</span></Fact>}
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                </Reveal>
                            )}

                            {activeTab === 'monitoring' && (
                                <Reveal key="monitoring">
                                    <Panel>
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <h3 className="font-display text-lg font-medium tracking-tight">Response time, last 24 hours</h3>
                                            <Legend />
                                        </div>
                                        <div className="mt-6">
                                            <ResponseChart data={responseTimeData} height={384} summary={chartSummary} />
                                        </div>

                                        <dl className="mt-8 grid gap-6 border-t border-white/[0.07] pt-6 sm:grid-cols-3">
                                            {[
                                                ['Average', responseStats?.avg],
                                                ['Slowest', responseStats?.max],
                                                ['Fastest', responseStats?.min],
                                            ].map(([label, value]) => (
                                                <div key={label}>
                                                    <dt className="text-xs text-muted-foreground">{label}</dt>
                                                    <dd className="mt-1 font-display text-3xl font-medium tracking-tight tabular-nums">
                                                        {value === undefined ? '—' : value}
                                                        {value !== undefined && <span className="ml-1 text-base font-normal text-muted-foreground">ms</span>}
                                                    </dd>
                                                </div>
                                            ))}
                                        </dl>
                                    </Panel>
                                </Reveal>
                            )}

                            {activeTab === 'settings' && (
                                <Reveal key="settings">
                                    <div className="bezel-sm">
                                        <div className="bezel-sm-core divide-y divide-white/[0.06]">
                                            <section className="p-6 sm:p-7">
                                                <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Schedule</h3>
                                                <dl className="grid gap-5 sm:grid-cols-3">
                                                    <Fact label="Check frequency">Every {plural(monitoring?.frequency || 5, 'minute')}</Fact>
                                                    <Fact label="Days">
                                                        {monitoring?.daysOfWeek?.length
                                                            ? monitoring.daysOfWeek.map((day) => DAY_NAMES[day]).join(', ')
                                                            : 'Every day'}
                                                    </Fact>
                                                    <Fact label="Hours">
                                                        <span className="font-mono tabular-nums">
                                                            {monitoring?.timeWindows?.map((w) => `${w.start}–${w.end}`).join(', ') || 'All day'}
                                                        </span>
                                                    </Fact>
                                                </dl>
                                            </section>

                                            <section className="p-6 sm:p-7">
                                                <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Alerts</h3>
                                                <dl className="grid gap-5 sm:grid-cols-2">
                                                    <Fact label="Channels">
                                                        <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
                                                            {[
                                                                ['Email alerts', alerts?.email],
                                                                ['Call alerts', alerts?.phone],
                                                            ].map(([label, on]) => (
                                                                <li key={label} className="flex items-center gap-2">
                                                                    {on ? <Check weight="bold" className="size-4 text-success" /> : <Minus weight="bold" className="size-4 text-muted-foreground/60" />}
                                                                    <span className={on ? '' : 'text-muted-foreground'}>{label}</span>
                                                                    <span className="sr-only">{on ? 'on' : 'off'}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </Fact>
                                                    <Fact label="Response threshold">
                                                        Alert above <span className="font-mono tabular-nums">{alerts?.responseThreshold || 1000} ms</span>
                                                    </Fact>
                                                </dl>
                                            </section>

                                            {(s.contactEmails?.length > 0 || s.contactPhones?.length > 0) && (
                                                <section className="p-6 sm:p-7">
                                                    <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Alert contacts</h3>
                                                    <ul className="flex flex-wrap gap-2">
                                                        {s.contactEmails?.map((email) => (
                                                            <li key={email} className="flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1.5 text-sm ring-1 ring-white/10">
                                                                <EnvelopeSimple weight="light" className="size-4 text-muted-foreground" />
                                                                <span className="break-all">{email}</span>
                                                            </li>
                                                        ))}
                                                        {s.contactPhones?.map((phone) => (
                                                            <li key={phone} className="flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1.5 text-sm ring-1 ring-white/10">
                                                                <Phone weight="light" className="size-4 text-muted-foreground" />
                                                                <span className="font-mono text-[13px] tabular-nums">{phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </section>
                                            )}
                                        </div>
                                    </div>
                                </Reveal>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </PageContainer>
    );
}
