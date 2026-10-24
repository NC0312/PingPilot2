'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
    CheckCircle,
    MagnifyingGlass,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useSocket } from '@/app/components/providers/SocketProvider';
import moment from 'moment-timezone';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatTimestamp } from '@/app/components/dateTimeUtils';
import { PageContainer } from '@/app/components/Layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Button, ButtonArrow } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge, StatusDot } from '@/components/ui/status';
import { Reveal } from '@/components/ui/reveal';
import TrialNotice from '@/app/components/TrialNotice';
import { displayUrl, toHref, timeAgo, formatPhone, formatSpan } from '@/lib/time';
import { cn } from '@/lib/utils';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TYPE_LABEL = { website: 'Website', api: 'API', tcp: 'TCP', database: 'Database' };

const PRIORITY_BADGE = { high: 'destructive', medium: 'warning', low: 'default' };

const idOf = (s) => s._id || s.id;

// Day and time of a check as the server's schedule sees it. Schedules are kept in a timezone per server,
// so the chart must filter by that clock and not by whatever timezone this browser happens to be in.
const zoned = (value, tz) => {
    const m = tz ? moment(value).tz(tz) : moment(value);
    return { day: m.day(), hour: m.hour(), minute: m.minute() };
};

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
            <div className="flex items-center justify-center rounded-2xl bg-white/[0.02] text-sm text-muted-foreground ring-1 ring-white/[0.05]" style={{ height: Math.min(height, 120) }}>
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

// Runs of failed checks become incidents. A run ends at the next successful check; one still open is ongoing.
const getIncidents = (data, frequency, downNow) => {
    const minimum = Math.max(frequency || 5, 5) * 60000;
    const out = [];
    let open = null;
    data.forEach((p) => {
        if (p.status === 'down') {
            if (!open) open = { start: p.time, error: p.error };
            else if (!open.error) open.error = p.error;
        } else if (p.status === 'up' && open) {
            out.push({ start: open.start, error: open.error, ongoing: false, ms: Math.max(p.time - open.start, minimum) });
            open = null;
        }
    });
    if (open) out.push({ start: open.start, error: open.error, ongoing: downNow, ms: Math.max(Date.now() - open.start, minimum) });
    return out.reverse();
};

const STRIP_SLOTS = 48;

