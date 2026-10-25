'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatTimestamp } from '@/app/components/dateTimeUtils';
import { formatBytes, formatPercent, formatRate, formatUptime, levelOf, summarise } from '@/lib/hostMetrics';
import { cn } from '@/lib/utils';

// Colour never carries the meaning alone: every line has its name in the legend and the tooltip, every bar a figure and a word.
const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];
const AXIS = { fill: 'var(--muted-foreground)', fontSize: 12 };

// The axis has to say which day when the range is longer than one: a 24 hour chart starts and ends at about the same clock time
const shortTime = (period) => (period === '7d' || period === '30d' ? 'D MMM' : period === '24h' ? 'ddd HH:mm' : 'HH:mm');

function ChartTooltip({ active, payload, label, lines, format }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl bg-popover px-3 py-2 text-xs shadow-lg ring-1 ring-white/10">
            <p className="mb-1 text-muted-foreground">{formatTimestamp(new Date(label), null, 'D MMM, HH:mm')}</p>
            {lines.map((line, i) => {
                const entry = payload.find((p) => p.dataKey === line.key);
                if (!entry || entry.value === null || entry.value === undefined) return null;
                return (
                    <p key={line.key} className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ background: line.color ?? COLORS[i % COLORS.length] }} aria-hidden="true" />
                        <span className="text-muted-foreground">{line.label}</span>
                        <span className="ml-auto pl-3 font-mono tabular-nums">{format(entry.value)}</span>
                    </p>
                );
            })}
        </div>
    );
}

/**
 * One chart: a title, the line(s), a legend, and a sentence for people who cannot see it.
 * @param {{ key: string, label: string, color?: string, dashed?: boolean }[]} lines
 */
