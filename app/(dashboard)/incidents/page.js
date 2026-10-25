'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ArrowsClockwise, CheckCircle, Plus, WarningCircle } from '@phosphor-icons/react';
import { useAuth } from '@/app/context/AuthContext';
import { PageContainer } from '@/app/components/Layout/AppShell';
import { formatTimestamp } from '@/app/components/dateTimeUtils';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Reveal } from '@/components/ui/reveal';
import DiagnosisNote from '@/app/components/Servers/DiagnosisNote';
import CheckDetail from '@/app/components/Servers/CheckDetail';
import { displayUrl, formatSpan, timeAgo } from '@/lib/time';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;
const STATUSES = [
  { key: 'all', label: 'All' },
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'resolved', label: 'Resolved' },
];
const PERIODS = [7, 30];

const DEFAULT_FILTERS = { status: 'all', days: 7, server: '' };

// The filters live in the address (/incidents?status=ongoing&days=30&server=<id>), so a refresh or a shared
// link shows the same view, and "View all incidents" on a server can link straight to it.
const readFilters = () => {
  const p = new URLSearchParams(window.location.search);
  return {
    status: ['ongoing', 'resolved'].includes(p.get('status')) ? p.get('status') : 'all',
    days: p.get('days') === '30' ? 30 : 7,
    server: p.get('server') || '',
  };
};

const writeFilters = (f) => {
  const p = new URLSearchParams();
  if (f.status !== 'all') p.set('status', f.status);
  if (f.days !== 7) p.set('days', String(f.days));
  if (f.server) p.set('server', f.server);
  const qs = p.toString();
  window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
};

