// app/admin/analytics/page.js

'use client';

import { useState, useEffect, useRef } from 'react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { ArrowsClockwise, ArrowUpRight, ArrowDownRight, ChartLineUp } from '@phosphor-icons/react';
import { useAuth } from '@/app/context/AuthContext';
import { PageContainer } from '@/app/components/Layout/AppShell';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Reveal } from '@/components/ui/reveal';

const RANGES = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
];

const TICK = { fill: 'oklch(0.72 0.03 215)', fontSize: 12 };
const GRID = 'oklch(1 0 0 / 0.06)';

const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
};

// Glass tooltip that reads from the chart's own series colours.
function ChartTooltip({ active, payload, label, unit = '' }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass rounded-2xl px-3.5 py-2.5 text-xs">
            {label && <p className="mb-1 text-muted-foreground">{label}</p>}
            {payload.map((entry, i) => (
                <p key={i} className="flex items-center gap-2 text-foreground">
                    <span className="size-2 rounded-full" style={{ background: entry.color || entry.payload?.fill || entry.fill }} />
                    {entry.name}
                    <span className="ml-auto pl-3 font-mono tabular-nums">{entry.value}{unit}</span>
                </p>
            ))}
        </div>
    );
}

// `better` says which direction is good, so a slower response time reads as a regression.
function Delta({ change, better = 'up' }) {
    const n = parseFloat(change);
    if (Number.isNaN(n)) return null;
    const up = n >= 0;
    const good = better === 'up' ? up : !up;
    const Icon = up ? ArrowUpRight : ArrowDownRight;
    return (
        <span className={`inline-flex items-center gap-1 text-xs tabular-nums ${good ? 'text-success' : 'text-destructive'}`}>
            <Icon weight="light" className="size-4" aria-hidden="true" />
            {up ? '+' : ''}{n}%
            <span className="sr-only"> versus the previous period, {good ? 'better' : 'worse'}</span>
        </span>
    );
}

function Tile({ title, value, unit, change, better, className = '', big = false, delay = 0, children }) {
    return (
        <Reveal delay={delay} className={className}>
            <div className="bezel-sm h-full">
                <div className="bezel-sm-core flex h-full flex-col justify-between gap-8 p-6">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
                    <div>
                        <p className={`font-display font-medium tracking-tight tabular-nums ${big ? 'text-6xl' : 'text-4xl'}`}>
                            {value}
                            {unit && value !== '—' && <span className="ml-1 text-lg font-normal text-muted-foreground">{unit}</span>}
                        </p>
                        {change !== undefined && <div className="mt-2"><Delta change={change} better={better} /></div>}
                        {children}
                    </div>
                </div>
            </div>
        </Reveal>
    );
}

function ChartPanel({ title, description, className = '', delay = 0, empty, hasData, children }) {
    return (
        <Reveal delay={delay} className={className}>
            <div className="bezel-sm h-full">
                <div className="bezel-sm-core flex h-full flex-col gap-5 p-6">
                    <div>
                        <h2 className="font-display text-lg font-medium tracking-tight">{title}</h2>
                        {description && <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>}
                    </div>
                    {hasData ? (
                        children
                    ) : (
                        <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
                            <ChartLineUp weight="light" className="size-8 text-muted-foreground/60" aria-hidden="true" />
                            <p className="text-sm text-muted-foreground">{empty}</p>
                        </div>
                    )}
                </div>
            </div>
        </Reveal>
    );
}

