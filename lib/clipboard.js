// Copy text to the clipboard. Falls back to a hidden textarea where the clipboard API is not allowed (an http page, an old browser,
// a webview). Resolves true when the text was copied and false when nothing could be, so the page can say which.

export async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        try {
            return document.execCommand('copy');
        } catch {
            return false;
        } finally {
            document.body.removeChild(area);
        }
    }
}

export default { copyText };
