import MarketingPage from '@/app/components/Marketing/MarketingPage'
import PricingSection from '@/app/components/Landing Page/PricingSection'

const PATH = '/pricing'

export const metadata = {
    title: 'Uptime Monitoring Pricing and Free Trial',
    description:
        'Simple uptime monitoring pricing. Start with a free trial, then pay from $10 a month for 10 monitors, or $29 for 30 monitors checked every minute. Save 17% yearly.',
    alternates: { canonical: PATH },
    openGraph: { url: PATH, title: 'Uptime monitoring pricing | Ping Pilott' },
}

const FAQS = [
    { q: 'Is there a free plan?', a: 'There is a free 2-day trial with 1 URL checked every 5 minutes and basic email alerts.' },
    { q: 'What changes between plans?', a: 'The number of URLs you can monitor and how often they are checked. Starter checks every 3 minutes, Pro and Business every minute. Business adds webhook integrations and API access.' },
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
            intro="Every plan includes uptime checks and email alerts. Start free, then upgrade for more monitors and faster check intervals."
            faqs={FAQS}
            cta={false}
        >
            <PricingSection />
        </MarketingPage>
    )
}
