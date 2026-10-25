import MarketingPage, { Section, Prose } from '@/app/components/Marketing/MarketingPage'
import ComparisonTable from '@/app/components/Marketing/ComparisonTable'
import { pageMetadata } from '@/lib/seo'

const PATH = '/alternatives/uptimerobot'

export const metadata = pageMetadata({
    path: PATH,
    title: 'UptimeRobot Alternative for Simple Uptime Monitoring',
    ogTitle: 'UptimeRobot alternative | Ping Pilott',
    description:
        'Comparing Ping Pilott and UptimeRobot: plans, check intervals, alerts and price. See where each fits and decide which uptime monitor suits your site.',
})

const ROWS = [
    ['Free option', 'Free forever: 5 URLs, 5-minute checks', 'Free plan: 50 monitors, 5-minute checks'],
    ['Entry paid plan', 'Starter $10/month: 20 URLs, 1-minute checks', 'Solo $9/month on annual billing: 10 or 50 monitors, 60-second checks'],
    ['1-minute checks from', 'Starter, $10/month (20 URLs)', 'Solo, $9/month'],
    ['Fastest interval', '1 minute', '15 seconds (Scale), 30 seconds (Team)'],
    ['Webhook alerts', 'Starter, $10/month', 'Team, $35/month, with Slack, Teams, Telegram and PagerDuty'],
    ['Highest listed plan', 'Business: 200 URLs', 'Scale: 200 or 500 monitors; Enterprise on request'],
    ['History retention', 'Full history on paid plans', '3 months free, 12 to 24 months paid'],
]

const FAQS = [
    { q: 'Is Ping Pilott cheaper than UptimeRobot?', a: 'Not at every level. UptimeRobot lists a free plan with 50 monitors and a $9 plan with 60-second checks, which is cheaper per monitor than Ping Pilott. Ping Pilott is built for people who want a smaller, simpler tool.' },
    { q: 'When should I choose UptimeRobot?', a: 'If you need a large free allowance, check intervals below one minute, or a wide range of alert integrations, UptimeRobot offers more.' },
    { q: 'When does Ping Pilott fit better?', a: 'If you want a focused dashboard of status, response times and incident history, with straightforward plans based on the number of URLs, and you do not need the larger feature set.' },
    { q: 'Does Ping Pilott offer public status pages?', a: 'Yes. Free and Starter include one public status page, Pro three and Business ten. Pages show the monitors you pick with 30 days of history and recent incidents, and search engines are told not to list them unless you turn that on.' },
    { q: 'Does Ping Pilott show why a check failed?', a: 'Yes. Each failure shows the step that broke (DNS, connect, TLS, response or content), and paid plans add likely causes, a checklist and, with the host agent, CPU and memory around the time of the failure.' },
]

export default function Page() {
    return (
        <MarketingPage
            path={PATH}
            crumb="UptimeRobot alternative"
            eyebrow="Compare"
            title="Ping Pilott as an UptimeRobot alternative."
            intro="Both tools check your sites on a schedule and alert you when they fail. This is an honest look at how the plans compare, so you can pick the one that fits."
            faqs={FAQS}
        >
            <Section eyebrow="At a glance" title="Ping Pilott vs UptimeRobot">
                <ComparisonTable theirs="UptimeRobot" caption="Ping Pilott compared with UptimeRobot" rows={ROWS} />
                <p className="mt-4 text-xs text-muted-foreground">UptimeRobot details are from its public pricing page in October 2026 and may change. Check uptimerobot.com for current terms.</p>
            </Section>
            <Section eyebrow="Where each fits" title="Choose the tool that matches your needs">
                <Prose>
                    <p><strong className="font-medium text-foreground">UptimeRobot fits</strong> teams that want many monitors, sub-minute checks, SMS and voice options, or integrations with chat and paging tools. Its plans scale to hundreds of monitors.</p>
                    <p><strong className="font-medium text-foreground">Ping Pilott fits</strong> individual developers and small teams who want to paste a URL, get an email when it fails, and look back over response times and every incident in one clear dashboard. It monitors websites, APIs, TCP ports and databases, explains each failure, and can publish a status page and show CPU, memory and disk through an optional host agent.</p>
                    <p>If your needs are close to the middle, try both on a real URL. Ping Pilott&apos;s free plan never expires.</p>
                </Prose>
            </Section>
        </MarketingPage>
    )
}
