'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  ArrowsClockwise,
  CaretRight,
  CheckCircle,
  Timer,
  Pulse,
  EnvelopeSimple,
  ChartLineUp,
} from '@phosphor-icons/react';
import { useAuth } from '@/app/context/AuthContext';
import { PageContainer } from '@/app/components/Layout/AppShell';
import TrialNotice from '@/app/components/TrialNotice';
import MobileAppCard from '@/app/components/MobileAppCard';
import { getPlanLimits } from '@/app/components/subscriptionPlans';
import { planLabel } from '@/app/components/planCatalog';
import { Button, ButtonArrow } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge, StatusDot } from '@/components/ui/status';
import { Reveal } from '@/components/ui/reveal';
import { timeAgo, durationSince, displayUrl } from '@/lib/time';
import { fetchAllServers } from '@/lib/servers';

const idOf = (s) => s._id || s.id;
const STATUS_RANK = { down: 0, unknown: 1, up: 2 };

// First run: nothing to show yet, so say what happens next instead of a wall of empty tiles.
function GetStarted({ limits, plan, admin }) {
  const steps = [
    { icon: Plus, title: 'Add a website or API address', body: 'Paste the URL. A name is filled in for you.' },
    { icon: EnvelopeSimple, title: 'We email you when it stops answering', body: 'Your account email is used by default. You can add more people or change this when you add the server.' },
    { icon: ChartLineUp, title: 'Watch it here', body: 'Status, response time and every incident appear on the Servers page.' },
  ];
  const slots = limits?.maxServers;
  return (
    <Reveal>
      <div className="bezel">
        <div className="bezel-core grid gap-10 p-7 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <div className="space-y-6">
            <span className="eyebrow">Get started</span>
            <h2 className="font-display text-4xl font-medium leading-[1.05] tracking-tight">Add your first server.</h2>
            <p className="max-w-[44ch] text-[15px] leading-relaxed text-muted-foreground">
              Ping Pilott checks it on a schedule and tells you the moment it stops responding.
              {!admin && slots > 0 && Number.isFinite(slots) && (
                <> Your {plan} plan includes {slots === 1 ? '1 server' : `${slots} servers`}.</>
              )}
            </p>
            <Button asChild size="lg">
              <Link href="/servers/new">
                Add a server
                <ButtonArrow />
              </Link>
            </Button>
          </div>

          <ol className="space-y-5">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/[0.05] text-primary ring-1 ring-white/10">
                  <step.icon weight="light" className="size-5" />
                </span>
                <div>
                  <p className="font-medium">
                    <span className="mr-2 font-mono text-xs tabular-nums text-muted-foreground">0{i + 1}</span>
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Reveal>
  );
}

