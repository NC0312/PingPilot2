import Link from 'next/link'
import MarketingPage, { Section, FeatureGrid, Prose } from '@/app/components/Marketing/MarketingPage'
import { pageMetadata } from '@/lib/seo'

const PATH = '/server-monitoring'

export const metadata = pageMetadata({
    path: PATH,
    title: 'Server Monitoring: Uptime, Ports, APIs, CPU and Disk',
    ogTitle: 'Server monitoring: uptime checks, ports, CPU, memory and disk | Ping Pilott',
    description:
        'Monitor server availability with scheduled checks on websites, APIs, TCP ports and databases, plus CPU, memory and disk metrics with a host agent. Downtime alerts, failure diagnosis and incident history.',
})

const FEATURES = [
    { title: 'Website and API checks', body: 'Request a URL or an API health endpoint on a schedule and record whether it answered and how long it took.' },
    { title: 'TCP port checks', body: 'Confirm a host is accepting connections on a port, such as SSH, SMTP or a custom service.' },
    { title: 'Database availability', body: 'Watch a database host and port, for example db.example.com:5432, and hear about it when it stops accepting connections.' },
    { title: 'Priority for critical servers', body: 'Mark important monitors as high priority so they are checked first when the queue is busy.' },
    { title: 'Response time alerts', body: 'Set a slow-response threshold per server so a degrading host is flagged before it fails.' },
    { title: 'Incident history per server', body: 'Every outage is recorded with its start time, what the server said and how long it lasted.' },
    { title: 'CPU, memory and disk', body: "Install the host agent and see the machine's CPU, memory, disk and network once a minute, with alerts when they stay high. On Starter, Pro and Business." },
    { title: 'Why it failed', body: 'A failed check shows the step that broke (name lookup, connect, TLS, response or content) and, when the agent is installed, whether the server was overloaded at the time.' },
]

const FAQS = [
    { q: 'What can Ping Pilott monitor?', a: 'Websites, API endpoints, TCP host and port, and database host and port. Each is checked from outside your network on the schedule you choose.' },
    { q: 'Does it track CPU, memory or disk usage?', a: 'Yes, with the optional host agent. It is one small file you install on a Linux, macOS or Windows server (or run in Docker). It reports CPU, memory, disk and network once a minute, opens no port, and never accepts a command. Host metrics are on Starter (3 servers), Pro (15) and Business (60); the free plan checks availability only.' },
    { q: 'Can the agent alert me before the disk fills?', a: 'Yes. Ping Pilott alerts when CPU or memory stays above a limit, when the fullest disk passes a limit, and when the agent stops reporting. The defaults are 90% and you can change each limit and how many minutes it must last.' },
    { q: 'How many servers can I monitor?', a: 'Free covers 5, Starter 20, Pro 60 and Business 200. Contact support if you need more.' },
    { q: 'How do I get alerted when a server is down?', a: 'By email on every plan, and to Slack, Discord or Telegram. Starter and higher plans can also call any webhook so alerts reach other tools such as incident systems.' },
]

export default function Page() {
    return (
        <MarketingPage
            path={PATH}
            crumb="Server monitoring"
            eyebrow="Server monitoring"
            title="Server monitoring for the websites, APIs and ports you depend on."
            intro="Know when a server stops answering, and why. Ping Pilott checks websites, APIs, TCP ports and databases on a schedule, alerts you at the first failure, records every outage, and with the host agent shows CPU, memory and disk."
            faqs={FAQS}
        >
            <Section eyebrow="Outside in, then inside" title="Server monitoring from both sides">
                <Prose>
                    <p>Ping Pilott first watches your servers the way your users reach them: from the outside. That catches the failures that matter, such as a crashed service, a closed port or a host that no longer responds.</p>
                    <p>For the cause, add the host agent. It reports the machine&apos;s CPU, memory, disk and network, so a 504 can be tied to a CPU that sat at 98% rather than guessed at. See <Link href="/server-resource-monitoring" className="text-primary underline-offset-4 hover:underline">server resource monitoring</Link> for what it sends and what it never does.</p>
                </Prose>
            </Section>
            <Section eyebrow="What you can monitor" title="One dashboard for every server">
                <FeatureGrid items={FEATURES} />
            </Section>
        </MarketingPage>
    )
}
