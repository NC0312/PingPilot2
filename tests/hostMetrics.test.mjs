// Run with: npm test
// Host metrics on the server page: the API's answer read safely, the words and numbers, the alert limits, the install options.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
    PERIODS, DEFAULT_PERIOD, periodWords, isPeriod, hostMetricsAllowance, readMetrics, formatBytes, formatRate, formatPercent,
    formatUptime, levelOf, agentState, summarise, disksToChart, diskRows, checkLimits, limitsFromServer, DEFAULT_LIMITS, LIMITS, installOptions
} from '../lib/hostMetrics.js';

// A real answer from the backend's metrics controller (captured from a live run of the agent), with the machine's name changed
const real = JSON.parse(fs.readFileSync(new URL('./fixtures/hostMetricsResponse.json', import.meta.url), 'utf8'));

// ── the real answer ──

test('what the backend really sends is read in full', () => {
    const m = readMetrics(real);
    assert.equal(m.agent.status, 'connected');
    assert.equal(m.agent.hostname, 'web-1');
    assert.equal(m.agent.version, '0.1.0');
    assert.equal(m.period, '1h');
    assert.equal(m.series.length, 4);
    assert.deepEqual(m.mounts, ['D:', 'C:']);
    assert.equal(m.latest.cores, 12);
    assert.equal(m.latest.mem.pct, 81.9);
    assert.equal(m.latest.disks.length, 2);
    assert.equal(m.latest.procs.length, 5);
    assert.equal(m.latest.load, null, 'a machine with no load average says null, and that is fine');
    assert.ok(m.series.every((p) => Number.isFinite(p.t) && Number.isFinite(p.cpu) && Number.isFinite(p.memPct)));
    assert.equal(m.series[0].rxBps, null, 'the first reading has no network rate');
    assert.ok(m.series[3].rxBps > 0);
    assert.deepEqual(m.series.map((p) => p.t), [...m.series.map((p) => p.t)].sort((a, b) => a - b));
});

test('a server with no agent, and one waiting for its first reading, are read as such', () => {
    const off = readMetrics({ data: { agent: { enabled: false, status: 'off' }, series: [], latest: null, mounts: [] } });
    assert.deepEqual([off.agent.enabled, off.agent.status, off.series, off.latest], [false, 'off', [], null]);
    const waiting = readMetrics({ data: { agent: { enabled: true, status: 'waiting' }, series: [], latest: null } });
    assert.equal(waiting.agent.status, 'waiting');
});

test('anything else the API might send, or fail to, gives something the page can draw', () => {
    for (const nothing of [null, undefined, {}, { data: null }, { data: 'x' }, 5, [], { data: { agent: 7, series: 'no', latest: 3, mounts: 4 } }]) {
        const m = readMetrics(nothing);
        assert.deepEqual([m.series, m.latest, m.mounts], [[], null, []], JSON.stringify(nothing));
        assert.equal(m.agent.enabled, false);
        assert.equal(m.agent.status, 'off');
        assert.equal(m.period, DEFAULT_PERIOD);
    }
});

test('fields of the wrong type are dropped one by one, without losing the rest', () => {
    const m = readMetrics({ data: {
        agent: { enabled: true, status: 'exploded', hostname: 5, version: '  1.2.3  ' },
        period: '99y',
        series: [{ t: 2, cpu: 'x', memPct: 5 }, { t: 'x', cpu: 1 }, null, { t: 1, cpu: 7, disks: [{ mount: '/', pct: 5 }, { mount: '', pct: 1 }, { mount: '/x', pct: 'z' }, null] }],
        latest: { cpu: 5, mem: { total: 100, used: 'x', pct: null }, disks: [{ mount: '/', total: 0 }, { mount: '/a', total: 10, used: 5, pct: 50 }], procs: [{ name: 'a' }, { name: '' }, { name: 'b', cpu: 'x' }] },
        mounts: ['/', '', 5],
    } });
    assert.equal(m.agent.status, 'waiting', 'an unknown status on an enabled agent reads as waiting');
    assert.equal(m.agent.hostname, null);
    assert.equal(m.agent.version, '1.2.3');
    assert.equal(m.period, DEFAULT_PERIOD);
    assert.deepEqual(m.series.map((p) => p.t), [1, 2], 'a point with no time is dropped, and the rest are in order');
    assert.equal(m.series[1].cpu, null);
    assert.deepEqual(m.series[0].disks, [{ mount: '/', pct: 5 }]);
    assert.equal(m.latest.mem.used, 0);
    assert.deepEqual(m.latest.disks.map((d) => d.mount), ['/a']);
    assert.deepEqual(m.latest.procs.map((p) => p.name), ['a', 'b']);
    assert.deepEqual(m.mounts, ['/']);
});

test('a latest reading with no CPU or memory is no reading, rather than a page of zeros', () => {
    assert.equal(readMetrics({ data: { latest: { cpu: 5 } } }).latest, null);
    assert.equal(readMetrics({ data: { latest: { mem: { total: 5 } } } }).latest, null);
});

