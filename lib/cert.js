// How close a site's security certificate is to expiring, for the server page.
//
// The backend reads the expiry date from the check's TLS handshake (certExpiresAt on the server) and warns by email and
// webhook at 14, 7, 3 and 1 day left and once expired (utils/certExpiry.js there). This shows the same date and uses the
// same 14-day line for "soon".

const DAY_MS = 24 * 60 * 60 * 1000;
export const CERT_SOON_DAYS = 14;

/**
 * @param {string|number|Date|null|undefined} expiresAt  the server's certExpiresAt
 * @returns {{ expiresAt: Date, daysLeft: number, tone: 'ok'|'soon'|'expired', label: string }|null}  null when no certificate has been seen
 */
export function certStatus(expiresAt, now = Date.now()) {
    if (expiresAt === null || expiresAt === undefined || expiresAt === '') return null;
    const end = new Date(expiresAt).getTime();
    if (!Number.isFinite(end)) return null;

    // Whole days, rounding up, as the backend counts them: half a day left is 1 day
    const daysLeft = end <= now ? 0 : Math.ceil((end - now) / DAY_MS);
    if (daysLeft === 0) return { expiresAt: new Date(end), daysLeft, tone: 'expired', label: 'Expired' };
    const label = daysLeft === 1 ? 'Expires in 1 day' : `Expires in ${daysLeft} days`;
    return { expiresAt: new Date(end), daysLeft, tone: daysLeft <= CERT_SOON_DAYS ? 'soon' : 'ok', label };
}

/** Does this kind of monitor have a certificate to show? Websites and APIs, not TCP or database checks. */
export const hasCertificate = (type) => type !== 'tcp' && type !== 'database';

/** What to say when no certificate has been seen: plain HTTP has none, anything else just has not been checked yet */
export const noCertificateText = (url) => (/^http:\/\//i.test(String(url || '')) ? 'Not using HTTPS' : 'Not seen yet');
