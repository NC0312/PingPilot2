import MarketingPage, { Section, FeatureGrid, Prose } from '@/app/components/Marketing/MarketingPage'
import Link from 'next/link'
import { pageMetadata } from '@/lib/seo'

const PATH = '/public-status-page'

export const metadata = pageMetadata({
    path: PATH,
    title: 'Public Status Page for Your Website and Services',
    ogTitle: 'Public status page: show customers what is up | Ping Pilott',
    description:
        'Publish a status page that shows which of your services are up, 30 days of history and recent incidents. Updated from your uptime checks, free on every plan.',
})

const FEATURES = [
    { title: 'Updated by your checks', body: 'The page is built from the same uptime checks that alert you. Nobody has to edit it when something breaks or recovers.' },
    { title: 'You choose what customers see', body: 'Pick the monitors to list, put them in order and give each a customer-friendly name, such as "Website" instead of "prod-web-02".' },
    { title: '30 days at a glance', body: 'Each service shows a bar for the last 30 days, one cell a day, with its uptime percentage. Hover a day for what happened.' },
    { title: 'Recent incidents', body: 'Outages from the last 14 days are listed with when they started and how long they lasted, so customers can see you noticed and fixed it.' },
    { title: 'Your title, your address', body: 'Set the page title, a short description and the address, such as /status/acme-status. Unpublish it any time without deleting it.' },
    { title: 'Hidden from search by default', body: 'New pages ask Google not to list them. Turn on "Let search engines list it" if you want the page to appear in results.' },
]

const FAQS = [
    { q: 'What is a status page?', a: 'A status page is a public web page that shows whether your website or services are working right now, plus recent history. Customers check it instead of writing to support when something looks wrong.' },
    { q: 'How many status pages can I have?', a: 'Free and Starter include 1, Pro includes 3 and Business includes 10. Pro and Business pages have no Ping Pilott footer; Free and Starter pages show a small "Powered by Ping Pilott" line.' },
    { q: 'Do I have to update it by hand?', a: 'No. Each service on the page follows the monitor behind it. When a check fails the service shows the problem, and when it recovers the page goes back to normal.' },
    { q: 'Will search engines list my status page?', a: 'Not unless you ask. New pages tell search engines not to list them. You can turn that on per page.' },
    { q: 'Can customers subscribe to updates?', a: 'Not yet. A status page is a link customers can open and bookmark. Alerts to your own team go by email, Slack, Discord, Telegram or webhook.' },
    { q: 'Does it use my own domain?', a: 'Not today. Pages are served from this site at /status/your-address.' },
    { q: 'Which times does the page use?', a: 'All times on the page are in UTC, and the page shows when it was last updated. It refreshes about once a minute.' },
]

export default function Page() {
    return (
        <MarketingPage
            path={PATH}
            crumb="Public status page"
            eyebrow="Status page"
            title="A public status page that updates itself."
            intro="Give customers one link that shows whether your website and services are up, with 30 days of history and recent incidents, built from the uptime checks you already run."
            faqs={FAQS}
        >
            <Section eyebrow="Why publish one" title="Fewer tickets, more trust">
                <Prose>
                    <p>When something breaks, the first question from customers is whether it is you or them. A status page answers it before they ask, and a visible record of fast recoveries builds more trust than silence.</p>
                    <p>Ping Pilott builds the page from your monitors, so it is accurate the moment a check fails and the moment it recovers, with no one needing to log in during an outage.</p>
                </Prose>
            </Section>
            <Section eyebrow="What you get" title="Everything a status page needs, nothing to maintain">
                <FeatureGrid items={FEATURES} />
            </Section>
            <Section eyebrow="Plans" title="Status pages on every plan">
                <div className="overflow-x-auto rounded-2xl ring-1 ring-white/[0.07]">
                    <table className="w-full min-w-[26rem] border-collapse text-left text-sm">
                        <caption className="sr-only">Status pages included in each Ping Pilott plan</caption>
                        <thead>
                            <tr className="bg-white/[0.04] text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                                <th scope="col" className="px-3 py-3 font-medium sm:px-4">Plan</th>
                                <th scope="col" className="px-3 py-3 font-medium sm:px-4">Status pages</th>
                                <th scope="col" className="px-3 py-3 font-medium sm:px-4">&ldquo;Powered by&rdquo; line</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06]">
                            {[['Free', '1', 'Shown'], ['Starter', '1', 'Shown'], ['Pro', '3', 'Not shown'], ['Business', '10', 'Not shown']].map(([plan, pages, powered]) => (
                                <tr key={plan}>
                                    <th scope="row" className="px-3 py-3.5 font-medium text-foreground/90 sm:px-4">{plan}</th>
                                    <td className="px-3 py-3.5 text-foreground/90 sm:px-4">{pages}</td>
                                    <td className="px-3 py-3.5 text-muted-foreground sm:px-4">{powered}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>
            <Section eyebrow="Setup" title="Publish a page in three steps">
                <ol className="max-w-[62ch] list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted-foreground">
                    <li>Add the websites or servers you want to show as monitors. <Link href="/docs/getting-started" className="text-primary underline-offset-4 hover:underline">Getting started</Link> shows how.</li>
                    <li>Open Status pages in the dashboard, choose a title and address, and pick the monitors to list.</li>
                    <li>Share the link. Read <Link href="/docs/status-pages" className="text-primary underline-offset-4 hover:underline">the status pages guide</Link> for every option.</li>
                </ol>
            </Section>
        </MarketingPage>
    )
}
