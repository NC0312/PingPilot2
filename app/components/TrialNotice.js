'use client';

import Link from 'next/link';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const HOUR = 60 * 60 * 1000;

const isFreeTrial = (s) => s.uploadedPlan === 'free' && s.monitoring?.trialEndsAt;

/**
 * Free-trial status for the servers on the page. A trial is per server: once it ends the server stops
 * being checked, so the user needs to hear about it here, not discover a flat chart later.
 */
export default function TrialNotice({ servers = [], now = Date.now() }) {
    const trials = servers.filter(isFreeTrial);
    const ended = trials.filter((s) => s.trialExpired || new Date(s.monitoring.trialEndsAt).getTime() < now);
    const ending = trials
        .filter((s) => !ended.includes(s))
        .map((s) => ({ s, left: new Date(s.monitoring.trialEndsAt).getTime() - now }))
        .filter(({ left }) => left <= 24 * HOUR)
        .sort((a, b) => a.left - b.left);

    const upgrade = (
        <Button asChild size="sm" variant="outline">
            <Link href="/subscription">See plans</Link>
        </Button>
    );

    if (ended.length > 0) {
        const names = ended.map((s) => s.name).join(', ');
        return (
            <Alert
                tone="error"
                title={`${ended.length === 1 ? 'A free trial has' : `${ended.length} free trials have`} ended`}
                action={upgrade}
            >
                Monitoring has stopped for {names}. Upgrade to start checking {ended.length === 1 ? 'it' : 'them'} again.
            </Alert>
        );
    }

    if (ending.length > 0) {
        const { s, left } = ending[0];
        const hours = Math.max(1, Math.ceil(left / HOUR));
        return (
            <Alert tone="warning" title="A free trial is about to end" action={upgrade}>
                {s.name} stops being monitored in about {hours} {hours === 1 ? 'hour' : 'hours'}.
                {ending.length > 1 ? ` ${ending.length - 1} more ${ending.length === 2 ? 'trial ends' : 'trials end'} soon too.` : ''}
            </Alert>
        );
    }

    return null;
}
