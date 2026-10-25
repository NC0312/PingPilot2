// Reading GET /api/app/version, which tells the dashboard where to download the Android app.
// Plain functions with no React in them, so they can be tested on their own.

/** The key under which "I don't want to see this card" is remembered, per build */
export const DISMISS_KEY = 'pp.mobile-app.dismissed';

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
