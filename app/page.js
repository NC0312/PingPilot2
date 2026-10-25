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
            description: 'Website and server uptime monitoring with scheduled checks, email alerts, response-time tracking and incident history.',
            url: SITE_URL,
            offers: [
                { '@type': 'Offer', name: 'Free trial', price: '0', priceCurrency: 'USD' },
                { '@type': 'Offer', name: 'Starter', price: '10', priceCurrency: 'USD' },
                { '@type': 'Offer', name: 'Pro', price: '29', priceCurrency: 'USD' },
                { '@type': 'Offer', name: 'Business', price: '79', priceCurrency: 'USD' },
            ],
        },
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
                                        Start free trial
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
                                <p className="text-[13px] text-muted-foreground">Free 2-day trial. One URL, checked every 5 minutes.</p>
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
                                        Start the free trial, paste a URL, and Ping Pilott starts checking it right away.
                                    </p>
                                    <Button asChild size="lg">
                                        <Link href="/auth?mode=signup">
                                            Start free trial
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
