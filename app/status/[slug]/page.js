import { notFound } from 'next/navigation';
import { CheckCircle, Info, Warning, WarningCircle } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/utils';
import { SITE_URL } from '@/lib/site';
import { formatSpan } from '@/lib/time';
import { COMPONENT, OVERALL, dayTitle, fetchPublicStatus, formatUtc, problemDays } from '@/lib/statusPage';

// A page for strangers, rebuilt at most once a minute. It belongs to the owner, not to Ping Pilott: no site navigation,
// the owner's title and monitors, and a small "Powered by" line only where the plan carries it.
// (Next reads this at build time, so it has to be a plain number, the same as REVALIDATE_SECONDS in lib/statusPage.js)
export const revalidate = 60;

const NOT_LISTED = { title: 'Status', robots: { index: false, follow: false } };

export async function generateMetadata({ params }) {
    const { slug } = await params;
    try {
        const status = await fetchPublicStatus(slug);
        if (!status) return NOT_LISTED;
        return {
            // "absolute": the site-wide " · Ping Pilott" suffix does not belong on somebody else's status page
            title: { absolute: `${status.title} status` },
            description: status.description || `Current status of ${status.title}.`,
            alternates: { canonical: `/status/${status.slug}` },
            // Search engines only list it when the owner turned that on
            robots: status.indexable ? { index: true, follow: true } : { index: false, follow: false },
        };
    } catch {
        return NOT_LISTED;
    }
}

const BANNER = {
    success: { icon: CheckCircle, box: 'bg-success/10 ring-success/25', color: 'text-success' },
    warning: { icon: Warning, box: 'bg-warning/10 ring-warning/25', color: 'text-warning' },
    error: { icon: WarningCircle, box: 'bg-destructive/10 ring-destructive/30', color: 'text-destructive' },
    muted: { icon: Info, box: 'bg-white/[0.04] ring-white/10', color: 'text-muted-foreground' },
};

const DOT = { success: 'bg-success', warning: 'bg-warning', error: 'bg-destructive', muted: 'bg-muted-foreground/60' };
const TEXT = { success: 'text-success', warning: 'text-warning', error: 'text-destructive', muted: 'text-muted-foreground' };

const CELL = { ok: 'bg-success/80', minor: 'bg-warning', major: 'bg-destructive', none: 'bg-white/10' };

function Banner({ overall }) {
    const { label, tone } = OVERALL[overall];
    const { icon: Icon, box, color } = BANNER[tone];
    return (
        <div role="status" className={cn('flex items-center gap-3 rounded-2xl px-5 py-4 ring-1', box)}>
            <Icon weight="light" aria-hidden="true" className={cn('size-7 shrink-0', color)} />
            <p className="font-display text-xl font-medium tracking-tight">{label}</p>
        </div>
    );
}

/** The last 30 days, one cell a day, oldest first. Hover or focus a cell for its day. */
function DayBar({ days, name }) {
    if (days.length === 0) return null;
    const bad = problemDays(days);
    return (
        <div
            role="img"
            aria-label={`${name}, last ${days.length} days: ${bad === 0 ? 'no days with problems' : `${bad} day${bad === 1 ? '' : 's'} with problems`}`}
            className="flex h-8 items-stretch gap-[2px]"
        >
            {days.map((day) => (
                <span key={day.date} title={dayTitle(day)} className={cn('min-w-0 flex-1 rounded-[2px]', CELL[day.state])} />
            ))}
        </div>
    );
}

function ComponentRow({ component }) {
    const { label, tone } = COMPONENT[component.state];
    return (
        <li className="space-y-3 px-5 py-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="font-medium">{component.name}</h3>
                <p className={cn('flex items-center gap-2 text-sm', TEXT[tone])}>
                    <span aria-hidden="true" className={cn('size-2 rounded-full', DOT[tone])} />
                    {label}
                </p>
            </div>
            <DayBar days={component.days} name={component.name} />
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{component.days.length} days ago</span>
                <span className="tabular-nums">{component.uptime === null ? 'No data yet' : `${component.uptime}% uptime`}</span>
                <span>Today</span>
            </div>
        </li>
    );
}

function IncidentRow({ incident }) {
    return (
        <li className="flex flex-wrap items-start gap-x-4 gap-y-1 px-5 py-4">
            <span aria-hidden="true" className={cn('mt-2 size-2 shrink-0 rounded-full', incident.ongoing ? 'bg-destructive' : 'bg-muted-foreground/60')} />
            <div className="min-w-0 flex-1 basis-48">
                <p className="font-medium">
                    {incident.name}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                        {incident.ongoing ? 'Ongoing' : `Resolved after ${formatSpan(incident.durationMs ?? 0)}`}
                    </span>
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    {formatUtc(incident.startedAt)}
                    {incident.endedAt ? ` to ${formatUtc(incident.endedAt)}` : ' to now'}
                </p>
            </div>
        </li>
    );
}

export default async function StatusPage({ params }) {
    const { slug } = await params;
    const status = await fetchPublicStatus(slug);
    if (!status) notFound();

    return (
        <main id="main-content" className="min-h-[100dvh] px-4 py-10 sm:px-8 sm:py-16">
            <div className="mx-auto max-w-3xl space-y-8">
                <header className="space-y-2">
                    <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">{status.title}</h1>
                    {status.description && <p className="max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground">{status.description}</p>}
                </header>

                <Banner overall={status.overall} />

                <section aria-label="Services">
                    {status.components.length === 0 ? (
                        <p className="rounded-2xl px-5 py-6 text-sm text-muted-foreground ring-1 ring-white/10">Nothing is listed on this page yet.</p>
                    ) : (
                        <ul className="divide-y divide-white/[0.07] overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/10">
                            {status.components.map((c) => <ComponentRow key={c.id} component={c} />)}
                        </ul>
                    )}
                </section>

                <section aria-labelledby="incidents-heading" className="space-y-3">
                    <h2 id="incidents-heading" className="font-display text-xl font-medium tracking-tight">Recent incidents</h2>
                    {status.incidents.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No incidents in the last 14 days.</p>
                    ) : (
                        <ul className="divide-y divide-white/[0.07] overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/10">
                            {status.incidents.map((i) => <IncidentRow key={`${i.name}-${i.startedAt}`} incident={i} />)}
                        </ul>
                    )}
                </section>

                <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-6 text-xs text-muted-foreground">
                    <p>{status.generatedAt ? `Updated ${formatUtc(status.generatedAt)}. Times are in UTC.` : 'Times are in UTC.'}</p>
                    {status.poweredBy && (
                        <a href={`${SITE_URL}/?ref=status-page`} rel="noopener" className="underline-offset-4 hover:text-foreground hover:underline">
                            Powered by Ping Pilott
                        </a>
                    )}
                </footer>
            </div>
        </main>
    );
}
