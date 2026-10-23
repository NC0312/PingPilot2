'use client'
import React from 'react'
import Link from 'next/link'
import { Check, Minus } from '@phosphor-icons/react'
import { Button, ButtonArrow } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Plan card. Featured plans get the accent bezel; CTAs are pinned to the bottom edge
// so every card ends on the same line regardless of copy length.
const PricingCard = ({ plan }) => {
    const { title, price, period, description, features, buttonText, href, featured, tag } = plan

    return (
        <div
            className={cn(
                'group h-full rounded-[1.75rem] p-1.5 transition-transform duration-700 ease-fluid hover:-translate-y-1',
                featured
                    ? 'bg-primary/[0.08] ring-1 ring-primary/35 shadow-[0_30px_70px_-34px_oklch(0.7_0.13_220/0.7)]'
                    : 'bg-white/[0.03] ring-1 ring-white/[0.07]'
            )}
        >
            <div className="flex h-full flex-col rounded-[calc(1.75rem-0.375rem)] bg-card p-6 shadow-[inset_0_1px_1px_oklch(1_0_0/0.07)]">
                <div className="flex h-6 items-center justify-between">
                    <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{title}</h3>
                    {tag && (
                        <span className={cn(
                            'rounded-md px-2 py-0.5 text-[11px] font-medium ring-1',
                            featured ? 'bg-primary/15 text-primary ring-primary/30' : 'bg-success/10 text-success ring-success/25'
                        )}>
                            {tag}
                        </span>
                    )}
                </div>

                <div className="mt-6 h-[4.5rem]">
                    <p className="font-display text-5xl font-medium tracking-tight tabular-nums">{price}</p>
                    <p className="mt-1 text-[13px] text-muted-foreground">{period}</p>
                </div>

                <p className="mt-5 min-h-10 text-sm leading-relaxed text-muted-foreground">{description}</p>

                <ul className="mt-6 flex-1 space-y-3 border-t border-white/[0.07] pt-6">
                    {features.map((f) => (
                        <li key={f.text} className="flex items-start gap-3 text-sm">
                            {f.included ? (
                                <Check weight="light" className="mt-0.5 size-4 shrink-0 text-primary" aria-label="Included" />
                            ) : (
                                <Minus weight="light" className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" aria-label="Not included" />
                            )}
                            <span className={f.included ? 'text-foreground/90' : 'text-muted-foreground/60'}>{f.text}</span>
                        </li>
                    ))}
                </ul>

                <Button
                    asChild
                    variant={featured ? 'default' : 'outline'}
                    size="lg"
                    className="mt-8 w-full justify-between pl-6"
                >
                    <Link href={href}>
                        {buttonText}
                        <ButtonArrow />
                    </Link>
                </Button>
            </div>
        </div>
    )
}

export default PricingCard
