// Shared labels, badges and icons for support tickets (user and admin views).
import React from 'react';
import { Wrench, CreditCard, Lightbulb, ChatCircleDots } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';

export const STATUS_META = {
    open: { label: 'Open', variant: 'default' },
    in_progress: { label: 'In progress', variant: 'warning' },
    resolved: { label: 'Resolved', variant: 'success' },
    closed: { label: 'Closed', variant: 'secondary' },
};

export const PRIORITY_META = {
    urgent: { label: 'Urgent', variant: 'destructive' },
    high: { label: 'High', variant: 'destructive' },
    medium: { label: 'Medium', variant: 'warning' },
    low: { label: 'Low', variant: 'secondary' },
};

// Plan ids are "<tier>_<billing>" (e.g. starter_monthly), plus free and admin.
const TIER_LABEL = { starter: 'Starter', pro: 'Pro', business: 'Business' };

export function planBadgeMeta(plan) {
    if (plan === 'free') return { label: 'Free', variant: 'secondary' };
    if (plan === 'admin') return { label: 'Admin', variant: 'outline' };
    const [tier, billing] = String(plan || '').split('_');
    if (TIER_LABEL[tier]) {
        return { label: billing ? `${TIER_LABEL[tier]} ${billing}` : TIER_LABEL[tier], variant: 'default' };
    }
    return { label: plan || 'Unknown', variant: 'outline' };
}

export const CATEGORY_META = {
    technical: { label: 'Technical', icon: Wrench },
    billing: { label: 'Billing', icon: CreditCard },
    feature_request: { label: 'Feature request', icon: Lightbulb },
    general: { label: 'General', icon: ChatCircleDots },
};

export const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed'];

export function TicketStatusBadge({ status }) {
    const m = STATUS_META[status];
    return m ? <Badge variant={m.variant}>{m.label}</Badge> : null;
}

export function PriorityBadge({ priority }) {
    const m = PRIORITY_META[priority];
    return m ? <Badge variant={m.variant}>{m.label}</Badge> : null;
}

export function PlanBadge({ plan }) {
    const m = planBadgeMeta(plan);
    return <Badge variant={m.variant}>{m.label}</Badge>;
}

export function CategoryLabel({ category, className = '' }) {
    const m = CATEGORY_META[category] || CATEGORY_META.general;
    const Icon = m.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 text-[13px] text-muted-foreground ${className}`}>
            <Icon weight="light" className="size-4" aria-hidden="true" />
            {m.label}
        </span>
    );
}

export function formatTicketDate(value) {
    if (!value) return '—';
    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}
