// Run with: npm test
// The dashboard's Android download card: what it accepts from the backend and when it stays hidden.
import test from 'node:test';
import assert from 'node:assert/strict';
import { FALLBACK_DOWNLOAD, isDismissed, parseAppVersion, resolveAppDownload } from '../lib/app-version.js';

const ok = (data) => ({ status: 'success', data });
const URL = 'https://github.com/Jatin-1111/ping-pilott-releases/releases/latest/download/Ping-Pilott.apk';

test('a published build gives the card its link, name, build number and notes', () => {
    const parsed = parseAppVersion(ok({ downloadUrl: URL, latestVersionName: ' 1.1.0 ', latestVersionCode: 2, notes: ' New overview screen ' }));
    assert.deepEqual(parsed, { url: URL, name: '1.1.0', code: 2, notes: 'New overview screen' });
});

test('with no download link there is no card', () => {
    assert.equal(parseAppVersion(ok({ latestVersionCode: 2 })), null);
    assert.equal(parseAppVersion(ok({ downloadUrl: null })), null);
    assert.equal(parseAppVersion(ok({ downloadUrl: '   ' })), null);
});

test('only https links are used: the button and the QR code point to it', () => {
    for (const bad of ['http://example.com/app.apk', 'javascript:alert(1)', 'data:text/html,hi', 'ftp://x/y.apk', '//evil.example/app.apk', 'intent://x']) {
        assert.equal(parseAppVersion(ok({ downloadUrl: bad })), null, bad);
    }
});

test('anything that is not the expected shape is ignored, never thrown on', () => {
    for (const body of [null, undefined, 'oops', 42, [], {}, { data: null }, { data: 'x' }]) {
        assert.equal(parseAppVersion(body), null);
    }
});

test('optional fields can be missing or wrongly typed without hiding the card', () => {
    const parsed = parseAppVersion(ok({ downloadUrl: URL, latestVersionName: 7, latestVersionCode: '2', notes: {} }));
    assert.deepEqual(parsed, { url: URL, name: null, code: null, notes: null });
});

test('dismissing hides the card for that build only', () => {
    assert.equal(isDismissed('2', 2), true);
    assert.equal(isDismissed('2', 3), false, 'a newer build shows it again');
    assert.equal(isDismissed(null, 2), false);
    assert.equal(isDismissed(undefined, 2), false);
    assert.equal(isDismissed('none', null), true);
});

test('with nothing published the app is still offered, from the permanent releases link', () => {
    for (const body of [null, {}, ok({}), ok({ latestVersionCode: 2 }), ok({ downloadUrl: 'http://insecure.example/a.apk' })]) {
        assert.equal(resolveAppDownload(body), FALLBACK_DOWNLOAD);
    }
});

test('the fallback is an https link to the file named Ping-Pilott.apk, and cannot be changed by accident', () => {
    assert.match(FALLBACK_DOWNLOAD.url, /^https:\/\/github\.com\/Jatin-1111\/ping-pilott-releases\/releases\/latest\/download\/Ping-Pilott\.apk$/);
    assert.equal(Object.isFrozen(FALLBACK_DOWNLOAD), true);
});

test('a published build wins over the fallback', () => {
    const published = resolveAppDownload(ok({ downloadUrl: URL, latestVersionName: '1.2.0', latestVersionCode: 3 }));
    assert.deepEqual(published, { url: URL, name: '1.2.0', code: 3, notes: null });
});