// 24 hours as 48 half-hour slots: red if any check failed, green if checks passed, grey if nothing ran.
function HistoryStrip({ data }) {
    const span = 24 * 3600000;
    const end = Date.now();
    const start = end - span;
    const slotMs = span / STRIP_SLOTS;
    const slots = Array.from({ length: STRIP_SLOTS }, (_, i) => ({ from: start + i * slotMs, up: 0, down: 0 }));
    data.forEach((p) => {
        const i = Math.floor((p.time.getTime() - start) / slotMs);
        if (i < 0 || i >= STRIP_SLOTS) return;
        if (p.status === 'down') slots[i].down += 1;
        else if (p.status === 'up') slots[i].up += 1;
    });
    const failed = slots.filter((x) => x.down > 0).length;
    const passed = slots.filter((x) => !x.down && x.up > 0).length;

    return (
        <div>
            <div
                role="img"
                aria-label={`Last 24 hours in half-hour steps: ${passed} operational, ${failed} with failed checks, ${STRIP_SLOTS - passed - failed} without checks.`}
                className="flex h-10 items-stretch gap-[3px]"
            >
                {slots.map((x, i) => (
                    <span
                        key={i}
                        title={`${formatTimestamp(new Date(x.from), null, 'HH:mm')}: ${x.down ? 'failed checks' : x.up ? 'operational' : 'no checks'}`}
                        className={cn(
                            'flex-1 rounded-[3px] transition-colors duration-500 ease-fluid',
                            x.down ? 'bg-destructive' : x.up ? 'bg-success/70' : 'bg-white/[0.07]'
                        )}
                    />
                ))}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[11px] text-muted-foreground">
                <span>24 hours ago</span>
                <span>Now</span>
            </div>
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
    const [query, setQuery] = useState('');
    const [checkMessage, setCheckMessage] = useState('');
    const { user, apiRequest } = useAuth();
    // Each history request gets a number; only the newest one may update the chart.
    const historyRequestId = useRef(0);

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
                    // /servers?s=<id> opens that server, so a refresh or a shared link lands where you were
                    const wanted = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('s') : null;
                    const initial = serversList.find((x) => idOf(x) === wanted) || serversList[0];
                    setSelectedServer(initial);
                    fetchServerHistory(idOf(initial), initial);
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
                                ...zoned(data.lastChecked, selectedServer?.timezone),
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
                const handleConnect = () => {
                    fetchServers(false);
                };
                socket.on('connect', handleConnect);

                return () => {
                    socket.off('server:update', handleUpdate);
                    // Remove only this page's listener; the provider has its own 'connect' handler.
                    socket.off('connect', handleConnect);
                    clearInterval(intervalId);
                };
            }

            return () => clearInterval(intervalId);
        }
    }, [user, socket, selectedServer?._id]); // Re-bind if selected server changes to ensure closure has correct ID

    // Fetch server history data. `forServer` carries the monitoring schedule used to filter points.
    const fetchServerHistory = async (serverId, forServer = selectedServer) => {
        const requestId = ++historyRequestId.current;
        try {
            // Get the last 24 hours of history data
            const response = await apiRequest(`/api/servers/${serverId}/history?period=24h&limit=500`, {
                method: 'GET'
            });

            // A newer request (another server was selected meanwhile) owns the chart now.
            if (requestId !== historyRequestId.current) return;

            if (response.status === 'success' && response.data.history) {
                let historicalData = response.data.history.map(check => {
                    const date = new Date(check.timestamp);
                    return {
                        time: date,
                        avgTime: check.responseTime || 0,
                        status: check.status || 'unknown',
                        error: check.error || null,
                        // Save original date components for filtering
                        ...zoned(date, forServer?.timezone) // day 0-6 (Sun-Sat), hour, minute on the server's clock
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
                setCheckMessage(
                    checkData.status === 'up'
                        ? `${selectedServer.name} is up. Response time ${checkData.responseTime} milliseconds.`
                        : `${selectedServer.name} is down.`
                );

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
                        ...zoned(checkData.timestamp, selectedServer?.timezone),
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
        window.history.replaceState(null, '', `?s=${idOf(server)}`);
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

        // The history API samples the last 24 hours into 5-minute buckets, so each point stands for
        // at least 5 minutes (or the check interval, if that is longer).
        const checkInterval = Math.max(selectedServer.monitoring?.frequency || 5, 5);
        const startTime = new Date(Date.now() - periodHours * 60 * 60 * 1000);

        const relevantData = responseTimeData.filter(point => point.time >= startTime);
        const downCount = relevantData.filter(point => point.status === 'down').length;

        return downCount * checkInterval;
    };

    const responseStats = useMemo(() => {
        if (responseTimeData.length === 0) return null;
        // Failed checks have no response time (stored as 0), so they must not count as "fastest" or pull the average down.
        const values = responseTimeData.filter((p) => p.status === 'up' && p.avgTime > 0).map((p) => p.avgTime);
        if (values.length === 0) return null;
        return {
            avg: Math.round(values.reduce((sum, v) => sum + v, 0) / values.length),
            max: Math.max(...values),
            min: Math.min(...values),
        };
    }, [responseTimeData]);

    const chartSummary = responseStats
        ? `Response time over the last 24 hours. Average ${responseStats.avg} milliseconds, fastest ${responseStats.min}, slowest ${responseStats.max}, ${plural(countIncidents(24), 'incident')}.`
        : 'No response time data yet.';

    // The sidebar carries this button on larger screens; the page header keeps it for small ones
    const addButton = (
        <Button asChild className="md:hidden">
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
    const hasChecks = responseTimeData.length > 0;
    const uptime24 = calculateUptime(24);
    const incidents = s ? getIncidents(responseTimeData, monitoring?.frequency, sStatus === 'down') : [];
    const frequency = monitoring?.frequency || 5;
    const q = query.trim().toLowerCase();
    const listed = q ? servers.filter((x) => `${x.name} ${x.url}`.toLowerCase().includes(q)) : servers;

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

            <TrialNotice servers={servers} />

            {error && (
                <Alert tone="error" title="Something went wrong" action={<Button size="sm" variant="outline" onClick={() => fetchServers(false)}>Try again</Button>}>
                    {error}
                </Alert>
            )}

            <p className="sr-only" role="status" aria-live="polite">{checkMessage}</p>

            <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
                {/* Server picker: horizontal strip on mobile, list on desktop */}
                <nav aria-label="Servers" className="-mx-4 min-w-0 space-y-3 px-4 sm:-mx-8 sm:px-8 lg:sticky lg:top-6 lg:mx-0 lg:px-0">
                    {servers.length > 6 && (
                        <div className="relative">
                            <MagnifyingGlass weight="light" aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
                            <Input type="search" aria-label="Find a server" placeholder="Find a server" value={query} onChange={(e) => setQuery(e.target.value)} className="rounded-full pl-10" />
                        </div>
                    )}
                    <ul className="flex snap-x gap-2.5 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
                        {listed.map((server) => {
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
                        {listed.length === 0 && <li className="px-1 text-sm text-muted-foreground">No server matches “{query}”.</li>}
                    </ul>
                </nav>

                {s && (
                    <div className="min-w-0 space-y-6">
                        {/* Status, with the last 24 hours at a glance */}
                        <Reveal>
                            <Panel
                                className={cn(
                                    sStatus === 'down' && 'shadow-[0_0_0_1px_oklch(0.72_0.17_22/0.35),0_30px_60px_-40px_oklch(0.72_0.17_22/0.5)]'
                                )}
                                coreClassName="space-y-7"
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
                                            {sStatus === 'unknown' && `The first check runs within ${plural(frequency, 'minute')}. Or run one now.`}
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

                                <section aria-labelledby="strip-heading">
                                    <div className="mb-3 flex items-baseline justify-between gap-3">
                                        <h3 id="strip-heading" className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Last 24 hours</h3>
                                        <p className={cn('font-mono text-sm tabular-nums', uptime24 === null ? 'text-muted-foreground' : parseFloat(uptime24) >= 99.9 ? 'text-success' : parseFloat(uptime24) >= 95 ? 'text-warning' : 'text-destructive')}>
                                            {uptime24 === null ? 'No checks yet' : `${uptime24}% uptime`}
                                        </p>
                                    </div>
                                    <HistoryStrip data={responseTimeData} />
                                </section>

                                <div className="flex flex-wrap items-center gap-2.5 border-t border-white/[0.07] pt-5">
                                    <Button onClick={handleRefresh} disabled={refreshing}>
                                        <ArrowsClockwise weight="light" className={refreshing ? 'animate-spin' : ''} />
                                        {refreshing ? 'Checking' : 'Check now'}
                                    </Button>
                                    <Button asChild variant="outline">
                                        <Link href={`/servers/${idOf(s)}/settings`}>
                                            <Gear weight="light" />
                                            Edit settings
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
                                        const windowIncidents = countIncidents(hours);
                                        const downtime = calculateDowntime(hours);
                                        return (
                                            <div key={hours} className="p-6">
                                                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Last {hours} hours</p>
                                                <p
                                                    className={cn(
                                                        'mt-3 font-display text-4xl font-medium tracking-tight tabular-nums',
                                                        uptime === null ? 'text-muted-foreground' : parseFloat(uptime) >= 99.9 ? 'text-success' : parseFloat(uptime) >= 95 ? 'text-warning' : 'text-destructive'
                                                    )}
                                                >
                                                    {uptime === null ? '—' : `${uptime}%`}
                                                </p>
                                                <p className="mt-2 text-[13px] text-muted-foreground">
                                                    {uptime === null ? 'No checks in this window yet' : `${plural(windowIncidents, 'incident')}, ${downtime} min downtime`}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </Reveal>

                        {/* Response time */}
                        <Reveal delay={120}>
                            <Panel>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="font-display text-xl font-medium tracking-tight">Response time</h3>
                                    <Legend />
                                </div>
                                <div className="mt-6">
                                    <ResponseChart data={responseTimeData} height={300} summary={chartSummary} />
                                </div>
                                {responseStats && (
                                    <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-white/[0.07] pt-6">
                                        {[
                                            ['Average', responseStats.avg],
                                            ['Fastest', responseStats.min],
                                            ['Slowest', responseStats.max],
                                        ].map(([label, value]) => (
                                            <div key={label}>
                                                <dt className="text-xs text-muted-foreground">{label}</dt>
                                                <dd className="mt-1 font-display text-2xl font-medium tracking-tight tabular-nums sm:text-3xl">
                                                    {value}
                                                    <span className="ml-1 text-sm font-normal text-muted-foreground">ms</span>
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                )}
                                {hasChecks && <p className="mt-4 text-xs text-muted-foreground">The chart only shows checks inside the monitoring schedule.</p>}
                            </Panel>
                        </Reveal>

                        {/* Incidents */}
                        <Reveal delay={160}>
                            <Panel>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="font-display text-xl font-medium tracking-tight">Incidents, last 24 hours</h3>
                                    <Button asChild variant="ghost" size="sm">
                                        <Link href={`/incidents?server=${idOf(s)}&days=30`}>View all incidents</Link>
                                    </Button>
                                </div>
                                {incidents.length === 0 ? (
                                    <p className="mt-4 flex items-center gap-2.5 text-sm text-muted-foreground">
                                        <CheckCircle weight="light" className={cn('size-5', hasChecks ? 'text-success' : 'text-muted-foreground/60')} />
                                        {hasChecks ? 'No failed checks in the last 24 hours.' : 'Nothing to report until the first checks have run.'}
                                    </p>
                                ) : (
                                    <ul className="mt-5 divide-y divide-white/[0.06]">
                                        {incidents.slice(0, 6).map((inc) => (
                                            <li key={inc.start.getTime()} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                                                <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', inc.ongoing ? 'bg-destructive' : 'bg-muted-foreground/60')} aria-hidden="true" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                                                        {inc.ongoing ? 'Down for' : 'Was down for'} {formatSpan(inc.ms)}
                                                        {inc.ongoing && <Badge variant="destructive">Ongoing</Badge>}
                                                    </p>
                                                    {inc.error && <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{inc.error}</p>}
                                                </div>
                                                <p className="shrink-0 text-right text-[13px] text-muted-foreground">{formatTimestamp(inc.start, null, 'D MMM, HH:mm')}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </Panel>
                        </Reveal>

                        {/* How it's monitored */}
                        <Reveal delay={200}>
                            <Panel>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="font-display text-xl font-medium tracking-tight">How it’s monitored</h3>
                                    <Button asChild variant="ghost" size="sm">
                                        <Link href={`/servers/${idOf(s)}/settings`}>Change</Link>
                                    </Button>
                                </div>
                                <div className="mt-6 grid gap-8 md:grid-cols-3">
                                    <dl className="space-y-4">
                                        <Fact label="Checked">Every {plural(frequency, 'minute')}</Fact>
                                        <Fact label="Days">
                                            {monitoring?.daysOfWeek?.length && monitoring.daysOfWeek.length < 7
                                                ? monitoring.daysOfWeek.map((day) => DAY_NAMES[day]).join(', ')
                                                : 'Every day'}
                                        </Fact>
                                        <Fact label="Hours">
                                            <span className="font-mono tabular-nums">
                                                {monitoring?.timeWindows?.map((w) => `${w.start}–${w.end}`).join(', ') || 'All day'}
                                            </span>
                                            {s.timezone && <span className="mt-0.5 block text-xs text-muted-foreground">{s.timezone}</span>}
                                        </Fact>
                                    </dl>

                                    <dl className="space-y-4">
                                        <Fact label="Alert channels">
                                            <ul className="space-y-1.5">
                                                {[
                                                    ['Email', alerts?.email],
                                                    ['Phone call', alerts?.phone],
                                                    ['Webhook', !!alerts?.webhookUrl],
                                                ].map(([label, on]) => (
                                                    <li key={label} className="flex items-center gap-2">
                                                        {on ? <Check weight="bold" className="size-4 text-success" /> : <Minus weight="bold" className="size-4 text-muted-foreground/60" />}
                                                        <span className={on ? '' : 'text-muted-foreground'}>{label}</span>
                                                        <span className="sr-only">{on ? 'on' : 'off'}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </Fact>
                                        <Fact label="Slow means">
                                            Over <span className="font-mono tabular-nums">{(alerts?.responseThreshold || 1000).toLocaleString()} ms</span>
                                        </Fact>
                                    </dl>

                                    <dl className="space-y-4">
                                        <Fact label="Tell">
                                            {s.contactEmails?.length > 0 || s.contactPhones?.length > 0 ? (
                                                <ul className="flex flex-col gap-1.5">
                                                    {s.contactEmails?.map((email) => (
                                                        <li key={email} className="flex items-center gap-2">
                                                            <EnvelopeSimple weight="light" className="size-4 shrink-0 text-muted-foreground" />
                                                            <span className="break-all">{email}</span>
                                                        </li>
                                                    ))}
                                                    {s.contactPhones?.map((phone) => (
                                                        <li key={phone} className="flex items-center gap-2">
                                                            <Phone weight="light" className="size-4 shrink-0 text-muted-foreground" />
                                                            <span className="font-mono text-[13px] tabular-nums">{formatPhone(phone)}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="text-muted-foreground">Nobody yet</span>
                                            )}
                                        </Fact>
                                        <Fact label="Type">{TYPE_LABEL[s.type] || 'Website'}</Fact>
                                        <Fact label="Added">{formatTimestamp(s.uploadedAt || s.createdAt, null, 'D MMM YYYY')}</Fact>
                                    </dl>
                                </div>
                                {s.description && <p className="mt-6 border-t border-white/[0.07] pt-5 text-sm text-muted-foreground">{s.description}</p>}
                            </Panel>
                        </Reveal>
                    </div>
                )}
            </div>
        </PageContainer>
    );
}
