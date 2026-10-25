'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Copy, Check, CaretDown, LockSimple } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { failureDetailOf, hasMoreDetail } from '@/lib/checkDetail';
import { cn } from '@/lib/utils';

const CONFIDENCE = { high: ['Most likely', 'destructive'], medium: ['Possible', 'warning'], low: ['Less likely', 'outline'] };

/** Copies text, and says so for a moment. Falls back to a hidden textarea where the clipboard API is not allowed. */
function CopyButton({ text, label }) {
    const [copied, setCopied] = useState(false);
    const timer = useRef(null);
    useEffect(() => () => clearTimeout(timer.current), []);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const area = document.createElement('textarea');
            area.value = text;
            area.setAttribute('readonly', '');
            area.style.position = 'fixed';
            area.style.opacity = '0';
            document.body.appendChild(area);
            area.select();
            try { document.execCommand('copy'); } finally { document.body.removeChild(area); }
        }
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1800);
    };

    return (
        <Button type="button" variant="ghost" size="icon-sm" onClick={copy} aria-label={copied ? 'Copied' : label}>
            {copied ? <Check weight="bold" className="text-success" /> : <Copy weight="light" />}
        </Button>
    );
}

// Each step of the request, as a slice of one bar. Colour only says "this is where it failed"; the figures are in the list.
function TimingBar({ steps, totalMs, phaseLabel }) {
    const summary = steps.map((s) => `${s.label} ${s.ms} ms${s.failed ? ' (failed here)' : ''}`).join(', ');
    return (
        <div>
            <div role="img" aria-label={`Where the check spent its time: ${summary}`} className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full">
                {steps.map((s) => (
                    <span
                        key={s.key}
                        style={{ flexGrow: Math.max(s.share, 0.04), flexBasis: 0 }}
                        className={cn('min-w-1 rounded-full', s.failed ? 'bg-destructive' : 'bg-[var(--chart-1)]/55')}
                    />
                ))}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                {steps.map((s) => (
                    <div key={s.key}>
                        <dt className={cn('flex items-center gap-1.5 text-xs', s.failed ? 'text-destructive' : 'text-muted-foreground')}>
                            <span className={cn('size-1.5 rounded-full', s.failed ? 'bg-destructive' : 'bg-[var(--chart-1)]/55')} aria-hidden="true" />
                            {s.label}
                        </dt>
                        <dd className="font-mono tabular-nums">{s.ms.toLocaleString('en-US')} ms{s.failed ? <span className="sr-only"> (failed here)</span> : null}</dd>
                    </div>
                ))}
            </dl>
            {phaseLabel && steps.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                    The check stopped at <span className="text-foreground/80">{phaseLabel.toLowerCase()}</span>
                    {totalMs ? `, ${totalMs.toLocaleString('en-US')} ms in` : ''}. Steps it never reached are not shown.
                </p>
            )}
        </div>
    );
}

function Heading({ children }) {
    return <h4 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{children}</h4>;
}

/**
 * What a developer can use to find the cause of a failed check: where it stopped, the likely causes with the evidence for
 * each, what to check in order (commands can be copied), and what the server actually returned. The backend decides what a
 * plan gets; this shows what arrived, and a short note when more is on a paid plan. Nothing shows for a payload with
 * nothing beyond the one-line diagnosis, so DiagnosisNote above it is all there is.
 *
 * source: a server, a check or an incident: anything with `diagnosis` and `failureDetail`.
 * collapsible: tucked behind a "Show details" line, for a list row where the whole panel would crowd it.
 */
