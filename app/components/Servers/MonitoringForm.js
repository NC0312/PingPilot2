// app/components/Server/MonitoringForm.js
'use client';

import React, { useState, useEffect } from 'react';
import { EnvelopeSimple, Phone, X, Plus, Info, CircleNotch, ArrowLeft } from '@phosphor-icons/react';
import { useAuth } from '@/app/context/AuthContext';
import { getPlanLimits } from '../subscriptionPlans';
import { Button, ButtonArrow } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const selectClass =
    'h-11 w-full min-w-0 rounded-xl bg-white/[0.035] px-3 text-sm text-foreground ring-1 ring-white/10 outline-none transition-[box-shadow,background-color] duration-300 ease-fluid hover:ring-white/20 focus-visible:ring-2 focus-visible:ring-ring [&>option]:bg-popover [&>option]:text-popover-foreground';

// Two-column section: heading and help on the left, controls on the right.
function Section({ title, description, children }) {
    return (
        <section className="grid gap-6 border-t border-white/[0.07] py-8 first:border-t-0 first:pt-0 lg:grid-cols-[minmax(0,260px)_1fr] lg:gap-10">
            <div className="space-y-1.5">
                <h3 className="font-display text-lg font-medium tracking-tight">{title}</h3>
                {description && <p className="max-w-[40ch] text-sm leading-relaxed text-muted-foreground">{description}</p>}
            </div>
            <div className="min-w-0 space-y-6">{children}</div>
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

    return (
        <div role="group" aria-label="Monitoring days" className="grid grid-cols-7 gap-1.5 sm:gap-2">
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
            <legend className="mb-2 text-sm font-medium text-foreground/90">{label}</legend>
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

// Shared add-to-list control: input, add button, inline error, removable chips.
function ContactListManager({ id, label, icon: Icon, items, onAdd, onRemove, inputProps, validate, format = (v) => v, disabled }) {
    const [value, setValue] = useState('');
    const [error, setError] = useState('');

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
        <div className={cn('transition-opacity duration-500 ease-fluid', disabled && 'opacity-60')}>
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
                        aria-invalid={!!error}
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

export const EmailListManager = ({ emails, onAdd, onRemove, disabled }) => (
    <ContactListManager
        id="alert-email"
        label="Alert email addresses"
        icon={EnvelopeSimple}
        items={emails}
        onAdd={onAdd}
        onRemove={onRemove}
        disabled={disabled}
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

export const PhoneListManager = ({ phones, onAdd, onRemove, disabled }) => (
    <ContactListManager
        id="alert-phone"
        label="Call alert numbers"
        icon={Phone}
        items={phones}
        onAdd={onAdd}
        onRemove={onRemove}
        disabled={disabled}
        format={(p) => p.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}
        inputProps={{ type: 'tel', inputMode: 'numeric', placeholder: '10-digit mobile number', autoComplete: 'off' }}
        validate={(raw, existing) => {
            const cleaned = raw.replace(/\D/g, '');
            if (!cleaned) return { error: 'Enter a phone number.' };
            if (!/^\d{10}$/.test(cleaned)) return { error: 'Enter a valid 10-digit phone number.' };
            if (existing.includes(cleaned)) return { error: 'That number is already on the list.' };
            return { value: cleaned };
        }}
    />
);

export const WebhookInputManager = ({ webhookUrl, onChange, disabled }) => {
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
        } else {
            setError('');
            onChange(newValue);
        }
    };

    return (
        <div>
            <FieldLabel htmlFor="webhook-url" aside={disabled ? <Badge variant="default">Business plan</Badge> : null}>
                Webhook URL
            </FieldLabel>
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
                {error || (disabled ? 'Upgrade to the Business plan to send alerts to a webhook.' : 'We send a POST request here when this server changes state.')}
            </p>
        </div>
    );
};

export const FrequencySlider = ({ value, onChange, minValue, maxValue, premiumText }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const step = 1;
    const min = minValue || 1;
    const max = maxValue || 60;
    const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;

    return (
        <div>
            <FieldLabel
                htmlFor="check-frequency"
                aside={
                    <output htmlFor="check-frequency" className="font-mono text-sm tabular-nums text-primary">
                        Every {value} {value === 1 ? 'minute' : 'minutes'}
                    </output>
                }
            >
                Check frequency
            </FieldLabel>
            <input
                id="check-frequency"
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value, 10))}
                aria-valuetext={`Every ${value} ${value === 1 ? 'minute' : 'minutes'}`}
                style={{ background: `linear-gradient(to right, var(--primary) ${pct}%, oklch(1 0 0 / 0.1) ${pct}%)` }}
                className="h-2 w-full cursor-pointer appearance-none rounded-full accent-primary [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_oklch(0.82_0.11_215/0.2)]"
            />
            <div className="mt-2 flex justify-between font-mono text-xs tabular-nums text-muted-foreground">
                <span>{min} min</span>
                <span>{Math.floor(max / 2)} min</span>
                <span>{max} min</span>
            </div>
            {premiumText && !isAdmin && (
                <p className="mt-3 flex items-start gap-2 text-[13px] text-muted-foreground">
                    <Info weight="light" className="mt-0.5 size-4 shrink-0 text-primary" />
                    {premiumText}
                </p>
            )}
        </div>
    );
};

