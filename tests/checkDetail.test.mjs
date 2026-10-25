// Run with: npm test
// Reading what the backend sends about a failed check: whatever arrives, the page gets something it can show or nothing.
import test from 'node:test';
import assert from 'node:assert/strict';
import { failureDetailOf, timingSteps, hasMoreDetail } from '../lib/checkDetail.js';

const full = {
    diagnosis: {
        title: 'The server is up, but the app behind it is not answering',
        cause: 'A proxy answered.',
        action: 'Check the process.',
        causes: [
            { text: 'The application is down or restarting', confidence: 'high', evidence: ['Status 502', 'Answered by nginx'] },
            { text: 'Wrong upstream', confidence: 'medium', evidence: [] }
        ],
        checks: [
            { step: 'Request it yourself.', kind: 'command', command: 'curl -sS -i --max-time 15 https://shop.example.com' },
            { step: 'Read the logs.', kind: 'manual' }
        ]
    },
    failureDetail: {
        failedPhase: 'response',
        timings: { dns: 4, connect: 6, tls: 30, ttfb: 120, redirects: 0 },
        statusCode: 502,
        evidence: { statusCode: 502, headers: { server: 'nginx' }, address: '203.0.113.7', snippet: '<h1>502 Bad Gateway</h1>', snippetTruncated: true }
    }
};

test('a full payload is read into causes, checks, steps and evidence', () => {
    const d = failureDetailOf(full);
    assert.equal(d.diagnosis.title, 'The server is up, but the app behind it is not answering');
    assert.equal(d.causes.length, 2);
    assert.deepEqual(d.causes[0].evidence, ['Status 502', 'Answered by nginx']);
    assert.deepEqual(d.checks.map((c) => c.kind), ['command', 'manual']);
    assert.equal(d.failedPhase, 'response');
    assert.equal(d.phaseLabel, 'Server response');
    assert.equal(d.statusCode, 502);
    assert.deepEqual(d.evidence.headers, [['server', 'nginx']]);
    assert.equal(d.evidence.snippetTruncated, true);
    assert.equal(d.locked, false);
    assert.equal(hasMoreDetail(d), true);
});

test('an old payload, with only the one-line diagnosis, reads as it always did and offers no extra detail', () => {
    const d = failureDetailOf({ diagnosis: { title: 'The domain name could not be found', cause: 'x', action: 'y' } });
    assert.equal(d.diagnosis.title, 'The domain name could not be found');
    assert.deepEqual([d.causes, d.checks, d.steps, d.evidence], [[], [], [], null]);
    assert.equal(hasMoreDetail(d), false);
});

test('nothing at all is null, and so is junk', () => {
    for (const nothing of [null, undefined, {}, { diagnosis: null, failureDetail: null }, { diagnosis: 'x', failureDetail: 5 }, { diagnosis: { title: '' } }]) {
        assert.equal(failureDetailOf(nothing), null, JSON.stringify(nothing));
    }
});

test('fields of the wrong type are dropped one by one, without losing the rest', () => {
    const d = failureDetailOf({
        diagnosis: { title: 'Headline', causes: 'nope', checks: [{ step: 5 }, null, { step: 'Do this', kind: 'command' }, { step: 'Look', kind: 'manual', command: 'rm -rf /' }] },
        failureDetail: { failedPhase: 'nonsense', timings: { dns: 'a', connect: -3, ttfb: 40 }, statusCode: 'x', evidence: { statusCode: 99, headers: { a: 5 }, snippet: 12 } }
    });
    assert.equal(d.causes.length, 0);
    assert.deepEqual(d.checks, [{ step: 'Do this', kind: 'manual' }, { step: 'Look', kind: 'manual' }], 'a command with no text, and advice that carries one, are advice');
    assert.equal(d.failedPhase, null);
    assert.deepEqual(d.steps.map((s) => s.key), ['ttfb']);
    assert.equal(d.statusCode, null);
    assert.equal(d.evidence, null);
});

test('a huge payload is cut: lengths, counts and the page text', () => {
    const d = failureDetailOf({
        diagnosis: {
            title: 'T'.repeat(5000),
            causes: Array.from({ length: 20 }, (_, i) => ({ text: `cause ${i}`, evidence: Array.from({ length: 20 }, (_, j) => `e${j}`) })),
            checks: Array.from({ length: 20 }, (_, i) => ({ step: `step ${i}`, kind: 'command', command: 'c'.repeat(5000) }))
        },
        failureDetail: { evidence: { snippet: 's'.repeat(100000), headers: { server: 'x'.repeat(5000) } } }
    });
    assert.ok(d.diagnosis.title.length <= 400);
    assert.equal(d.causes.length, 4);
    assert.ok(d.causes.every((c) => c.evidence.length <= 3));
    assert.equal(d.checks.length, 6);
    assert.ok(d.checks.every((c) => c.command.length <= 400));
    assert.ok(d.evidence.snippet.length <= 1100);
    assert.ok(d.evidence.headers[0][1].length <= 240);
});

test('page text stays text: markup in it is returned as the same string, for the page to print', () => {
    const attack = '<img src=x onerror=alert(1)><script>alert(2)</script>';
    const d = failureDetailOf({ failureDetail: { evidence: { snippet: attack } } });
    assert.equal(d.evidence.snippet, attack);
    assert.equal(typeof d.evidence.snippet, 'string');
});

test('a free plan is told there is more, and only when there is nothing to show instead', () => {
    const locked = failureDetailOf({ diagnosis: { title: 'Headline' }, failureDetail: { failedPhase: 'dns', timings: { dns: 40 }, locked: true } });
    assert.equal(locked.locked, true);
    assert.equal(locked.steps.length, 1);
    const paid = failureDetailOf({ ...full, failureDetail: { ...full.failureDetail, locked: true } });
    assert.equal(paid.locked, false, 'a payload that has the detail is never also "locked"');
});

// ── the timing bar ──

test('steps run in the order of a request, and the one that failed is marked', () => {
    const steps = timingSteps({ ttfb: 9000, dns: 20, connect: 40, tls: 100, redirects: 0 }, 'response');
    assert.deepEqual(steps.map((s) => s.key), ['dns', 'connect', 'tls', 'ttfb']);
    assert.deepEqual(steps.map((s) => s.failed), [false, false, false, true]);
    assert.ok(Math.abs(steps.reduce((sum, s) => sum + s.share, 0) - 1) < 1e-9);
});

test('a step that was never reached has no slice, and a step with no time has none unless it failed', () => {
    assert.deepEqual(timingSteps({ dns: 9800 }, 'dns').map((s) => s.key), ['dns']);
    assert.deepEqual(timingSteps({ dns: 0, connect: 12, tls: 0, ttfb: 50 }, null).map((s) => s.key), ['connect', 'ttfb']);
    assert.deepEqual(timingSteps({ dns: 0, connect: 0 }, 'connect').map((s) => [s.key, s.failed]), [['connect', true]]);
});

test('no timings, or junk, is no steps', () => {
    for (const none of [null, undefined, 'x', [], {}, { dns: 'a' }]) assert.deepEqual(timingSteps(none, 'dns'), [], String(none));
});
