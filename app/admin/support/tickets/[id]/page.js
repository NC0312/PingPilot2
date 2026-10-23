// app/admin/support/tickets/[id]/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowsClockwise, WarningOctagon } from '@phosphor-icons/react';
import { useAuth } from '@/app/context/AuthContext';
import { PageContainer } from '@/app/components/Layout/AppShell';
import { TicketThread, ReplyComposer, ClosedNotice } from '@/app/components/Support/TicketThread';
import {
    PriorityBadge,
    PlanBadge,
    CategoryLabel,
    STATUS_META,
    STATUS_OPTIONS,
    formatTicketDate,
} from '@/app/components/Support/ticketMeta';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function Fact({ label, children }) {
    return (
        <div className="space-y-1">
            <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</dt>
            <dd className="break-words text-sm text-foreground">{children}</dd>
        </div>
    );
}

export default function AdminTicketDetail() {
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [newResponse, setNewResponse] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [userData, setUserData] = useState(null);

    const params = useParams();
    const ticketId = params.id;
    const { apiRequest } = useAuth();

    // Customer details are extra context; failing to load them never blocks the ticket.
    const fetchUserData = async (userId) => {
        try {
            const response = await apiRequest(`/api/users/${userId}`, { method: 'GET' });
            if (response.status === 'success') setUserData(response.data.user);
        } catch (err) {
            console.error('Error fetching user data:', err);
        }
    };

    const fetchTicket = async () => {
        try {
            setRefreshing(true);
            setError(null);

            const response = await apiRequest(`/api/support/tickets/${ticketId}`, { method: 'GET' });

            if (response.status === 'success') {
                setTicket(response.data.ticket);
                fetchUserData(response.data.ticket.userId);
            } else {
                throw new Error(response.message || 'Failed to load ticket');
            }
        } catch (err) {
            console.error('Error fetching ticket:', err);
            setError('We couldn’t load this ticket. Check your connection and try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (ticketId) fetchTicket();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticketId]);

    const handleStatusUpdate = async (newStatus) => {
        try {
            setActionError(null);
            const response = await apiRequest(`/api/support/admin/tickets/${ticketId}/status`, {
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

                // A first reply moves an open ticket to in progress.
                if (ticket.status === 'open') {
                    await handleStatusUpdate('in_progress');
                }
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

    if (loading) {
        return (
            <PageContainer>
                <div className="space-y-8" role="status" aria-label="Loading ticket">
                    <Skeleton className="h-12 w-80" />
                    <div className="grid gap-5 lg:grid-cols-12">
                        <Skeleton className="h-80 rounded-3xl lg:col-span-8" />
                        <Skeleton className="h-80 rounded-3xl lg:col-span-4" />
                    </div>
                </div>
            </PageContainer>
        );
    }

    if (error) {
        return (
            <PageContainer className="space-y-8">
                <Button asChild variant="ghost"><Link href="/admin/support"><ArrowLeft weight="light" />Back to tickets</Link></Button>
                <Alert tone="error" title="Something went wrong" action={<Button size="sm" variant="outline" onClick={fetchTicket}>Try again</Button>}>
                    {error}
                </Alert>
            </PageContainer>
        );
    }

    if (!ticket) {
        return (
            <PageContainer>
                <div className="bezel-sm">
                    <div className="bezel-sm-core">
                        <EmptyState
                            icon={WarningOctagon}
                            title="Ticket not found"
                            description="It may have been deleted."
                            action={<Button asChild><Link href="/admin/support">Back to tickets</Link></Button>}
                        />
                    </div>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer className="space-y-8">
            <PageHeader
                eyebrow="Admin · Ticket"
                title={ticket.subject}
                actions={
                    <>
                        <Button asChild variant="ghost">
                            <Link href="/admin/support"><ArrowLeft weight="light" />All tickets</Link>
                        </Button>
                        <Button variant="outline" size="icon" onClick={fetchTicket} disabled={refreshing} aria-label="Refresh ticket">
                            <ArrowsClockwise weight="light" className={refreshing ? 'animate-spin' : ''} />
                        </Button>
                    </>
                }
            />

            {actionError && <Alert tone="error" title="Something went wrong">{actionError}</Alert>}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                {/* Thread */}
                <div className="space-y-6 lg:col-span-8">
                    <section aria-label="Original request" className="bezel-sm">
                        <div className="bezel-sm-core space-y-3 p-6">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Original request · {formatTicketDate(ticket.createdAt)}</p>
                            <p className="max-w-[70ch] whitespace-pre-wrap text-[15px] leading-relaxed">{ticket.description}</p>
                        </div>
                    </section>

                    <section aria-labelledby="thread-heading" className="space-y-6">
                        <h2 id="thread-heading" className="font-display text-2xl font-medium tracking-tight">Conversation</h2>
                        <TicketThread responses={ticket.responses} viewer="admin" />
                    </section>

                    {ticket.status !== 'closed' ? (
                        <ReplyComposer
                            value={newResponse}
                            onChange={setNewResponse}
                            onSubmit={handleSubmitResponse}
                            submitting={submitting}
                            label="Reply to customer"
                            placeholder="Reply to the customer"
                        />
                    ) : (
                        <ClosedNotice>
                            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate('open')}>Reopen ticket</Button>
                        </ClosedNotice>
                    )}
                </div>

                {/* Side panel */}
                <aside aria-label="Ticket details" className="space-y-5 lg:col-span-4">
                    <div className="bezel-sm">
                        <div className="bezel-sm-core space-y-5 p-6">
                            <div className="space-y-2">
                                <label htmlFor="ticket-status" className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Status</label>
                                <Select value={ticket.status} onValueChange={handleStatusUpdate}>
                                    <SelectTrigger id="ticket-status" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map((s) => (
                                            <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
                                <Fact label="Priority"><PriorityBadge priority={ticket.priority} /></Fact>
                                <Fact label="Plan"><PlanBadge plan={ticket.userPlan} /></Fact>
                                <Fact label="Category"><CategoryLabel category={ticket.category} className="!text-sm !text-foreground" /></Fact>
                            </dl>
                        </div>
                    </div>

                    {userData && (
                        <div className="bezel-sm">
                            <div className="bezel-sm-core space-y-5 p-6">
                                <h2 className="font-display text-lg font-medium tracking-tight">Customer</h2>
                                <dl className="space-y-4">
                                    <Fact label="Name">{userData.displayName || 'Not provided'}</Fact>
                                    <Fact label="Email"><span className="font-mono text-[13px]">{userData.email}</span></Fact>
                                    <Fact label="Subscription"><span className="capitalize">{(userData.subscription?.plan || 'free').replace('_', ' ')}</span></Fact>
                                    <Fact label="Role"><span className="capitalize">{userData.role || 'user'}</span></Fact>
                                </dl>
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </PageContainer>
    );
}
