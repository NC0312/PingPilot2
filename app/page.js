import Link from 'next/link'
import { ArrowDown, DeviceMobile } from '@phosphor-icons/react/dist/ssr'
import Navbar from './components/Landing Page/Navbar'
import HeroPreview from './components/Landing Page/HeroPreview'
import FeatureBento from './components/Landing Page/FeatureBento'
import PricingSection from './components/Landing Page/PricingSection'
import FooterNav from './components/Landing Page/FooterNav'
import { Brand } from '@/components/ui/brand'
import { Button, ButtonArrow } from '@/components/ui/button'
import { Reveal } from '@/components/ui/reveal'
import { SITE_URL, SITE_NAME } from '@/lib/site'
import { pageMetadata, faqSchema } from '@/lib/seo'

const STEPS = [
    {
        n: '01',
        title: 'Add a URL',
        body: 'Paste the address of a website or server, give it a name, and choose how often to check it.',
    },
    {
        n: '02',
        title: 'We check it on schedule',
        body: 'Ping Pilott requests the URL from our servers and records whether it answered and how long it took.',
    },
    {
        n: '03',
        title: 'Get alerted, then look back',
        body: 'A failed check sends you an alert. The dashboard keeps status, response times and every incident in one place.',
    },
]

export const metadata = pageMetadata({
    path: '/',
    title: { absolute: 'Website Uptime Monitoring & Server Monitoring Tool | Ping Pilott' },
    ogTitle: 'Ping Pilott: website uptime monitoring with instant downtime alerts',
    description:
        'Monitor website and server uptime with checks as often as every minute, instant alerts by email, Slack, Discord and Telegram, a diagnosis of why a check failed, public status pages and CPU, memory and disk metrics. Free plan, no expiry.',
})

const MORE = [
    {
        href: '/public-status-page',
        title: 'Public status page',
        body: 'Give customers a page that shows what is up, the last 30 days and recent incidents. One on every plan, up to 10 on Business.',
    },
    {
        href: '/server-resource-monitoring',
        title: 'CPU, memory and disk',
        body: 'Install the small host agent and see whether the machine ran out of resources when a check failed. On Starter, Pro and Business.',
    },
    {
        href: '/docs/failures',
        title: 'Why it failed',
        body: 'Each failed check shows the step that broke (DNS, connect, TLS, response, content) with the likely causes and what to check first.',
    },
]

const FAQS = [
    { q: 'What is Ping Pilott?', a: 'Ping Pilott is an uptime monitor for websites, APIs, TCP ports and databases. It checks them on a schedule from outside your network, alerts you when one stops answering, and records response times and every incident.' },
    { q: 'Is there a free plan?', a: 'Yes. The free plan never expires and covers 5 URLs checked every 5 minutes, with alerts by email, Slack, Discord and Telegram, and one public status page.' },
    { q: 'Does Ping Pilott tell me why a site is down?', a: 'It shows which step of the check failed (name lookup, connection, secure connection, response or page content) and the usual cause. Paid plans add the likely causes with evidence, a checklist of what to check, and what the server answered.' },
    { q: 'Can I show customers a status page?', a: 'Yes. A public status page lists the monitors you choose with 30 days of history and recent incidents. Free and Starter include one page, Pro three and Business ten. Search engines are told not to list it unless you turn that on.' },
    { q: 'Can it monitor CPU, memory and disk?', a: 'Yes, with the host agent, a small program you install on the server. It reports CPU, memory, disk and network once a minute and can alert you when they stay high. Host metrics are on Starter (3 servers), Pro (15) and Business (60).' },
    { q: 'Is there a mobile app?', a: 'There is an Android app that sends alerts to your phone, with Check now and Snooze buttons. There is no iPhone app yet; alerts still arrive by email there.' },
]

