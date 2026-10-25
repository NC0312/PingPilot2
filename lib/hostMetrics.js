// Host metrics on the server page: what the API sends, read safely, and how the page words and checks things.
//
// The backend (utils/hostSeries.js, controllers/hostAgentController.js there) sends, for GET /api/servers/:id/metrics:
//   agent   { enabled, status: 'off'|'waiting'|'connected'|'offline', lastSeenAt, version, hostname, os, arch }
//   latest  the newest reading in full (cpu, load, mem, swap, disks, network, uptime, top processes), or null
//   series  points for the chart, each { t, cpu, cpuMax, memPct, memPctMax, swapPct, load1, rxBps, txBps, disks: [{ mount, pct }] }
//   mounts  the disks that appear in the series
// Nothing here trusts the shape: a field of the wrong type is dropped, and the page gets something it can draw or nothing.
// Pure functions (no React, no network), so they are tested without a browser.

export const PERIODS = [
    { value: '1h', label: '1 hour' },
    { value: '6h', label: '6 hours' },
    { value: '24h', label: '24 hours' },
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
];
export const DEFAULT_PERIOD = '24h';
const PERIOD_WORDS = { '1h': 'the last hour', '6h': 'the last 6 hours', '24h': 'the last 24 hours', '7d': 'the last 7 days', '30d': 'the last 30 days' };
export const periodWords = (value) => (Object.hasOwn(PERIOD_WORDS, value) ? PERIOD_WORDS[value] : PERIOD_WORDS[DEFAULT_PERIOD]);
export const isPeriod = (value) => PERIODS.some((p) => p.value === value);

// ── who can use it (the backend decides; this only avoids offering what it will refuse) ──

const PLAN_CAPS = { free: 0, starter: 3, pro: 15, business: 60 };

/** @returns {{ enabled: boolean, maxServers: number }}  admins always; an unknown plan counts as free */
export function hostMetricsAllowance(user) {
    if (user?.role === 'admin') return { enabled: true, maxServers: Number.MAX_SAFE_INTEGER };
    const tier = String(user?.subscription?.plan || 'free').split('_')[0];
    const max = Object.hasOwn(PLAN_CAPS, tier) ? PLAN_CAPS[tier] : 0;
    return { enabled: max > 0, maxServers: max };
}

// ── reading what the API sent ──

const num = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const str = (value, max = 120) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null);
const STATUSES = ['off', 'waiting', 'connected', 'offline'];

function readPoint(p) {
    const t = num(p?.t);
    if (t === null) return null;
    return {
        t,
        cpu: num(p.cpu),
        cpuMax: num(p.cpuMax),
        memPct: num(p.memPct),
        memPctMax: num(p.memPctMax),
        swapPct: num(p.swapPct),
        load1: num(p.load1),
        rxBps: num(p.rxBps),
        txBps: num(p.txBps),
        disks: Array.isArray(p.disks)
            ? p.disks.map((d) => ({ mount: str(d?.mount, 64), pct: num(d?.pct) })).filter((d) => d.mount && d.pct !== null)
            : [],
    };
}

function readLatest(l) {
    if (!l || typeof l !== 'object') return null;
    const memTotal = num(l.mem?.total);
    if (num(l.cpu) === null || memTotal === null) return null;
    const load = Array.isArray(l.load) && l.load.length === 3 && l.load.every((v) => num(v) !== null) ? l.load : null;
    return {
        t: num(l.t),
        cpu: l.cpu,
        cores: num(l.cores),
        load,
        mem: { used: num(l.mem.used) ?? 0, total: memTotal, pct: num(l.mem.pct) ?? 0 },
        swap: l.swap && num(l.swap.total) ? { used: num(l.swap.used) ?? 0, total: l.swap.total, pct: num(l.swap.pct) ?? 0 } : null,
        disks: Array.isArray(l.disks)
            ? l.disks.map((d) => ({ mount: str(d?.mount, 64), used: num(d?.used) ?? 0, total: num(d?.total) ?? 0, pct: num(d?.pct) ?? 0 })).filter((d) => d.mount && d.total > 0)
            : [],
        rxBps: num(l.rxBps),
        txBps: num(l.txBps),
        uptimeSec: num(l.uptimeSec),
        procs: Array.isArray(l.procs)
            ? l.procs.map((p) => ({ name: str(p?.name, 64), cpu: num(p?.cpu) ?? 0, mem: num(p?.mem) ?? 0 })).filter((p) => p.name).slice(0, 5)
            : [],
    };
}