export default function AdminAnalytics() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        userGrowth: [],
        serverStatus: [],
        alertsByType: [],
        responseTime: [],
    });
    const [dateRange, setDateRange] = useState('month');
    const [refreshing, setRefreshing] = useState(false);
    const [kpis, setKpis] = useState({});

    const { apiRequest } = useAuth();
    // Only the newest request may update the page, so quickly switching ranges can't show old data.
    const requestId = useRef(0);

    const fetchAnalyticsData = async (isInitialLoad = true) => {
        const thisRequest = ++requestId.current;
        if (isInitialLoad) setLoading(true);
        setError(null);
        setRefreshing(true);

        try {
            const now = new Date();
            const days = { week: 7, month: 30, year: 365 }[dateRange] ?? 30;
            const span = days * 24 * 60 * 60 * 1000;
            const startDate = new Date(now.getTime() - span);
            const previousPeriodStart = new Date(startDate.getTime() - span);
            const previousPeriodEnd = new Date(startDate.getTime() - 1);

            // The range travels in the query string; fetch ignores a `params` option.
            const query = new URLSearchParams({
                startDate: startDate.toISOString(),
                endDate: now.toISOString(),
                prevStartDate: previousPeriodStart.toISOString(),
                prevEndDate: previousPeriodEnd.toISOString(),
                period: dateRange,
            });

            const response = await apiRequest(`/api/admin/analytics?${query}`, { method: 'GET' });
            if (thisRequest !== requestId.current) return;

            if (response.status !== 'success') {
                throw new Error(response.message || 'Failed to fetch analytics data');
            }

            const analyticsData = response.data;
            setData({
                userGrowth: analyticsData.userGrowth || [],
                serverStatus: analyticsData.serverStatus || [],
                alertsByType: analyticsData.alertsByType || [],
                responseTime: analyticsData.responseTime || [],
            });
            setKpis(analyticsData.kpis || {});
        } catch (err) {
            if (thisRequest !== requestId.current) return;
            console.error('Error fetching analytics data:', err);
            setError('We couldn’t load analytics. Check your connection and try again.');
        } finally {
            if (thisRequest === requestId.current) {
                if (isInitialLoad) setLoading(false);
                setRefreshing(false);
            }
        }
    };

    useEffect(() => {
        fetchAnalyticsData(true);
        const intervalId = setInterval(() => fetchAnalyticsData(false), 5 * 60 * 1000);
        return () => clearInterval(intervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange]);

    const statusColors = ['var(--chart-2)', 'var(--chart-4)'];
    const alertColors = ['var(--chart-1)', 'var(--chart-3)', 'var(--chart-2)', 'var(--chart-4)', 'var(--chart-5)'];
    const alertMax = Math.max(1, ...data.alertsByType.map((a) => a.value || 0));
    const statusTotal = data.serverStatus.reduce((t, s) => t + (s.value || 0), 0);

    return (
        <PageContainer className="space-y-10">
            <PageHeader
                eyebrow="Admin"
                title="Analytics"
                description="How the platform is performing, compared with the previous period."
                actions={
                    <>
                        <div role="group" aria-label="Date range" className="inline-flex rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.08]">
                            {RANGES.map((r) => {
                                const on = dateRange === r.key;
                                return (
                                    <button
                                        key={r.key}
                                        type="button"
                                        aria-pressed={on}
                                        onClick={() => setDateRange(r.key)}
                                        className={`min-h-9 rounded-full px-4 text-[13px] font-medium transition-[background-color,color] duration-500 ease-fluid ${on ? 'bg-white/[0.1] text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {r.label}
                                    </button>
                                );
                            })}
                        </div>
                        <Button variant="outline" size="icon" onClick={() => fetchAnalyticsData(false)} disabled={refreshing} aria-label="Refresh analytics">
                            <ArrowsClockwise weight="light" className={refreshing ? 'animate-spin' : ''} />
                        </Button>
                    </>
                }
            />

            {error && (
                <Alert tone="error" title="Something went wrong" action={<Button size="sm" variant="outline" onClick={() => fetchAnalyticsData(false)}>Try again</Button>}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <div className="grid gap-4 md:grid-cols-12" role="status" aria-label="Loading analytics">
                    <Skeleton className="h-48 rounded-3xl md:col-span-5" />
                    <Skeleton className="h-48 rounded-3xl md:col-span-4" />
                    <Skeleton className="h-48 rounded-3xl md:col-span-3" />
                    <Skeleton className="h-80 rounded-3xl md:col-span-8" />
                    <Skeleton className="h-80 rounded-3xl md:col-span-4" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                    <Tile title="Uptime" big value={kpis.uptime ?? '—'} unit="%" change={kpis.uptimeChange} better="up" className="md:col-span-5" />
                    <Tile title="Avg response" value={kpis.avgResponseTime ?? '—'} unit="ms" change={kpis.responseTimeChange} better="down" className="md:col-span-4" delay={70} />
                    <Tile title="Active servers" value={formatNumber(kpis.activeServers ?? 0)} change={kpis.serversChange} better="up" className="md:col-span-3" delay={140} />

                    <ChartPanel
                        title="User growth"
                        description="New accounts over the selected period."
                        className="md:col-span-8"
                        hasData={data.userGrowth.length > 0}
                        empty="No sign-ups in this period."
                    >
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.userGrowth} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="userGrowthFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" style={{ stopColor: 'var(--chart-1)', stopOpacity: 0.3 }} />
                                            <stop offset="100%" style={{ stopColor: 'var(--chart-1)', stopOpacity: 0 }} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} stroke={GRID} />
                                    <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false} />
                                    <YAxis tick={TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'oklch(1 0 0 / 0.12)' }} />
                                    <Area type="monotone" dataKey="users" name="Users" stroke="var(--chart-1)" strokeWidth={1.75} fill="url(#userGrowthFill)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartPanel>

                    <Tile title="Active users" value={formatNumber(kpis.activeUsers ?? 0)} change={kpis.usersChange} better="up" className="md:col-span-4" delay={70} />

                    <ChartPanel
                        title="Response time"
                        description="Average across all monitors, in milliseconds."
                        className="md:col-span-7"
                        hasData={data.responseTime.length > 0}
                        empty="No checks recorded in this period."
                    >
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.responseTime} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
                                    <CartesianGrid vertical={false} stroke={GRID} />
                                    <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false} />
                                    <YAxis tick={TICK} axisLine={false} tickLine={false} />
                                    <Tooltip content={<ChartTooltip unit=" ms" />} cursor={{ stroke: 'oklch(1 0 0 / 0.12)' }} />
                                    <Line type="monotone" dataKey="avgTime" name="Response time" stroke="var(--chart-2)" strokeWidth={1.75} dot={false} activeDot={{ r: 4, fill: 'var(--chart-2)', stroke: 'none' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartPanel>

                    <ChartPanel
                        title="Server status"
                        description="Up and down right now."
                        className="md:col-span-5"
                        delay={70}
                        hasData={data.serverStatus.some((s) => s.value > 0)}
                        empty="No servers are being monitored yet."
                    >
                        <div className="flex flex-col items-center gap-6 sm:flex-row">
                            <div className="relative h-48 w-48 shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={data.serverStatus} dataKey="value" nameKey="name" innerRadius={62} outerRadius={84} paddingAngle={3} stroke="none" cornerRadius={6}>
                                            {data.serverStatus.map((entry, i) => (
                                                <Cell key={entry.name} fill={statusColors[i % statusColors.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<ChartTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                                    <div>
                                        <p className="font-display text-3xl font-medium tabular-nums">{statusTotal}</p>
                                        <p className="text-xs text-muted-foreground">servers</p>
                                    </div>
                                </div>
                            </div>
                            <ul className="w-full space-y-3">
                                {data.serverStatus.map((s, i) => (
                                    <li key={s.name} className="flex items-center gap-3 text-sm">
                                        <span className="size-2.5 rounded-full" style={{ background: statusColors[i % statusColors.length] }} aria-hidden="true" />
                                        <span className="text-muted-foreground">{s.name}</span>
                                        <span className="ml-auto font-mono tabular-nums">{s.value}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </ChartPanel>

                    <ChartPanel
                        title="Alerts by type"
                        description="Alerts sent in the selected period."
                        className="md:col-span-12"
                        hasData={data.alertsByType.some((a) => a.value > 0)}
                        empty="No alerts were sent in this period."
                    >
                        <ul className="grid gap-x-10 gap-y-5 md:grid-cols-2">
                            {data.alertsByType.map((a, i) => (
                                <li key={a.name}>
                                    <div className="mb-2 flex items-baseline justify-between text-sm">
                                        <span>{a.name}</span>
                                        <span className="font-mono tabular-nums text-muted-foreground">{a.value}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                                        <div
                                            className="h-full origin-left rounded-full transition-transform duration-1000 ease-fluid"
                                            style={{ width: '100%', transform: `scaleX(${(a.value || 0) / alertMax})`, background: alertColors[i % alertColors.length] }}
                                        />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </ChartPanel>
                </div>
            )}
        </PageContainer>
    );
}
