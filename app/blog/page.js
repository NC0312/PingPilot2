import Link from 'next/link'
import MarketingPage, { Section } from '@/app/components/Marketing/MarketingPage'
import { POSTS } from '@/lib/posts'

const PATH = '/blog'

export const metadata = {
    title: 'Uptime Monitoring Blog and Guides',
    description: 'Guides on website uptime, downtime, server errors and monitoring best practice from the Ping Pilott team.',
    alternates: { canonical: PATH },
    openGraph: { url: PATH, title: 'Uptime monitoring blog | Ping Pilott' },
}

export default function Page() {
    return (
        <MarketingPage
            path={PATH}
            crumb="Blog"
            eyebrow="Blog"
            title="Uptime monitoring guides."
            intro="Practical advice on keeping websites and servers available, and on knowing quickly when they are not."
            cta={false}
        >
            <Section title="Latest guides">
                <ul className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
                    {POSTS.map((p) => (
                        <li key={p.slug} className="py-7">
                            <h3 className="font-display text-2xl font-medium tracking-tight">
                                <Link href={`/blog/${p.slug}`} className="hover:text-primary">{p.title}</Link>
                            </h3>
                            <p className="mt-2.5 max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground">{p.description}</p>
                            <p className="mt-3 text-xs text-muted-foreground">{p.readMinutes} min read</p>
                        </li>
                    ))}
                </ul>
            </Section>
        </MarketingPage>
    )
}
