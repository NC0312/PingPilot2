import Link from 'next/link'
import Navbar from '../Landing Page/Navbar'
import SiteFooter from './SiteFooter'
import { LEGAL } from '@/lib/legal'
import { SITE_URL, SITE_NAME } from '@/lib/site'

/** sections: [{ title, body: [string | { list: string[] }] }] */
export default function LegalPage({ path, title, intro, sections }) {
    const crumbs = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: title, item: `${SITE_URL}${path}` },
        ],
    }
    return (
        <div className="flex min-h-[100dvh] flex-col">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
            <Navbar />
            <main id="main-content" className="px-4 pb-24 pt-32 sm:px-8 md:pt-44">
                <div className="mx-auto max-w-3xl">
                    <span className="eyebrow">Legal</span>
                    <h1 className="mt-6 font-display text-4xl font-medium leading-[1.05] tracking-[-0.03em] md:text-5xl">{title}</h1>
                    <p className="mt-4 text-sm text-muted-foreground">Last updated {LEGAL.updatedLabel}</p>
                    <p className="mt-6 max-w-[62ch] text-[15px] leading-relaxed text-muted-foreground">{intro}</p>

                    <div className="mt-12 space-y-10">
                        {sections.map((s, i) => (
                            <section key={s.title} aria-labelledby={`s${i}`} className="space-y-4">
                                <h2 id={`s${i}`} className="font-display text-2xl font-medium tracking-tight">{i + 1}. {s.title}</h2>
                                {s.body.map((b, j) => typeof b === 'string'
                                    ? <p key={j} className="max-w-[66ch] text-[15px] leading-relaxed text-muted-foreground">{b}</p>
                                    : <ul key={j} className="max-w-[66ch] list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted-foreground">{b.list.map((li) => <li key={li}>{li}</li>)}</ul>)}
                            </section>
                        ))}
                    </div>

                    <p className="mt-14 border-t border-white/[0.07] pt-6 text-sm text-muted-foreground">
                        See also: <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> · <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                    </p>
                </div>
            </main>
            <SiteFooter />
        </div>
    )
}
