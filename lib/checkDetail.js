// What a failed check can tell a developer, read from the backend's `diagnosis` and `failureDetail`.
//
// The backend (utils/failureDetail.js there) sends, for a server, a manual check or an incident:
//   diagnosis      { title, cause, action }, and on a plan with the detail also causes[] and checks[]
//   failureDetail  { failedPhase, timings, statusCode, evidence, locked }
// Every part is optional, and older rows and older servers send none of the new parts. Nothing here trusts the shape: a
// field of the wrong type is dropped, a long string is cut, and the page gets either something it can show or nothing.
// The text of a page (evidence.snippet) is somebody else's: it is only ever returned as a string for React to print as
// text, never as markup.

const PHASE_LABEL = { dns: 'Name lookup', connect: 'Connecting', tls: 'Secure handshake', response: 'Server response', content: 'Page content' };
export const FAILED_PHASES = Object.keys(PHASE_LABEL);

// The order a request goes through, and the timing each step is stored under
const STEPS = [
    { key: 'dns', label: 'Name lookup', phase: 'dns' },
    { key: 'connect', label: 'Connecting', phase: 'connect' },
    { key: 'tls', label: 'Secure handshake', phase: 'tls' },
    { key: 'ttfb', label: 'Server response', phase: 'response' },
];

const LIMITS = { text: 400, command: 400, snippet: 1100, header: 240, causes: 4, checks: 6, evidenceLines: 3 };

const text = (value, max = LIMITS.text) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null);
const whole = (value) => (Number.isFinite(value) && value >= 0 ? Math.round(value) : null);

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** The plain-words diagnosis, or null when it has no headline */
function plainDiagnosis(raw) {
    const title = text(raw?.title);
    if (!title) return null;
    return { title, cause: text(raw.cause), action: text(raw.action) };
}

function causesOf(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((c) => {
            const label = text(c?.text);
            if (!label) return null;
            const evidence = Array.isArray(c.evidence) ? c.evidence.map((e) => text(e)).filter(Boolean).slice(0, LIMITS.evidenceLines) : [];
            return { text: label, confidence: ['high', 'medium', 'low'].includes(c.confidence) ? c.confidence : 'low', evidence };
        })
        .filter(Boolean)
        .slice(0, LIMITS.causes);
}

function checksOf(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((c) => {
            const step = text(c?.step);
            if (!step) return null;
            const command = c.kind === 'command' ? text(c.command, LIMITS.command) : null;
            return command ? { step, kind: 'command', command } : { step, kind: 'manual' };
        })
        .filter(Boolean)
        .slice(0, LIMITS.checks);
}

function evidenceOf(raw) {
    if (!isObject(raw)) return null;
    const evidence = {};
    if (Number.isInteger(raw.statusCode) && raw.statusCode >= 100 && raw.statusCode <= 599) evidence.statusCode = raw.statusCode;
    if (isObject(raw.headers)) {
        const headers = Object.entries(raw.headers)
            .map(([name, value]) => [text(name, 60), text(value, LIMITS.header)])
            .filter(([name, value]) => name && value);
        if (headers.length > 0) evidence.headers = headers;
    }
    const address = text(raw.address, 60);
    if (address) evidence.address = address;
    const snippet = typeof raw.snippet === 'string' && raw.snippet.trim() ? raw.snippet.slice(0, LIMITS.snippet) : null;
    if (snippet) {
        evidence.snippet = snippet;
        if (raw.snippetTruncated === true) evidence.snippetTruncated = true;
    }
    return Object.keys(evidence).length > 0 ? evidence : null;
}

/**
 * The steps of a request with how long each took, and which one the check failed in. A step the check never reached has no
 * entry, so the bar only shows what happened.
 * @returns {Array<{ key: string, label: string, ms: number, failed: boolean, share: number }>}  share: 0 to 1 of the total
 */
export function timingSteps(timings, failedPhase) {
    if (!isObject(timings)) return [];
    const steps = [];
    for (const step of STEPS) {
        const ms = whole(timings[step.key]);
        if (ms === null) continue;
        steps.push({ key: step.key, label: step.label, ms, failed: failedPhase === step.phase });
    }
    // A step with no time (TLS on a plain connection, DNS for an address) is not worth a slice
    const shown = steps.filter((s) => s.ms > 0 || s.failed);
    const total = shown.reduce((sum, s) => sum + s.ms, 0);
    return shown.map((s) => ({ ...s, share: total > 0 ? s.ms / total : 1 / shown.length }));
}

/**
 * Everything the detail panel needs, from whatever the backend sent.
 * @param {{ diagnosis?: any, failureDetail?: any }|null|undefined} source  a server, a check, or an incident
 * @returns {{ diagnosis: object|null, causes: object[], checks: object[], failedPhase: string|null, phaseLabel: string|null,
 *            steps: object[], totalMs: number|null, statusCode: number|null, evidence: object|null, locked: boolean }|null}
 *   null when there is nothing at all to show
 */
export function failureDetailOf(source) {
    const diagnosis = plainDiagnosis(source?.diagnosis);
    const causes = causesOf(source?.diagnosis?.causes);
    const checks = checksOf(source?.diagnosis?.checks);
    // What the host agent saw when it failed, when it looked fine: it rules resource exhaustion out (utils/hostContext.js)
    const hostNote = text(source?.diagnosis?.hostNote);

    const detail = isObject(source?.failureDetail) ? source.failureDetail : {};
    const failedPhase = FAILED_PHASES.includes(detail.failedPhase) ? detail.failedPhase : null;
    const steps = timingSteps(detail.timings, failedPhase);
    const evidence = evidenceOf(detail.evidence);
    const statusCode = Number.isInteger(detail.statusCode) ? detail.statusCode : (evidence?.statusCode ?? null);
    const locked = detail.locked === true && causes.length === 0 && !evidence;

    if (!diagnosis && causes.length === 0 && checks.length === 0 && !failedPhase && steps.length === 0 && !evidence && !locked) return null;

    return {
        diagnosis,
        causes,
        checks,
        hostNote,
        failedPhase,
        phaseLabel: failedPhase ? PHASE_LABEL[failedPhase] : null,
        steps,
        totalMs: steps.length > 0 ? steps.reduce((sum, s) => sum + s.ms, 0) : null,
        statusCode,
        evidence,
        locked
    };
}

/** Is there more than the one-line diagnosis to show? What decides whether the page offers "details" at all. */
export const hasMoreDetail = (detail) => Boolean(detail && (detail.causes.length > 0 || detail.checks.length > 0 || detail.evidence || detail.steps.length > 0 || detail.failedPhase || detail.locked));

export default { FAILED_PHASES, timingSteps, failureDetailOf, hasMoreDetail };
