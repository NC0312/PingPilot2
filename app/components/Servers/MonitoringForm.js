// app/components/Server/MonitoringForm.js
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
    EnvelopeSimple,
    WebhooksLogo,
    X,
    Plus,
    Lock,
    CheckCircle,
    WarningCircle,
    CircleNotch,
    ArrowLeft,
} from '@phosphor-icons/react';
import { useAuth } from '@/app/context/AuthContext';
import { getPlanLimits } from '../subscriptionPlans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const selectClass =
    'h-11 w-full min-w-0 rounded-xl bg-white/[0.035] px-3 text-sm text-foreground ring-1 ring-white/10 outline-none transition-[box-shadow,background-color] duration-300 ease-fluid hover:ring-white/20 focus-visible:ring-2 focus-visible:ring-ring [&>option]:bg-popover [&>option]:text-popover-foreground';

// ─────────────────────────── Small helpers ───────────────────────────

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first, as people read a week
const DAY_SHORT = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKENDS = [6, 0];
const EVERY_DAY = [1, 2, 3, 4, 5, 6, 0];

const sameDays = (a, b) => a.length === b.length && b.every((d) => a.includes(d));

function daysLabel(days) {
    if (days.length === 0) return 'No days';
    if (sameDays(days, EVERY_DAY)) return 'Every day';
    if (sameDays(days, WEEKDAYS)) return 'Weekdays';
    if (sameDays(days, WEEKENDS)) return 'Weekends';
    return DAY_ORDER.filter((d) => days.includes(d)).map((d) => DAY_SHORT[d]).join(', ');
}

const toMin = (t = '00:00') => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
};

// A window as [start, end) minute segments on a 24 h axis. 22:00 to 06:00 wraps past midnight; 23:59 means "to the end of the day".
function segmentsOf(range) {
    const a = toMin(range.start);
    let b = toMin(range.end);
    if (b === 1439) b = 1440;
    if (a === b) return [];
    if (a < b) return [[a, b]];
    return [[a, 1440], [0, b]];
}

const overlaps = (s1, s2) => s1.some(([a, b]) => s2.some(([c, d]) => Math.max(a, c) < Math.min(b, d)));
const totalMinutes = (segs) => segs.reduce((sum, [a, b]) => sum + (b - a), 0);
const isAllDay = (range) => range.start === '00:00' && range.end === '23:59';
const hoursLabel = (range) => (isAllDay(range) ? 'All day' : `${range.start} to ${range.end}`);

// ─────────────────────────── Layout atoms ───────────────────────────

