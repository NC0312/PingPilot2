import Link from 'next/link'
import Navbar from '../Landing Page/Navbar'
import SiteFooter from '../Marketing/SiteFooter'
import { DOCS } from '@/lib/docs'
import { cn } from '@/lib/utils'

const item = (active) => cn(
    'block min-h-11 rounded-lg px-3 py-2.5 text-sm transition-colors duration-300 ease-fluid',
    active ? 'bg-white/[0.08] text-foreground' : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground'
)

function Menu({ current }) {
    return (
        <nav aria-label="Documentation">
            <ul className="space-y-1">
                <li><Link href="/docs" aria-current={current === null ? 'page' : undefined} className={item(current === null)}>Overview</Link></li>
                {DOCS.map((d) => (
                    <li key={d.slug}>
                        <Link href={`/docs/${d.slug}`} aria-current={current === d.slug ? 'page' : undefined} className={item(current === d.slug)}>{d.title}</Link>
                    </li>
                ))}
            </ul>
        </nav>
    )
}

/** Chrome for every docs page: the site's nav and footer, a menu beside the page (above it on a phone), and the page */
export default function DocsShell({ current = null, children }) {
    return (
        <div className="flex min-h-[100dvh] flex-col">
            <Navbar />
            <main id="main-content" className="px-4 pb-24 pt-28 sm:px-8 md:pt-40">
                <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-14">
                    <aside className="lg:sticky lg:top-28 lg:self-start">
                        <details className="rounded-xl ring-1 ring-white/[0.08] lg:hidden">
                            <summary className="min-h-12 cursor-pointer list-none px-4 py-3 text-sm font-medium">Documentation menu</summary>
                            <div className="px-2 pb-3"><Menu current={current} /></div>
                        </details>
                        <div className="hidden lg:block">
                            <p className="mb-3 px-3 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">Documentation</p>
                            <Menu current={current} />
                        </div>
                    </aside>
                    <div className="min-w-0">{children}</div>
                </div>
            </main>
            <SiteFooter />
        </div>
    )
}
