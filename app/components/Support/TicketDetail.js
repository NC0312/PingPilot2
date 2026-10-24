// app/components/Support/TicketDetail.js
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowsClockwise, Plus, WarningOctagon } from '@phosphor-icons/react';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { TicketThread, ReplyComposer, ClosedNotice } from './TicketThread';
import { TicketStatusBadge, CategoryLabel, STATUS_META, STATUS_OPTIONS, formatTicketDate } from './ticketMeta';

const TicketDetail = () => {
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [newResponse, setNewResponse] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const params = useParams();
    const ticketId = params.id;
    const { apiRequest, isAdmin } = useAuth();

    const fetchTicket = async () => {
        try {
            setRefreshing(true);
            setError(null);

            const response = await apiRequest(`/api/support/tickets/${ticketId}`, { method: 'GET' });

            if (response.status === 'success') {
                setTicket(response.data.ticket);
            } else {
                throw new Error(response.message || 'Failed to load ticket');
            }
        } catch (err) {
            console.error('Error fetching ticket:', err);
            // A missing or off-limits ticket is an answer, not a connection problem: show the "not found" screen.
            if (/not found|not authorized|permission|forbidden|invalid/i.test(err?.message || '')) {
                setTicket(null);
                setError(null);
            } else {
                setError('We couldn’t load this ticket. Check your connection and try again.');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (ticketId) fetchTicket();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticketId]);

    const handleSubmitResponse = async (e) => {
        e.preventDefault();
        if (!newResponse.trim()) return;

        try {
            setSubmitting(true);
            setActionError(null);

            const response = await apiRequest(`/api/support/tickets/${ticketId}/responses`, {
                method: 'POST',
                body: JSON.stringify({ message: newResponse }),
            });

            if (response.status === 'success') {
                setTicket(response.data.ticket);
                setNewResponse('');
            } else {
                throw new Error(response.message || 'Failed to submit response');
            }
        } catch (err) {
            console.error('Error submitting response:', err);
            setActionError('Your reply wasn’t sent. Your text is still in the box, so try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Admins can change status from the customer view too.
    const handleStatusUpdate = async (newStatus) => {
        try {
            setActionError(null);
            const response = await apiRequest(`/api/support/tickets/${ticketId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.status === 'success') {
                setTicket(response.data.ticket);
            } else {
                throw new Error(response.message || 'Failed to update status');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            setActionError('We couldn’t update the status. Try again.');
        }
    };

    if (loading) {
        return (
            <div className="space-y-8" role="status" aria-label="Loading ticket">
                <Skeleton className="h-12 w-72" />
                <Skeleton className="h-40 rounded-3xl" />
                <Skeleton className="h-64 rounded-3xl" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-8">
                <Button asChild variant="ghost"><Link href="/support/tickets"><ArrowLeft weight="light" />Back to tickets</Link></Button>
                <Alert tone="error" title="Something went wrong" action={<Button size="sm" variant="outline" onClick={fetchTicket}>Try again</Button>}>
                    {error}
                </Alert>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="bezel-sm">
                <div className="bezel-sm-core">
                    <EmptyState
                        icon={WarningOctagon}
                        title="Ticket not found"
                        description="It may have been removed, or you may not have permission to view it."
                        action={<Button asChild><Link href="/support/tickets">Back to tickets</Link></Button>}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <PageHeader
                eyebrow="Support ticket"
                title={ticket.subject}
                actions={
                    <>
                        <Button asChild variant="ghost">
                            <Link href="/support/tickets"><ArrowLeft weight="light" />All tickets</Link>
                        </Button>
                        <Button variant="outline" size="icon" onClick={fetchTicket} disabled={refreshing} aria-label="Refresh ticket">
                            <ArrowsClockwise weight="light" className={refreshing ? 'animate-spin' : ''} />
                        </Button>
                    </>
                }
            />

            {actionError && <Alert tone="error" title="Something went wrong">{actionError}</Alert>}

            <section aria-label="Ticket summary" className="bezel-sm">
                <div className="bezel-sm-core space-y-5 p-6">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                        <TicketStatusBadge status={ticket.status} />
                        <CategoryLabel category={ticket.category} />
                        <span className="text-[13px] text-muted-foreground">Opened {formatTicketDate(ticket.createdAt)}</span>

                        {isAdmin() && (
                            <div className="ml-auto w-full sm:w-48">
                                <Select value={ticket.status} onValueChange={handleStatusUpdate}>
                                    <SelectTrigger size="sm" aria-label="Ticket status" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map((s) => (
                                            <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <p className="max-w-[70ch] whitespace-pre-wrap text-[15px] leading-relaxed text-muted-foreground">{ticket.description}</p>
                </div>
            </section>

            <section aria-labelledby="thread-heading" className="space-y-6">
                <h2 id="thread-heading" className="font-display text-2xl font-medium tracking-tight">Conversation</h2>
                <TicketThread responses={ticket.responses} viewer="user" />
            </section>

            {ticket.status !== 'closed' ? (
                <ReplyComposer
                    value={newResponse}
                    onChange={setNewResponse}
                    onSubmit={handleSubmitResponse}
                    submitting={submitting}
                    label="Add a reply"
                    placeholder="Add a reply"
                />
            ) : (
                <ClosedNotice>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/support/new"><Plus weight="light" />Open a new ticket</Link>
                    </Button>
                </ClosedNotice>
            )}
        </div>
    );
};

export default TicketDetail;
