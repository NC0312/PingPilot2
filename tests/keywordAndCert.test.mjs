// Run with: npm test
// The page-content check the form sends, and the certificate expiry the server page shows.
import test from 'node:test';
import assert from 'node:assert/strict';
import { describeKeyword, emptyKeyword, keywordFromServer, keywordPayload, supportsKeyword } from '../lib/keyword.js';
import { certStatus, hasCertificate, noCertificateText } from '../lib/cert.js';

// ---- keyword ----

test('a saved check fills the form, and a server without one gets an empty field', () => {
    assert.deepEqual(keywordFromServer({ keyword: { text: 'Welcome', mode: 'absent' } }), { text: 'Welcome', mode: 'absent' });
    assert.deepEqual(keywordFromServer({ keyword: { text: 'Welcome' } }), { text: 'Welcome', mode: 'present' });
    assert.deepEqual(keywordFromServer({ keyword: { text: '  ', mode: 'absent' } }), emptyKeyword());
    assert.deepEqual(keywordFromServer({}), emptyKeyword());
    assert.deepEqual(keywordFromServer(undefined), emptyKeyword());
});

test('an update sends the trimmed check, or null to take it away; a new server just leaves it out', () => {
    assert.deepEqual(keywordPayload({ text: '  Welcome  ', mode: 'present' }), { text: 'Welcome', mode: 'present' });
    assert.deepEqual(keywordPayload({ text: 'Error', mode: 'absent' }), { text: 'Error', mode: 'absent' });
    assert.deepEqual(keywordPayload({ text: 'x', mode: 'weird' }), { text: 'x', mode: 'present' });
    assert.equal(keywordPayload({ text: '   ', mode: 'present' }), null, 'cleared on an update');
    assert.equal(keywordPayload(undefined), null);
    assert.equal(keywordPayload({ text: '', mode: 'present' }, { clearable: false }), undefined, 'left out on create');
    assert.deepEqual(keywordPayload({ text: 'a', mode: 'present' }, { clearable: false }), { text: 'a', mode: 'present' });
});

test('the summary line says what the page must or must not contain, and long text is cut', () => {
    assert.equal(describeKeyword({ text: 'Welcome', mode: 'present' }), 'Must contain "Welcome"');
    assert.equal(describeKeyword({ text: 'Maintenance', mode: 'absent' }), 'Must not contain "Maintenance"');
    assert.equal(describeKeyword({ text: 'x'.repeat(40), mode: 'present' }), `Must contain "${'x'.repeat(24)}…"`);
    assert.equal(describeKeyword({ text: '', mode: 'present' }), null);
    assert.equal(describeKeyword(null), null);
});

test('only websites and APIs can check page content', () => {
    assert.equal(supportsKeyword('website'), true);
    assert.equal(supportsKeyword('api'), true);
    assert.equal(supportsKeyword('tcp'), false);
    assert.equal(supportsKeyword('database'), false);
});

// ---- certificate ----

const NOW = new Date('2026-10-25T12:00:00Z').getTime();
const inDays = (n) => new Date(NOW + n * 24 * 60 * 60 * 1000).toISOString();

test('a certificate far from expiry is ok, and one within 14 days is "soon"', () => {
    assert.deepEqual({ ...certStatus(inDays(90), NOW), expiresAt: undefined }, { expiresAt: undefined, daysLeft: 90, tone: 'ok', label: 'Expires in 90 days' });
    assert.equal(certStatus(inDays(14), NOW).tone, 'soon');
    assert.equal(certStatus(inDays(15), NOW).tone, 'ok');
    assert.equal(certStatus(inDays(3), NOW).label, 'Expires in 3 days');
});

test('days are counted up like the backend does: half a day left is 1 day', () => {
    assert.equal(certStatus(NOW + 12 * 60 * 60 * 1000, NOW).daysLeft, 1);
    assert.equal(certStatus(NOW + 12 * 60 * 60 * 1000, NOW).label, 'Expires in 1 day');
});

test('an expired certificate says so', () => {
    const expired = certStatus(inDays(-2), NOW);
    assert.equal(expired.tone, 'expired');
    assert.equal(expired.label, 'Expired');
    assert.equal(expired.daysLeft, 0);
    assert.equal(certStatus(NOW, NOW).tone, 'expired', 'expiring this very moment');
});

test('no date, or one that cannot be read, is no certificate', () => {
    for (const v of [null, undefined, '', 'not a date']) assert.equal(certStatus(v, NOW), null, String(v));
});

test('websites and APIs have a certificate to show, sockets do not, and plain HTTP says so', () => {
    assert.equal(hasCertificate('website'), true);
    assert.equal(hasCertificate('api'), true);
    assert.equal(hasCertificate('tcp'), false);
    assert.equal(hasCertificate('database'), false);
    assert.equal(noCertificateText('http://shop.example'), 'Not using HTTPS');
    assert.equal(noCertificateText('https://shop.example'), 'Not seen yet');
    assert.equal(noCertificateText(''), 'Not seen yet');
});
