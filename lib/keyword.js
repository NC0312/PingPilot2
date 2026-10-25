// The "page content" check: the page must contain some text (or must not). The backend reads, validates and applies it
// (utils/keyword.js there); this is how the form holds it and what it sends.

export const MAX_KEYWORD_LENGTH = 100;

export const emptyKeyword = () => ({ text: '', mode: 'present' });

/** The form's value for a saved server: monitoring.keyword is { text, mode } or missing */
export const keywordFromServer = (monitoring) => {
    const saved = monitoring?.keyword;
    return saved && typeof saved.text === 'string' && saved.text.trim()
        ? { text: saved.text, mode: saved.mode === 'absent' ? 'absent' : 'present' }
        : emptyKeyword();
};

/**
 * What to send. `null` takes a saved check away (an update), so use `clearable: false` when creating, where the field is
 * simply left out.
 * @returns {{ text: string, mode: 'present'|'absent' }|null|undefined}
 */
export const keywordPayload = (keyword, { clearable = true } = {}) => {
    const text = (keyword?.text || '').trim();
    if (!text) return clearable ? null : undefined;
    return { text, mode: keyword?.mode === 'absent' ? 'absent' : 'present' };
};

/** A short line for the setup summary, or null when there is no check */
export const describeKeyword = (keyword) => {
    const text = (keyword?.text || '').trim();
    if (!text) return null;
    const shown = text.length > 24 ? `${text.slice(0, 24)}…` : text;
    return keyword.mode === 'absent' ? `Must not contain "${shown}"` : `Must contain "${shown}"`;
};

/** Page checks read a web page, so they only make sense for websites and APIs */
export const supportsKeyword = (type) => type !== 'tcp' && type !== 'database';
