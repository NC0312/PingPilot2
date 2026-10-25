import Link from 'next/link'
import DocsShell from '@/app/components/Docs/DocsShell'
import { DOCS } from '@/lib/docs'
import { SITE_URL, SITE_NAME } from '@/lib/site'

export const metadata = {
    title: 'Documentation',
    description: 'How to set up Ping Pilott end to end: add monitors, set up alerts, read a failure diagnosis, and install the host agent for CPU, memory and disk metrics.',
    alternates: { canonical: '/docs' },
    openGraph: { url: '/docs', title: 'Documentation | Ping Pilott' },
}

export default function DocsIndex() {
    const crumbs = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'Documentation', item: `${SITE_URL}/docs` },
        ],
    }
    return (
        <DocsShell current={null}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
            <span className="eyebrow">Documentation</span>
            <h1 className="mt-6 font-display text-4xl font-medium leading-[1.05] tracking-[-0.03em] md:text-5xl">Set up Ping Pilott</h1>
            <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-muted-foreground">Everything from your first monitor to CPU, memory and disk metrics for a server, in the order you will need it.</p>
            <ol className="mt-12 grid gap-4 sm:grid-cols-2">
                {DOCS.map((d, i) => (
                    <li key={d.slug}>
                        <Link href={`/docs/${d.slug}`} className="block h-full min-h-12 rounded-2xl p-5 ring-1 ring-white/[0.08] transition-colors duration-300 ease-fluid hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <span className="text-xs text-muted-foreground">Step {i + 1}</span>
                            <span className="mt-1 block font-display text-xl font-medium tracking-tight">{d.title}</span>
                            <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">{d.summary}</span>
                        </Link>
                    </li>
                ))}
            </ol>
        </DocsShell>
    )
}