/**
 * @param {any} response  what apiRequest returned: { status, data: { agent, latest, series, mounts, period, binSeconds } }
 * @returns {{ agent, latest, series, mounts, period, binSeconds }}  always usable, never throws
 */
export function readMetrics(response) {
    const data = response?.data ?? {};
    const agent = data.agent ?? {};
    const status = STATUSES.includes(agent.status) ? agent.status : (agent.enabled ? 'waiting' : 'off');
    const series = (Array.isArray(data.series) ? data.series : []).map(readPoint).filter(Boolean).sort((a, b) => a.t - b.t);
    return {
        agent: {
            enabled: agent.enabled === true,
            status,
            lastSeenAt: str(agent.lastSeenAt, 40),
            version: str(agent.version, 24),
            hostname: str(agent.hostname, 64),
            os: str(agent.os, 32),
            arch: str(agent.arch, 16),
        },
        latest: readLatest(data.latest),
        series,
        mounts: (Array.isArray(data.mounts) ? data.mounts : []).map((m) => str(m, 64)).filter(Boolean).slice(0, 16),
        period: isPeriod(data.period) ? data.period : DEFAULT_PERIOD,
        binSeconds: num(data.binSeconds) ?? 0,
    };
}

// ── words and numbers ──

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

/** 1536 → "1.5 KB". Binary units, shown the way people read them. */
export function formatBytes(bytes) {
    const n = num(bytes);
    if (n === null || n < 0) return '—';
    let value = n;
    let unit = 0;
    while (value >= 1024 && unit < UNITS.length - 1) { value /= 1024; unit += 1; }
    const digits = value >= 100 || unit === 0 ? 0 : 1;
    return `${value.toFixed(digits)} ${UNITS[unit]}`;
}

export const formatRate = (bps) => (num(bps) === null ? '—' : `${formatBytes(bps)}/s`);

export function formatPercent(value, digits = 0) {
    const n = num(value);
    return n === null ? '—' : `${n.toFixed(digits)}%`;
}

/** 93784 → "1 d 2 h", 4000 → "1 h 6 min", 90 → "1 min" */
export function formatUptime(seconds) {
    const s = num(seconds);
    if (s === null || s < 0) return '—';
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d) return `${d} d ${h} h`;
    if (h) return `${h} h ${m} min`;
    return `${Math.max(1, m)} min`;
}

/** How full something is, as the word a person would use: for the bar's colour and for those who cannot see it */
export function levelOf(pct) {
    const n = num(pct);
    if (n === null) return 'unknown';
    if (n >= 90) return 'critical';
    if (n >= 75) return 'high';
    return 'ok';
}

/**
 * The agent's state in words, and what to do about it.
 * @returns {{ label: string, tone: 'success'|'warning'|'muted', hint: string|null }}
 */
export function agentState(agent, now = Date.now(), ago = (t) => String(t)) {
    switch (agent?.status) {
        case 'connected':
            return { label: 'Connected', tone: 'success', hint: null };
        case 'offline':
            return {
                label: 'Not reporting',
                tone: 'warning',
                hint: `Last heard ${agent.lastSeenAt ? ago(agent.lastSeenAt, now) : 'a while ago'}. Check the server is on and the agent is running: systemctl status pingpilot-agent`,
            };
        case 'waiting':
            return { label: 'Waiting for the first reading', tone: 'muted', hint: 'Run the install command on the server. This page updates by itself.' };
        default:
            return { label: 'Off', tone: 'muted', hint: null };
    }
}

// ── charts ──

/** One line for people who cannot see the chart: what it shows, over what time, and the range of it */
export function summarise(series, key, label, unit, period) {
    const values = series.map((p) => p[key]).filter((v) => num(v) !== null);
    if (values.length === 0) return `${label}: no data for ${periodWords(period)}.`;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return `${label} over ${periodWords(period)}: average ${Math.round(avg)}${unit}, lowest ${Math.round(Math.min(...values))}${unit}, highest ${Math.round(Math.max(...values))}${unit}.`;
}