test('very long text is cut, and the lists are bounded', () => {
    const m = readMetrics({ data: { agent: { hostname: 'h'.repeat(500) }, latest: { cpu: 1, mem: { total: 1 }, procs: Array.from({ length: 20 }, (_, i) => ({ name: `p${i}` })) }, mounts: Array.from({ length: 50 }, (_, i) => `/m${i}`) } });
    assert.equal(m.agent.hostname.length, 64);
    assert.equal(m.latest.procs.length, 5);
    assert.equal(m.mounts.length, 16);
});

// ── periods and plans ──

test('the ranges, and the default, are the ones the backend serves; anything else is not a range', () => {
    assert.deepEqual(PERIODS.map((p) => p.value), ['1h', '6h', '24h', '7d', '30d']);
    assert.equal(DEFAULT_PERIOD, '24h');
    for (const p of PERIODS) assert.ok(isPeriod(p.value) && periodWords(p.value).startsWith('the last'));
    for (const bad of ['1y', '', 'constructor', '__proto__', undefined, 5]) {
        assert.equal(isPeriod(bad), false, String(bad));
        assert.equal(periodWords(bad), 'the last 24 hours', String(bad));
    }
});

test('paid plans and admins are offered it, free and unknown plans are not, with the same caps as the backend', () => {
    const allow = (plan, role) => hostMetricsAllowance({ role, subscription: { plan } });
    assert.deepEqual(allow('free'), { enabled: false, maxServers: 0 });
    assert.deepEqual(allow('starter_monthly'), { enabled: true, maxServers: 3 });
    assert.deepEqual(allow('pro_yearly'), { enabled: true, maxServers: 15 });
    assert.deepEqual(allow('business_monthly'), { enabled: true, maxServers: 60 });
    for (const odd of ['gold', '', undefined, 'constructor', '__proto__']) assert.equal(allow(odd).enabled, false, String(odd));
    assert.equal(allow('free', 'admin').enabled, true);
    assert.equal(hostMetricsAllowance(null).enabled, false);
});

// ── words and numbers ──

test('sizes, rates, percentages and times are written the way people read them', () => {
    assert.equal(formatBytes(0), '0 B');
    assert.equal(formatBytes(1023), '1023 B');
    assert.equal(formatBytes(1536), '1.5 KB');
    assert.equal(formatBytes(3 * 1024 ** 3), '3.0 GB');
    assert.equal(formatBytes(250 * 1024 ** 3), '250 GB');
    assert.equal(formatBytes(1024 ** 5 * 3), '3.0 PB');
    for (const odd of [null, undefined, -1, NaN, 'x', Infinity]) assert.equal(formatBytes(odd), '—', String(odd));
    assert.equal(formatRate(2048), '2.0 KB/s');
    assert.equal(formatRate(null), '—');
    assert.equal(formatPercent(37.46), '37%');
    assert.equal(formatPercent(37.46, 1), '37.5%');
    assert.equal(formatPercent(null), '—');
    assert.equal(formatUptime(30), '1 min');
    assert.equal(formatUptime(4000), '1 h 6 min');
    assert.equal(formatUptime(93784), '1 d 2 h');
    assert.equal(formatUptime(-5), '—');
});

test('how full something is has a word as well as a colour', () => {
    assert.deepEqual([10, 74.9, 75, 89.9, 90, 100].map(levelOf), ['ok', 'ok', 'high', 'high', 'critical', 'critical']);
    assert.equal(levelOf(null), 'unknown');
});

test('each state of the agent says what it is and what to do', () => {
    const ago = (t) => `at ${t}`;
    assert.deepEqual(agentState({ status: 'connected' }, 0, ago), { label: 'Connected', tone: 'success', hint: null });
    const off = agentState({ status: 'offline', lastSeenAt: '12:03' }, 0, ago);
    assert.equal(off.tone, 'warning');
    assert.match(off.hint, /Last heard at 12:03/);
    assert.match(off.hint, /systemctl status pingpilot-agent/);
    assert.match(agentState({ status: 'offline' }, 0, ago).hint, /Last heard a while ago/);
    const waiting = agentState({ status: 'waiting' });
    assert.equal(waiting.label, 'Waiting for the first reading');
    assert.match(waiting.hint, /updates by itself/);
    assert.equal(agentState({ status: 'off' }).label, 'Off');
    assert.equal(agentState(undefined).label, 'Off');
});

// ── charts ──

test('each chart has a sentence for people who cannot see it', () => {
    const series = [{ cpu: 10 }, { cpu: 30 }, { cpu: 50 }, { cpu: null }];
    assert.equal(summarise(series, 'cpu', 'CPU', '%', '24h'), 'CPU over the last 24 hours: average 30%, lowest 10%, highest 50%.');
    assert.equal(summarise([], 'cpu', 'CPU', '%', '1h'), 'CPU: no data for the last hour.');
    assert.equal(summarise([{ cpu: null }], 'cpu', 'CPU', '%', '7d'), 'CPU: no data for the last 7 days.');
});