const JSON_LD = {
    '@context': 'https://schema.org',
    '@graph': [
        { '@type': 'Organization', '@id': `${SITE_URL}/#org`, name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/logo.png` },
        { '@type': 'WebSite', '@id': `${SITE_URL}/#site`, name: SITE_NAME, url: SITE_URL, publisher: { '@id': `${SITE_URL}/#org` } },
        {
            '@type': 'SoftwareApplication',
            name: SITE_NAME,
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Web',
            description: 'Website and server uptime monitoring with scheduled checks, alerts by email, Slack, Discord and Telegram, failure diagnosis, public status pages, host metrics and incident history.',
            url: SITE_URL,
            featureList: [
                'Website, API, TCP port and database monitoring',
                'Checks as often as every minute',
                'Alerts by email, Slack, Discord, Telegram and webhook',
                'Response-time tracking and slow-response alerts',
                'Failure diagnosis showing the step that failed',
                'Page content (keyword) checks and certificate expiry alerts',
                'Public status pages',
                'CPU, memory and disk metrics through a host agent',
                'Incident history',
                'Android app',
            ],
            offers: [
                { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
                { '@type': 'Offer', name: 'Starter', price: '10', priceCurrency: 'USD' },
                { '@type': 'Offer', name: 'Pro', price: '29', priceCurrency: 'USD' },
                { '@type': 'Offer', name: 'Business', price: '79', priceCurrency: 'USD' },
            ],
        },
        faqSchema(FAQS),
    ],
}

export default function LandingPage() {
    return (
        <div className="flex min-h-[100dvh] flex-col">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
            <Navbar />

            <main id="main-content">
                {/* Hero: editorial split */}
                <section className="px-4 pb-28 pt-32 sm:px-8 md:pb-36 md:pt-44">
                    <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
                        <div className="space-y-8">
                            <Reveal>
                                <span className="eyebrow">Website uptime monitoring</span>
                            </Reveal>
                            <Reveal delay={80}>
                                <h1 className="font-display text-5xl font-medium leading-[0.98] tracking-[-0.035em] sm:text-6xl md:text-7xl">
                                    Know it&apos;s down before your customers do.
                                </h1>
                            </Reveal>
                            <Reveal delay={160}>
                                <p className="max-w-[48ch] text-lg leading-relaxed text-muted-foreground">
                                    Ping Pilott is a website and server uptime monitor. It checks your URLs as often as every minute, emails you the moment a site goes down, and keeps a clear history of every incident.
                                </p>
                            </Reveal>
                            <Reveal delay={240} className="flex flex-wrap items-center gap-3">
                                <Button asChild size="lg">
                                    <Link href="/auth?mode=signup">
                                        Start free
                                        <ButtonArrow />
                                    </Link>
                                </Button>
                                <Button asChild size="lg" variant="ghost">
                                    <a href="#pricing">
                                        See pricing
                                        <ArrowDown weight="light" />
                                    </a>
                                </Button>
                            </Reveal>
                            <Reveal delay={300}>
                                <p className="text-[13px] text-muted-foreground">Free forever. 5 URLs, checked every 5 minutes.</p>
                            </Reveal>
                            <Reveal delay={360}>
                                <Link
                                    href="/android-app"
                                    className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3.5 py-1.5 text-[13px] text-muted-foreground ring-1 ring-white/10 transition-colors duration-300 ease-fluid hover:bg-white/[0.07] hover:text-foreground"
                                >
                                    <DeviceMobile weight="light" className="size-4 text-primary" />
                                    New: the Android app sends alerts to your phone
                                </Link>
                            </Reveal>
                        </div>

                        <Reveal delay={200} className="lg:pl-4">
                            <HeroPreview />
                        </Reveal>
                    </div>
                </section>

                {/* Features: asymmetric bento */}
                <section id="features" className="px-4 py-24 sm:px-8 md:py-32">
                    <div className="mx-auto max-w-6xl">
                        <Reveal className="mb-14 max-w-xl space-y-5">
                            <span className="eyebrow">What you get</span>
                            <h2 className="font-display text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
                                Website and server monitoring, without the setup.
                            </h2>
                        </Reveal>
                        <FeatureBento />
                    </div>
                </section>

                {/* Beyond uptime checks: links to the deeper pages */}
                <section className="px-4 py-24 sm:px-8 md:py-32">
                    <div className="mx-auto max-w-6xl">
                        <Reveal className="mb-12 max-w-xl space-y-5">
                            <span className="eyebrow">More than a ping</span>
                            <h2 className="font-display text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
                                Find out why, and tell your customers.
                            </h2>
                        </Reveal>
                        <ul className="grid gap-5 md:grid-cols-3">
                            {MORE.map((m, i) => (
                                <Reveal as="li" key={m.href} delay={i * 80}>
                                    <Link href={m.href} className="block h-full rounded-2xl bg-white/[0.03] p-7 ring-1 ring-white/[0.07] transition-colors duration-300 ease-fluid hover:bg-white/[0.06]">
                                        <h3 className="font-display text-2xl font-medium tracking-tight">{m.title}</h3>
                                        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{m.body}</p>
                                    </Link>
                                </Reveal>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* How it works: sticky title, stepped list */}
                <section id="how" className="px-4 py-24 sm:px-8 md:py-32">
                    <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
                        <Reveal className="md:sticky md:top-32 md:self-start">
                            <div className="space-y-5">
                                <span className="eyebrow">How it works</span>
                                <h2 className="font-display text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
                                    Three steps to a quiet pager.
                                </h2>
                            </div>
                        </Reveal>
                        <ol className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
                            {STEPS.map((s, i) => (
                                <Reveal as="li" key={s.n} delay={i * 80} className="grid grid-cols-[3.5rem_1fr] gap-4 py-9 md:grid-cols-[5rem_1fr]">
                                    <span className="font-mono text-sm tabular-nums text-primary">{s.n}</span>
                                    <div className="space-y-2.5">
                                        <h3 className="font-display text-2xl font-medium tracking-tight">{s.title}</h3>
                                        <p className="max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </ol>
                    </div>
                </section>

                <PricingSection />

                <section id="faq" className="px-4 py-24 sm:px-8 md:py-32">
                    <div className="mx-auto max-w-6xl">
                        <Reveal className="mb-12 max-w-xl space-y-5">
                            <span className="eyebrow">FAQ</span>
                            <h2 className="font-display text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">Common questions.</h2>
                        </Reveal>
                        <dl className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
                            {FAQS.map((f) => (
                                <div key={f.q} className="grid gap-3 py-7 md:grid-cols-[0.8fr_1.2fr] md:gap-10">
                                    <dt className="font-display text-xl font-medium tracking-tight">{f.q}</dt>
                                    <dd className="max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground">{f.a}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </section>

                {/* Closing call to action */}
                <section className="px-4 pb-20 pt-8 sm:px-8 md:pb-28">
                    <Reveal className="mx-auto max-w-6xl">
                        <div className="bezel">
                            <div className="bezel-core relative overflow-hidden px-7 py-16 text-center sm:px-12 md:py-24">
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-0"
                                    style={{
                                        background:
                                            'radial-gradient(36rem 18rem at 50% 0%, oklch(0.5 0.1 215 / 0.35), transparent 70%)',
                                    }}
                                />
                                <div className="relative mx-auto max-w-2xl space-y-7">
                                    <h2 className="font-display text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
                                        Add your first monitor today.
                                    </h2>
                                    <p className="mx-auto max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground">
                                        Start free, paste a URL, and Ping Pilott starts checking it right away.
                                    </p>
                                    <Button asChild size="lg">
                                        <Link href="/auth?mode=signup">
                                            Start free
                                            <ButtonArrow />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </section>
            </main>

            <footer className="mt-auto border-t border-white/[0.07] px-4 py-12 sm:px-8">
                <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-start md:justify-between">
                    <div className="max-w-xs space-y-4">
                        <Brand />
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            Uptime monitoring for websites and servers.
                        </p>
                    </div>
                    <FooterNav />
                </div>
                <p className="mx-auto mt-12 max-w-6xl text-xs text-muted-foreground/80">
                    © {new Date().getFullYear()} Ping Pilott
                </p>
            </footer>
        </div>
    )
}
