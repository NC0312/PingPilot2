'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import PricingCard from './PricingCard'
import { Reveal } from '@/components/ui/reveal'

const SIGNUP = '/auth?mode=signup'

function buildPlans(yearly) {
    const per = yearly ? 'per year · save 17%' : 'per month'
    return [
        {
            title: 'Free',
            price: '$0',
            period: '2-day trial',
            description: 'Try Ping Pilott on one URL.',
            features: [
                { included: true, text: '1 URL monitored' },
                { included: true, text: '5-minute check interval' },
                { included: true, text: 'Basic email alerts' },
                { included: false, text: 'Multiple URLs' },
            ],
            buttonText: 'Start free trial',
            href: SIGNUP,
        },
        {
            title: 'Starter',
            price: yearly ? '$100' : '$10',
            period: per,
            description: 'For individual developers.',
            features: [
                { included: true, text: '10 URLs monitored' },
                { included: true, text: '3-minute check interval' },
                { included: true, text: 'Email alerts' },
                { included: true, text: 'Historical reporting' },
            ],
            buttonText: 'Choose Starter',
            href: SIGNUP,
        },
        {
            title: 'Pro',
            price: yearly ? '$290' : '$29',
            period: per,
            description: 'For growing websites.',
            features: [
                { included: true, text: '30 URLs monitored' },
                { included: true, text: '1-minute check interval' },
                { included: true, text: 'Email and SMS alerts' },
                { included: true, text: 'Priority support' },
            ],
            buttonText: 'Choose Pro',
            href: SIGNUP,
            featured: true,
            tag: 'Most popular',
        },
        {
            title: 'Business',
            price: yearly ? '$790' : '$79',
            period: per,
            description: 'For SaaS teams and larger estates.',
            features: [
                { included: true, text: '100 URLs monitored' },
                { included: true, text: '1-minute check interval' },
                { included: true, text: 'Webhook integrations' },
                { included: true, text: 'API access' },
            ],
            buttonText: 'Choose Business',
            href: SIGNUP,
            tag: 'Best value',
        },
    ]
}

export default function PricingSection() {
    const [billing, setBilling] = useState('monthly')
    const yearly = billing === 'yearly'
    const plans = buildPlans(yearly)

    return (
        <section id="pricing" className="px-4 py-24 sm:px-8 md:py-32">
            <div className="mx-auto max-w-6xl">
                <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                    <Reveal className="max-w-xl space-y-5">
                        <span className="eyebrow">Pricing</span>
                        <h2 className="font-display text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
                            Pay for the URLs you watch.
                        </h2>
                        <p className="text-[15px] leading-relaxed text-muted-foreground">
                            Every plan includes uptime checks and email alerts. Upgrade for more monitors and faster intervals.
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
                        Need more than 100 URLs or a custom agreement?{' '}
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
