'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  HardDrives,
  MagnifyingGlass,
  ArrowsClockwise,
  ArrowSquareOut,
  Plus,
  Trash,
  CaretUp,
  CaretDown,
  CheckCircle,
  Timer,
  Pulse,
} from '@phosphor-icons/react';
import { useAuth } from '@/app/context/AuthContext';
import { PageContainer } from '@/app/components/Layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert } from '@/components/ui/alert';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status';
import { Reveal } from '@/components/ui/reveal';
import TrialNotice from '@/app/components/TrialNotice';
import { timeAgo, durationSince, displayUrl, toHref } from '@/lib/time';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'up', label: 'Operational' },
  { key: 'down', label: 'Down' },
];

const idOf = (s) => s._id || s.id;

export default function DashboardPage() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'status', direction: 'asc' });
  const [refreshing, setRefreshing] = useState(false);
  const [checking, setChecking] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [userMap, setUserMap] = useState({});

  const { user, isAdmin, apiRequest } = useAuth();
  const admin = isAdmin();

  const fetchServers = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    setError(null);

    try {
      const response = await apiRequest(admin ? '/api/servers?admin=true' : '/api/servers', { method: 'GET' });
      const list = response.data.servers;

      if (admin && list.length > 0) {
        try {
          const usersResponse = await apiRequest('/api/users?limit=200', { method: 'GET' });
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

  const visible = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let result = servers.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.name?.toLowerCase().includes(q) ||
        s.url?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        (admin && ownerName(s).toLowerCase().includes(q))
      );
    });

    const { key, direction } = sortConfig;
    const dir = direction === 'asc' ? 1 : -1;
    const rank = { down: 0, unknown: 1, up: 2 };
    const value = (s) => {
      if (key === 'lastChecked') return s.lastChecked ? new Date(s.lastChecked).getTime() : 0;
      if (key === 'status') return rank[s.status] ?? 1;
      if (key === 'responseTime') return s.responseTime ?? Infinity;
      if (key === 'owner') return ownerName(s).toLowerCase();
      return (s[key] || '').toString().toLowerCase();
    };
    result = [...result].sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      return av < bv ? -dir : av > bv ? dir : 0;
    });
    return result;
  }, [servers, searchTerm, statusFilter, sortConfig, admin, ownerName]);

  const handleSort = (key) =>
    setSortConfig((prev) => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));

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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const id = idOf(deleteTarget);
      await apiRequest(`/api/servers/${id}`, { method: 'DELETE' });
      setServers((prev) => prev.filter((s) => idOf(s) !== id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Error deleting server:', err);
      setDeleteTarget(null);
      setError('We couldn’t delete that server. Try again.');
    } finally {
      setDeleting(false);
    }
  };

  const downServers = servers.filter((s) => s.status === 'down');
  const barTotal = counts.total || 1;

  // Plain render functions, not components: a component defined here would be a new type on every render,
  // remounting the buttons and dropping keyboard focus after each click.
  const renderSortHeader = (k, children, className = '') => {
    const active = sortConfig.key === k;
    return (
      <th key={k} scope="col" aria-sort={active ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'} className={`px-5 py-3 text-left font-medium ${className}`}>
        <button
          type="button"
          onClick={() => handleSort(k)}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-colors duration-300 ease-fluid hover:text-foreground"
        >
          {children}
          {active ? (
            sortConfig.direction === 'asc' ? <CaretUp weight="bold" className="size-3 text-primary" /> : <CaretDown weight="bold" className="size-3 text-primary" />
          ) : (
            <span className="size-3" />
          )}
        </button>
      </th>
    );
  };

  const renderRowActions = (server) => {
    const id = idOf(server);
    return (
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="sm" onClick={() => handleCheckServer(id)} disabled={checking[id]} aria-label={`Check ${server.name} now`}>
          <ArrowsClockwise weight="light" className={checking[id] ? 'animate-spin' : ''} />
          {checking[id] ? 'Checking' : 'Check now'}
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/servers/${id}/settings`} aria-label={`Settings for ${server.name}`}>Settings</Link>
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(server)} aria-label={`Delete ${server.name}`} className="hover:bg-destructive/12 hover:text-destructive">
          <Trash weight="light" />
        </Button>
      </div>
    );
  };

  return (
    <PageContainer className="space-y-10">
      <PageHeader
        eyebrow={admin ? 'All accounts' : 'Overview'}
        title="Dashboard"
        description={
          loading
            ? 'Loading your monitors.'
            : counts.total === 0
              ? 'Add a server to start monitoring it.'
              : counts.down > 0
                ? `${counts.down} of ${counts.total} monitors ${counts.down === 1 ? 'is' : 'are'} down right now.`
                : `All ${counts.total} monitors are responding.`
        }
        actions={
          <>
            <Button variant="outline" onClick={fetchServers} disabled={refreshing} aria-label="Refresh">
              <ArrowsClockwise weight="light" className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button asChild>
              <Link href="/servers/new">
                <Plus weight="light" />
                Add server
              </Link>
            </Button>
          </>
        }
      />

      {error && (
        <Alert
          tone="error"
          title="Something went wrong"
          action={<Button size="sm" variant="outline" onClick={fetchServers}>Try again</Button>}
        >
          {error}
        </Alert>
      )}

      {!loading && <TrialNotice servers={servers} />}

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
                  <Link href={`/servers/${idOf(s)}/settings`} className="font-medium text-foreground underline-offset-4 hover:underline">
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

      {/* Monitors */}
      <section aria-labelledby="monitors-heading" className="space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 id="monitors-heading" className="font-display text-2xl font-medium tracking-tight">
            {admin ? 'All servers' : 'Your servers'}
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative sm:w-64">
              <MagnifyingGlass weight="light" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
              <Input type="search" aria-label="Search servers" placeholder="Search servers" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="rounded-full pl-10" />
            </div>
            <div role="group" aria-label="Filter by status" className="inline-flex rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.08]">
              {FILTERS.map((f) => {
                const n = f.key === 'all' ? counts.total : f.key === 'up' ? counts.up : counts.down;
                const on = statusFilter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setStatusFilter(f.key)}
                    className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-[background-color,color] duration-500 ease-fluid ${on ? 'bg-white/[0.1] text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {f.label} <span className="ml-0.5 tabular-nums text-muted-foreground">{n}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bezel-sm">
          <div className="bezel-sm-core overflow-hidden">
            {loading ? (
              <div className="space-y-px p-3" role="status" aria-label="Loading servers">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-2xl" />
                ))}
              </div>
            ) : visible.length === 0 ? (
              <EmptyState
                icon={HardDrives}
                title={counts.total === 0 ? 'No servers yet' : 'Nothing matches'}
                description={
                  counts.total === 0
                    ? 'Add a website or server address and Ping Pilott will start checking it.'
                    : 'Try a different search term or clear the status filter.'
                }
                action={
                  counts.total === 0 ? (
                    <Button asChild>
                      <Link href="/servers/new">
                        <Plus weight="light" />
                        Add your first server
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
                      Clear filters
                    </Button>
                  )
                }
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full text-sm">
                    <thead className="border-b border-white/[0.06]">
                      <tr>
                        {renderSortHeader('name', 'Server')}
                        {renderSortHeader('status', 'Status')}
                        {renderSortHeader('responseTime', 'Response')}
                        {renderSortHeader('lastChecked', 'Last check')}
                        {admin && renderSortHeader('owner', 'Owner')}
                        <th scope="col" className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {visible.map((server) => (
                        <tr key={idOf(server)} className="transition-colors duration-300 ease-fluid hover:bg-white/[0.025]">
                          <td className="px-5 py-4">
                            <Link href={`/servers/${idOf(server)}/settings`} className="font-medium text-foreground underline-offset-4 hover:underline">
                              {server.name}
                            </Link>
                            <a
                              href={toHref(server.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-0.5 flex w-fit items-center gap-1 font-mono text-xs text-muted-foreground transition-colors duration-300 ease-fluid hover:text-primary"
                            >
                              {displayUrl(server.url)}
                              <ArrowSquareOut weight="light" className="size-3.5" />
                              <span className="sr-only">(opens in a new tab)</span>
                            </a>
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={server.status} />
                          </td>
                          <td className="px-5 py-4 font-mono text-[13px] tabular-nums">
                            {server.responseTime ? `${server.responseTime} ms` : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-5 py-4 text-[13px] text-muted-foreground">{timeAgo(server.lastChecked)}</td>
                          {admin && <td className="px-5 py-4 text-[13px] text-muted-foreground">{ownerName(server)}</td>}
                          <td className="px-3 py-3">
                            {renderRowActions(server)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <ul className="divide-y divide-white/[0.05] lg:hidden">
                  {visible.map((server) => (
                    <li key={idOf(server)} className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link href={`/servers/${idOf(server)}/settings`} className="block truncate font-medium">
                            {server.name}
                          </Link>
                          <p className="truncate font-mono text-xs text-muted-foreground">{displayUrl(server.url)}</p>
                        </div>
                        <StatusBadge status={server.status} />
                      </div>
                      <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                        {server.responseTime ? <span className="font-mono tabular-nums text-foreground">{server.responseTime} ms</span> : <span>No response</span>}
                        <span>{server.lastChecked ? `Checked ${timeAgo(server.lastChecked)}` : 'Not checked yet'}</span>
                      </div>
                      {admin && <p className="text-[13px] text-muted-foreground">Owner: {ownerName(server)}</p>}
                      {renderRowActions(server)}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </section>

      <Dialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name ?? 'server'}?`}
        description={'Monitoring stops immediately and its check history is removed. This can’t be undone.'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Keep server
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Deleting' : 'Delete server'}
            </Button>
          </>
        }
      />
    </PageContainer>
  );
}
