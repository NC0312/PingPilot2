'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, CircleNotch, CheckCircle } from '@phosphor-icons/react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { copyText } from '@/lib/clipboard';
import { DEFAULT_LIMITS, LIMITS, checkLimits } from '@/lib/hostMetrics';
import { cn } from '@/lib/utils';

const RELEASES = 'https://github.com/Jatin-1111/pingpilot-agent/releases/latest';

/** A command in a box that scrolls sideways on a phone, with a copy button that stays put and says when it has copied */
function CommandBox({ text, label }) {
    const [state, setState] = useState('idle');
    const timer = useRef(null);
    useEffect(() => () => clearTimeout(timer.current), []);

    const copy = async () => {
        const ok = await copyText(text);
        setState(ok ? 'copied' : 'failed');
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setState('idle'), 2500);
    };

    return (
        <div className="rounded-xl bg-black/30 ring-1 ring-white/[0.08]">
            <pre tabIndex={0} aria-label={label} className="overflow-x-auto whitespace-pre px-4 py-3.5 font-mono text-[12.5px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring">{text}</pre>
            <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-2 py-1.5">
                <span aria-live="polite" className={cn('pl-2 text-[13px]', state === 'failed' ? 'text-destructive' : 'text-success')}>
                    {state === 'copied' ? 'Copied' : state === 'failed' ? 'Could not copy: select it and copy by hand' : ''}
                </span>
                <Button type="button" variant="outline" size="sm" onClick={copy} className="min-h-12 sm:min-h-8">
                    {state === 'copied' ? <Check weight="bold" className="text-success" /> : <Copy weight="light" />}
                    Copy
                </Button>
            </div>
        </div>
    );
}

/**
 * Shown right after the token is made, and the only time it is visible. Says how to install, waits for the first reading
 * (the page keeps asking the API, and this follows `status`), and says how to get a new command if this one is lost.
 */
export function InstallDialog({ open, onClose, token, options, status, replacing }) {
    const tabs = [...options, { id: 'manual', label: 'Another way', intro: 'Download the agent for your system, put this token in its token file (or in PINGPILOT_TOKEN), and run pingpilot-agent check to see it work.', command: token, manual: true }];
    const [tab, setTab] = useState(tabs[0].id);
    useEffect(() => { if (open) setTab(options[0]?.id ?? 'manual'); }, [open, options]);
    const current = tabs.find((t) => t.id === tab) ?? tabs[0];
    const connected = status === 'connected';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={replacing ? 'New token' : 'Install the agent'}
            description="It reports this server's CPU, memory, disk, network and process names once a minute. It never sends command lines or files, and never takes commands."
            className="max-w-xl"
            footer={<Button type="button" onClick={onClose} variant={connected ? 'default' : 'outline'} className="min-h-12 sm:min-h-10">{connected ? 'Done' : 'Close'}</Button>}>
            <div className="space-y-5">
                {replacing && (
                    <Alert tone="warning" title="The old token no longer works">
                        An agent still using it will stop reporting. Put the new token on every machine that used the old one.
                    </Alert>
                )}

                <div>
                    <div role="tablist" aria-label="How to install" className="flex flex-wrap gap-1.5">
                        {tabs.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                role="tab"
                                id={`install-tab-${t.id}`}
                                aria-selected={t.id === tab}
                                aria-controls="install-panel"
                                onClick={() => setTab(t.id)}
                                className={cn(
                                    'min-h-12 rounded-full px-4 text-sm transition-colors duration-300 ease-fluid outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-9',
                                    t.id === tab ? 'bg-white/[0.1] text-foreground ring-1 ring-white/15' : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground'
                                )}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <div role="tabpanel" id="install-panel" aria-labelledby={`install-tab-${current.id}`} className="mt-3 space-y-3">
                        <p className="text-sm text-muted-foreground">{current.intro}</p>
                        <CommandBox text={current.command} label={current.manual ? 'The token' : `Install command for ${current.label}`} />
                        {current.manual && (
                            <p className="text-sm text-muted-foreground">
                                Agent downloads, with checksums: <a href={RELEASES} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline">GitHub releases</a>
                            </p>
                        )}
                    </div>
                </div>

                <p className="text-[13px] text-muted-foreground">
                    The token is shown once. If you lose it, choose <span className="text-foreground/90">Manage → Replace token</span> for a new one.
                </p>

                <div aria-live="polite" className={cn('flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ring-1', connected ? 'bg-success/8 ring-success/25' : 'bg-white/[0.03] ring-white/[0.07]')}>
                    {connected ? (
                        <>
                            <CheckCircle weight="light" className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
                            <span><span className="font-medium">Connected.</span> The agent is reporting. Charts appear on this page.</span>
                        </>
                    ) : (
                        <>
                            <CircleNotch weight="light" className="mt-0.5 size-5 shrink-0 animate-spin text-muted-foreground motion-reduce:animate-none" aria-hidden="true" />
                            <span>Waiting for the first reading. This updates by itself, usually within a minute of the agent starting.</span>
                        </>
                    )}
                </div>
            </div>
        </Dialog>
    );
}

