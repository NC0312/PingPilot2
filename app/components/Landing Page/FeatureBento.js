import React from 'react'
import { Bell, ChartLineUp, ClockCountdown, Receipt } from '@phosphor-icons/react/dist/ssr'
import { Bezel } from '@/components/ui/bezel'
import { Reveal } from '@/components/ui/reveal'
import { Sparkline } from './HeroPreview'

// 60 minutes of checks. 1 = ok, 0 = failed. Fixed so SSR and client match.
const TIMELINE = '111111111111111111111111111011111111111111111111111100111111'.split('').map(Number)

const INCIDENTS = [
    { site: 'status.halden.io', note: 'Timed out after 30 s', when: 'Today, 09:41', length: 'ongoing', open: true },
    { site: 'shop.larkspur.co', note: 'HTTP 503 from origin', when: 'Tue, 22:07', length: '6 min', open: false },
    { site: 'northwind.dev/api', note: 'Connection refused', when: 'Sun, 03:15', length: '2 min', open: false },
]

function Label({ icon: Icon, children }) {
    return (
        <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
            <Icon weight="light" className="size-4" />
            {children}
        </span>
    )
}

export default function FeatureBento() {
    return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
            {/* Wide: check cadence */}
            <Reveal className="md:col-span-7">
                <Bezel className="h-full" coreClassName="flex h-full flex-col justify-between gap-10 p-7 sm:p-9">
                    <div className="max-w-md space-y-4">
                        <Label icon={ClockCountdown}>Check cadence</Label>
                        <h3 className="font-display text-3xl font-medium leading-[1.1] tracking-tight">
                            Every check, as often as every minute.
                        </h3>
                        <p className="text-[15px] leading-relaxed text-muted-foreground">
                            Pick an interval per monitor. Paid plans check every minute; the free plan checks every five.
                        </p>
                    </div>
                    <div>
                        <div className="flex h-12 items-end gap-[3px]" role="img" aria-label="Last 60 minutes: 57 successful checks, 3 failed">
                            {TIMELINE.map((ok, i) => (
                                <span
                                    key={i}
                                    className={`flex-1 rounded-[2px] ${ok ? 'h-full bg-success/70' : 'h-full bg-destructive'}`}
                                />
                            ))}
                        </div>
                        <div className="mt-2 flex justify-between font-mono text-[11px] text-muted-foreground">
                            <span>60 min ago</span>
                            <span>now</span>
                        </div>
                    </div>
                </Bezel>
            </Reveal>

            {/* Narrow: alerts */}
            <Reveal delay={90} className="md:col-span-5">
                <Bezel className="h-full" coreClassName="flex h-full flex-col gap-8 p-7 sm:p-9">
                    <div className="space-y-4">
                        <Label icon={Bell}>Alerts</Label>
                        <h3 className="font-display text-3xl font-medium leading-[1.1] tracking-tight">
                            Told the moment it fails.
                        </h3>
                        <p className="text-[15px] leading-relaxed text-muted-foreground">
                            Email alerts on every plan, webhooks from Starter up. You hear about it before your customers write in.
                        </p>
                    </div>
                    <div className="mt-auto rounded-2xl bg-black/20 p-4 ring-1 ring-white/[0.05]">
                        <p className="font-mono text-[11px] text-muted-foreground">alerts@pingpilott · 09:41</p>
                        <p className="mt-2 text-sm font-medium">status.halden.io is down</p>
                        <p className="mt-1 text-[13px] text-muted-foreground">First failed check at 09:40. We&apos;ll email again when it recovers.</p>
                    </div>
                </Bezel>
            </Reveal>

            {/* Narrow: response times */}
            <Reveal className="md:col-span-5">
                <Bezel className="h-full" coreClassName="flex h-full flex-col gap-8 p-7 sm:p-9">
                    <div className="space-y-4">
                        <Label icon={ChartLineUp}>Response time</Label>
                        <h3 className="font-display text-3xl font-medium leading-[1.1] tracking-tight">
                            See slow before it&apos;s down.
                        </h3>
                        <p className="text-[15px] leading-relaxed text-muted-foreground">
                            Every check records how long the server took to answer, so a creeping response time shows up well before an outage.
                        </p>
                    </div>
                    <div className="mt-auto">
                        <div className="flex items-baseline justify-between">
                            <p className="font-display text-4xl font-medium tracking-tight tabular-nums">146<span className="ml-1 text-lg text-muted-foreground">ms</span></p>
                            <p className="text-xs text-muted-foreground">24 h average</p>
                        </div>
                        <Sparkline className="mt-3 h-16 w-full" height={64} id="bento-spark" values={[120, 126, 118, 131, 140, 152, 149, 160, 171, 158, 146, 139, 133, 128, 141, 147, 144, 138, 130, 126, 134, 143, 148, 146]} />
                    </div>
                </Bezel>
            </Reveal>

            {/* Wide: incident history */}
            <Reveal delay={90} className="md:col-span-7">
                <Bezel className="h-full" coreClassName="flex h-full flex-col gap-8 p-7 sm:p-9">
                    <div className="max-w-md space-y-4">
                        <Label icon={Receipt}>Incident history</Label>
                        <h3 className="font-display text-3xl font-medium leading-[1.1] tracking-tight">
                            A record of every outage.
                        </h3>
                        <p className="text-[15px] leading-relaxed text-muted-foreground">
                            When it started, what the server said, how long it lasted. Paid plans keep the full history for reporting.
                        </p>
                    </div>
                    <ul className="mt-auto divide-y divide-white/[0.06] rounded-2xl bg-black/20 px-4 ring-1 ring-white/[0.05]">
                        {INCIDENTS.map((i) => (
                            <li key={i.site + i.when} className="flex items-center gap-3 py-3.5 text-sm">
                                <span className={`size-2 shrink-0 rounded-full ${i.open ? 'bg-destructive' : 'bg-muted-foreground/60'}`} />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-mono text-[13px]">{i.site}</p>
                                    <p className="truncate text-xs text-muted-foreground">{i.note}</p>
                                </div>
                                <div className="text-right text-xs text-muted-foreground">
                                    <p>{i.when}</p>
                                    <p className={i.open ? 'text-destructive' : ''}>{i.length}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Bezel>
            </Reveal>
        </div>
    )
}
