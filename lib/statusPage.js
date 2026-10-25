// What the public status page shows, and how it asks the backend for it.
//
// The backend decides what a stranger may see (GET /api/public/status/:slug returns a display name, a state, daily
// uptime and incident times, nothing else). This reads that answer defensively, so an odd or older response renders
// as an empty section instead of breaking the page, and turns states into words and colours.

import { getApiUrl } from './apiConfig.js';

/** The same shape the backend accepts: 3 to 40 lowercase letters, numbers and single hyphens */
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){1,38}[a-z0-9]$/;

export const REVALIDATE_SECONDS = 60;

/** The banner at the top: one line for how everything is doing */
export const OVERALL = {
    operational: { label: 'All systems operational', tone: 'success' },
    degraded: { label: 'Some systems are running slowly', tone: 'warning' },
    partial: { label: 'Some systems are having problems', tone: 'warning' },
    major: { label: 'Major outage', tone: 'error' },
    unknown: { label: 'Status unavailable', tone: 'muted' },
};

export const COMPONENT = {
    operational: { label: 'Operational', tone: 'success' },
    degraded: { label: 'Slow', tone: 'warning' },
    down: { label: 'Down', tone: 'error' },
    unknown: { label: 'No data yet', tone: 'muted' },
};

const DAY_STATES = ['ok', 'minor', 'major', 'none'];

const text = (value, fallback = '') => (typeof value === 'string' ? value : fallback);
const number = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Month names are written out here, not taken from the browser's locale data, which spells September "Sep" or "Sept"
// depending on the version and would make the server render and the browser disagree.
const shortDate = (date) => `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
const pad = (n) => String(n).padStart(2, '0');

/** One monitor's day on the bar, as a tooltip: "26 Sep: 99.9% uptime", "26 Sep: no data" */
export function dayTitle(day) {
    const date = new Date(`${day.date}T00:00:00Z`);
    const when = Number.isNaN(date.getTime()) ? day.date : shortDate(date);
    return day.uptime === null ? `${when}: no data` : `${when}: ${day.uptime}% uptime`;
}

/** A moment in UTC, so the server render and the browser agree: "25 Oct, 10:30 UTC" */
export function formatUtc(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return `${shortDate(date)}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
}

/** How many of a monitor's days had a bad patch or worse, for the screen-reader summary of the bar */
export const problemDays = (days) => days.filter((d) => d.state === 'minor' || d.state === 'major').length;

/**
 * The backend's answer, made safe to render. Unknown states become "unknown", missing lists become empty ones, and
 * anything that is not the right type is dropped.
 */
export function normalizeStatus(data) {
    const d = data && typeof data === 'object' ? data : {};
    const components = (Array.isArray(d.components) ? d.components : []).map((c, i) => ({
        id: text(c?.id, String(i)),
        name: text(c?.name, 'Service'),
        state: COMPONENT[c?.state] ? c.state : 'unknown',
        uptime: number(c?.uptime),
        days: (Array.isArray(c?.days) ? c.days : []).map((day) => ({
            date: text(day?.date),
            uptime: number(day?.uptime),
            state: DAY_STATES.includes(day?.state) ? day.state : 'none',
        })),
    }));
    const incidents = (Array.isArray(d.incidents) ? d.incidents : []).map((i) => ({
        name: text(i?.name, 'Service'),
        startedAt: text(i?.startedAt),
        endedAt: typeof i?.endedAt === 'string' ? i.endedAt : null,
        ongoing: Boolean(i?.ongoing),
        durationMs: number(i?.durationMs),
    }));
    return {
        title: text(d.title, 'Status'),
        description: text(d.description),
        slug: text(d.slug),
        indexable: d.indexable === true,
        overall: OVERALL[d.overall] ? d.overall : 'unknown',
        components,
        incidents,
        poweredBy: d.poweredBy === true,
        generatedAt: text(d.generatedAt),
    };
}

/**
 * Fetch a published page for the server render. Returns null when there is no such page. Throws when the backend cannot
 * be reached or is failing: the page cache then keeps showing the last good copy instead of caching an error.
 * The request is cached by Next for a minute, so the page's title and body share one fetch.
 */
export async function fetchPublicStatus(slug) {
    if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug)) return null;

    const response = await fetch(getApiUrl(`/api/public/status/${slug}`), {
        next: { revalidate: REVALIDATE_SECONDS },
        headers: { Accept: 'application/json' },
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Status page request failed (${response.status})`);

    const body = await response.json();
    return normalizeStatus(body?.data);
}