function Section({ step, title, description, children }) {
    return (
        <section aria-labelledby={`mf-${step}`} className="border-t border-white/[0.07] py-9 first:border-t-0 first:pt-0">
            <header className="mb-6 flex items-start gap-4">
                <span aria-hidden="true" className="mt-0.5 font-mono text-xs tabular-nums text-primary">0{step}</span>
                <div className="space-y-1.5">
                    <h3 id={`mf-${step}`} className="font-display text-xl font-medium tracking-tight">{title}</h3>
                    {description && <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">{description}</p>}
                </div>
            </header>
            <div className="min-w-0 space-y-7 sm:pl-9">{children}</div>
        </section>
    );
}

const FieldLabel = ({ htmlFor, children, aside }) => (
    <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-medium text-foreground/90">
            {children}
        </label>
        {aside}
    </div>
);

const Legend = ({ children, aside }) => (
    <div className="mb-2 flex items-center justify-between gap-3">
        <legend className="float-left text-sm font-medium text-foreground/90">{children}</legend>
        {aside}
    </div>
);

// The visual switch used by every toggle in the form. The real checkbox sits beside it, visually hidden.
function SwitchVisual({ checked }) {
    return (
        <span
            aria-hidden="true"
            className={cn('relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors duration-500 ease-fluid', checked ? 'bg-primary' : 'bg-white/15')}
        >
            <span
                className={cn(
                    'absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform duration-500 ease-fluid',
                    checked && 'translate-x-4'
                )}
            />
        </span>
    );
}

// A labelled on/off row, for settings that are not a channel (for example "All day").
function ToggleRow({ id, checked, onChange, title, description }) {
    return (
        <label
            htmlFor={id}
            className={cn(
                'flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-xl bg-white/[0.03] px-4 py-3 ring-1 ring-white/10 transition-[background-color,box-shadow] duration-500 ease-fluid',
                'hover:bg-white/[0.06] hover:ring-white/20 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring'
            )}
        >
            <input id={id} type="checkbox" role="switch" checked={checked} onChange={onChange} className="sr-only" />
            <span>
                <span className="block text-sm font-medium">{title}</span>
                {description && <span className="block text-xs leading-snug text-muted-foreground">{description}</span>}
            </span>
            <SwitchVisual checked={checked} />
        </label>
    );
}

// ─────────────────────────── Schedule controls ───────────────────────────

const FREQUENCY_PRESETS = [1, 3, 5, 10, 15, 30, 60];

export const FrequencyPicker = ({ value, onChange, minValue, maxValue, premiumText }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const min = minValue || 1;
    const max = maxValue || 60;

    // A saved interval that is not a preset (7 min, say) stays visible and selected.
    const options = FREQUENCY_PRESETS.includes(value) ? FREQUENCY_PRESETS : [...FREQUENCY_PRESETS, value].sort((a, b) => a - b);
    const [customOpen, setCustomOpen] = useState(!FREQUENCY_PRESETS.includes(value));
    const [customText, setCustomText] = useState(String(value));

    useEffect(() => {
        setCustomText((t) => (parseInt(t, 10) === value ? t : String(value)));
    }, [value]);

    const commitCustom = () => {
        const parsed = parseInt(customText, 10);
        const clamped = Math.min(max, Math.max(min, Number.isNaN(parsed) ? value : parsed));
        setCustomText(String(clamped));
        onChange(clamped);
    };

    return (
        <fieldset className="min-w-0">
            <Legend aside={<span className="font-mono text-sm tabular-nums text-primary">Every {value} {value === 1 ? 'minute' : 'minutes'}</span>}>
                Check every
            </Legend>
            <div className="clear-both grid grid-cols-7 gap-1.5 sm:gap-2">
                {options.map((v) => {
                    const allowed = (v >= min && v <= max) || v === value;
                    const lockedBelow = v < min;
                    return (
                        <label
                            key={v}
                            className={cn(
                                'relative flex h-14 cursor-pointer flex-col items-center justify-center rounded-xl bg-white/[0.03] ring-1 ring-white/10 transition-[background-color,box-shadow,transform] duration-500 ease-fluid',
                                'hover:bg-white/[0.06] hover:ring-white/20 active:scale-[0.97]',
                                'has-[:checked]:bg-primary/12 has-[:checked]:ring-2 has-[:checked]:ring-primary/60',
                                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                                !allowed && 'cursor-not-allowed opacity-40 hover:bg-white/[0.03] hover:ring-white/10 active:scale-100'
                            )}
                            title={!allowed ? (lockedBelow ? 'Needs a faster plan' : 'Above your plan’s longest interval') : undefined}
                        >
                            <input
                                type="radio"
                                name="check-frequency"
                                className="sr-only"
                                checked={v === value}
                                disabled={!allowed}
                                onChange={() => onChange(v)}
                                aria-label={`${v} ${v === 1 ? 'minute' : 'minutes'}`}
                            />
                            <span className="font-mono text-base tabular-nums leading-none">{v}</span>
                            <span className="mt-1 text-[11px] leading-none text-muted-foreground">min</span>
                            {lockedBelow && !isAdmin && <Lock weight="light" aria-hidden="true" className="absolute right-1.5 top-1.5 size-3 text-muted-foreground" />}
                        </label>
                    );
                })}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted-foreground">
                <button
                    type="button"
                    onClick={() => setCustomOpen((o) => !o)}
                    aria-expanded={customOpen}
                    className="inline-flex min-h-8 items-center rounded-md text-primary underline-offset-4 transition-colors duration-300 ease-fluid hover:underline"
                >
                    {customOpen ? 'Hide custom interval' : 'Use a custom interval'}
                </button>
                {premiumText && !isAdmin && (
                    <span>
                        {premiumText}{' '}
                        <Link href="/subscription" className="text-primary underline-offset-4 hover:underline">Compare plans</Link>
                    </span>
                )}
            </div>

            {customOpen && (
                <div className="mt-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-500">
                    <div className="relative w-36">
                        <Input
                            id="check-frequency-custom"
                            aria-label="Custom check interval in minutes"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={customText}
                            onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '').slice(0, 3);
                                setCustomText(digits);
                                const n = parseInt(digits, 10);
                                if (!Number.isNaN(n) && n >= min && n <= max) onChange(n);
                            }}
                            onBlur={commitCustom}
                            className="pr-12 font-mono tabular-nums"
                        />
                        <span aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">min</span>
                    </div>
                    <p className="text-[13px] text-muted-foreground">Between {min} and {max} minutes.</p>
                </div>
            )}
        </fieldset>
    );
};

