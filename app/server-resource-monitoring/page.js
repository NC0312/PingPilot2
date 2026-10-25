import Link from 'next/link'
import MarketingPage, { Section, FeatureGrid, Prose } from '@/app/components/Marketing/MarketingPage'
import { pageMetadata } from '@/lib/seo'
import { AGENT_REPO } from '@/lib/docs'

const PATH = '/server-resource-monitoring'

export const metadata = pageMetadata({
    path: PATH,
    title: 'Server CPU, Memory and Disk Monitoring Agent',
    ogTitle: 'Monitor server CPU, memory and disk with a small agent | Ping Pilott',
    description:
        'Install a small agent and see a server\'s CPU, memory, disk and network once a minute. Get alerts before the disk fills, and see if overload caused a failed check.',
})

const FEATURES = [
    { title: 'CPU, memory, disk and network', body: 'Percent busy and load average, memory used without cache, each real disk, and bytes per second in and out, once a minute.' },
    { title: 'Alerts before it is an outage', body: 'Get told when CPU or memory stays high, when the fullest disk passes a limit, or when the agent goes quiet. Each limit and its duration is yours to change.' },
    { title: 'Tied to your uptime checks', body: 'When a check fails, the diagnosis looks at the ten minutes before it. A 504 while CPU averaged 98% says so, with the figures and a command to find the busiest process.' },
    { title: 'Top processes, by name only', body: 'The five busiest processes are listed by name with CPU and memory. Command lines are never sent, because that is where passwords end up.' },
    { title: 'One file, nothing to install', body: 'A single static binary of 6 to 7 MB for Linux (x86-64, arm64, 32-bit arm), macOS and Windows, or a Docker image for container hosts.' },
    { title: 'Source on GitHub', body: 'The source is published on GitHub, so you can read exactly what the agent measures and sends before running it.' },
]

const FAQS = [
    { q: 'What does the agent measure?', a: 'Once a minute it sends CPU percent, cores and load average, memory and swap, total and used space for each real disk (at most 16), network bytes per second, uptime, and the five busiest processes by name with CPU and memory percent.' },
    { q: 'Is it safe to run on a production server?', a: 'It opens no port, never accepts a command, and runs as an unprivileged user. Its only inbound message is "send the next reading in 60 seconds". It never sends command lines, files, environment variables or paths other than a disk\'s mount point.' },
    { q: 'How do I install it?', a: 'Turn on Host metrics for a server in the dashboard and copy the command it shows, which already has your token. On Linux with systemd it is one line that checks the download against its published checksum, creates an unprivileged user and starts a hardened service. A Docker command and manual downloads for macOS and Windows are also provided.' },
    { q: 'Which plans include host metrics?', a: 'Starter includes agents for 3 servers, Pro for 15 and Business for 60. The free plan checks availability only.' },
    { q: 'What are the default alert limits?', a: 'CPU and memory alert above 90% for 5 minutes, the fullest disk above 90% for 2 minutes, and a "no data" alert when the agent has not reported for 5 minutes. You can change each one.' },
    { q: 'How long is the data kept?', a: 'Per-minute readings are kept for 24 hours and 5-minute averages for 30 days.' },
    { q: 'What if my server loses its connection?', a: 'The agent keeps the last 10 readings (and nothing older than 14 minutes) and sends them in order when the network is back, retrying with growing delays.' },
]

export default function Page() {
    return (
        <MarketingPage
            path={PATH}
            crumb="Server resource monitoring"
            eyebrow="Host metrics"
            title="See CPU, memory and disk, and know when they caused an outage."
            intro="An uptime check tells you a server stopped answering. The Ping Pilott host agent tells you whether the machine ran out of CPU, memory or disk when it did."
            faqs={FAQS}
        >
            <Section eyebrow="Why add an agent" title="From &ldquo;it is down&rdquo; to &ldquo;here is why&rdquo;">
                <Prose>
                    <p>A check from outside can only see the symptom: a timeout, a 502, a refused connection. Many of those come from the machine itself, a full disk, exhausted memory or a runaway process, and the quickest way to know is to look at the machine at that moment.</p>
                    <p>The agent keeps that record. Open a failed check and the host&apos;s CPU, memory and disk for the minutes around it are right there, next to the likely causes. If the host looked normal, the diagnosis says so too, which rules out running out of resources.</p>
                </Prose>
            </Section>
            <Section eyebrow="What you get" title="Server resource monitoring, built into uptime monitoring">
                <FeatureGrid items={FEATURES} />
            </Section>
            <Section eyebrow="Setup" title="Reporting in about two minutes">
                <ol className="max-w-[62ch] list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted-foreground">
                    <li>Add the server as a monitor on a Starter, Pro or Business plan.</li>
                    <li>On the monitor, choose Set up host metrics and copy the command for your system.</li>
                    <li>Run it on the server. The page changes to &ldquo;Connected&rdquo; within a minute and the charts start to fill.</li>
                </ol>
                <p className="mt-6 max-w-[62ch] text-[15px] leading-relaxed text-muted-foreground">
                    Full commands and options are in <Link href="/docs/host-agent" className="text-primary underline-offset-4 hover:underline">Install the host agent</Link>, and the limits are explained in <Link href="/docs/host-alerts" className="text-primary underline-offset-4 hover:underline">Host alerts and limits</Link>. The source is on <a href={AGENT_REPO} rel="noopener" className="text-primary underline-offset-4 hover:underline">GitHub</a>.
                </p>
            </Section>
        </MarketingPage>
    )
}
