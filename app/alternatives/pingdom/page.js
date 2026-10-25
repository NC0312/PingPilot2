import MarketingPage, { Section, Prose } from '@/app/components/Marketing/MarketingPage'
import ComparisonTable from '@/app/components/Marketing/ComparisonTable'
import { pageMetadata } from '@/lib/seo'

const PATH = '/alternatives/pingdom'

export const metadata = pageMetadata({
    path: PATH,
    title: 'Pingdom Alternative for Straightforward Uptime Monitoring',
    ogTitle: 'Pingdom alternative | Ping Pilott',
    description:
        'Comparing Ping Pilott and Pingdom: focus, plans and pricing approach. See when a simple uptime monitor is enough and when you need a larger platform.',
})

const ROWS = [
    ['Focus', 'Uptime, response time and incident history', 'Synthetic monitoring plus real user monitoring (RUM)'],
    ['Free option', 'Free forever: 5 URLs, 5-minute checks', 'Free trial; no free plan listed'],
    ['Pricing shown', '$10, $29 and $79 per month, public', 'Listed as "starting at" prices by tier'],
    ['Smallest paid tier', 'Starter: 20 URLs', 'Synthetics from 10 uptime monitors'],
    ['Check intervals', '5 minutes free, 1 minute on paid plans', 'See Pingdom pricing page'],
    ['Real user monitoring', 'No', 'Yes, priced by pageviews'],
    ['Monitor types', 'Website, API, TCP port, database', 'Synthetic monitoring (see Pingdom docs)'],
    ['Public status page', 'Yes: 1 on Free and Starter, 3 on Pro, 10 on Business', 'See Pingdom pricing page'],
    ['Server CPU, memory, disk', 'Host agent on Starter and above', 'See Pingdom docs'],
]

const FAQS = [
    { q: 'Is Ping Pilott a replacement for Pingdom?', a: 'For basic uptime and response-time monitoring, yes. Ping Pilott does not offer real user monitoring or transaction scripts, so teams that rely on those should stay with a larger platform.' },
    { q: 'How does Ping Pilott pricing compare to Pingdom?', a: 'Ping Pilott publishes three flat monthly prices, $10, $29 and $79, based on the number of URLs. Pingdom shows starting prices by tier on its site, so check its pricing page for the current figure for your size.' },
    { q: 'Does Ping Pilott have status pages and server metrics?', a: 'Yes. It includes public status pages (one on Free and Starter, three on Pro, ten on Business) and an optional host agent for CPU, memory and disk on Starter and above.' },
    { q: 'Can I try Ping Pilott without paying?', a: 'Yes. The free plan never expires and covers 5 URLs checked every 5 minutes.' },
]

export default function Page() {
    return (
        <MarketingPage
            path={PATH}
            crumb="Pingdom alternative"
            eyebrow="Compare"
            title="Ping Pilott as a Pingdom alternative."
            intro="Pingdom is a broad monitoring platform. If you mainly need to know when a site is down and how fast it responds, a simpler tool can be enough."
            faqs={FAQS}
        >
            <Section eyebrow="At a glance" title="Ping Pilott vs Pingdom">
                <ComparisonTable theirs="Pingdom" caption="Ping Pilott compared with Pingdom" rows={ROWS} />
                <p className="mt-4 text-xs text-muted-foreground">Pingdom details are from its public pricing page in October 2026 and may change. Check pingdom.com for current terms and prices.</p>
            </Section>
            <Section eyebrow="Where each fits" title="Simple uptime or a full platform">
                <Prose>
                    <p><strong className="font-medium text-foreground">Pingdom fits</strong> organisations that want synthetic transaction checks and real user monitoring alongside uptime checks, and that can budget for a larger platform.</p>
                    <p><strong className="font-medium text-foreground">Ping Pilott fits</strong> developers and small teams who want scheduled checks on websites, APIs and ports, email alerts, response times and an incident history, with prices that are listed up front.</p>
                </Prose>
            </Section>
        </MarketingPage>
    )
}
