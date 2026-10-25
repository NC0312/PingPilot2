'use client';

import { useEffect, useState } from 'react';
import { getApiUrl } from '@/lib/apiConfig';
import { FALLBACK_DOWNLOAD, resolveAppDownload } from '@/lib/app-version';

// One request per page load, shared by everything on the page that offers the Android app.
let inflight = null;
let resolved = null;

function load() {
    if (!inflight) {
        inflight = fetch(getApiUrl('/api/app/version'), { headers: { Accept: 'application/json' } })
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null) // offline or an older backend: the permanent link is used instead
            .then((body) => {
                resolved = resolveAppDownload(body);
                return resolved;
            });
    }
    return inflight;
}

/**
 * Where to download the Android app, and which version that is.
 * `ready` turns true once the backend has answered (or failed), so a component that depends on the version, like the
 * dismissible dashboard card, can wait instead of deciding on the fallback and then changing its mind.
 * @returns {{ url: string, name: string | null, code: number | null, notes: string | null, ready: boolean }}
 */
export function useAppDownload() {
    const [info, setInfo] = useState(resolved ?? FALLBACK_DOWNLOAD);
    const [ready, setReady] = useState(resolved !== null);

    useEffect(() => {
        let cancelled = false;
        load().then((value) => {
            if (cancelled) return;
            setInfo(value);
            setReady(true);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    return { ...info, ready };
}
