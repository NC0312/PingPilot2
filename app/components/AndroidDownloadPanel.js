'use client';

import React from 'react';
import { DownloadSimple } from '@phosphor-icons/react';
import { QRCodeSVG } from 'qrcode.react';
import { RELEASES_URL } from '@/lib/app-version';
import { useAppDownload } from '@/app/components/useAppDownload';
import { Button } from '@/components/ui/button';

/** The download itself for the /android-app page: button, version, and a QR code for visitors on a desktop. */
export default function AndroidDownloadPanel() {
    const app = useAppDownload();

    return (
        <div className="bezel-sm">
            <div className="bezel-sm-core grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center md:gap-12">
                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <p className="font-display text-2xl font-medium tracking-tight">
                            Ping Pilott for Android{app.name ? <span className="text-muted-foreground"> · version {app.name}</span> : null}
                        </p>
                        {app.notes && <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">{app.notes}</p>}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                        <Button asChild size="lg">
                            <a href={app.url} download="Ping-Pilott.apk" rel="noopener">
                                <DownloadSimple weight="light" />
                                Download for Android
                            </a>
                        </Button>
                        <a href={RELEASES_URL} rel="noopener" className="text-sm text-primary underline-offset-4 hover:underline">
                            All versions and release notes
                        </a>
                    </div>

                    <p className="text-xs leading-relaxed text-muted-foreground">
                        Installed directly from a file, not from Google Play. Free to download; you sign in with your Ping Pilott account.
                    </p>
                </div>

                {/* A phone has no use for a code to scan on itself */}
                <div className="hidden text-center md:block">
                    <div className="inline-block rounded-2xl bg-white p-3">
                        <QRCodeSVG value={app.url} size={148} marginSize={0} title="QR code for the Android app download" />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">Scan with your phone's camera</p>
                </div>
            </div>
        </div>
    );
}
