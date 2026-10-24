'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Globe, HardDrives, Plugs, Database, CircleNotch, CaretDown } from '@phosphor-icons/react';
import { Button, ButtonArrow } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// Only "high" changes behaviour today (those monitors are checked first when the queue is busy),
// so the copy says that instead of promising faster checks.
const priorityOptions = [
    { id: 'high', name: 'High', dot: 'bg-destructive', description: 'Checked first when the queue is busy' },
    { id: 'medium', name: 'Medium', dot: 'bg-warning', description: 'The default for most servers' },
    { id: 'low', name: 'Low', dot: 'bg-primary', description: 'For services that can wait' },
];

const serverTypes = [
    { id: 'website', name: 'Website', icon: Globe },
    { id: 'api', name: 'API', icon: HardDrives },
    { id: 'tcp', name: 'TCP', icon: Plugs },
    { id: 'database', name: 'Database', icon: Database },
];

const ADDRESS_COPY = {
    website: { label: 'Website address', placeholder: 'example.com', hint: 'Paste the address. We add https:// if you leave it out.' },
    api: { label: 'API address', placeholder: 'api.example.com/health', hint: 'Any endpoint that answers when the service is healthy.' },
    tcp: { label: 'Host and port', placeholder: 'db.example.com:5432', hint: 'Host and port, no protocol.' },
    database: { label: 'Host and port', placeholder: 'db.example.com:5432', hint: 'Host and port, or a full address like postgres://host:5432.' },
};

const HOST_PORT = /^[\w.-]+(?::\d{1,5})?$/;
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

// Websites and APIs are usually pasted without the protocol; add it rather than reject them.
const withProtocol = (raw, type) => {
    const url = raw.trim();
    if (!url || /\s/.test(url) || (type !== 'website' && type !== 'api')) return url;
    return HAS_SCHEME.test(url) ? url : `https://${url}`;
};

