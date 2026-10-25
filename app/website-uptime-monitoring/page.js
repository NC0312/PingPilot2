import MarketingPage, { Section, FeatureGrid, Prose } from '@/app/components/Marketing/MarketingPage'
import { pageMetadata } from '@/lib/seo'

const PATH = '/website-uptime-monitoring'

export const metadata = pageMetadata({
    path: PATH,
    title: 'Website Uptime Monitoring and Downtime Alerts',
    ogTitle: 'Website uptime monitoring with instant downtime alerts | Ping Pilott',
    description:
        'Monitor your website uptime every minute, get an alert by email, Slack, Discord or Telegram the moment it goes down, see why it failed, and track response times and incident history. Start free.',
})

const FEATURES = [
    { title: 'Checks as often as every minute', body: 'Starter, Pro and Business plans check every minute and the free plan every five. A site that goes down is noticed within one interval.' },
    { title: 'Instant downtime alerts', body: 'A failed check emails the addresses you choose straight away, and we email again when the site recovers. Slack, Discord and Telegram alerts are free on every plan, and Starter and above add any webhook so alerts can reach your own tools.' },
    { title: 'Response time tracking', body: 'Every check records how long your site took to answer. Set a threshold and get told when it is slow, before it is down.' },
    { title: 'Full incident history', body: 'See when each outage started, what the server returned and how long it lasted. Paid plans keep the history for reporting.' },
    { title: 'Alert hours and days', body: 'Choose the hours and weekdays when alerts may be sent, so a planned maintenance window does not wake anyone up.' },
    { title: 'Websites, APIs and ports', body: 'Monitor a website, an API health endpoint, or a TCP or database host and port, all from the same dashboard.' },
    { title: 'Page content checks', body: 'Require that a page contains a word, or does not, so a site that answers 200 with an error message in the body still counts as down.' },
    { title: 'Know why it failed', body: 'Every failure shows the step that broke: name lookup, connection, TLS, response or content. Paid plans add the likely causes and what to check first.' },
    { title: 'Certificate expiry alerts', body: 'Get told before an SSL certificate expires, not after visitors see a browser warning.' },
    { title: 'A public status page', body: 'Show customers what is up and what is not, with 30 days of history. One page on every plan.' },
]

const FAQS = [
    { q: 'What is website uptime monitoring?', a: 'Website uptime monitoring sends a request to your site on a fixed schedule and records whether it answered and how fast. When a check fails, you are alerted so you can fix the problem before more visitors are affected.' },
    { q: 'How often does Ping Pilott check my website?', a: 'The free plan checks every 5 minutes. Starter, Pro and Business check every minute.' },
    { q: 'How will I be told my website is down?', a: 'By email on every plan, to as many addresses as you add, and to Slack, Discord or Telegram. Starter and higher plans can also send alerts to any webhook URL.' },
    { q: 'Can it tell me why my website is down?', a: 'It shows which step of the check failed (DNS, connect, TLS, response or page content) and the usual cause. On paid plans it lists likely causes with the evidence, a checklist of what to check, and what the server answered. With the host agent installed it also says whether the server was overloaded.' },
    { q: 'Can I give customers a status page?', a: 'Yes. Free and Starter include one public status page, Pro three and Business ten.' },
    { q: 'Can I try it for free?', a: 'Yes. The free plan never expires and covers 5 URLs checked every 5 minutes. No plan is needed to start.' },
    { q: 'What is a good uptime percentage?', a: '99.9% uptime allows about 8 hours 46 minutes of downtime a year, or roughly 43 minutes a month. 99.99% allows under an hour a year. Checking every minute lets you measure against targets like these.' },
]

export default function Page() {
    return (
        <MarketingPage
            path={PATH}
            crumb="Website uptime monitoring"
            eyebrow="Website uptime monitoring"
            title="Website uptime monitoring that tells you the moment you're down."
            intro="Ping Pilott checks your website on a schedule, as often as every minute, emails you when it stops answering, and keeps a record of every outage and every response time."
            faqs={FAQS}
        >
            <Section eyebrow="Why monitor uptime" title="Visitors notice downtime before you do">
                <Prose>
                    <p>Most outages are found by customers, not by the team running the site. Every minute a checkout, login or landing page is unreachable costs sales and support tickets, and Google also sees pages that fail to load.</p>
                    <p>An uptime monitor closes that gap. It makes the same request a visitor would, on a timer, from outside your own network, and alerts you when the answer is an error or never arrives.</p>
                </Prose>
            </Section>
            <Section eyebrow="What you get" title="Everything you need to watch a website">
                <FeatureGrid items={FEATURES} />
            </Section>
            <Section eyebrow="Setup" title="Start monitoring in three steps">
                <ol className="max-w-[62ch] list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted-foreground">
                    <li>Create a free account.</li>
                    <li>Paste your website address and choose a check interval.</li>
                    <li>Add the email addresses to alert. Checks begin right away.</li>
                </ol>
            </Section>
        </MarketingPage>
    )
}
