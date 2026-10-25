import Link from 'next/link'
import { Info, Warning } from '@phosphor-icons/react/dist/ssr'
import CopyButton from './CopyButton'
import { parseInline, slugify } from '@/lib/docs'
import { cn } from '@/lib/utils'

const linkClass = 'text-primary underline-offset-4 hover:underline'

/** Text with `code` and [links](...) in it */
export function Inline({ text }) {
    return parseInline(text).map((part, i) => {
        if (part.type === 'code') return <code key={i} className="rounded-md bg-white/[0.07] px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">{part.text}</code>
        if (part.type === 'link') {
            return part.external
                ? <a key={i} href={part.href} target="_blank" rel="noopener noreferrer" className={linkClass}>{part.text}</a>
                : <Link key={i} href={part.href} className={linkClass}>{part.text}</Link>
        }
        return <span key={i}>{part.text}</span>
    })
}

const prose = 'max-w-[68ch] text-[15px] leading-relaxed text-muted-foreground'

function Block({ block }) {
    switch (block.type) {
        case 'h2':
            return <h2 id={slugify(block.text)} className="scroll-mt-28 pt-6 font-display text-2xl font-medium tracking-tight text-foreground">{block.text}</h2>
        case 'p':
            return <p className={prose}><Inline text={block.text} /></p>
        case 'ul':
            return <ul className={cn(prose, 'list-disc space-y-2 pl-5')}>{block.items.map((t) => <li key={t}><Inline text={t} /></li>)}</ul>
        case 'ol':
            return <ol className={cn(prose, 'list-decimal space-y-2 pl-5')}>{block.items.map((t) => <li key={t}><Inline text={t} /></li>)}</ol>
        case 'code':
            return (
                <div className="max-w-[68ch] rounded-xl bg-black/30 ring-1 ring-white/[0.08]">
                    <pre tabIndex={0} aria-label={block.label} className="overflow-x-auto whitespace-pre px-4 py-3.5 font-mono text-[12.5px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring">{block.text}</pre>
                    <div className="flex justify-end border-t border-white/[0.06] px-2 py-1.5"><CopyButton text={block.text} /></div>
                </div>
            )
        case 'note': {
            const warn = block.tone === 'warning'
            const Icon = warn ? Warning : Info
            return (
                <div role="note" className={cn('flex max-w-[68ch] items-start gap-3 rounded-xl px-4 py-3 text-sm ring-1', warn ? 'bg-warning/8 ring-warning/25' : 'bg-white/[0.03] ring-white/[0.07]')}>
                    <Icon weight="light" className={cn('mt-0.5 size-5 shrink-0', warn ? 'text-warning' : 'text-muted-foreground')} aria-hidden="true" />
                    <p className="leading-relaxed"><span className="sr-only">{warn ? 'Warning: ' : 'Note: '}</span><Inline text={block.text} /></p>
                </div>
            )
        }
        case 'table':
            return (
                <div className="overflow-x-auto rounded-2xl ring-1 ring-white/[0.07]">
                    <table className="w-full min-w-[22rem] border-collapse text-left text-sm">
                        <thead>
                            <tr className="bg-white/[0.04] text-[11px] uppercase tracking-[0.15em]">
                                {block.head.map((h, i) => <th key={i} scope="col" className="px-3 py-3 font-medium sm:px-4">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06] text-muted-foreground">
                            {block.rows.map((row, r) => (
                                <tr key={r}>
                                    {row.map((cell, c) => c === 0
                                        ? <th key={c} scope="row" className="px-3 py-3 text-left align-top font-medium text-foreground sm:px-4"><Inline text={cell} /></th>
                                        : <td key={c} className="px-3 py-3 align-top sm:px-4"><Inline text={cell} /></td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )
        default:
            return null
    }
}

export default function DocBody({ blocks }) {
    return <div className="space-y-5">{blocks.map((b, i) => <Block key={i} block={b} />)}</div>
}
