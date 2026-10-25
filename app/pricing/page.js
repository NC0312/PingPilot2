import MarketingPage from '@/app/components/Marketing/MarketingPage'
import PricingSection from '@/app/components/Landing Page/PricingSection'

const PATH = '/pricing'

export const metadata = {
    title: 'Uptime Monitoring Pricing and Free Plan',
    description:
        'Simple uptime monitoring pricing. Monitor 5 URLs free forever, then pay from $10 a month for 20 monitors checked every minute, or $29 for 60. Save 17% yearly.',
    alternates: { canonical: PATH },
    openGraph: { url: PATH, title: 'Uptime monitoring pricing | Ping Pilott' },
}

const FAQS = [
    { q: 'Is there a free plan?', a: 'Yes. The free plan never expires. It covers 5 URLs checked every 5 minutes, with email alerts and Android app alerts.' },
    { q: 'What changes between plans?', a: 'The number of URLs you can monitor and how often they are checked. Free checks every 5 minutes; Starter, Pro and Business check every minute. Starter adds webhooks, Pro adds advanced alerts and priority support, and Business adds API access.' },
    { q: 'Do yearly plans cost less?', a: 'Yes. Yearly billing saves 17% compared with paying monthly.' },
    { q: 'Can I monitor more than 100 URLs?', a: 'Yes. Contact support for a custom plan.' },
]

export default function Page() {
    return (
        <MarketingPage
            path={PATH}
            crumb="Pricing"
            eyebrow="Pricing"
            title="Uptime monitoring pricing that scales with the URLs you watch."
            intro="Every plan includes uptime checks and email alerts. Start free, then upgrade for more monitors and 1-minute checks."
            faqs={FAQS}
            cta={false}
        >
            <PricingSection compact />
        </MarketingPage>
    )
}
