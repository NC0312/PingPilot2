'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check } from '@phosphor-icons/react';
import { TIERS, BILLING, planId, getPlan, featureList, planLabel, serverLimitLabel } from './planCatalog';
import { Dialog } from '@/components/ui/dialog';
import { Button, ButtonArrow } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Props are unchanged: isOpen, onClose, currentPlan, serverCount, maxServers.
const SubscriptionPopup = ({ isOpen, onClose, currentPlan = 'free', serverCount = 0, maxServers = 1 }) => {
    const [tier, setTier] = useState('pro');
    const [billing, setBilling] = useState('monthly');

    const selectedPlan = planId(tier, billing);

    return (
        <Dialog
            open={!!isOpen}
            onClose={onClose}
            title={'You’ve reached your server limit'}
            description={`You’re using ${serverCount} of ${serverLimitLabel(maxServers)} server slots on the ${planLabel(currentPlan)} plan. Pick a plan with more room.`}
            className="max-w-3xl"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Not now</Button>
                    <Button asChild>
                        <Link href={`/subscription?plan=${selectedPlan}`}>
                            Continue with {planLabel(selectedPlan)}
                            <ButtonArrow />
                        </Link>
                    </Button>
                </>
            }
        >
            <div className="max-h-[56dvh] space-y-5 overflow-y-auto pr-1">
                <div
                    role="radiogroup"
                    aria-label="Billing period"
                    className="relative inline-grid grid-cols-2 rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.08]"
                >
                    <span
                        aria-hidden="true"
                        className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-primary transition-transform duration-500 ease-fluid"
                        style={{ transform: billing === 'yearly' ? 'translateX(100%)' : 'translateX(0)' }}
                    />
                    {BILLING.map((v) => (
                        <button
                            key={v}
                            type="button"
                            role="radio"
                            aria-checked={billing === v}
                            onClick={() => setBilling(v)}
                            className={cn('relative min-h-10 rounded-full px-5 py-2 text-sm font-medium capitalize transition-colors duration-500 ease-fluid', billing === v ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
                        >
                            {v}
                        </button>
                    ))}
                </div>

                <div role="radiogroup" aria-label="Plan" className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {TIERS.map((t) => {
                        const id = planId(t.key, billing);
                        const p = getPlan(id);
                        const selected = tier === t.key;
                        return (
                            <button
                                key={t.key}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() => setTier(t.key)}
                                className={cn(
                                    'flex flex-col rounded-2xl p-4 text-left ring-1 transition-[background-color,box-shadow] duration-500 ease-fluid',
                                    selected ? 'bg-primary/[0.08] ring-2 ring-primary/50' : 'bg-white/[0.03] ring-white/10 hover:bg-white/[0.06]'
                                )}
                            >
                                <span className="flex h-6 items-center justify-between">
                                    <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{t.name}</span>
                                    {t.recommended && <Badge>Most popular</Badge>}
                                </span>
                                <span className="mt-3 font-display text-3xl font-medium tracking-tight tabular-nums">{p.price}</span>
                                <span className="mt-0.5 text-[13px] text-muted-foreground">{p.period}</span>
                                <ul className="mt-4 space-y-2 border-t border-white/[0.07] pt-4">
                                    {featureList(id).slice(0, 4).map((text) => (
                                        <li key={text} className="flex items-start gap-2 text-[13px] text-foreground/90">
                                            <Check weight="light" className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </button>
                        );
                    })}
                </div>
            </div>
        </Dialog>
    );
};

export default SubscriptionPopup;
