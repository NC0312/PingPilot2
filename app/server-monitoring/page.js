import MarketingPage, { Section, FeatureGrid, Prose } from '@/app/components/Marketing/MarketingPage'

const PATH = '/server-monitoring'

export const metadata = {
    title: 'Server Monitoring for Servers, APIs and Ports',
    description:
        'Monitor server availability with scheduled checks on websites, APIs, TCP ports and databases. Get downtime alerts, response times and incident history with Ping Pilott.',
    alternates: { canonical: PATH },
    openGraph: { url: PATH, title: 'Server monitoring: uptime checks for servers, APIs and ports | Ping Pilott' },
}

const FEATURES = [
    { title: 'Website and API checks', body: 'Request a URL or an API health endpoint on a schedule and record whether it answered and how long it took.' },
    { title: 'TCP port checks', body: 'Confirm a host is accepting connections on a port, such as SSH, SMTP or a custom service.' },
    { title: 'Database availability', body: 'Watch a database host and port, for example db.example.com:5432, and hear about it when it stops accepting connections.' },
    { title: 'Priority for critical servers', body: 'Mark important monitors as high priority so they are checked first when the queue is busy.' },
    { title: 'Response time alerts', body: 'Set a slow-response threshold per server so a degrading host is flagged before it fails.' },
    { title: 'Incident history per server', body: 'Every outage is recorded with its start time, what the server said and how long it lasted.' },
]

const FAQS = [
    { q: 'What can Ping Pilott monitor?', a: 'Websites, API endpoints, TCP host and port, and database host and port. Each is checked from outside your network on the schedule you choose.' },
    { q: 'Does it track CPU, memory or disk usage?', a: 'No. Ping Pilott measures availability and response time from the outside. It does not install an agent on your server, so it does not report CPU, memory or disk metrics.' },
    { q: 'How many servers can I monitor?', a: 'Free covers 5, Starter 20, Pro 60 and Business 200. Contact support if you need more.' },
    { q: 'How do I get alerted when a server is down?', a: 'By email on every plan. Starter and higher plans can also call a webhook so alerts reach tools such as chat or incident systems.' },
]

export default function Page() {
    return (
        <MarketingPage
            path={PATH}
            crumb="Server monitoring"
            eyebrow="Server monitoring"
            title="Server monitoring for the websites, APIs and ports you depend on."
            intro="Know when a server stops answering. Ping Pilott checks websites, APIs, TCP ports and databases on a schedule, alerts you at the first failure, and records response times and every outage."
            faqs={FAQS}
        >
            <Section eyebrow="Availability first" title="Outside-in server monitoring">
                <Prose>
                    <p>Ping Pilott watches your servers the way your users reach them: from the outside. That catches the failures that matter, such as a crashed service, a closed port or a host that no longer responds.</p>
                    <p>It is an uptime monitor, not an in-server metrics agent. Pair it with your own CPU and memory tooling if you need resource graphs.</p>
                </Prose>
            </Section>
            <Section eyebrow="What you can monitor" title="One dashboard for every server">
                <FeatureGrid items={FEATURES} />
            </Section>
        </MarketingPage>
    )
}
