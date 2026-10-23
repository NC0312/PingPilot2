// Conversation thread + reply composer shared by the customer and admin ticket views.
'use client';

import React from 'react';
import { PaperPlaneTilt, CircleNotch, ChatCircleDots, LockSimple } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatTicketDate } from './ticketMeta';

/**
 * viewer = "user": the customer's own messages sit on the right.
 * viewer = "admin": support messages sit on the right, so "mine" is always the right-hand side.
 */
export function TicketThread({ responses = [], viewer = 'user' }) {
    if (!responses.length) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-black/20 px-6 py-10 text-center ring-1 ring-white/[0.05]">
                <ChatCircleDots weight="light" className="size-8 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">No replies yet. The first reply will appear here.</p>
            </div>
        );
    }

    return (
        <ol className="space-y-5" aria-label="Conversation">
            {responses.map((r, i) => {
                const mine = viewer === 'admin' ? !!r.fromAdmin : !r.fromAdmin;
                const label = r.fromAdmin ? 'Support team' : viewer === 'user' ? 'You' : 'Customer';
                return (
                    <li key={r._id || i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[88%] sm:max-w-[75%] ${mine ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                            <p className={`flex items-center gap-2 text-xs text-muted-foreground ${mine ? 'flex-row-reverse' : ''}`}>
                                <span className={`font-medium ${r.fromAdmin ? 'text-primary' : 'text-foreground/80'}`}>{label}</span>
                                <span aria-hidden="true">·</span>
                                <time dateTime={r.createdAt}>{formatTicketDate(r.createdAt)}</time>
                            </p>
                            <div
                                className={`whitespace-pre-wrap rounded-3xl px-5 py-3.5 text-sm leading-relaxed ${mine
                                    ? 'rounded-br-lg bg-primary/[0.12] text-foreground ring-1 ring-primary/25'
                                    : 'rounded-bl-lg bg-white/[0.05] text-foreground ring-1 ring-white/[0.08]'
                                    }`}
                            >
                                {r.message}
                            </div>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

/** Sticks to the bottom of the viewport so the thread can scroll above it. */
export function ReplyComposer({ value, onChange, onSubmit, submitting, label = 'Reply', placeholder = 'Write a reply' }) {
    // Cmd/Ctrl + Enter sends.
    const onKeyDown = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && value.trim() && !submitting) {
            e.preventDefault();
            onSubmit(e);
        }
    };

    return (
        <form onSubmit={onSubmit} className="sticky bottom-3">
            <div className="glass rounded-[1.75rem] p-2">
                <label htmlFor="ticket-reply" className="sr-only">{label}</label>
                <Textarea
                    id="ticket-reply"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    rows={3}
                    placeholder={placeholder}
                    disabled={submitting}
                    className="min-h-24 rounded-[1.25rem] border-0 bg-transparent shadow-none ring-0 focus-visible:bg-transparent focus-visible:ring-0"
                />
                <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-1">
                    <p className="hidden text-xs text-muted-foreground sm:block">Ctrl or ⌘ + Enter to send</p>
                    <Button type="submit" disabled={submitting || !value.trim()} className="ml-auto">
                        {submitting ? (
                            <>
                                <CircleNotch weight="light" className="animate-spin" />
                                Sending
                            </>
                        ) : (
                            <>
                                <PaperPlaneTilt weight="light" />
                                Send reply
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </form>
    );
}

export function ClosedNotice({ children }) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/[0.03] px-6 py-8 text-center ring-1 ring-white/[0.07]">
            <LockSimple weight="light" className="size-7 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">This ticket is closed and no longer accepts replies.</p>
            {children}
        </div>
    );
}
