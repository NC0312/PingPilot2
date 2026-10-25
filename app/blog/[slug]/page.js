import { notFound } from 'next/navigation'
import MarketingPage, { Section } from '@/app/components/Marketing/MarketingPage'
import { POSTS, getPost } from '@/lib/posts'
import { SITE_URL, SITE_NAME } from '@/lib/site'

export const dynamicParams = false

export function generateStaticParams() {
    return POSTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }) {
    const post = getPost((await params).slug)
    if (!post) return {}
    const path = `/blog/${post.slug}`
    return {
        title: post.title,
        description: post.description,
        alternates: { canonical: path },
        openGraph: { type: 'article', url: path, title: post.title, description: post.description, publishedTime: post.date },
    }
}

function Block({ b }) {
    switch (b.type) {
        case 'h2':
            return <h2 className="pt-6 font-display text-2xl font-medium tracking-tight text-foreground">{b.text}</h2>
        case 'ul':
            return <ul className="list-disc space-y-2 pl-5">{b.items.map((i) => <li key={i}>{i}</li>)}</ul>
        case 'ol':
            return <ol className="list-decimal space-y-2 pl-5">{b.items.map((i) => <li key={i}>{i}</li>)}</ol>
        case 'table':
            return (
                <div className="overflow-x-auto rounded-2xl ring-1 ring-white/[0.07]">
                    <table className="w-full min-w-[20rem] border-collapse text-left text-sm">
                        <thead>
                            <tr className="bg-white/[0.04] text-[11px] uppercase tracking-[0.15em]">
                                {b.head.map((h) => <th key={h} scope="col" className="px-3 py-3 sm:px-4 font-medium">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06]">
                            {b.rows.map((r) => (
                                <tr key={r[0]}>
                                    {r.map((c, i) => (i === 0
                                        ? <th key={c} scope="row" className="px-3 py-3 sm:px-4 font-medium text-foreground/90">{c}</th>
                                        : <td key={c} className="px-3 py-3 sm:px-4">{c}</td>))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )
        default:
            return <p>{b.text}</p>
    }
}

export default async function Page({ params }) {
    const post = getPost((await params).slug)
    if (!post) notFound()
    const path = `/blog/${post.slug}`

    const article = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        dateModified: post.date,
        mainEntityOfPage: `${SITE_URL}${path}`,
        author: { '@type': 'Organization', name: SITE_NAME },
        publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` } },
    }

    return (
        <MarketingPage
            path={path}
            crumb={post.title}
            eyebrow={`Guide · ${post.readMinutes} min read`}
            title={post.title}
            intro={post.description}
        >
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />
            <Section>
                <article className="max-w-[62ch] space-y-5 text-[15px] leading-relaxed text-muted-foreground">
                    {post.blocks.map((b, i) => <Block key={i} b={b} />)}
                </article>
            </Section>
        </MarketingPage>
    )
}
