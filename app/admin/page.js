// app/admin/page.js

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowsClockwise, ArrowUpRight, UsersThree, HardDrives, ChartBar, Tray, Pulse } from '@phosphor-icons/react';
import { useAuth } from '@/app/context/AuthContext';
import { PageContainer } from '@/app/components/Layout/AppShell';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Reveal } from '@/components/ui/reveal';
import { StatusDot } from '@/components/ui/status';
import { timeAgo } from '@/lib/time';
import { getApiUrl } from '@/lib/apiConfig';

// Only what /health actually reports: the API answering, MongoDB and Redis (which backs the job queue).
const SERVICE_LABELS = {
    api: 'API',
    database: 'Database',
    queue: 'Job queue',
};

const QUICK_LINKS = [
    { href: '/admin/users', label: 'Manage users', hint: 'Roles, verification, accounts', icon: UsersThree },
    { href: '/admin/support', label: 'Support tickets', hint: 'Reply, reassign, close', icon: Tray },
    { href: '/admin/analytics', label: 'Analytics', hint: 'Uptime, response time, growth', icon: ChartBar },
    { href: '/dashboard', label: 'All servers', hint: 'Every monitor on the platform', icon: HardDrives },
];

function Tile({ title, value, unit, hint, big = false, className = '', delay = 0, loading }) {
    return (
        <Reveal delay={delay} className={className}>
            <div className="bezel-sm h-full">
                <div className="bezel-sm-core flex h-full flex-col justify-between gap-8 p-6">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
                    <div>
                        {loading ? (
                            <Skeleton className="h-12 w-28" />
                        ) : (
                            <p className={`font-display font-medium tracking-tight tabular-nums ${big ? 'text-6xl' : 'text-4xl'}`}>
                                {value}
                                {unit && <span className="ml-1 text-lg font-normal text-muted-foreground">{unit}</span>}
                            </p>
                        )}
                        {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
                    </div>
                </div>
            </div>
        </Reveal>
    );
}

export default function AdminDashboard() {
    // null until the analytics call succeeds, so a failed load shows "—" rather than a false 0%
    const [stats, setStats] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [systemStatus, setSystemStatus] = useState({
        api: 'Checking',
        database: 'Checking',
        queue: 'Checking',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const { apiRequest } = useAuth();

    const fetchAdminStats = async (isInitialLoad = true) => {
        if (isInitialLoad) setLoading(true);
        setError(null);
        setRefreshing(true);

        try {
            // The period goes in the query string; fetch ignores a `params` option.
            const analyticsResponse = await apiRequest('/api/admin/analytics?period=month', { method: 'GET' });

            if (analyticsResponse.status !== 'success') {
                throw new Error(analyticsResponse.message || 'Failed to fetch analytics data');
            }

            const kpis = analyticsResponse.data.kpis || {};

            setStats({
                users: kpis.activeUsers || 0,
                servers: kpis.activeServers || 0,
                alerts: (analyticsResponse.data.alertsByType || []).reduce((total, item) => total + item.value, 0),
                uptime: kpis.uptime ?? null, // null = no checks in the period, shown as "—" instead of 0%
            });

            const serversResponse = await apiRequest('/api/servers?admin=true&limit=5&sortBy=updatedAt&sortDir=desc', { method: 'GET' });

            if (serversResponse.status !== 'success') {
                throw new Error(serversResponse.message || 'Failed to fetch servers data');
            }

            const recentServers = serversResponse.data.servers || [];

            const activities = await Promise.all(
                recentServers.map(async (server) => {
                    try {
                        let displayName = 'Unknown user';

                        // uploadedBy is either a populated user object or a bare id.
                        if (server.uploadedBy && typeof server.uploadedBy === 'object') {
                            displayName = server.uploadedBy.displayName || server.uploadedBy.email || displayName;
                        } else if (server.uploadedBy) {
                            const userResponse = await apiRequest(`/api/users/${server.uploadedBy}`, { method: 'GET' });
                            if (userResponse.status === 'success') {
                                const u = userResponse.data.user;
                                displayName = u.displayName || u.email || displayName;
                            }
                        }

                        return {
                            user: displayName,
                            server: server.name,
                            status: server.status,
                            changed: !!server.lastStatusChange,
                            // A status line should carry the time of the change; "added" lines carry the creation time.
                            at: server.lastStatusChange || server.uploadedAt || server.createdAt || server.updatedAt,
                        };
                    } catch (err) {
                        console.error('Error processing recent activity:', err);
                        return null;
                    }
                })
            );

            setRecentActivity(activities.filter(Boolean));

            // /health answers 503 with a body when a dependency is down, so read it directly instead of through apiRequest.
            try {
                const healthResponse = await fetch(getApiUrl('/health'));
                const health = await healthResponse.json();
                const label = (state) => (state === 'up' ? 'Operational' : 'Down');
                setSystemStatus({
                    api: 'Operational',
                    database: label(health.checks?.mongodb),
                    queue: label(health.checks?.redis),
                });
            } catch (err) {
                setSystemStatus({ api: 'Unreachable', database: 'Unknown', queue: 'Unknown' });
            }
        } catch (err) {
            console.error('Error fetching admin stats:', err);
            setError('We couldn’t load the admin overview. Check your connection and try again.');
        } finally {
            if (isInitialLoad) setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAdminStats(true);
        const intervalId = setInterval(() => fetchAdminStats(false), 60000);
        return () => clearInterval(intervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <PageContainer className="space-y-10">
            <PageHeader
                eyebrow="Admin"
                title="Overview"
                description="Platform health and what changed recently."
                actions={
                    <Button variant="outline" onClick={() => fetchAdminStats(false)} disabled={refreshing}>
                        <ArrowsClockwise weight="light" className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </Button>
                }
            />

            {error && (
                <Alert tone="error" title="Something went wrong" action={<Button size="sm" variant="outline" onClick={() => fetchAdminStats(false)}>Try again</Button>}>
                    {error}
                </Alert>
            )}

            <section aria-label="Key numbers" className="grid grid-cols-1 gap-4 md:grid-cols-12">
                <Tile title="System uptime" big loading={loading} value={stats?.uptime ?? '—'} unit={stats?.uptime != null ? '%' : undefined} hint={stats ? `Last 30 days · ${stats.alerts} ${stats.alerts === 1 ? 'alert' : 'alerts'} sent` : undefined} className="md:col-span-5" />
                <Tile title="Active users" loading={loading} value={stats ? stats.users : '—'} className="md:col-span-3" delay={70} />
                <Tile title="Monitored servers" loading={loading} value={stats ? stats.servers : '—'} className="md:col-span-4" delay={140} />
            </section>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                {/* Recent activity */}
                <Reveal className="lg:col-span-7">
                    <section aria-labelledby="activity-heading" className="bezel-sm h-full">
                        <div className="bezel-sm-core h-full p-6">
                            <h2 id="activity-heading" className="font-display text-lg font-medium tracking-tight">Recent activity</h2>
                            {loading ? (
                                <div className="mt-5 space-y-3" role="status" aria-label="Loading activity">
                                    {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
                                </div>
                            ) : recentActivity.length === 0 ? (
                                <p className="mt-8 text-sm text-muted-foreground">No activity yet. New and changed servers appear here.</p>
                            ) : (
                                <ul className="mt-4 divide-y divide-white/[0.06]">
                                    {recentActivity.map((a, i) => (
                                        <li key={i} className="flex items-center justify-between gap-4 py-3.5">
                                            <p className="min-w-0 text-sm">
                                                <span className="font-medium">{a.user}</span>
                                                <span className="text-muted-foreground">
                                                    {a.changed ? ` · ${a.server} is now ${a.status}` : ` added ${a.server}`}
                                                </span>
                                            </p>
                                            <span className="shrink-0 text-xs text-muted-foreground">{a.at ? timeAgo(a.at) : ""}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>
                </Reveal>

                <div className="space-y-4 lg:col-span-5">
                    {/* System status */}
                    <Reveal delay={70}>
                        <section aria-labelledby="status-heading" className="bezel-sm">
                            <div className="bezel-sm-core p-6">
                                <h2 id="status-heading" className="flex items-center gap-2 font-display text-lg font-medium tracking-tight">
                                    <Pulse weight="light" className="size-5 text-primary" aria-hidden="true" />
                                    Services
                                </h2>
                                <ul className="mt-4 space-y-3.5">
                                    {Object.entries(systemStatus).map(([service, status]) => (
                                        <li key={service} className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">{SERVICE_LABELS[service] || service}</span>
                                            <span className={`inline-flex items-center gap-2 ${status === 'Operational' ? 'text-success' : status === 'Checking' || status === 'Unknown' ? 'text-muted-foreground' : 'text-destructive'}`}>
                                                <StatusDot status={status === 'Operational' ? 'up' : status === 'Checking' || status === 'Unknown' ? 'unknown' : 'down'} />
                                                {status}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    </Reveal>

                    {/* Quick links */}
                    <Reveal delay={140}>
                        <nav aria-label="Admin shortcuts" className="bezel-sm">
                            <ul className="bezel-sm-core divide-y divide-white/[0.06] overflow-hidden">
                                {QUICK_LINKS.map(({ href, label, hint, icon: Icon }) => (
                                    <li key={href}>
                                        <Link href={href} className="group flex items-center gap-4 px-5 py-4 transition-colors duration-300 ease-fluid hover:bg-white/[0.03]">
                                            <Icon weight="light" className="size-6 shrink-0 text-primary" aria-hidden="true" />
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm font-medium">{label}</span>
                                                <span className="block truncate text-xs text-muted-foreground">{hint}</span>
                                            </span>
                                            <ArrowUpRight weight="light" className="size-5 shrink-0 text-muted-foreground transition-transform duration-500 ease-fluid group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden="true" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </Reveal>
                </div>
            </div>
        </PageContainer>
    );
}