export function HostChart({ title, rows, lines, period, yMax, yTicks, yWidth = 46, format, unit, summaryKey, className }) {
    const summary = useMemo(() => summarise(rows, summaryKey ?? lines[0].key, title, unit, period), [rows, summaryKey, lines, title, unit, period]);
    const empty = !rows.some((r) => lines.some((l) => r[l.key] !== null && r[l.key] !== undefined));

    return (
        <figure className={cn('min-w-0', className)}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <figcaption className="text-sm font-medium">{title}</figcaption>
                <ul className="flex flex-wrap gap-x-3 text-xs text-muted-foreground" aria-label="Lines in this chart">
                    {lines.map((line, i) => (
                        <li key={line.key} className="flex items-center gap-1.5">
                            <span className="h-0.5 w-3 rounded-full" style={{ background: line.color ?? COLORS[i % COLORS.length], opacity: line.dashed ? 0.6 : 1 }} aria-hidden="true" />
                            {line.label}
                        </li>
                    ))}
                </ul>
            </div>
            {empty ? (
                <div className="mt-3 grid h-[160px] place-items-center rounded-2xl bg-white/[0.02] text-sm text-muted-foreground ring-1 ring-white/[0.05]">No data for this period yet.</div>
            ) : (
                <div role="img" aria-label={summary} className="mt-3 h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={rows} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
                            <CartesianGrid vertical={false} stroke="oklch(1 0 0 / 0.06)" />
                            <XAxis
                                dataKey="t"
                                type="number"
                                domain={['dataMin', 'dataMax']}
                                tickCount={4}
                                tickFormatter={(t) => formatTimestamp(new Date(t), null, shortTime(period))}
                                tick={AXIS}
                                axisLine={false}
                                tickLine={false}
                                tickMargin={8}
                                minTickGap={28}
                            />
                            <YAxis tick={AXIS} axisLine={false} tickLine={false} width={yWidth} domain={yMax ? [0, yMax] : [0, 'auto']} ticks={yTicks} tickFormatter={format} tickCount={4} />
                            <Tooltip content={<ChartTooltip lines={lines} format={format} />} cursor={{ stroke: 'oklch(1 0 0 / 0.14)' }} />
                            {lines.map((line, i) => (
                                <Line
                                    key={line.key}
                                    type="monotone"
                                    dataKey={line.key}
                                    stroke={line.color ?? COLORS[i % COLORS.length]}
                                    strokeWidth={line.dashed ? 1.25 : 2}
                                    strokeDasharray={line.dashed ? '4 3' : undefined}
                                    strokeOpacity={line.dashed ? 0.7 : 1}
                                    dot={false}
                                    activeDot={{ r: 4 }}
                                    isAnimationActive={false}
                                    connectNulls={false}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </figure>
    );
}

const LEVEL_WORD = { ok: null, high: 'Getting full', critical: 'Almost full', unknown: null };
const LEVEL_BAR = { ok: 'bg-[var(--chart-1)]', high: 'bg-warning', critical: 'bg-destructive', unknown: 'bg-muted-foreground' };

/** A bar with its figure beside it and a word when it matters, so it reads without colour */
export function UsageBar({ label, pct, detail }) {
    const level = levelOf(pct);
    const width = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));
    return (
        <div>
            <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-mono text-[13px]">{label}</span>
                <span className="shrink-0 tabular-nums">
                    {formatPercent(pct)}
                    {LEVEL_WORD[level] && <span className={cn('ml-2 text-xs', level === 'critical' ? 'text-destructive' : 'text-warning')}>{LEVEL_WORD[level]}</span>}
                </span>
            </div>
            <div
                role="progressbar"
                aria-label={`${label}: ${formatPercent(pct)} used${LEVEL_WORD[level] ? `, ${LEVEL_WORD[level].toLowerCase()}` : ''}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(width)}
                className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div className={cn('h-full rounded-full transition-[width] duration-500 ease-fluid', LEVEL_BAR[level])} style={{ width: `${width}%` }} />
            </div>
            {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
        </div>
    );
}

function Fact({ label, children, sub }) {
    return (
        <div>
            <dt className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-display text-2xl font-medium tracking-tight tabular-nums">{children}</dd>
            {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
    );
}

/** The newest reading in full: what the machine is doing right now */
export function CurrentValues({ latest }) {
    if (!latest) return null;
    const load = latest.load ? latest.load.map((v) => v.toFixed(2)).join(' · ') : null;
    return (
        <div className="space-y-6">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                <Fact label="CPU" sub={latest.cores ? `${latest.cores} core${latest.cores === 1 ? '' : 's'}` : null}>{formatPercent(latest.cpu)}</Fact>
                <Fact label="Memory" sub={`${formatBytes(latest.mem.used)} of ${formatBytes(latest.mem.total)}`}>{formatPercent(latest.mem.pct)}</Fact>
                <Fact label="Network">
                    {/* two short lines, not one long one: side by side they wrap in the middle of a figure on a phone */}
                    <span className="block text-lg leading-snug"><span className="mr-1.5 text-xs font-normal text-muted-foreground">In</span>{formatRate(latest.rxBps)}</span>
                    <span className="block text-lg leading-snug"><span className="mr-1.5 text-xs font-normal text-muted-foreground">Out</span>{formatRate(latest.txBps)}</span>
                </Fact>
                <Fact label="Uptime" sub={load ? `Load ${load}` : latest.swap ? `Swap ${formatPercent(latest.swap.pct)}` : null}>{formatUptime(latest.uptimeSec)}</Fact>
            </dl>
            {latest.disks.length > 0 && (
                <div>
                    <h4 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Disks</h4>
                    <div className="mt-3 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                        {latest.disks.map((d) => (
                            <UsageBar key={d.mount} label={d.mount} pct={d.pct} detail={`${formatBytes(d.used)} of ${formatBytes(d.total)}`} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/** The busiest processes, by name only: the agent never reads a command line */
export function ProcessList({ procs }) {
    if (!procs?.length) return null;
    return (
        <div>
            <h4 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Busiest processes</h4>
            <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[320px] text-sm">
                    <caption className="sr-only">The busiest processes right now, with their CPU and memory use</caption>
                    <thead>
                        <tr className="text-left text-xs text-muted-foreground">
                            <th scope="col" className="pb-2 font-medium">Name</th>
                            <th scope="col" className="pb-2 text-right font-medium">CPU</th>
                            <th scope="col" className="pb-2 text-right font-medium">Memory</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                        {procs.map((p) => (
                            <tr key={p.name}>
                                <th scope="row" className="max-w-[16rem] truncate py-2 pr-4 text-left font-mono text-[13px] font-normal">{p.name}</th>
                                <td className="py-2 text-right tabular-nums">{p.cpu.toFixed(1)}%</td>
                                <td className="py-2 text-right tabular-nums">{p.mem.toFixed(1)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">CPU is of one core, so a busy process can pass 100%. Names only: the agent never reads command lines.</p>
        </div>
    );
}
