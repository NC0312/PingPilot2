'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowLeft, ArrowSquareOut, ArrowUp, Broadcast, Check, Copy, PencilSimple, Plus, Trash, X } from '@phosphor-icons/react';
import { useAuth } from '@/app/context/AuthContext';
import { PageContainer } from '@/app/components/Layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog } from '@/components/ui/dialog';
import { fetchAllServers } from '@/lib/servers';
import { displayUrl } from '@/lib/time';
import { cn } from '@/lib/utils';
import {
    MAX_COMPONENTS, MAX_DESCRIPTION, MAX_LABEL, MAX_TITLE,
    emptyForm, formFromPage, missingServers, moveServer, payloadFromForm, publicUrl, setLabel, slugify, toggleServer, validateForm,
} from '@/lib/statusPageForm';

const idOf = (s) => String(s?._id || s?.id);

/** A switch row: a title, one line of what it does, and a checkbox that reads as a switch */
function Toggle({ id, title, description, checked, onChange }) {
    return (
        <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-4 rounded-xl bg-white/[0.03] px-4 py-3.5 ring-1 ring-white/10">
            <span className="min-w-0">
                <span className="block text-sm font-medium">{title}</span>
                <span className="mt-0.5 block text-[13px] text-muted-foreground">{description}</span>
            </span>
            <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-5 shrink-0 accent-[var(--primary)]" />
        </label>
    );
}