/** The disks to draw as lines: all of them up to a handful, the fullest first */
export function disksToChart(series, mounts, max = 4) {
    const worst = new Map();
    for (const p of series) for (const d of p.disks) worst.set(d.mount, Math.max(worst.get(d.mount) ?? 0, d.pct));
    return [...mounts].sort((a, b) => (worst.get(b) ?? 0) - (worst.get(a) ?? 0)).slice(0, max);
}

/** Series rows for a chart with one line per disk: { t, '/': 40, '/data': 71 } */
export const diskRows = (series) => series.map((p) => ({ t: p.t, ...Object.fromEntries(p.disks.map((d) => [d.mount, d.pct])) }));

// ── the alert limits ──

export const LIMITS = { percent: [1, 100], minutes: [0, 60], missingMinutes: [2, 60] };
export const DEFAULT_LIMITS = {
    enabled: true,
    cpu: { percent: 90, minutes: 5 },
    memory: { percent: 90, minutes: 5 },
    disk: { percent: 90, minutes: 2 },
    missing: { minutes: 5 },
};

const wholeOr = (value, fallback) => (typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback);

/** The limits in force for a server: what it saved over the defaults, as the backend works them out */
export function limitsFromServer(saved) {
    const s = saved && typeof saved === 'object' ? saved : {};
    const part = (key) => ({
        percent: wholeOr(s[key]?.percent, DEFAULT_LIMITS[key].percent),
        minutes: wholeOr(s[key]?.minutes, DEFAULT_LIMITS[key].minutes),
    });
    return { enabled: s.enabled !== false, cpu: part('cpu'), memory: part('memory'), disk: part('disk'), missing: { minutes: wholeOr(s.missing?.minutes, DEFAULT_LIMITS.missing.minutes) } };
}

const FIELDS = [
    ['cpu', 'percent', 'CPU limit', LIMITS.percent], ['cpu', 'minutes', 'CPU time', LIMITS.minutes],
    ['memory', 'percent', 'Memory limit', LIMITS.percent], ['memory', 'minutes', 'Memory time', LIMITS.minutes],
    ['disk', 'percent', 'Disk limit', LIMITS.percent], ['disk', 'minutes', 'Disk time', LIMITS.minutes],
    ['missing', 'minutes', 'No-data time', LIMITS.missingMinutes],
];

/**
 * Check what the form holds (numbers typed as text) and turn it into what the API takes.
 * @param {{ enabled: boolean, cpu: {percent: string|number, minutes: ...}, ... }} form
 * @returns {{ ok: boolean, errors: Record<string, string>, payload: object|null }}  errors are keyed "cpu.percent" and are in plain words
 */
export function checkLimits(form) {
    const errors = {};
    const hostAlerts = { enabled: form.enabled !== false };
    for (const [group, field, label, [min, max]] of FIELDS) {
        const raw = form[group]?.[field];
        const text = typeof raw === 'number' ? String(raw) : String(raw ?? '').trim();
        const n = Number(text);
        if (text === '' || !Number.isFinite(n)) errors[`${group}.${field}`] = `${label}: enter a number from ${min} to ${max}.`;
        else if (!Number.isInteger(n)) errors[`${group}.${field}`] = `${label}: use a whole number.`;
        else if (n < min || n > max) errors[`${group}.${field}`] = `${label}: use ${min} to ${max}.`;
        else (hostAlerts[group] ||= {})[field] = n;
    }
    return Object.keys(errors).length ? { ok: false, errors, payload: null } : { ok: true, errors: {}, payload: { monitoring: { hostAlerts } } };
}

// ── the install dialog ──

/** The ways to install, from what the API returned with the token. Anything it did not give is left out, never guessed. */
export function installOptions(install) {
    const options = [];
    const text = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
    if (text(install?.command)) options.push({ id: 'linux', label: 'Linux server', intro: 'Run this on the server as a user that can use sudo. It checks what it downloads before installing.', command: text(install.command) });
    if (text(install?.docker)) options.push({ id: 'docker', label: 'Docker host', intro: 'Run this on a host that runs containers. The agent reports on the machine, not on its own container, so it is given the machine.', command: text(install.docker) });
    return options;
}

export default { PERIODS, DEFAULT_PERIOD, hostMetricsAllowance, readMetrics, formatBytes, formatRate, formatPercent, formatUptime, levelOf, agentState, summarise, checkLimits, limitsFromServer, installOptions };
