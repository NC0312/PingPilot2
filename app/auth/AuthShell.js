'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react';
import { Brand } from '@/components/ui/brand';
import { Reveal } from '@/components/ui/reveal';
import { StatusDot } from '@/components/ui/status';
import { Sparkline } from '@/app/components/Landing Page/HeroPreview';

const SAMPLE = [
    { name: 'northwind.dev/api', status: 'up', value: '142 ms' },
    { name: 'shop.larkspur.co', status: 'up', value: '238 ms' },
    { name: 'status.halden.io', status: 'down', value: 'Down' },
];

/**
 * Shared frame for every auth screen: editorial panel on desktop, form-only on mobile.
 * The form card is a double bezel; children are the card contents.
 */
export default function AuthShell({ children }) {
    return (
        <div className="min-h-[100dvh] lg:grid lg:grid-cols-[1.05fr_1fr]">
            <aside className="hidden flex-col justify-between px-12 py-12 lg:flex xl:px-20">
                <Brand size="lg" />

                <div className="max-w-lg space-y-8">
                    <div className="space-y-5">
                        <h2 className="font-display text-5xl font-medium leading-[1.02] tracking-[-0.03em] xl:text-6xl">
                            Know it&apos;s down before your customers do.
                        </h2>
                        <p className="max-w-[44ch] text-base leading-relaxed text-muted-foreground">
                            Scheduled checks, instant alerts and a clear history of every incident.
                        </p>
                    </div>

                    <div className="bezel-sm">
                        <div className="bezel-sm-core p-5">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Response time</p>
                                <span className="rounded-md bg-white/[0.05] px-2 py-0.5 font-mono text-[11px] text-muted-foreground ring-1 ring-white/[0.07]">
                                    Sample data
                                </span>
                            </div>
                            <Sparkline className="mt-3 h-12 w-full" id="auth-spark" />
                            <ul className="mt-3 divide-y divide-white/[0.06]" aria-label="Sample monitors">
                                {SAMPLE.map((m) => (
                                    <li key={m.name} className="flex items-center gap-3 py-2.5 text-[13px]">
                                        <StatusDot status={m.status} />
                                        <span className="min-w-0 flex-1 truncate font-mono">{m.name}</span>
                                        <span className={`font-mono text-xs tabular-nums ${m.status === 'down' ? 'text-destructive' : 'text-foreground'}`}>
                                            {m.value}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground/80">© {new Date().getFullYear()} Ping Pilott</p>
            </aside>

            <section className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-8 sm:px-8 lg:min-h-0">
                <div className="mb-8 lg:hidden">
                    <Brand />
                </div>

                <Reveal className="w-full max-w-md">
                    <div className="bezel">
                        <div className="bezel-core p-6 sm:p-8">{children}</div>
                    </div>
                </Reveal>

                <Link
                    href="/"
                    className="group mt-6 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm text-muted-foreground transition-colors duration-300 ease-fluid hover:text-foreground"
                >
                    <ArrowLeft weight="light" className="size-4 transition-transform duration-500 ease-fluid group-hover:-translate-x-0.5" />
                    Back to home
                </Link>
            </section>
        </div>
    );
}

/** Title block used at the top of each card. */
export function AuthHeading({ icon: Icon, title, description }) {
    return (
        <div className="space-y-3">
            {Icon && (
                <div className="bezel-sm w-fit">
                    <div className="bezel-sm-core grid size-12 place-items-center text-primary">
                        <Icon weight="light" className="size-6" />
                    </div>
                </div>
            )}
            <h1 className="font-display text-3xl font-medium tracking-tight">{title}</h1>
            {description && <p className="text-[15px] leading-relaxed text-muted-foreground">{description}</p>}
        </div>
    );
}
