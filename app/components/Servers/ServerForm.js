'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Globe, HardDrives, Plugs, Database, CircleNotch } from '@phosphor-icons/react';
import { Button, ButtonArrow } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const priorityOptions = [
    { id: 'high', name: 'High', dot: 'bg-destructive', description: 'Faster checks, immediate alerts' },
    { id: 'medium', name: 'Medium', dot: 'bg-warning', description: 'Standard checking interval' },
    { id: 'low', name: 'Low', dot: 'bg-primary', description: 'Slower checks, saves resources' },
];

const serverTypes = [
    { id: 'website', name: 'Website', icon: Globe },
    { id: 'api', name: 'API endpoint', icon: HardDrives },
    { id: 'tcp', name: 'TCP service', icon: Plugs },
    { id: 'database', name: 'Database', icon: Database },
];

// Plan and slot status shown above the form when adding a server.
const PlanLimitInfo = ({ userPlan, serverCount, maxServers }) => {
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
    const plan = userPlan.charAt(0).toUpperCase() + userPlan.slice(1);
    return (
        <Alert tone="success" title={`${plan.replace('_', ' ')} plan`}>
            {Number.isFinite(maxServers) ? `You have used ${serverCount} of ${maxServers} server slots.` : `You have ${serverCount} ${serverCount === 1 ? 'server' : 'servers'}. Your plan has no server limit.`}
        </Alert>
    );
};