/** The address field with a live "is it free?" answer. `current` is the page's own saved address, which is always fine. */
function useSlugCheck(slug, current, apiRequest) {
    const [state, setState] = useState('idle'); // idle | checking | available | taken | invalid
    const latest = useRef(0);

    useEffect(() => {
        const value = (slug || '').trim().toLowerCase();
        if (!value) { setState('idle'); return undefined; }
        if (value === current) { setState('available'); return undefined; }
        const ticket = ++latest.current;
        setState('checking');
        const timer = setTimeout(async () => {
            try {
                const res = await apiRequest(`/api/status-pages/slug?slug=${encodeURIComponent(value)}`, { method: 'GET' });
                if (ticket !== latest.current) return; // a newer address was typed meanwhile
                const d = res.data || {};
                setState(!d.valid ? 'invalid' : d.available ? 'available' : 'taken');
            } catch {
                if (ticket === latest.current) setState('idle'); // the save itself still checks
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [slug, current, apiRequest]);

    return state;
}

function Editor({ page, servers, branded, onSaved, onCancel, apiRequest }) {
    const [form, setForm] = useState(() => (page ? formFromPage(page) : emptyForm()));
    const [slugTouched, setSlugTouched] = useState(Boolean(page));
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const slugState = useSlugCheck(form.slug, page?.slug, apiRequest);

    const ownedIds = servers.map(idOf);
    const byId = new Map(servers.map((s) => [idOf(s), s]));
    const available = servers.filter((s) => !form.servers.some((c) => c.serverId === idOf(s)));
    const missing = missingServers(form, ownedIds);

    const set = (patch) => setForm((f) => ({ ...f, ...patch }));
    const onTitle = (title) => setForm((f) => ({ ...f, title, ...(slugTouched ? {} : { slug: slugify(title) }) }));

    const submit = async (e) => {
        e.preventDefault();
        const found = validateForm(form);
        setErrors(found);
        if (Object.keys(found).length > 0) return;
        if (slugState === 'taken') return setErrors({ slug: 'That address is already taken.' });
        if (slugState === 'invalid') return setErrors({ slug: 'That address cannot be used. Try another.' });

        setSaving(true);
        setError(null);
        try {
            // Monitors that were deleted since are left out, so one stale entry cannot block the save
            const body = payloadFromForm({ ...form, servers: form.servers.filter((s) => ownedIds.includes(s.serverId)) });
            const res = await apiRequest(page ? `/api/status-pages/${page.id}` : '/api/status-pages', {
                method: page ? 'PATCH' : 'POST',
                body: JSON.stringify(body),
            });
            onSaved(res.data.page, !page);
        } catch (err) {
            setError(err.message || 'Could not save the status page');
        } finally {
            setSaving(false);
        }
    };

    const slugHint = {
        checking: 'Checking…',
        available: form.slug && form.slug !== page?.slug ? 'This address is free.' : undefined,
    }[slugState];
    const slugError = errors.slug || (slugState === 'taken' ? 'That address is already taken.' : slugState === 'invalid' ? 'That address cannot be used. Try another.' : undefined);

    return (
        <form onSubmit={submit} noValidate className="space-y-8">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="-ml-2">
                <ArrowLeft weight="light" />
                All status pages
            </Button>

            {error && <Alert tone="error" title="We couldn’t save this page">{error}</Alert>}

            <section className="bezel-sm">
                <div className="bezel-sm-core space-y-6 p-6 sm:p-8">
                    <h2 className="font-display text-2xl font-medium tracking-tight">{page ? 'Edit status page' : 'New status page'}</h2>

                    <Field id="sp-title" label="Title" error={errors.title} hint="What visitors see at the top, for example your company or product name.">
                        <Input id="sp-title" value={form.title} maxLength={MAX_TITLE} onChange={(e) => onTitle(e.target.value)} aria-invalid={!!errors.title} aria-describedby="sp-title-msg" placeholder="Acme Cloud" autoComplete="off" />
                    </Field>

                    <Field id="sp-slug" label="Address" error={slugError} hint={slugHint || 'Lowercase letters, numbers and hyphens.'}>
                        <div className="flex items-center gap-2">
                            <span className="hidden shrink-0 font-mono text-[13px] text-muted-foreground sm:block">{displayUrl(publicUrl(''))}</span>
                            <Input
                                id="sp-slug"
                                value={form.slug}
                                maxLength={40}
                                onChange={(e) => { setSlugTouched(true); set({ slug: e.target.value.toLowerCase() }); }}
                                aria-invalid={!!slugError}
                                aria-describedby="sp-slug-msg"
                                placeholder="acme-status"
                                spellCheck={false}
                                autoComplete="off"
                                className="font-mono text-[13px]"
                            />
                        </div>
                    </Field>

                    <Field id="sp-description" label="Description" optional error={errors.description} hint="One or two sentences under the title.">
                        <Textarea id="sp-description" value={form.description} maxLength={MAX_DESCRIPTION} onChange={(e) => set({ description: e.target.value })} aria-describedby="sp-description-msg" className="min-h-20" />
                    </Field>
                </div>
            </section>

            <section className="bezel-sm">
                <div className="bezel-sm-core space-y-6 p-6 sm:p-8">
                    <div className="space-y-1.5">
                        <h2 className="font-display text-2xl font-medium tracking-tight">Monitors on this page</h2>
                        <p className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
                            Visitors see each monitor&apos;s name, whether it is up, and its uptime over 30 days. They never see its address or why a check failed.
                        </p>
                    </div>

                    {form.servers.length === 0 ? (
                        <p className="rounded-xl px-4 py-5 text-sm text-muted-foreground ring-1 ring-white/10">No monitors yet. Add some from the list below.</p>
                    ) : (
                        <ul className="space-y-2.5" aria-label="Monitors on this page">
                            {form.servers.map((c, i) => {
                                const owned = byId.get(c.serverId);
                                return (
                                    <li key={c.serverId} className="flex flex-wrap items-center gap-2.5 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
                                        <div className="flex shrink-0 items-center gap-1">
                                            <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => setForm((f) => moveServer(f, c.serverId, -1))} aria-label={`Move ${owned?.name || 'monitor'} up`}><ArrowUp weight="light" /></Button>
                                            <Button type="button" variant="ghost" size="icon-sm" disabled={i === form.servers.length - 1} onClick={() => setForm((f) => moveServer(f, c.serverId, 1))} aria-label={`Move ${owned?.name || 'monitor'} down`}><ArrowDown weight="light" /></Button>
                                        </div>
                                        <div className="min-w-0 flex-1 basis-40">
                                            <p className={cn('truncate text-sm font-medium', !owned && 'text-muted-foreground')}>{owned ? owned.name : 'A monitor you deleted'}</p>
                                            {owned && <p className="truncate font-mono text-xs text-muted-foreground">{displayUrl(owned.url)}</p>}
                                        </div>
                                        <Input
                                            aria-label={`Name shown to visitors for ${owned?.name || 'this monitor'}`}
                                            value={c.label}
                                            maxLength={MAX_LABEL}
                                            onChange={(e) => setForm((f) => setLabel(f, c.serverId, e.target.value))}
                                            placeholder={owned ? owned.name : 'Name'}
                                            className="h-9 basis-48 sm:w-52 sm:flex-none"
                                        />
                                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => setForm((f) => toggleServer(f, c.serverId))} aria-label={`Remove ${owned?.name || 'monitor'} from this page`}><X weight="light" /></Button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    {missing.length > 0 && <p className="text-[13px] text-warning">Monitors that were deleted are left out when you save.</p>}

                    <div className="space-y-2.5">
                        <h3 className="text-sm font-medium">Add a monitor</h3>
                        {servers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                You have no monitors yet. <Link href="/servers/new" className="text-primary underline-offset-4 hover:underline">Add one</Link>, then come back.
                            </p>
                        ) : available.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Every monitor is already on this page.</p>
                        ) : (
                            <ul className="grid gap-2 sm:grid-cols-2">
                                {available.map((s) => (
                                    <li key={idOf(s)}>
                                        <button
                                            type="button"
                                            onClick={() => setForm((f) => toggleServer(f, idOf(s)))}
                                            disabled={form.servers.length >= MAX_COMPONENTS}
                                            className="flex w-full items-center gap-3 rounded-xl bg-white/[0.03] px-3.5 py-3 text-left ring-1 ring-white/10 transition-colors duration-300 hover:bg-white/[0.06] disabled:opacity-50"
                                        >
                                            <Plus weight="light" className="size-4 shrink-0 text-primary" />
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-medium">{s.name}</span>
                                                <span className="block truncate font-mono text-xs text-muted-foreground">{displayUrl(s.url)}</span>
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </section>

            <section className="bezel-sm">
                <div className="bezel-sm-core space-y-3 p-6 sm:p-8">
                    <h2 className="font-display text-2xl font-medium tracking-tight">Visibility</h2>
                    <Toggle id="sp-published" title="Published" description="Anyone with the link can see this page. Turn it off to hide it without deleting it." checked={form.published} onChange={(published) => set({ published })} />
                    <Toggle id="sp-indexable" title="Let search engines list it" description="Off by default. When off, Google and others are asked not to show the page in results." checked={form.indexable} onChange={(indexable) => set({ indexable })} />
                    {branded && <p className="pt-1 text-[13px] text-muted-foreground">Pages on your plan show a small &ldquo;Powered by Ping Pilott&rdquo; line. Pro and Business pages don&apos;t. <Link href="/subscription" className="text-primary underline-offset-4 hover:underline">Compare plans</Link></p>}
                </div>
            </section>

            <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" size="lg" disabled={saving}>{saving ? 'Saving' : page ? 'Save changes' : 'Create status page'}</Button>
                <Button type="button" variant="ghost" size="lg" onClick={onCancel} disabled={saving}>Cancel</Button>
            </div>
        </form>
    );
}

function CopyLinkButton({ slug }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(publicUrl(slug));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // clipboard blocked: the address is shown on the card to copy by hand
        }
    };
    return (
        <Button type="button" variant="outline" size="sm" onClick={copy}>
            {copied ? <Check weight="light" /> : <Copy weight="light" />}
            {copied ? 'Copied' : 'Copy link'}
        </Button>
    );
}

export default function StatusPagesPage() {
    const { apiRequest } = useAuth();
    const [data, setData] = useState(null);
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState(null);
    const [editing, setEditing] = useState(null); // null: the list. 'new', or a page
    const [deleting, setDeleting] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            setError(null);
            const [res, list] = await Promise.all([apiRequest('/api/status-pages', { method: 'GET' }), fetchAllServers(apiRequest)]);
            setData(res.data);
            setServers(list);
        } catch (err) {
            console.error('Error loading status pages:', err);
            setError('We couldn’t load your status pages. Check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }, [apiRequest]);

    useEffect(() => { load(); }, [load]);

    const atLimit = data && data.limit !== null && data.used >= data.limit;

    const saved = async (page, created) => {
        setEditing(null);
        setNotice(created ? `Created ${page.title}.` : `Saved ${page.title}.`);
        await load();
    };

    const confirmDelete = async () => {
        if (!deleting) return;
        setDeleteBusy(true);
        try {
            await apiRequest(`/api/status-pages/${deleting.id}`, { method: 'DELETE' });
            setNotice(`Deleted ${deleting.title}.`);
            setDeleting(null);
            await load();
        } catch (err) {
            setError(err.message || 'Could not delete the status page');
            setDeleting(null);
        } finally {
            setDeleteBusy(false);
        }
    };

    if (editing) {
        return (
            <PageContainer className="space-y-10">
                <Editor
                    page={editing === 'new' ? null : editing}
                    servers={servers}
                    branded={Boolean(data?.branded)}
                    apiRequest={apiRequest}
                    onSaved={saved}
                    onCancel={() => setEditing(null)}
                />
            </PageContainer>
        );
    }

    const description = loading
        ? 'Loading your status pages.'
        : data?.pages.length
            ? `${data.used} of ${data.limit === null ? 'unlimited' : data.limit} used. Share the link with your customers.`
            : 'A public page that shows customers whether your sites are up.';

    return (
        <PageContainer className="space-y-10">
            <PageHeader
                eyebrow="Monitoring"
                title="Status pages"
                description={description}
                actions={
                    <Button onClick={() => { setNotice(null); setEditing('new'); }} disabled={loading || !!error || atLimit}>
                        <Plus weight="light" />
                        New status page
                    </Button>
                }
            />

            {notice && <Alert tone="success" title={notice} />}
            {error && <Alert tone="error" title="Something went wrong" action={<Button size="sm" variant="outline" onClick={() => { setLoading(true); load(); }}>Try again</Button>}>{error}</Alert>}
            {atLimit && (
                <Alert tone="info" title="You are using all the status pages your plan includes">
                    Upgrade to add more. <Link href="/subscription" className="text-primary underline-offset-4 hover:underline">Compare plans</Link>
                </Alert>
            )}

            {loading ? (
                <div className="space-y-3" role="status" aria-label="Loading status pages">
                    <Skeleton className="h-28 w-full rounded-2xl" />
                </div>
            ) : data && data.pages.length === 0 && !error ? (
                <div className="bezel-sm">
                    <div className="bezel-sm-core">
                        <EmptyState
                            icon={Broadcast}
                            title="No status pages yet"
                            description="Pick the monitors you want customers to see and share one link. It updates by itself."
                            action={<Button onClick={() => setEditing('new')}><Plus weight="light" />Create a status page</Button>}
                        />
                    </div>
                </div>
            ) : data && (
                <ul className="space-y-4">
                    {data.pages.map((p) => (
                        <li key={p.id} className="bezel-sm">
                            <div className="bezel-sm-core space-y-4 p-6">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0 space-y-1">
                                        <h2 className="truncate font-display text-xl font-medium tracking-tight">{p.title}</h2>
                                        <p className="truncate font-mono text-[13px] text-muted-foreground">{displayUrl(publicUrl(p.slug))}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {p.published ? <Badge variant="success">Published</Badge> : <Badge variant="secondary">Hidden</Badge>}
                                        {p.indexable && <Badge variant="outline">In search results</Badge>}
                                        <Badge variant="outline">{p.servers.length} monitor{p.servers.length === 1 ? '' : 's'}</Badge>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {p.published && (
                                        <Button asChild variant="outline" size="sm">
                                            <a href={`/status/${p.slug}`} target="_blank" rel="noopener">
                                                <ArrowSquareOut weight="light" />
                                                Open
                                            </a>
                                        </Button>
                                    )}
                                    {p.published && <CopyLinkButton slug={p.slug} />}
                                    <Button type="button" variant="outline" size="sm" onClick={() => { setNotice(null); setEditing(p); }}>
                                        <PencilSimple weight="light" />
                                        Edit
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setDeleting(p)}>
                                        <Trash weight="light" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <Dialog
                open={!!deleting}
                onClose={() => !deleteBusy && setDeleting(null)}
                title={`Delete ${deleting?.title || 'this page'}?`}
                description="The link stops working straight away. Your monitors are not affected."
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setDeleting(null)} disabled={deleteBusy}>Keep it</Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleteBusy}>{deleteBusy ? 'Deleting' : 'Delete page'}</Button>
                    </>
                }
            />
        </PageContainer>
    );
}
