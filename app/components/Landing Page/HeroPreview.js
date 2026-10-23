import React from 'react'
import { BellRinging } from '@phosphor-icons/react/dist/ssr'
import { Bezel } from '@/components/ui/bezel'
import { StatusDot } from '@/components/ui/status'

// Sample response times (ms). Fixed values so server and client render identically.
const SERIES = [148, 142, 151, 139, 144, 160, 146, 141, 138, 152, 149, 143, 171, 158, 145, 140, 137, 146, 154, 147, 142, 139, 144, 150, 163, 148, 143, 141, 146, 152, 145, 140, 138, 144, 149, 142, 147, 151, 146, 143]

export function Sparkline({ values = SERIES, className = '', height = 56, id = 'spark' }) {
    const w = 320
    const min = Math.min(...values) - 10
    const max = Math.max(...values) + 10
    const step = w / (values.length - 1)
    const pts = values.map((v, i) => [i * step, height - ((v - min) / (max - min)) * height])
    const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
    const area = `${line} L${w} ${height} L0 ${height} Z`
    return (
        <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={className} aria-hidden="true">
            <defs>
                <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.82 0.11 215)" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="oklch(0.82 0.11 215)" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#${id})`} />
            <path d={line} fill="none" stroke="oklch(0.82 0.11 215)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>
    )
}

const MONITORS = [
    { name: 'northwind.dev/api', status: 'up', ms: '142 ms', uptime: '99.98%' },
    { name: 'shop.larkspur.co', status: 'up', ms: '238 ms', uptime: '99.94%' },
    { name: 'status.halden.io', status: 'down', ms: '—', uptime: '98.71%' },
    { name: 'cdn.brightfern.net', status: 'up', ms: '61 ms', uptime: '100%' },
]

export default function HeroPreview() {
    return (
        <div className="relative">
            <Bezel coreClassName="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Overview</p>
                        <p className="mt-1 font-display text-2xl font-medium tracking-tight tabular-nums">
                            3 of 4 <span className="text-muted-foreground">operational</span>
                        </p>
                    </div>
                    <span className="rounded-md bg-white/[0.05] px-2 py-1 font-mono text-[11px] text-muted-foreground ring-1 ring-white/[0.07]">
                        Sample data
                    </span>
                </div>

                <div className="mt-5 rounded-2xl bg-black/20 p-4 ring-1 ring-white/[0.05]">
                    <div className="flex items-baseline justify-between">
                        <p className="text-xs text-muted-foreground">Response time · last 40 checks</p>
                        <p className="font-mono text-xs tabular-nums text-foreground">146 ms avg</p>
                    </div>
                    <Sparkline className="mt-3 h-14 w-full" id="hero-spark" />
                </div>

                <ul className="mt-4 divide-y divide-white/[0.06]" aria-label="Sample monitors">
                    {MONITORS.map((m) => (
                        <li key={m.name} className="flex items-center gap-3 py-3 first:pt-1">
                            <StatusDot status={m.status} />
                            <span className="min-w-0 flex-1 truncate font-mono text-[13px]">{m.name}</span>
                            <span className="hidden font-mono text-xs tabular-nums text-muted-foreground sm:block">{m.uptime}</span>
                            <span className={`w-14 text-right font-mono text-xs tabular-nums ${m.status === 'down' ? 'text-destructive' : 'text-foreground'}`}>
                                {m.status === 'down' ? 'Down' : m.ms}
                            </span>
                        </li>
                    ))}
                </ul>
            </Bezel>

            {/* Alert card: overlaps and tilts on desktop, stacks flat on mobile */}
            <div className="mt-4 md:absolute md:-bottom-9 md:-left-10 md:mt-0 md:w-72 md:-rotate-2">
                <div className="glass flex items-start gap-3 rounded-2xl p-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-destructive/15 text-destructive">
                        <BellRinging weight="light" className="size-5" />
                    </span>
                    <div className="min-w-0 text-sm">
                        <p className="font-medium">status.halden.io is down</p>
                        <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                            Timed out after 30 s. Alert emailed at 09:41.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
