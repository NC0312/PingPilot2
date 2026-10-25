'use client';

import React, { useEffect, useState } from 'react';
import { DeviceMobile, DownloadSimple, X } from '@phosphor-icons/react';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import { DISMISS_KEY, isDismissed } from '@/lib/app-version';
import { useAppDownload } from '@/app/components/useAppDownload';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';

const STEPS = [
  'Open the downloaded file on your phone.',
  'If Android asks, allow installs from your browser, then tap Install.',
  'Open Ping Pilott and sign in with this same account.',
];

/**
 * "Get alerts on your phone": the download for the Android app, with a QR code so a desktop visitor can send it to
 * their phone. It sits at the top of the dashboard until it is dismissed, and comes back when a newer build is
 * published. The download link comes from the backend, with the permanent releases link as a fallback.
 */
export default function MobileAppCard() {
  const app = useAppDownload();
  // Starts hidden: show it only after we know the version and have checked whether this build was dismissed
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!app.ready) return;
    let stored = null;
    try {
      stored = window.localStorage.getItem(DISMISS_KEY);
    } catch {
      // storage blocked: just show the card
    }
    setVisible(!isDismissed(stored, app.code));
  }, [app.ready, app.code]);

  if (!visible) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(app.code ?? 'none'));
    } catch {
      // not remembered, but it still goes away for now
    }
    setVisible(false);
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
            <div className="flex items-center gap-3 pr-10">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/[0.05] text-primary ring-1 ring-white/10">
                <DeviceMobile weight="light" className="size-5" />
              </span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                New · Android app{app.name ? ` · version ${app.name}` : ''}
              </span>
            </div>

            <div className="space-y-2">
              <h2 id="mobile-app-heading" className="font-display text-xl font-medium tracking-tight">
                Get alerts on your phone.
              </h2>
              <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
                A notification the moment one of your servers goes down, comes back, or slows down, even when the app is closed.
                {app.notes ? ` ${app.notes}` : ''}
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
                <a href={app.url} download="Ping-Pilott.apk" rel="noopener">
                  <DownloadSimple weight="light" />
                  Download for Android
                </a>
              </Button>
              <Link href="/android-app" className="text-sm text-primary underline-offset-4 hover:underline">
                More about the app
              </Link>
            </div>
          </div>

          {/* A phone has no use for a code to scan on itself */}
          <div className="hidden text-center md:block">
            <div className="inline-block rounded-2xl bg-white p-3">
              <QRCodeSVG value={app.url} size={132} marginSize={0} title="QR code for the Android app download" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Scan to download on your phone</p>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