function Segmented({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.08]">
      {options.map((o) => {
        const on = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.key)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-[background-color,color] duration-500 ease-fluid',
              on ? 'bg-white/[0.1] text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {o.label}
            {o.count !== undefined && <span className="ml-1 tabular-nums text-muted-foreground">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

function Stat({ label, children }) {
  return (
    <div className="p-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <div className="mt-3 font-display text-4xl font-medium tracking-tight tabular-nums">{children}</div>
    </div>
  );
}

export default function IncidentsPage() {
  const { user, apiRequest } = useAuth();
  const [filters, setFilters] = useState(null); // null until the address has been read
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  // Only the newest request may update the page, so a slow answer to an old filter cannot overwrite a new one
  const requestId = useRef(0);

  useEffect(() => {
    setFilters(readFilters());
  }, []);

  const load = useCallback(
    async ({ page = 1, size = PAGE_SIZE, append = false, silent = false } = {}) => {
      if (!user || !filters) return;
      const id = ++requestId.current;
      if (!silent) (append ? setLoadingMore : setLoading)(true);

      const qs = new URLSearchParams({ status: filters.status, days: String(filters.days), page: String(page), limit: String(size) });
      if (filters.server) qs.set('serverId', filters.server);

      try {
        const res = await apiRequest(`/api/incidents?${qs}`, { method: 'GET' });
        if (id !== requestId.current) return;
        const next = res.data;
        setData((prev) => {
          if (!append || !prev) return next;
          const seen = new Set(prev.incidents.map((i) => i.id));
          return { ...next, incidents: [...prev.incidents, ...next.incidents.filter((i) => !seen.has(i.id))] };
        });
        setError(null);
      } catch (err) {
        if (id !== requestId.current) return;
        console.error('Error loading incidents:', err);
        setError('We couldn’t load incidents. Check your connection and try again.');
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [user, filters, apiRequest]
  );

  // A different view starts from the top
  useEffect(() => {
    if (filters) load();
  }, [filters, load]);

  const ongoingCount = data?.summary?.ongoing ?? 0;
  const loadedCount = data?.incidents?.length ?? 0;

  // While something is down, keep the page current. The refresh asks for everything loaded so far,
  // so it does not collapse a list the user has paged down.
  useEffect(() => {
    if (!filters || ongoingCount === 0) return undefined;
    const id = setInterval(() => load({ silent: true, size: Math.min(100, Math.max(PAGE_SIZE, loadedCount)) }), 60 * 1000);
    return () => clearInterval(id);
  }, [filters, ongoingCount, loadedCount, load]);

  // Keeps "down for 12 min" counting up between refreshes
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(id);
  }, []);

  const update = (patch) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    writeFilters(next);
  };

  const summary = data?.summary;
  const servers = data?.servers || [];
  const pagination = data?.pagination;
  const hasMore = pagination && pagination.page < pagination.totalPages;
  const filtered = filters && (filters.status !== 'all' || filters.server);
  const resolvedCount = summary ? summary.total - summary.ongoing : 0;

  const description = loading && !data
    ? 'Loading incidents.'
    : !summary || summary.total === 0
      ? `Nothing went down in the last ${filters?.days ?? 7} days.`
      : summary.ongoing > 0
        ? `${summary.ongoing} ongoing right now, ${summary.total} in the last ${filters.days} days.`
        : `${summary.total} in the last ${filters.days} days, all resolved.`;

  return (
    <PageContainer className="space-y-10">
      <PageHeader
        eyebrow="Monitoring"
        title="Incidents"
        description={description}
        actions={
          <Button variant="outline" onClick={() => load({ silent: true, size: Math.min(100, Math.max(PAGE_SIZE, loadedCount)) })} aria-label="Refresh">
            <ArrowsClockwise weight="light" />
            Refresh
          </Button>
        }
      />

      {error && (
        <Alert tone="error" title="Something went wrong" action={<Button size="sm" variant="outline" onClick={() => load()}>Try again</Button>}>
          {error}
        </Alert>
      )}

      {/* Summary */}
      {filters && (
        <Reveal>
          <div className="bezel-sm">
            <div className="bezel-sm-core grid divide-y divide-white/[0.06] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {loading && !data ? (
                [0, 1, 2].map((i) => (
                  <div key={i} className="p-6">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="mt-4 h-10 w-24" />
                  </div>
                ))
              ) : (
                <>
                  <Stat label={`Incidents, ${filters.days} days`}>{summary?.total ?? 0}</Stat>
                  <Stat label="Total downtime">
                    {summary && summary.downtimeMs > 0 ? formatSpan(summary.downtimeMs) : <span className="text-muted-foreground">None</span>}
                  </Stat>
                  <Stat label="Ongoing now">
                    <span className={summary?.ongoing > 0 ? 'text-destructive' : ''}>{summary?.ongoing ?? 0}</span>
                  </Stat>
                </>
              )}
            </div>
          </div>
        </Reveal>
      )}

      {/* Filters */}
      {filters && (
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
          <Segmented
            label="Filter by status"
            value={filters.status}
            onChange={(status) => update({ status })}
            options={STATUSES.map((s) => ({
              ...s,
              count: !summary ? undefined : s.key === 'all' ? summary.total : s.key === 'ongoing' ? summary.ongoing : resolvedCount,
            }))}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {servers.length > 1 && (
              <select
                aria-label="Filter by server"
                value={filters.server}
                onChange={(e) => update({ server: e.target.value })}
                className="h-11 min-w-0 rounded-full bg-white/[0.04] px-4 text-sm text-foreground ring-1 ring-white/[0.08] outline-none transition-[box-shadow] duration-300 ease-fluid hover:ring-white/20 focus-visible:ring-2 focus-visible:ring-ring [&>option]:bg-popover [&>option]:text-popover-foreground"
              >
                <option value="">All servers</option>
                {servers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
            <Segmented
              label="Time period"
              value={String(filters.days)}
              onChange={(days) => update({ days: Number(days) })}
              options={PERIODS.map((d) => ({ key: String(d), label: `${d} days` }))}
            />
          </div>
        </div>
      )}

      {/* List */}
      <section aria-label="Incident list">
        <div className="bezel-sm">
          <div className="bezel-sm-core overflow-hidden">
            {loading && !data ? (
              <div className="space-y-px p-3" role="status" aria-label="Loading incidents">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
              </div>
            ) : !data ? (
              <EmptyState icon={WarningCircle} title="We couldn’t load incidents" description="Check your connection, then try again." action={<Button onClick={() => load()}>Try again</Button>} />
            ) : data.incidents.length === 0 ? (
              servers.length === 0 ? (
                <EmptyState
                  icon={WarningCircle}
                  title="No servers to watch yet"
                  description="Add a website or API address. If it ever stops answering, the incident shows up here."
                  action={
                    <Button asChild>
                      <Link href="/servers/new">
                        <Plus weight="light" />
                        Add a server
                      </Link>
                    </Button>
                  }
                />
              ) : filtered && summary.total > 0 ? (
                <EmptyState
                  icon={WarningCircle}
                  title="No incidents match these filters"
                  description="Try another status or server, or clear the filters."
                  action={<Button variant="outline" onClick={() => update({ status: 'all', server: '' })}>Clear filters</Button>}
                />
              ) : (
                <EmptyState
                  icon={CheckCircle}
                  title={`Nothing went down in the last ${filters.days} days`}
                  description="When a server stops answering, it appears here with how long it was down and what the error was."
                />
              )
            ) : (
              <ul className="divide-y divide-white/[0.05]">
                {data.incidents.map((inc) => (
                  <li key={inc.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 px-5 py-5 transition-colors duration-300 ease-fluid hover:bg-white/[0.025]">
                    <span className={cn('mt-2 size-2 shrink-0 rounded-full', inc.ongoing ? 'bg-destructive' : 'bg-muted-foreground/60')} aria-hidden="true" />
                    <div className="min-w-0 flex-1 basis-56">
                      <p className="flex flex-wrap items-center gap-2 font-medium">
                        {inc.ongoing
                          ? `Down for ${formatSpan(now - new Date(inc.startedAt).getTime())}`
                          : `Was down for ${formatSpan(inc.durationMs)}`}
                        {inc.ongoing && <Badge variant="destructive">Ongoing</Badge>}
                      </p>
                      <p className="mt-1 text-sm">
                        <Link href={`/servers?s=${inc.serverId}`} className="text-foreground underline-offset-4 hover:underline">
                          {inc.serverName}
                        </Link>
                        {inc.serverUrl && <span className="ml-2 font-mono text-xs text-muted-foreground">{displayUrl(inc.serverUrl)}</span>}
                      </p>
                      <DiagnosisNote diagnosis={inc.diagnosis} className="mt-3" />
                      {inc.error && <p className={`break-words font-mono text-xs text-muted-foreground ${inc.diagnosis ? 'mt-3' : 'mt-1.5'}`}>{inc.error}</p>}
                      <CheckDetail source={inc} collapsible className="mt-4" />
                    </div>
                    <div className="basis-full pl-6 text-left text-[13px] sm:shrink-0 sm:basis-auto sm:pl-0 sm:text-right">
                      <p className="tabular-nums">{formatTimestamp(inc.startedAt, null, 'D MMM, HH:mm')}</p>
                      <p className="mt-0.5 text-muted-foreground">
                        {inc.ongoing ? `started ${timeAgo(inc.startedAt, now)}` : `ended ${timeAgo(inc.endedAt, now)}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {data && data.incidents.length > 0 && (
          <div className="mt-5 flex flex-col items-center gap-3">
            <p className="text-[13px] text-muted-foreground">
              Showing {data.incidents.length} of {pagination.total}
            </p>
            {hasMore && (
              <Button variant="outline" onClick={() => load({ page: pagination.page + 1, size: pagination.limit, append: true })} disabled={loadingMore}>
                {loadingMore ? 'Loading' : 'Load more'}
              </Button>
            )}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
