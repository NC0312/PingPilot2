'use client';

import React, { useEffect, useState } from 'react';
import { DeviceMobile, DownloadSimple, X } from '@phosphor-icons/react';
import { QRCodeSVG } from 'qrcode.react';
import { getApiUrl } from '@/lib/apiConfig';
import { DISMISS_KEY, isDismissed, parseAppVersion } from '@/lib/app-version';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';

const STEPS = [
  'Open the downloaded file on your phone.',
  'If Android asks, allow installs from your browser, then tap Install.',
  'Open Ping Pilott and sign in with this same account.',
];

/**
 * "Get alerts on your phone": the download for the Android app, with a QR code so a desktop visitor can send it to
 * their phone. It asks the backend where the current build lives, and shows nothing at all when no build is published
 * or the request fails, so it can never be a broken box on the dashboard.
 */
export default function MobileAppCard() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(getApiUrl('/api/app/version'), { headers: { Accept: 'application/json' } });
        if (!res.ok) return;
        const parsed = parseAppVersion(await res.json());
        if (!parsed || cancelled) return;

        let stored = null;
        try {
          stored = window.localStorage.getItem(DISMISS_KEY);
        } catch {
          // storage blocked: just show the card
        }
        if (!isDismissed(stored, parsed.code)) setInfo(parsed);
      } catch {
        // offline or an older backend without the endpoint: no card
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!info) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(info.code ?? 'none'));
    } catch {
      // not remembered, but it still goes away for now
    }
    setInfo(null);
  };

  return (
    <Reveal>
      <section className="bezel-sm" aria-labelledby="mobile-app-heading">
        <div className="bezel-sm-core relative grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center md:gap-12">
          <button
            type="button"
            onClick={dismiss}
            aria-label="Hide this card"
            className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-muted-foreground transition-colors duration-300 ease-fluid hover:bg-white/[0.06] hover:text-foreground"
          >
            <X weight="light" className="size-4" />
          </button>

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/[0.05] text-primary ring-1 ring-white/10">
                <DeviceMobile weight="light" className="size-5" />
              </span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Android app{info.name ? ` · version ${info.name}` : ''}
              </span>
            </div>

            <div className="space-y-2">
              <h2 id="mobile-app-heading" className="font-display text-2xl font-medium tracking-tight">
                Get alerts on your phone.
              </h2>
              <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
                A notification the moment one of your servers goes down, comes back, or slows down, even when the app is closed.
                {info.notes ? ` ${info.notes}` : ''}
              </p>
            </div>

            <ol className="space-y-1.5 text-sm text-muted-foreground">
              {STEPS.map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="font-mono text-xs tabular-nums leading-5">0{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Button asChild size="lg">
                <a href={info.url} download="Ping-Pilott.apk" rel="noopener">
                  <DownloadSimple weight="light" />
                  Download for Android
                </a>
              </Button>
              <p className="text-xs text-muted-foreground">Installed directly, not from Google Play.</p>
            </div>
          </div>

          {/* A phone has no use for a code to scan on itself */}
          <div className="hidden text-center md:block">
            <div className="inline-block rounded-2xl bg-white p-3">
              <QRCodeSVG value={info.url} size={132} marginSize={0} title="QR code for the Android app download" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Scan to download on your phone</p>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
