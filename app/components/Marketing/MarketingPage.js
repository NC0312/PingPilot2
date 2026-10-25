import Link from 'next/link'
import Navbar from '../Landing Page/Navbar'
import SiteFooter from './SiteFooter'
import { Button, ButtonArrow } from '@/components/ui/button'
import { Reveal } from '@/components/ui/reveal'
import { SITE_URL, SITE_NAME } from '@/lib/site'

/** Page chrome for public SEO pages: nav, hero, JSON-LD (breadcrumb), closing CTA, footer. */
export default function MarketingPage({ path, crumb, eyebrow, title, intro, faqs, children, cta = true }) {
    const url = `${SITE_URL}${path}`
    const graph = [
        {
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
                { '@type': 'ListItem', position: 2, name: crumb, item: url },
            ],
        },
    ]

    return (
        <div className="flex min-h-[100dvh] flex-col">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }) }}
            />
            <Navbar />
            <main id="main-content">
                <section className="px-4 pb-16 pt-32 sm:px-8 md:pb-24 md:pt-44">
                    <div className="mx-auto max-w-4xl space-y-7">
                        <Reveal><span className="eyebrow">{eyebrow}</span></Reveal>
                        <Reveal delay={80}>
                            <h1 className="font-display text-4xl font-medium leading-[1.02] tracking-[-0.03em] sm:text-5xl md:text-6xl">{title}</h1>
                        </Reveal>
                        <Reveal delay={160}>
                            <p className="max-w-[60ch] text-lg leading-relaxed text-muted-foreground">{intro}</p>
                        </Reveal>
                        <Reveal delay={240}>
                            <Button asChild size="lg">
                                <Link href="/auth?mode=signup">Start free trial<ButtonArrow /></Link>
                            </Button>
                        </Reveal>
                    </div>
                </section>

                {children}

                {faqs?.length > 0 && (
                    <Section id="faq" eyebrow="FAQ" title="Common questions">
                        <dl className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
                            {faqs.map((f) => (
                                <div key={f.q} className="grid gap-3 py-7 md:grid-cols-[0.8fr_1.2fr] md:gap-10">
                                    <dt className="font-display text-xl font-medium tracking-tight">{f.q}</dt>
                                    <dd className="max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground">{f.a}</dd>
                                </div>
                            ))}
                        </dl>
                    </Section>
                )}

                {cta && (
                    <section className="px-4 pb-20 pt-8 sm:px-8 md:pb-28">
                        <div className="mx-auto max-w-4xl space-y-6 text-center">
                            <h2 className="font-display text-3xl font-medium tracking-tight md:text-4xl">Add your first monitor today.</h2>
                            <p className="text-[15px] text-muted-foreground">Free 2-day trial. One URL, checked every 5 minutes.</p>
                            <Button asChild size="lg">
                                <Link href="/auth?mode=signup">Start free trial<ButtonArrow /></Link>
                            </Button>
                        </div>
                    </section>
                )}
            </main>
            <SiteFooter />
        </div>
    )
}

export function Section({ id, eyebrow, title, children }) {
    return (
        <section id={id} className="px-4 py-16 sm:px-8 md:py-24">
            <div className="mx-auto max-w-4xl">
                <div className="mb-10 space-y-4">
                    {eyebrow && <span className="eyebrow">{eyebrow}</span>}
                    <h2 className="font-display text-3xl font-medium leading-[1.08] tracking-tight md:text-4xl">{title}</h2>
                </div>
                {children}
            </div>
        </section>
    )
}

/** Grid of short feature cards: [{ title, body }]. */
export function FeatureGrid({ items }) {
    return (
        <ul className="grid gap-5 sm:grid-cols-2">
            {items.map((i) => (
                <li key={i.title} className="rounded-2xl bg-white/[0.03] p-6 ring-1 ring-white/[0.07]">
                    <h3 className="font-display text-xl font-medium tracking-tight">{i.title}</h3>
                    <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">{i.body}</p>
                </li>
            ))}
        </ul>
    )
}

export function Prose({ children }) {
    return <div className="max-w-[62ch] space-y-5 text-[15px] leading-relaxed text-muted-foreground">{children}</div>
}