// Radio group rendered as selectable tiles. The native radio stays in the DOM for keyboard and screen readers.
function ChoiceGroup({ legend, name, value, onChange, disabled, options, columns, children }) {
    return (
        <fieldset disabled={disabled} className="min-w-0 space-y-2.5">
            <legend className="text-sm font-medium text-foreground/90">{legend}</legend>
            <div className={cn('grid gap-2.5', columns)}>
                {options.map((opt) => (
                    <label
                        key={opt.id}
                        className={cn(
                            'group relative flex min-h-12 cursor-pointer items-center rounded-2xl bg-white/[0.03] px-4 py-3 ring-1 ring-white/10 transition-[background-color,box-shadow] duration-500 ease-fluid',
                            'hover:bg-white/[0.06] hover:ring-white/20',
                            'has-[:checked]:bg-primary/10 has-[:checked]:ring-2 has-[:checked]:ring-primary/60',
                            'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                            disabled && 'cursor-not-allowed opacity-50'
                        )}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={opt.id}
                            checked={value === opt.id}
                            onChange={() => onChange(opt.id)}
                            className="sr-only"
                        />
                        {children(opt)}
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

export const ServerForm = ({
    onSubmit,
    loading,
    error,
    userPlan,
    serverCount,
    maxServers,
    initialData = {},
    isEdit = false,
    submitLabel,
    cancelHref,
}) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        url: initialData?.url || '',
        type: initialData?.type || 'website',
        description: initialData?.description || '',
        priority: initialData?.priority || 'medium',
    });

    const [validationErrors, setValidationErrors] = useState({});

    const setField = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear validation error when field is edited
        if (validationErrors[name]) {
            setValidationErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const handleChange = (e) => setField(e.target.name, e.target.value);

    const validateUrl = (url) => {
        // Allow TCP format like 123.123.123.123:8080
        if (formData.type === 'tcp') {
            return /^[\w.-]+(?::\d+)?$/.test(url);
        }
        // For websites and APIs, require http(s)://
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.name.trim()) {
            errors.name = 'Enter a name for this server.';
        }

        if (!formData.url.trim()) {
            errors.url = 'Enter a URL or address to monitor.';
        } else if (!validateUrl(formData.url)) {
            errors.url =
                formData.type === 'tcp'
                    ? 'Use the host:port format, for example db.example.com:5432.'
                    : 'Enter a full URL that starts with http:// or https://.';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    // Disable form if server limit is reached for non-admin users
    const isFormDisabled = !isEdit && userPlan !== 'admin' && serverCount >= maxServers;
    const locked = isFormDisabled || loading;

    return (
        <form onSubmit={handleSubmit} noValidate className="bezel-sm" aria-label={isEdit ? 'General settings' : 'Server details'}>
            <div className="bezel-sm-core space-y-7 p-6 sm:p-8">
                <div className="space-y-1.5">
                    <h2 className="font-display text-xl font-medium tracking-tight">{isEdit ? 'General' : 'Server details'}</h2>
                    <p className="text-sm text-muted-foreground">
                        {isEdit ? 'Name, address and priority for this monitor.' : 'What should Ping Pilott check?'}
                    </p>
                </div>

                {!isEdit && userPlan && <PlanLimitInfo userPlan={userPlan} serverCount={serverCount} maxServers={maxServers} />}
                {error && <Alert tone="error" title="We couldn’t add this server">{error}</Alert>}

                <div className="grid gap-6 md:grid-cols-2">
                    <Field id="name" label="Server name" error={validationErrors.name}>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={locked}
                            placeholder="Production API"
                            aria-invalid={!!validationErrors.name}
                            aria-describedby={validationErrors.name ? 'name-msg' : undefined}
                            autoComplete="off"
                        />
                    </Field>

                    <Field
                        id="url"
                        label="URL or address"
                        error={validationErrors.url}
                        hint={formData.type === 'tcp' ? 'Host and port, no protocol.' : 'Include https:// or http://.'}
                    >
                        <Input
                            id="url"
                            name="url"
                            value={formData.url}
                            onChange={handleChange}
                            disabled={locked}
                            placeholder={formData.type === 'tcp' ? 'db.example.com:5432' : 'https://example.com'}
                            aria-invalid={!!validationErrors.url}
                            aria-describedby="url-msg"
                            className="font-mono text-[13px]"
                            inputMode="url"
                            autoComplete="off"
                            spellCheck={false}
                        />
                    </Field>
                </div>

                <ChoiceGroup
                    legend="Server type"
                    name="type"
                    value={formData.type}
                    onChange={(v) => setField('type', v)}
                    disabled={locked}
                    options={serverTypes}
                    columns="grid-cols-2 sm:grid-cols-4"
                >
                    {(type) => {
                        const TypeIcon = type.icon;
                        return (
                            <span className="flex items-center gap-2.5 text-sm font-medium">
                                <TypeIcon weight="light" className="size-5 shrink-0 text-muted-foreground transition-colors duration-500 ease-fluid group-has-[:checked]:text-primary" />
                                {type.name}
                            </span>
                        );
                    }}
                </ChoiceGroup>

                <ChoiceGroup
                    legend="Monitoring priority"
                    name="priority"
                    value={formData.priority}
                    onChange={(v) => setField('priority', v)}
                    disabled={locked}
                    options={priorityOptions}
                    columns="grid-cols-1 md:grid-cols-3"
                >
                    {(option) => (
                        <span className="flex flex-col gap-1">
                            <span className="flex items-center gap-2 text-sm font-medium">
                                <span className={cn('size-2 rounded-full', option.dot)} aria-hidden="true" />
                                {option.name}
                            </span>
                            <span className="text-xs leading-snug text-muted-foreground">{option.description}</span>
                        </span>
                    )}
                </ChoiceGroup>

                <Field id="description" label="Description" optional>
                    <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        disabled={locked}
                        rows={3}
                        placeholder="What does this server do, and who owns it?"
                    />
                </Field>

                <div className="flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-between">
                    {cancelHref ? (
                        <Button asChild variant="ghost" className="sm:w-auto">
                            <Link href={cancelHref}>Cancel</Link>
                        </Button>
                    ) : (
                        <span />
                    )}
                    <Button type="submit" size="lg" disabled={locked} className={isEdit ? '' : 'justify-between pl-7'}>
                        {loading ? (
                            <>
                                <CircleNotch weight="light" className="animate-spin" />
                                {isEdit ? 'Saving' : 'Processing'}
                            </>
                        ) : (
                            <>
                                {submitLabel || (isEdit ? 'Save changes' : 'Continue')}
                                {!isEdit && <ButtonArrow />}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </form>
    );
};