export default function CheckDetail({ source, className, collapsible = false }) {
    const detail = failureDetailOf(source);
    if (!hasMoreDetail(detail)) return null;

    const { causes, checks, steps, evidence, locked } = detail;

    const body = (
        <div className={cn('space-y-6', !collapsible && className)}>
            {(detail.phaseLabel || detail.statusCode) && (
                <div className="flex flex-wrap items-center gap-2">
                    {detail.phaseLabel && <Badge variant="destructive">Failed at: {detail.phaseLabel}</Badge>}
                    {detail.statusCode && <Badge variant="outline">HTTP {detail.statusCode}</Badge>}
                </div>
            )}

            {steps.length > 0 && <TimingBar steps={steps} totalMs={detail.totalMs} phaseLabel={detail.phaseLabel} />}

            {causes.length > 0 && (
                <section aria-label="Likely causes" className="space-y-3">
                    <Heading>Likely causes</Heading>
                    <ol className="space-y-3">
                        {causes.map((c) => {
                            const [label, tone] = CONFIDENCE[c.confidence];
                            return (
                                <li key={c.text} className="rounded-xl bg-white/[0.03] px-4 py-3 ring-1 ring-white/[0.06]">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant={tone}>{label}</Badge>
                                        <p className="text-sm font-medium">{c.text}</p>
                                    </div>
                                    {c.evidence.length > 0 && (
                                        <ul className="mt-2 space-y-0.5 text-[13px] text-muted-foreground">
                                            {c.evidence.map((line) => <li key={line} className="break-words">{line}</li>)}
                                        </ul>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </section>
            )}

            {checks.length > 0 && (
                <section aria-label="What to check" className="space-y-3">
                    <Heading>What to check, in order</Heading>
                    <ol className="space-y-3">
                        {checks.map((c, i) => (
                            <li key={`${i}-${c.step}`} className="flex gap-3 text-sm">
                                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-white/[0.06] text-[11px] tabular-nums text-muted-foreground" aria-hidden="true">{i + 1}</span>
                                <div className="min-w-0 flex-1">
                                    <p>{c.step}</p>
                                    {c.command && (
                                        <div className="mt-1.5 flex items-start gap-1 rounded-lg bg-black/30 py-1 pl-3 pr-1 ring-1 ring-white/[0.06]">
                                            <code className="min-w-0 flex-1 overflow-x-auto whitespace-pre py-1.5 font-mono text-[12.5px]">{c.command}</code>
                                            <CopyButton text={c.command} label={`Copy command: ${c.command}`} />
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>
            )}

            {evidence && (
                <details className="group rounded-xl ring-1 ring-white/[0.08]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                        What the server returned
                        <CaretDown weight="light" className="size-4 text-muted-foreground transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <div className="space-y-4 border-t border-white/[0.06] px-4 py-4 text-sm">
                        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
                            {evidence.statusCode && (<><dt className="text-muted-foreground">Status</dt><dd className="font-mono">{evidence.statusCode}</dd></>)}
                            {evidence.address && (<><dt className="text-muted-foreground">Resolved to</dt><dd className="break-all font-mono">{evidence.address}</dd></>)}
                            {evidence.headers?.map(([name, value]) => (
                                <div key={name} className="contents">
                                    <dt className="font-mono text-muted-foreground">{name}</dt>
                                    <dd className="break-words font-mono">{value}</dd>
                                </div>
                            ))}
                        </dl>
                        {evidence.snippet && (
                            <div>
                                <p className="mb-1.5 text-xs text-muted-foreground">
                                    Start of the page{evidence.snippetTruncated ? ' (cut)' : ''}, shown as plain text. It may contain private content from your site.
                                </p>
                                <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-black/30 p-3 font-mono text-[12.5px] ring-1 ring-white/[0.06]">{evidence.snippet}</pre>
                            </div>
                        )}
                    </div>
                </details>
            )}

            {locked && (
                <p className="flex items-start gap-2 text-[13px] text-muted-foreground">
                    <LockSimple weight="light" className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>
                        Likely causes, a checklist of what to check and what your server returned are on paid plans.{' '}
                        <Link href="/subscription" className="text-primary underline-offset-4 hover:underline">See plans</Link>
                    </span>
                </p>
            )}
        </div>
    );

    if (!collapsible) return body;

    return (
        <details className={cn('group', className)}>
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-sm text-sm text-primary outline-none underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">Show details</span>
                <span className="hidden group-open:inline">Hide details</span>
                <CaretDown weight="light" className="size-3.5 transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="mt-4">{body}</div>
        </details>
    );
}
