// The form for a status page: what it holds, how it is checked, and what it sends.
//
// The backend (utils/statusPage.js there) is the authority on every rule; this only catches the obvious mistakes before
// a round trip and builds the request. A page lists monitors in the order the owner picks, each with an optional
// display name that visitors see instead of the monitor's own.

import { SLUG_PATTERN } from './statusPage.js';
import { SITE_URL } from './site.js';

export const MAX_TITLE = 80;
export const MAX_DESCRIPTION = 300;
export const MAX_LABEL = 60;
export const MAX_COMPONENTS = 50;

export const emptyForm = () => ({ title: '', slug: '', description: '', servers: [], published: true, indexable: false });

/** The form for a saved page (the backend's owner view) */
export const formFromPage = (page) => ({
    title: page?.title || '',
    slug: page?.slug || '',
    description: page?.description || '',
    servers: Array.isArray(page?.servers) ? page.servers.map((s) => ({ serverId: String(s.serverId), label: s.label || '' })) : [],
    published: Boolean(page?.published),
    indexable: Boolean(page?.indexable),
});

/** A suggested address from a title: "Acme Cloud, Inc." becomes "acme-cloud-inc". Empty when too little is left to use. */
export function slugify(text) {
    const slug = String(text || '')
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40)
        .replace(/-+$/g, '');
    return slug.length >= 3 ? slug : '';
}

/** @returns {{ title?: string, slug?: string, description?: string }}  a message for each field that is not right */
export function validateForm(form) {
    const errors = {};
    const title = (form.title || '').trim();
    if (!title) errors.title = 'Give the page a title.';
    else if (title.length > MAX_TITLE) errors.title = `Use at most ${MAX_TITLE} characters.`;

    const slug = (form.slug || '').trim().toLowerCase();
    if (!slug) errors.slug = 'Choose an address for the page.';
    else if (!SLUG_PATTERN.test(slug)) errors.slug = 'Use 3 to 40 lowercase letters, numbers and hyphens, starting and ending with a letter or number.';

    if ((form.description || '').trim().length > MAX_DESCRIPTION) errors.description = `Use at most ${MAX_DESCRIPTION} characters.`;
    return errors;
}

/** What to send. Labels are trimmed and an empty one is sent as nothing, so the monitor's own name shows. */
export const payloadFromForm = (form) => ({
    slug: (form.slug || '').trim().toLowerCase(),
    title: (form.title || '').trim(),
    description: (form.description || '').trim(),
    servers: form.servers.map((s) => ({ serverId: s.serverId, label: (s.label || '').trim().slice(0, MAX_LABEL) })),
    published: Boolean(form.published),
    indexable: Boolean(form.indexable),
});

/** Add a monitor to the end of the list, or take it off when it is already there */
export function toggleServer(form, serverId) {
    const id = String(serverId);
    const on = form.servers.some((s) => s.serverId === id);
    if (on) return { ...form, servers: form.servers.filter((s) => s.serverId !== id) };
    if (form.servers.length >= MAX_COMPONENTS) return form;
    return { ...form, servers: [...form.servers, { serverId: id, label: '' }] };
}

export const setLabel = (form, serverId, label) => ({
    ...form,
    servers: form.servers.map((s) => (s.serverId === String(serverId) ? { ...s, label: label.slice(0, MAX_LABEL) } : s)),
});

/** Move a listed monitor up (-1) or down (1); at either end it stays put */
export function moveServer(form, serverId, delta) {
    const from = form.servers.findIndex((s) => s.serverId === String(serverId));
    const to = from + delta;
    if (from === -1 || to < 0 || to >= form.servers.length) return form;
    const servers = [...form.servers];
    [servers[from], servers[to]] = [servers[to], servers[from]];
    return { ...form, servers };
}

/** Monitors a page lists that the owner no longer has (deleted since), so the editor can say so */
export const missingServers = (form, ownedIds) => form.servers.filter((s) => !ownedIds.includes(s.serverId));

/** The address people open */
export const publicUrl = (slug) => `${SITE_URL}/status/${slug}`;
