import Link from 'next/link'
import { notFound } from 'next/navigation'
import DocsShell from '@/app/components/Docs/DocsShell'
import DocBody from '@/app/components/Docs/DocBody'
import { DOCS, getDoc, headingsOf, neighbours } from '@/lib/docs'
import { SITE_URL, SITE_NAME } from '@/lib/site'
import { pageMetadata } from '@/lib/seo'

export const dynamicParams = false

export function generateStaticParams() {
    return DOCS.map((d) => ({ slug: d.slug }))
}

export async function generateMetadata({ params }) {
    const doc = getDoc((await params).slug)
    if (!doc) return {}
    const path = `/docs/${doc.slug}`
    return pageMetadata({ path, title: doc.title, ogTitle: `${doc.title} | Ping Pilott docs`, description: doc.summary })
}

export default async function DocPage({ params }) {
    const doc = getDoc((await params).slug)
    if (!doc) notFound()
    const { prev, next } = neighbours(doc.slug)
    const headings = headingsOf(doc)
    const crumbs = {
        '@context': 'https://schema.org',
        '@graph': [{
        '@type': 'TechArticle',
        headline: doc.title,
        description: doc.summary,
        url: `${SITE_URL}/docs/${doc.slug}`,
        inLanguage: 'en',
        author: { '@type': 'Organization', name: SITE_NAME },
        publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` } },
        }, {
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'Documentation', item: `${SITE_URL}/docs` },
            { '@type': 'ListItem', position: 3, name: doc.title, item: `${SITE_URL}/docs/${doc.slug}` },
        ],
        }],
    }

    return (
        <DocsShell current={doc.slug}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
            <article className="max-w-3xl">
                <span className="eyebrow">Documentation</span>
                <h1 className="mt-6 font-display text-4xl font-medium leading-[1.05] tracking-[-0.03em] md:text-5xl">{doc.title}</h1>
                <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-muted-foreground">{doc.summary}</p>

                {headings.length > 2 && (
                    <nav aria-label="On this page" className="mt-8 rounded-xl p-4 ring-1 ring-white/[0.07]">
                        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">On this page</p>
                        <ul className="mt-2 space-y-0.5">
                            {headings.map((h) => (
                                <li key={h.id}><a href={`#${h.id}`} className="block min-h-9 py-1.5 text-sm text-muted-foreground transition-colors duration-300 ease-fluid hover:text-foreground">{h.text}</a></li>
                            ))}
                        </ul>
                    </nav>
                )}

                <div className="mt-10"><DocBody blocks={doc.blocks} /></div>

                <nav aria-label="Previous and next" className="mt-16 grid gap-4 border-t border-white/[0.07] pt-6 sm:grid-cols-2">
                    {prev ? (
                        <Link href={`/docs/${prev.slug}`} className="block min-h-12 rounded-xl p-4 ring-1 ring-white/[0.08] transition-colors duration-300 ease-fluid hover:bg-white/[0.04]">
                            <span className="text-xs text-muted-foreground">Previous</span>
                            <span className="mt-1 block font-medium">{prev.title}</span>
                        </Link>
                    ) : <span />}
                    {next && (
                        <Link href={`/docs/${next.slug}`} className="block min-h-12 rounded-xl p-4 text-right ring-1 ring-white/[0.08] transition-colors duration-300 ease-fluid hover:bg-white/[0.04]">
                            <span className="text-xs text-muted-foreground">Next</span>
                            <span className="mt-1 block font-medium">{next.title}</span>
                        </Link>
                    )}
                </nav>
            </article>
        </DocsShell>
    )
}