export const ResponseTimeThresholdInput = ({ value, onChange }) => {
    return (
        <div>
            <FieldLabel htmlFor="response-threshold">Alert when response time exceeds</FieldLabel>
            <div className="relative sm:max-w-xs">
                <Input
                    id="response-threshold"
                    type="number"
                    min="100"
                    max="10000"
                    step="100"
                    inputMode="numeric"
                    value={value}
                    onChange={(e) => onChange(Math.max(100, parseInt(e.target.value, 10) || 0))}
                    aria-describedby="response-threshold-msg"
                    className="pr-12 font-mono tabular-nums"
                />
                <span aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    ms
                </span>
            </div>
            <p id="response-threshold-msg" className="mt-2 text-[13px] text-muted-foreground">
                You get an alert when a check is slower than this. Minimum 100 ms.
            </p>
        </div>
    );
};

export const PlanLimitInfo = ({ userPlan, serverCount, maxServers }) => {
    if (userPlan === 'free') {
        return (
            <Alert tone="info" title="Free trial">
                Each server you add has a 2-day free trial. After that, upgrade to a paid plan to keep monitoring.
            </Alert>
        );
    }
    if (serverCount >= maxServers) {
        return (
            <Alert tone="warning" title="Server limit reached">
                Your plan allows {maxServers} servers. Upgrade your plan to add more.
            </Alert>
        );
    }
    return (
        <Alert tone="success" title={`${userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} plan`}>
            {Number.isFinite(maxServers) ? `You have used ${serverCount} of ${maxServers} server slots.` : `You have ${serverCount} ${serverCount === 1 ? 'server' : 'servers'}. Your plan has no server limit.`}
        </Alert>
    );
};

// Checkbox rendered as a selectable tile; the native input stays for keyboard and screen readers.
function ChannelToggle({ id, checked, onChange, icon: Icon, title, description }) {
    return (
        <label
            htmlFor={id}
            className={cn(
                'relative flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl bg-white/[0.03] px-4 py-3.5 ring-1 ring-white/10 transition-[background-color,box-shadow] duration-500 ease-fluid',
                'hover:bg-white/[0.06] hover:ring-white/20',
                'has-[:checked]:bg-primary/10 has-[:checked]:ring-2 has-[:checked]:ring-primary/60',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring'
            )}
        >
            <input id={id} type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
            <Icon weight="light" className={cn('mt-0.5 size-5 shrink-0 transition-colors duration-500 ease-fluid', checked ? 'text-primary' : 'text-muted-foreground')} />
            <span className="flex-1">
                <span className="block text-sm font-medium">{title}</span>
                <span className="block text-xs leading-snug text-muted-foreground">{description}</span>
            </span>
            <span
                aria-hidden="true"
                className={cn(
                    'relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors duration-500 ease-fluid',
                    checked ? 'bg-primary' : 'bg-white/15'
                )}
            >
                <span
                    className={cn(
                        'absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform duration-500 ease-fluid',
                        checked && 'translate-x-4'
                    )}
                />
            </span>
        </label>
    );
}

