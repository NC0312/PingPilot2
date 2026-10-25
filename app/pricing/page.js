import MarketingPage from '@/app/components/Marketing/MarketingPage'
import PricingSection from '@/app/components/Landing Page/PricingSection'
import { pageMetadata } from '@/lib/seo'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const PATH = '/pricing'

export const metadata = pageMetadata({
    path: PATH,
    title: 'Uptime Monitoring Pricing and Free Plan',
    ogTitle: 'Uptime monitoring pricing | Ping Pilott',
    description:
        'Simple uptime monitoring pricing. Monitor 5 URLs free forever, then pay from $10 a month for 20 monitors checked every minute, or $29 for 60. Save 17% yearly.',
})

const FAQS = [
    { q: 'Is there a free plan?', a: 'Yes. The free plan never expires. It covers 5 URLs checked every 5 minutes, with email, Slack, Discord, Telegram and Android app alerts, and one public status page.' },
    { q: 'What changes between plans?', a: 'The number of URLs you can monitor and how often they are checked. Free checks every 5 minutes; Starter, Pro and Business check every minute. Starter adds any webhook, detailed failure diagnosis and host metrics for 3 servers. Pro adds advanced alerts, priority support, 15 host agents and 3 status pages. Business adds API access, 60 host agents and 10 status pages.' },
    { q: 'Do yearly plans cost less?', a: 'Yes. Yearly billing saves 17% compared with paying monthly.' },
    { q: 'What are host agents?', a: 'A host agent is a small program installed on a server that reports its CPU, memory, disk and network. Starter includes 3, Pro 15 and Business 60. The free plan does not include host metrics.' },
    { q: 'Can I monitor more than 200 URLs?', a: 'Yes. Contact support for a custom plan.' },
]

const OFFERS = [
    { name: 'Free', price: '0', description: '5 URLs, 5-minute checks, 1 status page' },
    { name: 'Starter', price: '10', description: '20 URLs, 1-minute checks, host metrics for 3 servers, any webhook' },
    { name: 'Pro', price: '29', description: '60 URLs, 1-minute checks, host metrics for 15 servers, 3 status pages, advanced alerts' },
    { name: 'Business', price: '79', description: '200 URLs, 1-minute checks, host metrics for 60 servers, 10 status pages, API access' },
]

const SCHEMA = [{
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    url: `${SITE_URL}${PATH}`,
    offers: OFFERS.map((o) => ({
        '@type': 'Offer',
        name: o.name,
        description: o.description,
        price: o.price,
        priceCurrency: 'USD',
        url: `${SITE_URL}${PATH}`,
        ...(o.price === '0' ? {} : { priceSpecification: { '@type': 'UnitPriceSpecification', price: o.price, priceCurrency: 'USD', billingDuration: 1, billingIncrement: 1, unitCode: 'MON' } }),
    })),
}]

export default function Page() {
    return (
        <MarketingPage
            path={PATH}
            crumb="Pricing"
            eyebrow="Pricing"
            title="Uptime monitoring pricing that scales with the URLs you watch."
            intro="Every plan includes uptime checks and email alerts. Start free, then upgrade for more monitors and 1-minute checks."
            faqs={FAQS}
            schema={SCHEMA}
            cta={false}
        >
            <PricingSection compact />
        </MarketingPage>
    )
}
