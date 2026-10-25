import LegalPage from '@/app/components/Marketing/LegalPage'
import { entityLabel, addressLabel, emailLabel, officerLabel, cityLabel } from '@/lib/legal'

const PATH = '/terms'

export const metadata = {
    title: 'Terms of Service',
    description: 'The terms that apply when you use Ping Pilott uptime monitoring: accounts, plans, acceptable use, alerts, liability and governing law.',
    alternates: { canonical: PATH },
    openGraph: { url: PATH, title: 'Terms of Service | Ping Pilott' },
}

const SECTIONS = [
    {
        title: 'Agreement',
        body: [
            `These terms are an agreement between you and ${entityLabel()}, ${addressLabel()} ("Ping Pilott", "we"), and govern your use of the Ping Pilott website and uptime monitoring service. They are an electronic record under the Information Technology Act, 2000 and need no physical signature.`,
            'By creating an account or using the service you accept them. If you use Ping Pilott for an organization, you confirm you are authorised to accept these terms on its behalf.',
        ],
    },
    {
        title: 'Who can use the service',
        body: ['You must be at least 18 years old and capable of entering a binding contract under the Indian Contract Act, 1872. The service is not for children.'],
    },
    {
        title: 'The service',
        body: ['Ping Pilott checks websites, APIs, TCP ports and databases that you choose, on a schedule, records the results and sends alerts when checks fail. We may improve, change or remove features over time.'],
    },
    {
        title: 'Your account',
        body: [
            { list: [
                'Give accurate information and keep your sign-in details secret.',
                'You are responsible for activity under your account. Tell us promptly if you suspect unauthorized access.',
            ] },
        ],
    },
    {
        title: 'Free trial, plans and taxes',
        body: [
            'New accounts may start with a free trial that has its own limits, such as the number of monitors and the check interval. Paid plans, prices, monitor limits and check intervals are described on the pricing page and may change; changes do not alter a billing period you have already paid for.',
            'Where payment is taken, the price, billing period and any applicable taxes, including Goods and Services Tax (GST), are shown before you pay. If a plan is not available for online purchase, contact support to change your plan. Any refund rights are those stated at the time of purchase and those the law gives you.',
        ],
    },
    {
        title: 'Acceptable use',
        body: [
            'Only monitor websites, servers and services that you own or have permission to monitor. You must not:',
            { list: [
                'use Ping Pilott to attack, overload, scan or probe a system, or to bypass its security, or otherwise in breach of the Information Technology Act, 2000 or any other law;',
                'set up monitors designed to generate abusive volumes of traffic;',
                'send unlawful, defamatory, obscene or infringing content through support tickets, alerts or webhooks;',
                'interfere with or attempt to disrupt the service, or access data that is not yours;',
                'resell or sublicense the service without our written permission.',
            ] },
            'We may suspend monitors or accounts that break these rules and may report unlawful activity to the authorities.',
        ],
    },
    {
        title: 'Alerts and monitoring results',
        body: ['Monitoring depends on networks and third-party systems that we do not control. Checks can produce false positives or miss short outages, and alerts can be delayed or fail to arrive, for example because of email delivery problems. Do not rely on Ping Pilott as your only safeguard for safety-critical systems.'],
    },
    {
        title: 'Availability',
        body: ['We work to keep Ping Pilott available but do not promise uninterrupted or error-free operation. We may suspend the service for maintenance or security reasons.'],
    },
    {
        title: 'Your data and our rights',
        body: [
            'You keep ownership of the data you submit. You permit us to process it only to provide and secure the service, as described in our Privacy Policy, which forms part of these terms.',
            'Ping Pilott, including its software, design and branding, belongs to us or our licensors. We give you a limited, non-exclusive, non-transferable right to use the service under these terms.',
        ],
    },
    {
        title: 'Ending your account',
        body: ['You can stop using the service and delete your account at any time. We may suspend or end your access if you break these terms, if the law requires it, or if we stop offering the service. Sections that by their nature should continue, such as those on liability and governing law, survive the end of the agreement.'],
    },
    {
        title: 'Disclaimers and limits on liability',
        body: [
            'The service is provided "as is" and "as available". To the extent permitted by applicable law, we give no warranties beyond those that cannot be excluded, including fitness for a particular purpose.',
            'To the extent permitted by applicable law, Ping Pilott is not liable for indirect or consequential loss, loss of profit, revenue or data, or loss from missed or delayed alerts. Our total liability for any claim is limited to the amount you paid us for the service in the 12 months before the claim arose. Nothing in these terms limits liability that cannot be limited by law, or any right you have as a consumer under the Consumer Protection Act, 2019.',
        ],
    },
    {
        title: 'Governing law and disputes',
        body: [
            `These terms are governed by the laws of India. Subject to any right you have as a consumer to approach the competent Consumer Commission, the courts at ${cityLabel()}, India have exclusive jurisdiction over disputes arising from them.`,
            `Please raise any complaint with us first. Our Grievance Officer is ${officerLabel()}, and we aim to acknowledge complaints within 48 hours and resolve them within one month.`,
        ],
    },
    {
        title: 'Changes to these terms',
        body: ['We may update these terms. We will update the date at the top and, for material changes, notify you by email or in the service. If you keep using the service after changes take effect, you accept the updated terms.'],
    },
    {
        title: 'Contact us',
        body: [{ list: [`Email: ${emailLabel()}`, `Address: ${addressLabel()}`] }],
    },
]

export default function Page() {
    return (
        <LegalPage
            path={PATH}
            title="Terms of Service"
            intro="Please read these terms before using Ping Pilott. They set out how the service works and what we each expect, under Indian law."
            sections={SECTIONS}
        />
    )
}