export const MonitoringForm = ({ onSave, initialData = {}, isLoading, submitLabel = 'Update settings', loadingLabel = 'Saving', onBack, backLabel = 'Back' }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const defaultData = {
        alertPreferences: {
            email: true,
            phone: false,
        },
        monitoringDays: [0, 1, 2, 3, 4, 5, 6], // Monday through Sunday
        alertTimeRange: {
            start: '00:00',
            end: '23:59',
        },
        checkTimeRange: {
            start: '00:00',
            end: '23:59',
        },
        checkFrequency: 5, // 5 minutes
        responseThreshold: 1000, // 1000ms
        webhookUrl: '',
        emails: [],
        phones: [],
    };

    // Merge initial data with defaults
    const mergedData = { ...defaultData, ...initialData };

    const [formData, setFormData] = useState(mergedData);

    const getPremiumText = (currentPlan) => {
        switch (currentPlan) {
            case 'monthly':
                return 'The half-yearly plan allows 1-minute checks.';
            case 'halfYearly':
                return 'The yearly plan allows 30-second checks.';
            case 'yearly':
                return null;
            default: // free
                return 'Paid plans allow more frequent checks and longer monitoring.';
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

    const addPhone = (phone) => {
        setFormData((prev) => ({ ...prev, phones: [...prev.phones, phone] }));
    };

    const removePhone = (phone) => {
        setFormData((prev) => ({ ...prev, phones: prev.phones.filter((p) => p !== phone) }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const noDays = formData.monitoringDays.length === 0;

    return (
        <form onSubmit={handleSubmit} noValidate className="bezel-sm" aria-label="Monitoring settings">
            <div className="bezel-sm-core p-6 sm:p-8">
                <div className="mb-8 space-y-1.5">
                    <h2 className="font-display text-xl font-medium tracking-tight">Monitoring and alerts</h2>
                    <p className="text-sm text-muted-foreground">When to check this server, and who hears about it when something changes.</p>
                </div>

                <Section title="Check schedule" description="How often Ping Pilott checks, and on which days and hours.">
                    <FrequencySlider
                        value={formData.checkFrequency}
                        onChange={(value) => handleChange('checkFrequency', value)}
                        minValue={min}
                        maxValue={max}
                        premiumText={premiumText}
                    />
                    <div>
                        <FieldLabel>Days</FieldLabel>
                        <WeekdaySelector selectedDays={formData.monitoringDays} onChange={(days) => handleChange('monitoringDays', days)} />
                        {noDays && <p role="alert" className="mt-2 text-[13px] text-warning">No days selected. This server won’t be checked.</p>}
                    </div>
                    <TimeRangeSelector
                        id="check-range"
                        label="Check hours"
                        startTime={formData.checkTimeRange.start}
                        endTime={formData.checkTimeRange.end}
                        onStartChange={(time) => handleNestedChange('checkTimeRange', 'start', time)}
                        onEndChange={(time) => handleNestedChange('checkTimeRange', 'end', time)}
                    />
                </Section>

                <Section title="Alert channels" description="Choose how you’re told, then add who should be told.">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <ChannelToggle
                            id="emailAlert"
                            checked={formData.alertPreferences.email}
                            onChange={(e) => handleNestedChange('alertPreferences', 'email', e.target.checked)}
                            icon={EnvelopeSimple}
                            title="Email alerts"
                            description="Sent to the addresses below"
                        />
                        <ChannelToggle
                            id="phoneAlert"
                            checked={formData.alertPreferences.phone}
                            onChange={(e) => handleNestedChange('alertPreferences', 'phone', e.target.checked)}
                            icon={Phone}
                            title="Call alerts"
                            description="Calls the numbers below"
                        />
                    </div>

                    <EmailListManager emails={formData.emails} onAdd={addEmail} onRemove={removeEmail} disabled={!formData.alertPreferences.email} />
                    {!formData.alertPreferences.email && formData.emails.length === 0 && (
                        <p className="-mt-3 text-[13px] text-muted-foreground">Email alerts are off, so these addresses won’t be used.</p>
                    )}

                    <PhoneListManager phones={formData.phones} onAdd={addPhone} onRemove={removePhone} disabled={!formData.alertPreferences.phone} />
                    {!formData.alertPreferences.phone && formData.phones.length === 0 && (
                        <p className="-mt-3 text-[13px] text-muted-foreground">Call alerts are off, so these numbers won’t be used.</p>
                    )}

                    <WebhookInputManager
                        webhookUrl={formData.webhookUrl}
                        onChange={(url) => handleChange('webhookUrl', url)}
                        disabled={!isAdmin && !user?.subscription?.features?.webhookIntegrations}
                    />
                </Section>

                <Section title="Alert rules" description="When an alert should fire, and during which hours.">
                    <ResponseTimeThresholdInput value={formData.responseThreshold} onChange={(value) => handleChange('responseThreshold', value)} />
                    <TimeRangeSelector
                        id="alert-range"
                        label="Alert hours"
                        startTime={formData.alertTimeRange.start}
                        endTime={formData.alertTimeRange.end}
                        onStartChange={(time) => handleNestedChange('alertTimeRange', 'start', time)}
                        onEndChange={(time) => handleNestedChange('alertTimeRange', 'end', time)}
                    />
                </Section>

                <div className="glass sticky bottom-4 mt-2 flex flex-col-reverse gap-2 rounded-[1.75rem] p-2 sm:flex-row sm:items-center sm:justify-between sm:rounded-full">
                    {onBack ? (
                        <Button type="button" variant="ghost" onClick={onBack} disabled={isLoading}>
                            <ArrowLeft weight="light" />
                            {backLabel}
                        </Button>
                    ) : (
                        <span />
                    )}
                    <Button type="submit" size="lg" disabled={isLoading}>
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
        </form>
    );
};