test('the disks to draw are the fullest few, and each row has one value per disk', () => {
    const series = [
        { t: 1, disks: [{ mount: '/', pct: 10 }, { mount: '/data', pct: 90 }, { mount: '/b', pct: 30 }] },
        { t: 2, disks: [{ mount: '/', pct: 12 }, { mount: '/data', pct: 91 }, { mount: '/b', pct: 31 }, { mount: '/c', pct: 5 }] },
    ];
    assert.deepEqual(disksToChart(series, ['/', '/data', '/b', '/c'], 2), ['/data', '/b']);
    assert.deepEqual(disksToChart(series, ['/', '/data', '/b', '/c']), ['/data', '/b', '/', '/c']);
    assert.deepEqual(diskRows(series), [{ t: 1, '/': 10, '/data': 90, '/b': 30 }, { t: 2, '/': 12, '/data': 91, '/b': 31, '/c': 5 }]);
});

// ── the alert limits ──

test('the defaults and ranges are the backend\'s', () => {
    assert.deepEqual(DEFAULT_LIMITS, { enabled: true, cpu: { percent: 90, minutes: 5 }, memory: { percent: 90, minutes: 5 }, disk: { percent: 90, minutes: 2 }, missing: { minutes: 5 } });
    assert.deepEqual([LIMITS.percent, LIMITS.minutes, LIMITS.missingMinutes], [[1, 100], [0, 60], [2, 60]]);
});

test('what a server saved is shown over the defaults, and odd saved values show the default', () => {
    assert.deepEqual(limitsFromServer(undefined), DEFAULT_LIMITS);
    const l = limitsFromServer({ cpu: { percent: 80 }, disk: { minutes: 0 }, missing: { minutes: 15 }, enabled: false });
    assert.deepEqual(l.cpu, { percent: 80, minutes: 5 });
    assert.deepEqual(l.disk, { percent: 90, minutes: 0 }, '0 minutes is a real setting: alert at once');
    assert.equal(l.missing.minutes, 15);
    assert.equal(l.enabled, false);
    assert.deepEqual(limitsFromServer({ cpu: { percent: null, minutes: 'x' }, memory: 'high' }).cpu, DEFAULT_LIMITS.cpu);
    assert.equal(limitsFromServer({ enabled: 'no' }).enabled, true);
});

const form = (over = {}) => ({ enabled: true, cpu: { percent: '90', minutes: '5' }, memory: { percent: '90', minutes: '5' }, disk: { percent: '90', minutes: '2' }, missing: { minutes: '5' }, ...over });

test('a good form becomes exactly what the API takes, numbers as numbers', () => {
    const r = checkLimits(form({ cpu: { percent: '80', minutes: ' 10 ' }, enabled: false }));
    assert.equal(r.ok, true);
    assert.deepEqual(r.payload, { monitoring: { hostAlerts: {
        enabled: false, cpu: { percent: 80, minutes: 10 }, memory: { percent: 90, minutes: 5 }, disk: { percent: 90, minutes: 2 }, missing: { minutes: 5 }
    } } });
    assert.equal(checkLimits(form({ disk: { percent: '90', minutes: '0' } })).ok, true, 'zero minutes is allowed');
});

test('each mistake gets a message in plain words, for the field it is in, and everything else is still checked', () => {
    const r = checkLimits(form({ cpu: { percent: '0', minutes: '5' }, memory: { percent: '90', minutes: '61' }, disk: { percent: 'high', minutes: '1.5' }, missing: { minutes: '1' } }));
    assert.equal(r.ok, false);
    assert.equal(r.payload, null);
    assert.deepEqual(Object.keys(r.errors).sort(), ['cpu.percent', 'disk.minutes', 'disk.percent', 'memory.minutes', 'missing.minutes']);
    assert.equal(r.errors['cpu.percent'], 'CPU limit: use 1 to 100.');
    assert.equal(r.errors['memory.minutes'], 'Memory time: use 0 to 60.');
    assert.equal(r.errors['disk.percent'], 'Disk limit: enter a number from 1 to 100.');
    assert.equal(r.errors['disk.minutes'], 'Disk time: use a whole number.');
    assert.equal(r.errors['missing.minutes'], 'No-data time: use 2 to 60.');
});

test('empty fields and missing parts are mistakes, not zeros', () => {
    assert.equal(checkLimits(form({ cpu: { percent: '', minutes: '5' } })).ok, false);
    assert.equal(checkLimits(form({ cpu: { percent: '  ', minutes: '5' } })).ok, false);
    assert.equal(checkLimits({ enabled: true }).ok, false);
    assert.equal(checkLimits(form({ missing: {} })).ok, false);
});

// ── installing ──

test('the install options are the commands the API gave, and only those', () => {
    const o = installOptions({ command: 'curl -fsSL https://api.example/install.sh | sudo sh', docker: 'docker run x' });
    assert.deepEqual(o.map((x) => x.id), ['linux', 'docker']);
    assert.equal(o[0].command, 'curl -fsSL https://api.example/install.sh | sudo sh');
    assert.ok(o.every((x) => x.label && x.intro));
    assert.deepEqual(installOptions({ command: 'only linux' }).map((x) => x.id), ['linux']);
    for (const none of [null, undefined, {}, { command: '' }, { command: 5 }, 'x']) assert.deepEqual(installOptions(none), [], String(none));
});