/** A question that names its consequence in the button, so the choice is clear without reading the paragraph */
export function ConfirmDialog({ open, onClose, title, description, confirmLabel, destructive, busy, error, onConfirm }) {
    return (
        <Dialog
            open={open}
            onClose={busy ? undefined : onClose}
            title={title}
            description={description}
            footer={
                <>
                    <Button type="button" variant="outline" onClick={onClose} disabled={busy} className="min-h-12 sm:min-h-10">Cancel</Button>
                    <Button type="button" variant={destructive ? 'destructive' : 'default'} onClick={onConfirm} disabled={busy} className="min-h-12 sm:min-h-10">
                        {busy ? 'Working…' : confirmLabel}
                    </Button>
                </>
            }>
            {error && <Alert tone="error" title="That did not work">{error}</Alert>}
        </Dialog>
    );
}

const toForm = (limits) => ({
    enabled: limits.enabled,
    cpu: { percent: String(limits.cpu.percent), minutes: String(limits.cpu.minutes) },
    memory: { percent: String(limits.memory.percent), minutes: String(limits.memory.minutes) },
    disk: { percent: String(limits.disk.percent), minutes: String(limits.disk.minutes) },
    missing: { minutes: String(limits.missing.minutes) },
});

function NumberField({ id, label, error, value, onChange, suffix, range }) {
    return (
        <Field id={id} label={label} error={error} className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
                <Input
                    id={id}
                    inputMode="numeric"
                    autoComplete="off"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${id}-msg` : undefined}
                    className="max-w-24 tabular-nums"
                />
                <span className="text-sm text-muted-foreground">{suffix}</span>
            </div>
            {range && !error && <span className="sr-only">{range}</span>}
        </Field>
    );
}

/** The limits for the alerts: prefilled, with units, checked as you leave a field and again on save */
export function LimitsDialog({ open, onClose, limits, onSave, busy, error }) {
    const [form, setForm] = useState(() => toForm(limits));
    const [errors, setErrors] = useState({});
    useEffect(() => { if (open) { setForm(toForm(limits)); setErrors({}); } }, [open, limits]);

    const set = (group, field) => (value) => setForm((f) => ({ ...f, [group]: { ...f[group], [field]: value } }));
    const submit = (event) => {
        event.preventDefault();
        const result = checkLimits(form);
        setErrors(result.errors);
        if (result.ok) onSave(result.payload.monitoring.hostAlerts);
    };

    const row = (group, name, hint) => (
        <fieldset key={group} className="space-y-2">
            <legend className="text-sm font-medium">{name}</legend>
            <p className="text-[13px] text-muted-foreground">{hint}</p>
            <div className="flex flex-wrap gap-4">
                <NumberField id={`limit-${group}-percent`} label="Above" suffix="%" value={form[group].percent} onChange={set(group, 'percent')} error={errors[`${group}.percent`]} range={`${LIMITS.percent[0]} to ${LIMITS.percent[1]}`} />
                <NumberField id={`limit-${group}-minutes`} label="For at least" suffix={group === 'disk' ? 'min' : 'minutes'} value={form[group].minutes} onChange={set(group, 'minutes')} error={errors[`${group}.minutes`]} range={`${LIMITS.minutes[0]} to ${LIMITS.minutes[1]}`} />
            </div>
        </fieldset>
    );

    return (
        <Dialog
            open={open}
            onClose={busy ? undefined : onClose}
            title="Alert limits"
            description="You are told once when a number stays above its limit for the time you set, and once when it is back to normal. 0 minutes means at once."
            className="max-w-xl"
            footer={
                <>
                    <Button type="button" variant="ghost" onClick={() => { setForm(toForm({ ...DEFAULT_LIMITS, enabled: form.enabled })); setErrors({}); }} disabled={busy} className="min-h-12 sm:mr-auto sm:min-h-10">Reset to defaults</Button>
                    <Button type="button" variant="outline" onClick={onClose} disabled={busy} className="min-h-12 sm:min-h-10">Cancel</Button>
                    <Button type="submit" form="limits-form" disabled={busy} className="min-h-12 sm:min-h-10">{busy ? 'Saving…' : 'Save limits'}</Button>
                </>
            }>
            <form id="limits-form" onSubmit={submit} noValidate className="space-y-6">
                {error && <Alert tone="error" title="Could not save">{error}</Alert>}
                {Object.keys(errors).length > 0 && (
                    <Alert tone="error" title="Check these fields">
                        <ul className="list-disc pl-4">{Object.values(errors).map((message) => <li key={message}>{message}</li>)}</ul>
                    </Alert>
                )}
                <label className="flex min-h-12 cursor-pointer items-center gap-3 text-sm">
                    <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} className="size-5 accent-[var(--primary)]" />
                    <span>Send these alerts</span>
                </label>
                <div className={cn('space-y-6', !form.enabled && 'opacity-50')}>
                    {row('cpu', 'CPU', 'Alert when CPU use stays above this.')}
                    {row('memory', 'Memory', 'Alert when memory use stays above this.')}
                    {row('disk', 'Disk space', 'Alert when the fullest disk stays above this.')}
                    <fieldset className="space-y-2">
                        <legend className="text-sm font-medium">No data</legend>
                        <p className="text-[13px] text-muted-foreground">Alert when the agent has not reported for this long.</p>
                        <NumberField id="limit-missing-minutes" label="Not reporting for at least" suffix="minutes" value={form.missing.minutes} onChange={set('missing', 'minutes')} error={errors['missing.minutes']} range={`${LIMITS.missingMinutes[0]} to ${LIMITS.missingMinutes[1]}`} />
                    </fieldset>
                </div>
            </form>
        </Dialog>
    );
}
