// app/components/Support/TicketList.js
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowsClockwise, ChatCircleDots, Plus, CaretRight } from '@phosphor-icons/react';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Reveal } from '@/components/ui/reveal';
import { timeAgo } from '@/lib/time';
import { TicketStatusBadge, CategoryLabel } from './ticketMeta';

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In progress' },
    { key: 'resolved', label: 'Resolved' },
];

const TicketList = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [refreshing, setRefreshing] = useState(false);

    const { apiRequest } = useAuth();

    const fetchTickets = async () => {
        try {
            setRefreshing(true);
            setError(null);

            const response = await apiRequest('/api/support/tickets', { method: 'GET' });

            if (response.status === 'success') {
                setTickets(response.data.tickets);
            } else {
                throw new Error(response.message || 'Failed to load tickets');
            }
        } catch (err) {
            console.error('Error fetching tickets:', err);
            setError('We couldn’t load your tickets. Check your connection and try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTickets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Filtering happens here: the list endpoint returns every ticket for the user.
    const visible = useMemo(
        () => (statusFilter === 'all' ? tickets : tickets.filter((t) => t.status === statusFilter)),
        [tickets, statusFilter]
    );
    const count = (key) => (key === 'all' ? tickets.length : tickets.filter((t) => t.status === key).length);

    return (
        <div className="space-y-10">
            <PageHeader
                eyebrow="Support"
                title="Your tickets"
                description="Ask a question or report a problem. We reply on the ticket and you can follow the conversation here."
                actions={
                    <>
                        <Button variant="outline" onClick={fetchTickets} disabled={refreshing}>
                            <ArrowsClockwise weight="light" className={refreshing ? 'animate-spin' : ''} />
                            Refresh
                        </Button>
                        <Button asChild>
                            <Link href="/support/new">
                                <Plus weight="light" />
                                New ticket
                            </Link>
                        </Button>
                    </>
                }
            />

            <div role="group" aria-label="Filter by status" className="inline-flex max-w-full overflow-x-auto rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.08]">
                {FILTERS.map((f) => {
                    const on = statusFilter === f.key;
                    return (
                        <button
                            key={f.key}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setStatusFilter(f.key)}
                            className={`whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium transition-[background-color,color] duration-500 ease-fluid ${on ? 'bg-white/[0.1] text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {f.label} <span className="ml-0.5 tabular-nums text-muted-foreground">{loading ? '' : count(f.key)}</span>
                        </button>
                    );
                })}
            </div>

            {error && (
                <Alert tone="error" title="Something went wrong" action={<Button size="sm" variant="outline" onClick={fetchTickets}>Try again</Button>}>
                    {error}
                </Alert>
            )}

            <div className="bezel-sm">
                <div className="bezel-sm-core overflow-hidden">
                    {loading ? (
                        <div className="space-y-px p-3" role="status" aria-label="Loading tickets">
                            {[0, 1, 2].map((i) => (
                                <Skeleton key={i} className="h-24 rounded-2xl" />
                            ))}
                        </div>
                    ) : visible.length === 0 ? (
                        <EmptyState
                            icon={ChatCircleDots}
                            title={tickets.length === 0 ? 'No tickets yet' : 'No tickets in this view'}
                            description={
                                tickets.length === 0
                                    ? 'When you need a hand, open a ticket and we will reply here.'
                                    : `You have no ${statusFilter.replace('_', ' ')} tickets right now.`
                            }
                            action={
                                tickets.length === 0 ? (
                                    <Button asChild>
                                        <Link href="/support/new">
                                            <Plus weight="light" />
                                            Open a ticket
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button variant="outline" onClick={() => setStatusFilter('all')}>Show all tickets</Button>
                                )
                            }
                        />
                    ) : (
                        <ul className="divide-y divide-white/[0.05]">
                            {visible.map((ticket, i) => (
                                <Reveal as="li" key={ticket._id} delay={Math.min(i, 6) * 40}>
                                    <Link
                                        href={`/support/tickets/${ticket._id}`}
                                        className="group flex items-start gap-4 px-5 py-5 transition-colors duration-300 ease-fluid hover:bg-white/[0.025] sm:items-center"
                                    >
                                        <div className="min-w-0 flex-1 space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                                <h3 className="font-medium text-foreground">{ticket.subject}</h3>
                                                <TicketStatusBadge status={ticket.status} />
                                            </div>
                                            <p className="line-clamp-1 text-sm text-muted-foreground">{ticket.description}</p>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                <CategoryLabel category={ticket.category} className="!text-xs" />
                                                <span className="tabular-nums">
                                                    {ticket.responses?.length || 0} {ticket.responses?.length === 1 ? 'reply' : 'replies'}
                                                </span>
                                                <span>Updated {timeAgo(ticket.updatedAt)}</span>
                                            </div>
                                        </div>
                                        <CaretRight weight="light" className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform duration-500 ease-fluid group-hover:translate-x-1 group-hover:text-foreground sm:mt-0" aria-hidden="true" />
                                    </Link>
                                </Reveal>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TicketList;