export const WeekdaySelector = ({ selectedDays, onChange }) => {
    const days = [
        { id: 1, name: 'Mon', full: 'Monday' },
        { id: 2, name: 'Tue', full: 'Tuesday' },
        { id: 3, name: 'Wed', full: 'Wednesday' },
        { id: 4, name: 'Thu', full: 'Thursday' },
        { id: 5, name: 'Fri', full: 'Friday' },
        { id: 6, name: 'Sat', full: 'Saturday' },
        { id: 0, name: 'Sun', full: 'Sunday' },
    ];

    const toggleDay = (dayId) => {
        if (selectedDays.includes(dayId)) {
            onChange(selectedDays.filter((id) => id !== dayId));
        } else {
            onChange([...selectedDays, dayId]);
        }
    };

    const presets = [
        { label: 'Every day', days: EVERY_DAY },
        { label: 'Weekdays', days: WEEKDAYS },
        { label: 'Weekends', days: WEEKENDS },
    ];

    return (
        <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <span id="monitoring-days-label" className="text-sm font-medium text-foreground/90">Days</span>
                <div className="flex gap-1" role="group" aria-label="Day presets">
                    {presets.map((p) => {
                        const on = sameDays(selectedDays, p.days);
                        return (
                            <button
                                key={p.label}
                                type="button"
                                aria-pressed={on}
                                onClick={() => onChange([...p.days])}
                                className={cn(
                                    'min-h-8 rounded-full px-3 text-[13px] transition-[background-color,color] duration-500 ease-fluid',
                                    on ? 'bg-white/[0.1] text-foreground' : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground'
                                )}
                            >
                                {p.label}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div role="group" aria-labelledby="monitoring-days-label" className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {days.map((day) => {
                    const on = selectedDays.includes(day.id);
                    return (
                        <button
                            key={day.id}
                            type="button"
                            aria-pressed={on}
                            aria-label={day.full}
                            onClick={() => toggleDay(day.id)}
                            className={cn(
                                'h-11 rounded-xl text-[13px] font-medium ring-1 transition-[background-color,color,box-shadow,transform] duration-500 ease-fluid active:scale-[0.97]',
                                on
                                    ? 'bg-primary/15 text-primary ring-primary/50'
                                    : 'bg-white/[0.03] text-muted-foreground ring-white/10 hover:bg-white/[0.06] hover:text-foreground'
                            )}
                        >
                            {day.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export const TimeRangeSelector = ({ id, label, startTime, endTime, onStartChange, onEndChange }) => {
    // 30-minute increments, plus 23:59 so the default "all day" window is selectable
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
        for (const minute of [0, 30]) {
            const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            options.push({ value, label: value });
        }
    }
    options.push({ value: '23:59', label: '23:59' });

    return (
        <fieldset className="min-w-0">
            <legend className="sr-only">{label}</legend>
            <div className="flex items-center gap-2.5">
                <select
                    aria-label={`${label} start`}
                    id={id ? `${id}-start` : undefined}
                    value={startTime}
                    onChange={(e) => onStartChange(e.target.value)}
                    className={selectClass}
                >
                    {options.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
                <span className="text-sm text-muted-foreground">to</span>
                <select
                    aria-label={`${label} end`}
                    id={id ? `${id}-end` : undefined}
                    value={endTime}
                    onChange={(e) => onEndChange(e.target.value)}
                    className={selectClass}
                >
                    {options.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
            </div>
        </fieldset>
    );
};

// "All day" switch that reveals the start and end pickers only when they are needed.
function HoursField({ id, label, range, onChange, allDayHint }) {
    const allDay = isAllDay(range);
    return (
        <div className="space-y-3">
            <ToggleRow
                id={`${id}-allday`}
                checked={allDay}
                onChange={(e) => onChange(e.target.checked ? { start: '00:00', end: '23:59' } : { start: '09:00', end: '18:00' })}
                title={`${label}: all day`}
                description={allDay ? allDayHint : 'Only inside the hours below'}
            />
            {!allDay && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-500">
                    <TimeRangeSelector
                        id={id}
                        label={label}
                        startTime={range.start}
                        endTime={range.end}
                        onStartChange={(start) => onChange({ ...range, start })}
                        onEndChange={(end) => onChange({ ...range, end })}
                    />
                </div>
            )}
        </div>
    );
}

// ─────────────────────────── Contacts ───────────────────────────

// Shared add-to-list control: input, add button, inline error, removable chips.
function ContactListManager({ id, label, icon: Icon, items, onAdd, onRemove, inputProps, validate, format = (v) => v, onPendingChange, flagged }) {
    const [value, setValue] = useState('');
    const [error, setError] = useState('');

    // Tell the form what has been typed but not added yet, so saving can't silently drop it.
    useEffect(() => {
        onPendingChange?.(value);
    }, [value, onPendingChange]);

    // When the channel is switched off this box unmounts; forget anything typed so it can't block saving unseen.
    useEffect(() => () => onPendingChange?.(''), [onPendingChange]);

    const handleAdd = () => {
        const result = validate(value, items);
        if (result.error) {
            setError(result.error);
            return;
        }
        onAdd(result.value);
        setValue('');
        setError('');
    };

    return (
        <div>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                    <Input
                        id={id}
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value);
                            if (error) setError('');
                        }}
                        onKeyDown={(e) => {
                            // Enter adds the contact instead of submitting the whole settings form
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAdd();
                            }
                        }}
                        aria-invalid={!!error || !!flagged}
                        aria-describedby={error ? `${id}-msg` : undefined}
                        {...inputProps}
                    />
                </div>
                <Button type="button" variant="outline" size="icon" onClick={handleAdd} aria-label={`Add ${label.toLowerCase()}`} className="h-11 w-11">
                    <Plus weight="light" />
                </Button>
            </div>
            {error && (
                <p id={`${id}-msg`} role="alert" className="mt-2 text-[13px] text-destructive">
                    {error}
                </p>
            )}
            {items.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                    {items.map((item) => (
                        <li key={item} className="flex items-center gap-2 rounded-full bg-white/[0.05] py-1 pl-3 pr-1 text-sm ring-1 ring-white/10">
                            <Icon weight="light" className="size-4 text-muted-foreground" />
                            <span className="break-all">{format(item)}</span>
                            <button
                                type="button"
                                onClick={() => onRemove(item)}
                                aria-label={`Remove ${format(item)}`}
                                className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors duration-300 ease-fluid hover:bg-destructive/15 hover:text-destructive"
                            >
                                <X weight="light" className="size-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export const EmailListManager = ({ emails, onAdd, onRemove, onPendingChange, flagged }) => (
    <ContactListManager
        id="alert-email"
        label="Email addresses to alert"
        icon={EnvelopeSimple}
        items={emails}
        onAdd={onAdd}
        onRemove={onRemove}
        onPendingChange={onPendingChange}
        flagged={flagged}
        inputProps={{ type: 'email', placeholder: 'name@company.com', autoComplete: 'off' }}
        validate={(raw, existing) => {
            const email = raw.trim();
            if (!email) return { error: 'Enter an email address.' };
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter a valid email address.' };
            if (existing.includes(email)) return { error: 'That email is already on the list.' };
            return { value: email };
        }}
    />
);

export const WebhookInputManager = ({ webhookUrl, onChange, disabled, onValidityChange }) => {
    const [url, setUrl] = useState(webhookUrl || '');
    const [error, setError] = useState('');

    useEffect(() => {
        setUrl(webhookUrl || '');
    }, [webhookUrl]);

    const validateUrl = (value) => {
        try {
            new URL(value);
            return true;
        } catch (_) {
            return false;
        }
    };

    const handleChange = (e) => {
        const newValue = e.target.value;
        setUrl(newValue);

        if (newValue && !validateUrl(newValue)) {
            setError('Enter a full URL, for example https://example.com/webhook.');
            onValidityChange?.(false);
        } else {
            setError('');
            onValidityChange?.(true);
            onChange(newValue);
        }
    };

    return (
        <div>
            <FieldLabel htmlFor="webhook-url">Webhook URL</FieldLabel>
            <Input
                id="webhook-url"
                value={url}
                onChange={handleChange}
                disabled={disabled}
                placeholder="https://your-app.com/webhook"
                aria-invalid={!!error}
                aria-describedby="webhook-url-msg"
                className="font-mono text-[13px]"
                spellCheck={false}
            />
            <p id="webhook-url-msg" role={error ? 'alert' : undefined} className={cn('mt-2 text-[13px]', error ? 'text-destructive' : 'text-muted-foreground')}>
                {error || 'We send a POST request here when this server changes state.'}
            </p>
        </div>
    );
};

// One alert channel: a header you can switch, and its settings that appear only while it is on.
function ChannelCard({ id, icon: Icon, title, description, badge, checked, onChange, always, children }) {
    const open = always || checked;
    const header = (
        <>
            <Icon weight="light" aria-hidden="true" className={cn('mt-0.5 size-5 shrink-0 transition-colors duration-500 ease-fluid', open ? 'text-primary' : 'text-muted-foreground')} />
            <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {title}
                    {badge}
                </span>
                <span className="block text-xs leading-snug text-muted-foreground">{description}</span>
            </span>
        </>
    );

    return (
        <div
            className={cn(
                'rounded-2xl ring-1 transition-[background-color,box-shadow] duration-500 ease-fluid',
                open ? 'bg-primary/[0.05] ring-primary/35' : 'bg-white/[0.025] ring-white/10 hover:ring-white/20'
            )}
        >
            {always ? (
                <div className="flex items-start gap-3 px-4 py-4">{header}</div>
            ) : (
                <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-2xl px-4 py-4 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
                    <input id={id} type="checkbox" role="switch" checked={checked} onChange={onChange} className="sr-only" />
                    {header}
                    <SwitchVisual checked={checked} />
                </label>
            )}
            {open && children && <div className="space-y-4 px-4 pb-5 pt-1 animate-in fade-in slide-in-from-top-1 duration-500">{children}</div>}
        </div>
    );
}

// ─────────────────────────── Alert rules ───────────────────────────

const THRESHOLD_PRESETS = [
    { value: 500, label: '0.5 s' },
    { value: 1000, label: '1 s' },
    { value: 2000, label: '2 s' },
    { value: 5000, label: '5 s' },
];

export const ResponseTimeThresholdInput = ({ value, onChange }) => {
    // Keep what the user is typing as text; clamping on every keystroke made a fresh number impossible to enter.
    const [text, setText] = useState(String(value ?? ''));

    const clamp = (raw) => {
        const parsed = parseInt(raw, 10);
        return Math.min(10000, Math.max(100, Number.isNaN(parsed) ? 100 : parsed));
    };

    // Follow outside changes to `value`, but never overwrite text that already maps to it (that is mid-typing).
    useEffect(() => {
        setText((current) => (clamp(current) === value ? current : String(value ?? '')));
    }, [value]);

    const commit = () => {
        const clamped = clamp(text);
        setText(String(clamped));
        onChange(clamped);
    };

    return (
        <fieldset className="min-w-0">
            <Legend aside={<span className="font-mono text-sm tabular-nums text-primary">Over {Number(value).toLocaleString()} ms</span>}>
                Alert when a check is slower than
            </Legend>
            <div className="clear-both flex flex-wrap items-center gap-2">
                {THRESHOLD_PRESETS.map((p) => (
                    <label
                        key={p.value}
                        className={cn(
                            'flex h-11 min-w-16 cursor-pointer items-center justify-center rounded-xl bg-white/[0.03] px-4 font-mono text-sm tabular-nums ring-1 ring-white/10 transition-[background-color,box-shadow,transform] duration-500 ease-fluid',
                            'hover:bg-white/[0.06] hover:ring-white/20 active:scale-[0.97]',
                            'has-[:checked]:bg-primary/12 has-[:checked]:text-primary has-[:checked]:ring-2 has-[:checked]:ring-primary/60',
                            'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring'
                        )}
                    >
                        <input
                            type="radio"
                            name="response-threshold-preset"
                            className="sr-only"
                            checked={value === p.value}
                            onChange={() => {
                                setText(String(p.value));
                                onChange(p.value);
                            }}
                            aria-label={`${p.value} milliseconds`}
                        />
                        {p.label}
                    </label>
                ))}
                <div className="relative w-36">
                    <Input
                        id="response-threshold"
                        aria-label="Custom threshold in milliseconds"
                        aria-describedby="response-threshold-msg"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={text}
                        onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 5);
                            setText(digits);
                            // Keep the saved value valid while typing; the text itself is only corrected on blur.
                            if (digits) onChange(clamp(digits));
                        }}
                        onBlur={commit}
                        className="pr-12 font-mono tabular-nums"
                    />
                    <span aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        ms
                    </span>
                </div>
            </div>
            <p id="response-threshold-msg" className="mt-2.5 text-[13px] text-muted-foreground">
                A check that takes longer than this counts as slow and sends an alert. Between 100 and 10,000 ms.
            </p>
        </fieldset>
    );
};

// ─────────────────────────── Live summary ───────────────────────────

// One bar on a 24 h axis. The window is a clipped layer so it slides and resizes with a transform-free, compositor-friendly clip-path.
function TimelineRow({ label, value, segs, muted }) {
    const layers = [segs[0], segs[1]];
    return (
        <div>
            <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono tabular-nums text-foreground/90">{value}</span>
            </div>
            <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                {layers.map((seg, i) => (
                    <span
                        key={i}
                        aria-hidden="true"
                        className={cn('absolute inset-0 rounded-full transition-[clip-path,background-color] duration-700 ease-fluid', muted ? 'bg-white/25' : 'bg-primary')}
                        style={{ clipPath: seg ? `inset(0 ${100 - seg[1] / 14.4}% 0 ${seg[0] / 14.4}%)` : 'inset(0 50% 0 50%)' }}
                    />
                ))}
            </div>
        </div>
    );
}

function SummaryRow({ term, children }) {
    return (
        <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
            <dt className="shrink-0 text-muted-foreground">{term}</dt>
            <dd className="min-w-0 text-right">{children}</dd>
        </div>
    );
}

function SetupSummary({ data, issues, className }) {
    const checkSegs = segmentsOf(data.checkTimeRange);
    const alertSegs = segmentsOf(data.alertTimeRange);
    const noDays = data.monitoringDays.length === 0;
    const perDay = noDays ? 0 : Math.floor(totalMinutes(checkSegs) / data.checkFrequency);
    const hasWebhook = !!data.webhookUrl;
    const alertsOn = (data.alertPreferences.email && data.emails.length > 0) || hasWebhook;

    const channels = [];
    if (data.alertPreferences.email) channels.push(data.emails.length ? `Email, ${data.emails.length}` : 'Email, no address');
    if (hasWebhook) channels.push('Webhook');

    return (
        <aside aria-label="Summary of your setup" className={cn('bezel-sm', className)}>
            <div className="bezel-sm-core space-y-5 p-6">
                <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-lg font-medium tracking-tight">Your setup</h3>
                    {issues.length === 0 ? (
                        <Badge variant="success"><CheckCircle weight="light" />Ready</Badge>
                    ) : (
                        <Badge variant="warning"><WarningCircle weight="light" />{issues.length} to check</Badge>
                    )}
                </div>

                <div className="space-y-4" role="group" aria-label="Hours covered, on a 24 hour axis">
                    <TimelineRow label="Checks" value={noDays ? 'Never' : hoursLabel(data.checkTimeRange)} segs={noDays ? [] : checkSegs} />
                    <TimelineRow label="Alerts" value={alertsOn ? hoursLabel(data.alertTimeRange) : 'Off'} segs={alertSegs} muted={!alertsOn} />
                    <div aria-hidden="true" className="flex justify-between font-mono text-[10px] tabular-nums text-muted-foreground/70">
                        <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
                    </div>
                </div>

                <dl className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
                    <SummaryRow term="Interval"><span className="font-mono tabular-nums">Every {data.checkFrequency} min</span></SummaryRow>
                    <SummaryRow term="Days">{daysLabel(data.monitoringDays)}</SummaryRow>
                    <SummaryRow term="Volume"><span className="font-mono tabular-nums">{perDay.toLocaleString()}</span> checks per active day</SummaryRow>
                    <SummaryRow term="Tell">
                        {channels.length ? (
                            <ul className="flex flex-wrap justify-end gap-1.5">
                                {channels.map((c) => (
                                    <li key={c} className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs ring-1 ring-white/10">{c}</li>
                                ))}
                            </ul>
                        ) : (
                            <span className="text-muted-foreground">Nobody</span>
                        )}
                    </SummaryRow>
                    <SummaryRow term="Slow means"><span className="font-mono tabular-nums">Over {Number(data.responseThreshold).toLocaleString()} ms</span></SummaryRow>
                </dl>

                {issues.length > 0 && (
                    <ul className="space-y-2" aria-label="Things to check">
                        {issues.map((msg) => (
                            <li key={msg} className="flex items-start gap-2 text-[13px] leading-snug text-warning">
                                <WarningCircle weight="light" aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                                <span>{msg}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </aside>
    );
}

// What a new monitor gets if the user changes nothing: checked every 5 minutes, every day, all day,
// with email alerts to the account address. Used by the form and by the quick "start monitoring" path.
export const getDefaultMonitoring = (user) => ({
    alertPreferences: {
        email: true,
    },
    monitoringDays: [0, 1, 2, 3, 4, 5, 6],
    alertTimeRange: {
        start: '00:00',
        end: '23:59',
    },
    checkTimeRange: {
        start: '00:00',
        end: '23:59',
    },
    checkFrequency: 5, // minutes
    responseThreshold: 1000, // ms
    webhookUrl: '',
    emails: user?.email ? [user.email] : [],
});

export const MonitoringForm = ({ onSave, initialData = {}, isLoading, submitLabel = 'Update settings', loadingLabel = 'Saving', onBack, backLabel = 'Back', onDirtyChange, savedKey }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const defaultData = getDefaultMonitoring(user);

    // Merge initial data with defaults
    const mergedData = { ...defaultData, ...initialData };

    const [formData, setFormData] = useState(mergedData);

    // Unsaved-change tracking (see ServerForm): `savedKey` changing means the current values were saved.
    const [baseline, setBaseline] = useState(() => JSON.stringify(mergedData));
    const dirty = JSON.stringify(formData) !== baseline;
    useEffect(() => {
        onDirtyChange?.(dirty);
    }, [dirty, onDirtyChange]);
    const firstSavedKey = useRef(savedKey);
    useEffect(() => {
        if (savedKey !== firstSavedKey.current) setBaseline(JSON.stringify(formData));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [savedKey]);

    // Plan ids look like "starter_monthly" or "pro_yearly"; the tier decides what is left to upsell.
    const getPremiumText = (currentPlan) => {
        const tier = (currentPlan || 'free').split('_')[0];
        switch (tier) {
            case 'starter':
                return null;
            case 'pro':
            case 'business':
            case 'admin':
                return null;
            default: // free
                return 'Paid plans allow 1-minute checks.';
        }
    };

    // Get min and max check frequency based on user's plan
    const getFrequencyLimits = () => {
        // If user is admin, provide full access
        if (isAdmin) {
            return { min: 1, max: 60, premiumText: null };
        }

        // Otherwise, get limits from subscription plan
        const planLimits = getPlanLimits(user);

        return {
            min: planLimits.minCheckFrequency,
            max: planLimits.maxCheckFrequency,
            premiumText: getPremiumText(user.subscription?.plan),
        };
    };

    const { min, max, premiumText } = getFrequencyLimits();

    const handleChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleNestedChange = (parent, field, value) => {
        setFormData((prev) => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: value,
            },
        }));
    };

    const addEmail = (email) => {
        setFormData((prev) => ({ ...prev, emails: [...prev.emails, email] }));
    };

    const removeEmail = (email) => {
        setFormData((prev) => ({ ...prev, emails: prev.emails.filter((e) => e !== email) }));
    };

    // What has been typed into the contact boxes but not added with "+" or Enter yet.
    const [pendingEmail, setPendingEmail] = useState('');
    const [webhookValid, setWebhookValid] = useState(true);
    const [formError, setFormError] = useState(null);
    const formErrorRef = useRef(null);

    const showFormError = (message) => {
        setFormError(message);
        // The submit bar is pinned to the bottom; make sure the message is seen.
        requestAnimationFrame(() => formErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!webhookValid) {
            return showFormError('The webhook URL is not a valid address. Fix it or clear the box.');
        }
        if (pendingEmail.trim()) {
            return showFormError('You typed an email address but did not add it. Press + or Enter to add it, or clear the box.');
        }
        // Alerts are only sent to the listed contacts, so a channel with nobody on it never notifies anyone.
        if (formData.alertPreferences.email && formData.emails.length === 0) {
            return showFormError('Email alerts are on, but no address is listed. Add one, or turn email alerts off.');
        }

        setFormError(null);
        onSave(formData);
    };

    const noDays = formData.monitoringDays.length === 0;
    const webhookLocked = !isAdmin && !user?.subscription?.features?.webhookIntegrations;
    const timezone = mergedData.timezone || (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'your');

    // Everything that would make this setup do less than the user expects, shown live in the summary.
    const checkSegs = segmentsOf(formData.checkTimeRange);
    const alertSegs = segmentsOf(formData.alertTimeRange);
    const alertsOn = (formData.alertPreferences.email && formData.emails.length > 0) || !!formData.webhookUrl;
    const issues = [];
    if (noDays) issues.push('No days are selected, so this server won’t be checked.');
    if (!noDays && checkSegs.length === 0) issues.push('Check hours start and end at the same time.');
    if (formData.alertPreferences.email && formData.emails.length === 0) issues.push('Email alerts are on but no address is listed.');
    if (!webhookValid) issues.push('The webhook URL isn’t a valid address.');
    if (pendingEmail.trim()) issues.push('An email address is typed but not added.');
    if (alertsOn && !noDays && checkSegs.length > 0 && alertSegs.length > 0 && !overlaps(checkSegs, alertSegs)) {
        issues.push('Alert hours sit outside check hours, so no alert would be sent.');
    }
    if (!alertsOn && !issues.some((m) => m.includes('Email alerts are on'))) issues.push('Nobody will be alerted. Turn on a channel in step 2.');

    return (
        <form onSubmit={handleSubmit} noValidate aria-label="Monitoring settings" className="@container">
            <div className="grid gap-6 @4xl:grid-cols-[minmax(0,1fr)_300px] @4xl:items-start">
                <div className="min-w-0 space-y-6">
                    <div className="bezel-sm">
                        <div className="bezel-sm-core p-6 sm:p-8">
                            <div className="mb-9 space-y-1.5">
                                <h2 className="font-display text-2xl font-medium tracking-tight">Monitoring and alerts</h2>
                                <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
                                    Choose when this server is checked, who is told when something changes, and what counts as a problem.
                                </p>
                            </div>

                            <Section step={1} title="When to check" description="How often Ping Pilott checks, and on which days and hours.">
                                <FrequencyPicker
                                    value={formData.checkFrequency}
                                    onChange={(value) => handleChange('checkFrequency', value)}
                                    minValue={min}
                                    maxValue={max}
                                    premiumText={premiumText}
                                />
                                <WeekdaySelector selectedDays={formData.monitoringDays} onChange={(days) => handleChange('monitoringDays', days)} />
                                <HoursField
                                    id="check-range"
                                    label="Check hours"
                                    range={formData.checkTimeRange}
                                    onChange={(range) => handleChange('checkTimeRange', range)}
                                    allDayHint="Checked around the clock on the days above"
                                />
                                <p className="text-[13px] text-muted-foreground">Days and hours use the {timezone} timezone.</p>
                            </Section>

                            <Section step={2} title="Who to tell" description="Turn on the ways you want to hear about problems. Each one opens its own settings.">
                                <div className="space-y-3">
                                    <ChannelCard
                                        id="emailAlert"
                                        icon={EnvelopeSimple}
                                        title="Email"
                                        description={
                                            formData.alertPreferences.email
                                                ? 'Sent to the addresses below'
                                                : formData.emails.length
                                                    ? `${formData.emails.length} saved, not in use`
                                                    : 'Sent to the addresses you add'
                                        }
                                        checked={formData.alertPreferences.email}
                                        onChange={(e) => handleNestedChange('alertPreferences', 'email', e.target.checked)}
                                    >
                                        <EmailListManager
                                            emails={formData.emails}
                                            onAdd={addEmail}
                                            onRemove={removeEmail}
                                            onPendingChange={setPendingEmail}
                                            flagged={!!formError && !!pendingEmail.trim()}
                                        />
                                    </ChannelCard>

                                    <ChannelCard
                                        icon={WebhooksLogo}
                                        title="Webhook"
                                        badge={webhookLocked ? <Badge variant="default"><Lock weight="light" />Paid plans</Badge> : null}
                                        description={webhookLocked ? 'Send alerts to your own app or chat tool.' : 'Send alerts to your own app or chat tool. Leave empty to skip.'}
                                        always
                                    >
                                        {webhookLocked ? (
                                            <p className="text-[13px] text-muted-foreground">
                                                Webhooks come with every paid plan.{' '}
                                                <Link href="/subscription" className="text-primary underline-offset-4 hover:underline">Compare plans</Link>
                                            </p>
                                        ) : (
                                            <WebhookInputManager
                                                webhookUrl={formData.webhookUrl}
                                                onChange={(url) => handleChange('webhookUrl', url)}
                                                onValidityChange={setWebhookValid}
                                            />
                                        )}
                                    </ChannelCard>
                                </div>
                            </Section>

                            <Section step={3} title="What counts as a problem" description="Down always sends an alert. These settings decide when slow does, and when you’re left in peace.">
                                <ResponseTimeThresholdInput value={formData.responseThreshold} onChange={(value) => handleChange('responseThreshold', value)} />
                                <HoursField
                                    id="alert-range"
                                    label="Alert hours"
                                    range={formData.alertTimeRange}
                                    onChange={(range) => handleChange('alertTimeRange', range)}
                                    allDayHint="Alerts can be sent whenever a check runs"
                                />
                            </Section>
                        </div>
                    </div>

                    {/* Below the wide breakpoint the summary sits here, right above the save bar */}
                    <SetupSummary data={formData} issues={issues} className="@4xl:hidden" />

                    {formError && (
                        <div ref={formErrorRef} className="scroll-mt-24">
                            <Alert tone="error" title="Can’t save yet">{formError}</Alert>
                        </div>
                    )}

                    <div className="glass sticky bottom-4 flex items-center justify-between gap-2 rounded-full p-2" style={{ zIndex: 'var(--z-nav)' }}>
                        {onBack ? (
                            <Button type="button" variant="ghost" onClick={onBack} disabled={isLoading} aria-label={backLabel} className="max-sm:size-12 max-sm:px-0">
                                <ArrowLeft weight="light" />
                                <span className="max-sm:sr-only">{backLabel}</span>
                            </Button>
                        ) : (
                            <span />
                        )}
                        <Button type="submit" size="lg" disabled={isLoading} className="max-sm:flex-1">
                            {isLoading ? (
                                <>
                                    <CircleNotch weight="light" className="animate-spin" />
                                    {loadingLabel}
                                </>
                            ) : (
                                submitLabel
                            )}
                        </Button>
                    </div>
                </div>

                <SetupSummary data={formData} issues={issues} className="hidden @4xl:sticky @4xl:top-8 @4xl:block" />
            </div>
        </form>
    );
};