// "https://www.shop.example.com/path" -> "shop.example.com"
const nameFromAddress = (raw) => {
    try {
        const host = new URL(HAS_SCHEME.test(raw) ? raw : `https://${raw}`).hostname;
        return host.replace(/^www\./, '');
    } catch {
        return '';
    }
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
    onDirtyChange,
    savedKey,
}) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        url: initialData?.url || '',
        type: initialData?.type || 'website',
        description: initialData?.description || '',
        priority: initialData?.priority || 'medium',
    });

    const [validationErrors, setValidationErrors] = useState({});

    // Unsaved-change tracking for pages that edit an existing server. `savedKey` changes after each
    // successful save, which makes the current values the new baseline.
    const [baseline, setBaseline] = useState(() => JSON.stringify(formData));
    const dirty = JSON.stringify(formData) !== baseline;
    useEffect(() => {
        onDirtyChange?.(dirty);
    }, [dirty, onDirtyChange]);
    const firstSavedKey = useRef(savedKey);
    useEffect(() => {
        if (savedKey !== firstSavedKey.current) setBaseline(JSON.stringify(formData));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [savedKey]);
    // Adding a server asks for the essentials first; priority and description wait behind a disclosure.
    // Editing shows everything, and so does going back to a step that already has values in them.
    const [showMore, setShowMore] = useState(
        isEdit || initialData?.priority !== undefined && initialData?.priority !== 'medium' || !!initialData?.description
    );
    // Once the user types a name themselves we stop suggesting one from the address.
    const nameTouched = useRef(!!initialData?.name);

    const setField = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear validation error when field is edited
        if (validationErrors[name]) {
            setValidationErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const handleChange = (e) => {
        if (e.target.name === 'name') nameTouched.current = true;
        setField(e.target.name, e.target.value);
    };

    // On leaving the address box: tidy it up and suggest a name.
    const handleUrlBlur = () => {
        const tidy = withProtocol(formData.url, formData.type);
        setFormData((prev) => ({
            ...prev,
            url: tidy,
            name: !isEdit && !nameTouched.current && !prev.name.trim() ? nameFromAddress(tidy) : prev.name,
        }));
    };

    const validateUrl = (raw, type) => {
        const url = raw.trim();
        const hostPort = HOST_PORT.test(url) && !(url.includes(':') && Number(url.split(':').pop()) > 65535);

        // TCP services are a bare host and optional port, like 123.123.123.123:8080
        if (type === 'tcp') return hostPort;

        // `new URL` happily parses "localhost:3000" or "mailto:a@b.c", so check the protocol and host too.
        let parsed = null;
        try {
            parsed = new URL(url);
        } catch (e) {
            parsed = null;
        }

        // Databases can be a host:port or a connection-style URL (postgres://host:5432)
        if (type === 'database') return hostPort || (!!parsed && !!parsed.hostname);

        // Websites and APIs must be real http(s) addresses
        return !!parsed && /^https?:$/.test(parsed.protocol) && !!parsed.hostname;
    };

    const validateForm = (data) => {
        const errors = {};

        if (!data.url.trim()) {
            errors.url = 'Enter the address to monitor.';
        } else if (!validateUrl(data.url, data.type)) {
            errors.url =
                data.type === 'tcp'
                    ? 'Use the host:port format, for example db.example.com:5432.'
                    : data.type === 'database'
                        ? 'Use host:port, for example db.example.com:5432, or a full address like postgres://db.example.com:5432.'
                        : 'That doesn’t look like a web address. Try something like example.com.';
        }

        if (!data.name.trim()) {
            errors.name = 'Give this server a name so you can recognise it later.';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Pressing Enter in the address box skips its blur, so tidy here too.
        const url = withProtocol(formData.url, formData.type);
        const data = {
            ...formData,
            url,
            name: (formData.name.trim() || (!isEdit ? nameFromAddress(url) : '')),
        };
        if (validateForm(data)) {
            setFormData(data);
            onSubmit({ ...data, name: data.name.trim(), url: data.url.trim() });
        } else {
            setFormData(data);
        }
    };

    // Disable form if server limit is reached for non-admin users
    const isFormDisabled = !isEdit && userPlan !== 'admin' && serverCount >= maxServers;
    const locked = isFormDisabled || loading;
    const copy = ADDRESS_COPY[formData.type] || ADDRESS_COPY.website;

    const priorityGroup = (
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
    );

    const descriptionField = (
        <Field id="description" label="Note" optional hint="Visible only to you. Handy for who owns it or what it does.">
            <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={locked}
                rows={3}
                placeholder="Production checkout API, owned by the payments team"
            />
        </Field>
    );

    return (
        <form onSubmit={handleSubmit} noValidate className="bezel-sm" aria-label={isEdit ? 'General settings' : 'Server details'}>
            <div className="bezel-sm-core space-y-7 p-6 sm:p-8">
                <div className="space-y-1.5">
                    <h2 className="font-display text-xl font-medium tracking-tight">{isEdit ? 'General' : 'What should we watch?'}</h2>
                    <p className="text-sm text-muted-foreground">
                        {isEdit ? 'Name, address and priority for this monitor.' : 'Paste an address. The next step covers how often to check and who to alert.'}
                    </p>
                </div>

                {error && <Alert tone="error" title="We couldn’t add this server">{error}</Alert>}

                {/* Type first when adding: it decides what the address looks like */}
                <ChoiceGroup
                    legend="What kind of server is it?"
                    name="type"
                    value={formData.type}
                    onChange={(v) => {
                        setField('type', v);
                        // The address rules differ per type, so an old address error no longer applies.
                        setValidationErrors((prev) => ({ ...prev, url: null }));
                    }}
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

                <div className="grid gap-6 md:grid-cols-2">
                    <Field id="url" label={copy.label} error={validationErrors.url} hint={copy.hint} className="md:col-span-2">
                        <Input
                            id="url"
                            name="url"
                            value={formData.url}
                            onChange={handleChange}
                            onBlur={handleUrlBlur}
                            disabled={locked}
                            placeholder={copy.placeholder}
                            aria-invalid={!!validationErrors.url}
                            aria-describedby="url-msg"
                            className="font-mono text-[13px]"
                            inputMode="url"
                            autoComplete="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            autoFocus={!isEdit}
                        />
                    </Field>

                    <Field id="name" label="Name" error={validationErrors.name} hint={!validationErrors.name ? 'Shown on your dashboard and in alerts.' : undefined} className="md:col-span-2">
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={locked}
                            placeholder="Production API"
                            aria-invalid={!!validationErrors.name}
                            aria-describedby="name-msg"
                            autoComplete="off"
                        />
                    </Field>
                </div>

                {showMore ? (
                    <div className="space-y-7">
                        {priorityGroup}
                        {descriptionField}
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setShowMore(true)}
                        aria-expanded="false"
                        className="group -mt-1 inline-flex min-h-11 items-center gap-2 rounded-full text-sm text-muted-foreground transition-colors duration-300 ease-fluid hover:text-foreground"
                    >
                        <CaretDown weight="light" className="size-4 transition-transform duration-500 ease-fluid group-hover:translate-y-0.5" aria-hidden="true" />
                        More options: priority and a note
                    </button>
                )}

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
