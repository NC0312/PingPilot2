// Run with: npm test
// The public status page reads the backend's answer defensively and words it plainly.
import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPONENT, OVERALL, SLUG_PATTERN, dayTitle, formatUtc, normalizeStatus, problemDays } from '../lib/statusPage.js';

test('every state the backend sends has words and a tone', () => {
    for (const state of ['operational', 'degraded', 'partial', 'major', 'unknown']) {
        assert.ok(OVERALL[state].label && OVERALL[state].tone, state);
    }
    for (const state of ['operational', 'degraded', 'down', 'unknown']) {
        assert.ok(COMPONENT[state].label && COMPONENT[state].tone, state);
    }
    assert.equal(OVERALL.operational.label, 'All systems operational');
    assert.equal(OVERALL.major.tone, 'error');
});

test('an address is checked the way the backend checks it', () => {
    for (const ok of ['acme', 'acme-status', 'a1b']) assert.ok(SLUG_PATTERN.test(ok), ok);
    for (const bad of ['ab', 'Acme', '-acme', 'acme-', 'ac--me', '../etc', 'a b', 'x'.repeat(41), '']) assert.equal(SLUG_PATTERN.test(bad), false, bad);
});

test('a day on the bar says its date and uptime, or that there is no data', () => {
    assert.equal(dayTitle({ date: '2026-09-26', uptime: 99.9, state: 'ok' }), '26 Sep: 99.9% uptime');
    assert.equal(dayTitle({ date: '2026-10-05', uptime: null, state: 'none' }), '5 Oct: no data');
    assert.equal(dayTitle({ date: 'garbage', uptime: 100, state: 'ok' }), 'garbage: 100% uptime');
});

test('times are shown in UTC so the server and the browser agree', () => {
    assert.equal(formatUtc('2026-10-25T10:30:00Z'), '25 Oct, 10:30 UTC');
    assert.equal(formatUtc('2026-10-25T23:59:00+05:30'), '25 Oct, 18:29 UTC');
    assert.equal(formatUtc('nope'), '');
});

test('the days with a bad patch or worse are counted', () => {
    const days = [{ state: 'ok' }, { state: 'minor' }, { state: 'major' }, { state: 'none' }];
    assert.equal(problemDays(days), 2);
    assert.equal(problemDays([]), 0);
});

test('a good answer comes through whole', () => {
    const view = normalizeStatus({
        title: 'Acme', description: 'Our services', slug: 'acme', indexable: true, overall: 'partial', poweredBy: true,
        generatedAt: '2026-10-25T10:30:00.000Z',
        components: [{ id: 's1', name: 'API', state: 'down', uptime: 98.5, days: [{ date: '2026-10-25', uptime: 90, state: 'major' }] }],
        incidents: [{ name: 'API', startedAt: '2026-10-25T09:00:00.000Z', endedAt: null, ongoing: true, durationMs: null }],
    });
    assert.equal(view.title, 'Acme');
    assert.equal(view.indexable, true);
    assert.equal(view.overall, 'partial');
    assert.equal(view.components[0].state, 'down');
    assert.equal(view.components[0].days[0].state, 'major');
    assert.equal(view.incidents[0].ongoing, true);
    assert.equal(view.poweredBy, true);
});

test('an odd or missing answer becomes an empty, safe page', () => {
    for (const bad of [null, undefined, 'text', 42, [], {}]) {
        const view = normalizeStatus(bad);
        assert.equal(view.overall, 'unknown');
        assert.deepEqual(view.components, []);
        assert.deepEqual(view.incidents, []);
        assert.equal(view.indexable, false, 'not indexed unless the backend says so');
        assert.equal(view.poweredBy, false);
        assert.equal(view.title, 'Status');
    }
});

test('unknown states and wrong types are dropped to safe values', () => {
    const view = normalizeStatus({
        overall: 'on-fire', indexable: 'yes', poweredBy: 1,
        components: [{ name: 42, state: 'exploding', uptime: '99', days: [{ date: 5, uptime: 'x', state: 'purple' }, null] }, null],
        incidents: [{ startedAt: 7, endedAt: 8, durationMs: 'long' }],
    });
    assert.equal(view.overall, 'unknown');
    assert.equal(view.indexable, false);
    assert.equal(view.poweredBy, false);
    assert.equal(view.components[0].name, 'Service');
    assert.equal(view.components[0].state, 'unknown');
    assert.equal(view.components[0].uptime, null);
    assert.deepEqual(view.components[0].days[0], { date: '', uptime: null, state: 'none' });
    assert.equal(view.components.length, 2, 'a null entry still renders as an unknown service');
    assert.deepEqual(view.incidents[0], { name: 'Service', startedAt: '', endedAt: null, ongoing: false, durationMs: null });
});