export default function DashboardPage() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [checking, setChecking] = useState({});
  const [userMap, setUserMap] = useState({});

  const { user, isAdmin, apiRequest } = useAuth();
  const admin = isAdmin();

  const fetchServers = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    setError(null);

    try {
      const list = await fetchAllServers(apiRequest, { admin });

      if (admin && list.length > 0) {
        try {
          const usersResponse = await apiRequest('/api/users', { method: 'GET' });
          const map = {};
          (usersResponse.data?.users || []).forEach((u) => {
            const uid = u.id || u._id;
            if (uid) map[String(uid)] = u.displayName || u.email || 'Unknown user';
          });
          setUserMap(map);
        } catch (userErr) {
          console.error('Error fetching user details:', userErr);
        }
      }

      setServers(list);
    } catch (err) {
      console.error('Error fetching servers:', err);
      setError('We couldn’t load your servers. Check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, admin, apiRequest]);

  useEffect(() => {
    if (!user) return;
    fetchServers();
    const id = setInterval(fetchServers, 60 * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const ownerName = useCallback(
    (s) => {
      if (s.uploadedBy && typeof s.uploadedBy === 'object') {
        return s.uploadedBy.displayName || s.uploadedBy.email || 'Unknown user';
      }
      return userMap[String(s.uploadedBy)] || 'Unknown user';
    },
    [userMap]
  );

  const counts = useMemo(() => {
    const up = servers.filter((s) => s.status === 'up').length;
    const down = servers.filter((s) => s.status === 'down').length;
    const timed = servers.filter((s) => s.status === 'up' && s.responseTime > 0);
    const avg = timed.length ? Math.round(timed.reduce((a, s) => a + s.responseTime, 0) / timed.length) : null;
    return { total: servers.length, up, down, pending: servers.length - up - down, avg };
  }, [servers]);

  // Problems first, then anything still waiting for a first check, then healthy servers
  const sorted = useMemo(
    () =>
      [...servers].sort(
        (a, b) => (STATUS_RANK[a.status] ?? 1) - (STATUS_RANK[b.status] ?? 1) || (a.name || '').localeCompare(b.name || '')
      ),
    [servers]
  );

  const handleCheckServer = async (serverId) => {
    setChecking((c) => ({ ...c, [serverId]: true }));
    try {
      const response = await apiRequest(`/api/servers/${serverId}/check`, { method: 'POST' });
      if (response.status === 'success') {
        const check = response.data.check;
        setServers((prev) =>
          prev.map((s) =>
            idOf(s) === serverId
              ? { ...s, status: check.status, responseTime: check.responseTime, error: check.error, lastChecked: check.timestamp }
              : s
          )
        );
      }
    } catch (err) {
      console.error('Error checking server:', err);
      setError('That check didn’t go through. Try again in a moment.');
    } finally {
      setChecking((c) => ({ ...c, [serverId]: false }));
    }
  };

  const downServers = servers.filter((s) => s.status === 'down');
  const barTotal = counts.total || 1;
  const limits = user ? getPlanLimits(user) : null;
  const planName = admin ? 'Admin' : planLabel(user?.subscription?.plan);
  const firstRun = !loading && !error && servers.length === 0;
  const maxServers = limits?.maxServers;
  const showUsage = !admin && Number.isFinite(maxServers) && maxServers > 0;

  return (
    <PageContainer className="space-y-10">
      <PageHeader
        eyebrow={admin ? 'All accounts' : 'Overview'}
        title="Dashboard"
        description={
          loading
            ? 'Loading your servers.'
            : counts.total === 0
              ? 'Nothing to watch yet.'
              : counts.down > 0
                ? `${counts.down} of ${counts.total} servers ${counts.down === 1 ? 'is' : 'are'} down right now.`
                : `All ${counts.total} servers are responding.`
        }
        actions={
          <>
            <Button variant="outline" onClick={fetchServers} disabled={refreshing} aria-label="Refresh">
              <ArrowsClockwise weight="light" className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </Button>
            {/* The sidebar has this button on larger screens; keep it here only where the sidebar is tucked away */}
            <Button asChild className="md:hidden">
              <Link href="/servers/new">
                <Plus weight="light" />
                Add server
              </Link>
            </Button>
          </>
        }
      />

      {/* The Android app, front and centre until dismissed; it comes back when a newer build is published */}
      <MobileAppCard />

      <TrialNotice servers={servers} />

      {error && (
        <Alert
          tone="error"
          title="Something went wrong"
          action={<Button size="sm" variant="outline" onClick={fetchServers}>Try again</Button>}
        >
          {error}
        </Alert>
      )}

      {firstRun && <GetStarted limits={limits} plan={planName} admin={admin} />}

      {!firstRun && (
        <>
          {/* Summary bento */}
          <section aria-label="Summary" className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <Reveal className="md:col-span-6">
              <div className="bezel-sm h-full">
                <div className="bezel-sm-core flex h-full flex-col justify-between gap-6 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Fleet status</p>
                      {loading ? (
                        <Skeleton className="mt-3 h-10 w-44" />
                      ) : (
                        <p className="mt-2 font-display text-4xl font-medium tracking-tight tabular-nums">
                          {counts.up}
                          <span className="text-muted-foreground"> / {counts.total}</span>
                          <span className="ml-2 text-base font-normal text-muted-foreground">operational</span>
                        </p>
                      )}
                    </div>
                    <CheckCircle weight="light" className={`size-6 ${counts.down > 0 ? 'text-muted-foreground' : 'text-success'}`} />
                  </div>
                  <div>
                    <div className="flex h-2 gap-1 overflow-hidden rounded-full" role="img" aria-label={`${counts.up} operational, ${counts.down} down, ${counts.pending} pending`}>
                      {counts.total === 0 ? (
                        <span className="h-full flex-1 rounded-full bg-white/[0.08]" />
                      ) : (
                        <>
                          {counts.up > 0 && <span className="h-full rounded-full bg-success transition-[flex-grow] duration-700 ease-fluid" style={{ flexGrow: counts.up / barTotal }} />}
                          {counts.down > 0 && <span className="h-full rounded-full bg-destructive transition-[flex-grow] duration-700 ease-fluid" style={{ flexGrow: counts.down / barTotal }} />}
                          {counts.pending > 0 && <span className="h-full rounded-full bg-white/20 transition-[flex-grow] duration-700 ease-fluid" style={{ flexGrow: counts.pending / barTotal }} />}
                        </>
                      )}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">Refreshes every minute.</p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={80} className="md:col-span-3">
              <div className="bezel-sm h-full">
                <div className="bezel-sm-core flex h-full flex-col justify-between gap-6 p-6">
                  <div className="flex items-start justify-between">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Down now</p>
                    <Pulse weight="light" className={`size-6 ${counts.down > 0 ? 'text-destructive' : 'text-muted-foreground/60'}`} />
                  </div>
                  {loading ? (
                    <Skeleton className="h-10 w-16" />
                  ) : (
                    <p className={`font-display text-5xl font-medium tracking-tight tabular-nums ${counts.down > 0 ? 'text-destructive' : ''}`}>{counts.down}</p>
                  )}
                </div>
              </div>
            </Reveal>

            <Reveal delay={160} className="md:col-span-3">
              <div className="bezel-sm h-full">
                <div className="bezel-sm-core flex h-full flex-col justify-between gap-6 p-6">
                  <div className="flex items-start justify-between">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Avg response</p>
                    <Timer weight="light" className="size-6 text-muted-foreground/60" />
                  </div>
                  {loading ? (
                    <Skeleton className="h-10 w-24" />
                  ) : (
                    <p className="font-display text-5xl font-medium tracking-tight tabular-nums">
                      {counts.avg ?? '—'}
                      {counts.avg !== null && <span className="ml-1 text-lg font-normal text-muted-foreground">ms</span>}
                    </p>
                  )}
                </div>
              </div>
            </Reveal>
          </section>

          {/* Needs attention */}
          {!loading && downServers.length > 0 && (
            <section aria-label="Needs attention">
              <Alert tone="error" title={`${downServers.length} ${downServers.length === 1 ? 'server needs' : 'servers need'} attention`}>
                <ul className="mt-2 space-y-1.5">
                  {downServers.map((s) => (
                    <li key={idOf(s)} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Link href={`/servers?s=${idOf(s)}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                        {s.name}
                      </Link>
                      <span className="text-[13px]">
                        {s.error ? `${s.error} · ` : ''}down for {durationSince(s.lastStatusChange || s.lastChecked)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Alert>
            </section>
          )}

          {/* Servers: a glance, not a second management screen. Details, history and settings live on Servers. */}
          <section aria-labelledby="servers-heading" className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="servers-heading" className="font-display text-xl font-medium tracking-tight">
                  {admin ? 'All servers' : 'Your servers'}
                </h2>
                {showUsage && !loading && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {counts.total} of {maxServers} on your {planName} plan.{' '}
                    <Link href="/subscription" className="text-primary underline-offset-4 hover:underline">Plan & billing</Link>
                  </p>
                )}
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/servers">
                  Open servers
                  <CaretRight weight="light" />
                </Link>
              </Button>
            </div>

            <div className="bezel-sm">
              <div className="bezel-sm-core overflow-hidden">
                {loading ? (
                  <div className="space-y-px p-3" role="status" aria-label="Loading servers">
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} className="h-16 rounded-2xl" />
                    ))}
                  </div>
                ) : (
                  <ul className="divide-y divide-white/[0.05]">
                    {sorted.map((server) => {
                      const id = idOf(server);
                      return (
                        <li key={id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 transition-colors duration-300 ease-fluid hover:bg-white/[0.025]">
                          <StatusDot status={server.status} />
                          <div className="min-w-0 flex-1 basis-48">
                            <Link href={`/servers?s=${id}`} className="block truncate font-medium underline-offset-4 hover:underline">
                              {server.name}
                            </Link>
                            <p className="truncate font-mono text-xs text-muted-foreground">
                              {displayUrl(server.url)}
                              {admin && <span className="font-sans"> · {ownerName(server)}</span>}
                            </p>
                          </div>
                          <StatusBadge status={server.status} className="hidden sm:inline-flex" />
                          <span className="sr-only sm:hidden">{server.status === 'up' ? 'Operational' : server.status === 'down' ? 'Down' : 'Pending'}</span>
                          <span className="w-20 text-right font-mono text-[13px] tabular-nums">
                            {server.responseTime ? `${server.responseTime} ms` : <span className="text-muted-foreground">—</span>}
                          </span>
                          <span className="hidden w-24 text-right text-[13px] text-muted-foreground md:block">
                            {server.lastChecked ? timeAgo(server.lastChecked) : 'Not checked'}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => handleCheckServer(id)} disabled={checking[id]} aria-label={`Check ${server.name} now`}>
                            <ArrowsClockwise weight="light" className={checking[id] ? 'animate-spin' : ''} />
                            {checking[id] ? 'Checking' : 'Check now'}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </PageContainer>
  );
}
