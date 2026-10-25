'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import PricingCard from './PricingCard'
import { Reveal } from '@/components/ui/reveal'

const SIGNUP = '/auth?mode=signup'

// Paid plans carry the chosen plan through sign-up, so the user lands on checkout for it afterwards.
const signupFor = (tier, yearly) =>
    `${SIGNUP}&next=${encodeURIComponent(`/subscription?plan=${tier}_${yearly ? 'yearly' : 'monthly'}`)}`

function buildPlans(yearly) {
    const per = yearly ? 'per year · save 17%' : 'per month'
    return [
        {
            title: 'Free',
            price: '$0',
            period: 'free forever',
            description: 'Watch your first sites, free.',
            features: [
                { included: true, text: '5 URLs monitored' },
                { included: true, text: '5-minute check interval' },
                { included: true, text: 'Email, Slack, Discord and Telegram alerts' },
                { included: true, text: '1 public status page' },
                { included: false, text: '1-minute checks' },
            ],
            buttonText: 'Start free',
            href: SIGNUP,
        },
        {
            title: 'Starter',
            price: yearly ? '$100' : '$10',
            period: per,
            description: 'For individual developers.',
            features: [
                { included: true, text: '20 URLs monitored' },
                { included: true, text: '1-minute check interval' },
                { included: true, text: 'Chat alerts and any webhook' },
                { included: true, text: 'Historical reporting' },
                { included: true, text: 'Host metrics for 3 servers' },
            ],
            buttonText: 'Choose Starter',
            href: signupFor('starter', yearly),
        },
        {
            title: 'Pro',
            price: yearly ? '$290' : '$29',
            period: per,
            description: 'For growing websites.',
            features: [
                { included: true, text: '60 URLs monitored' },
                { included: true, text: '1-minute check interval' },
                { included: true, text: 'Advanced alerts' },
                { included: true, text: 'Host metrics for 15 servers' },
                { included: true, text: '3 status pages, no footer' },
                { included: true, text: 'Priority support' },
            ],
            buttonText: 'Choose Pro',
            href: signupFor('pro', yearly),
            featured: true,
            tag: 'Most popular',
        },
        {
            title: 'Business',
            price: yearly ? '$790' : '$79',
            period: per,
            description: 'For SaaS teams and larger estates.',
            features: [
                { included: true, text: '200 URLs monitored' },
                { included: true, text: '1-minute check interval' },
                { included: true, text: 'API access' },
                { included: true, text: 'Host metrics for 60 servers' },
                { included: true, text: '10 status pages, no footer' },
                { included: true, text: '4-hour support response' },
            ],
            buttonText: 'Choose Business',
            href: signupFor('business', yearly),
            tag: 'Best value',
        },
    ]
}

// compact: the heading sits at the size of a sub-page section (the pricing page already has its own H1)
export default function PricingSection({ compact = false }) {
    const [billing, setBilling] = useState('monthly')
    const yearly = billing === 'yearly'
    const plans = buildPlans(yearly)

    return (
        <section id="pricing" className="px-4 py-24 sm:px-8 md:py-32">
            <div className="mx-auto max-w-6xl">
                <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                    <Reveal className="max-w-xl space-y-5">
                        <span className="eyebrow">Pricing</span>
                        <h2 className={compact ? 'font-display text-3xl font-medium leading-[1.08] tracking-tight md:text-4xl' : 'font-display text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl'}>
                            Pay for the URLs you watch.
                        </h2>
                        <p className="text-[15px] leading-relaxed text-muted-foreground">
                            Every plan includes uptime checks and alerts by email, Slack, Discord and Telegram, and the free plan never expires. Upgrade for more monitors and 1-minute checks.
                        </p>
                    </Reveal>

                    <Reveal delay={90}>
                        <div
                            role="radiogroup"
                            aria-label="Billing period"
                            className="relative inline-grid grid-cols-2 rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.08]"
                        >
                            <span
                                aria-hidden="true"
                                className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-primary shadow-[0_8px_20px_-8px_oklch(0.7_0.13_220/0.7)] transition-transform duration-500 ease-fluid"
                                style={{ transform: yearly ? 'translateX(100%)' : 'translateX(0)' }}
                            />
                            {['monthly', 'yearly'].map((v) => (
                                <button
                                    key={v}
                                    type="button"
                                    role="radio"
                                    aria-checked={billing === v}
                                    onClick={() => setBilling(v)}
                                    className={`relative rounded-full px-6 py-2 text-sm font-medium capitalize transition-colors duration-500 ease-fluid ${billing === v ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </Reveal>
                </div>

                <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {plans.map((plan, i) => (
                        <Reveal key={plan.title} delay={i * 80}>
                            <PricingCard plan={plan} />
                        </Reveal>
                    ))}
                </div>

                <Reveal className="mt-12">
                    <p className="text-sm text-muted-foreground">
                        Need more than 200 URLs or a custom agreement?{' '}
                        <Link href="/support" className="text-primary underline-offset-4 hover:underline">
                            Contact support
                        </Link>
                        .
                    </p>
                </Reveal>
            </div>
        </section>
    )
}
