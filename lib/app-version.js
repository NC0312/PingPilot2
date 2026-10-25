// Reading GET /api/app/version, which tells the dashboard where to download the Android app.
// Plain functions with no React in them, so they can be tested on their own.

/** The key under which "I don't want to see this card" is remembered, per build */
export const DISMISS_KEY = 'pp.mobile-app.dismissed';

/** The key under which "I have seen the Android app page" is remembered, to retire the sidebar's "New" badge */
export const SEEN_KEY = 'pp.mobile-app.seen';

/**
 * The newest release always lives at this address, with the file named Ping-Pilott.apk (see the releases repo and
 * PingPilot-Mobile/scripts/release-apk.mjs). It is the fallback when the backend has no download link configured, so
 * the app is offered from day one. The backend's answer still wins when it has one: it also knows the version.
 */
export const FALLBACK_DOWNLOAD = Object.freeze({
    url: 'https://github.com/Jatin-1111/ping-pilott-releases/releases/latest/download/Ping-Pilott.apk',
    name: null,
    code: null,
    notes: null,
});

/** Where every build is listed, with what changed in each */
export const RELEASES_URL = 'https://github.com/Jatin-1111/ping-pilott-releases/releases';

/** What to offer: the backend's published build, or the permanent link when it publishes nothing usable */
export function resolveAppDownload(body) {
    return parseAppVersion(body) ?? FALLBACK_DOWNLOAD;
}

/**
 * Turn the endpoint's answer into what the card shows, or null when there is nothing to offer.
 * The link is only ever used if it is https: it becomes a button and a QR code people will trust.
 * @returns {{ url: string, name: string | null, code: number | null, notes: string | null } | null}
 */
export function parseAppVersion(body) {
    const data = body && typeof body === 'object' ? body.data : null;
    if (!data || typeof data !== 'object') return null;

    const url = typeof data.downloadUrl === 'string' ? data.downloadUrl.trim() : '';
    if (!/^https:\/\//i.test(url)) return null;

    const code = Number.isInteger(data.latestVersionCode) && data.latestVersionCode > 0 ? data.latestVersionCode : null;
    const name = typeof data.latestVersionName === 'string' && data.latestVersionName.trim() ? data.latestVersionName.trim() : null;
    const notes = typeof data.notes === 'string' && data.notes.trim() ? data.notes.trim() : null;
    return { url, name, code, notes };
}

/** Hidden only if the user dismissed this very build. A newer build shows the card again. */
export function isDismissed(stored, code) {
    return stored !== null && stored !== undefined && String(stored) === String(code ?? 'none');
}
