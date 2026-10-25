import LegalPage from '@/app/components/Marketing/LegalPage'
import { entityLabel, addressLabel, emailLabel, officerLabel } from '@/lib/legal'

const PATH = '/privacy'

export const metadata = {
    title: 'Privacy Policy',
    description: 'How Ping Pilott collects, uses and protects your personal data under Indian law, and how to exercise your rights or raise a grievance.',
    alternates: { canonical: PATH },
    openGraph: { url: PATH, title: 'Privacy Policy | Ping Pilott' },
}

const SECTIONS = [
    {
        title: 'Who we are and what this covers',
        body: [
            `Ping Pilott is operated by ${entityLabel()}, ${addressLabel()} ("we", "us"). We act as the data fiduciary for the personal data described in this policy.`,
            'This policy is published under the Information Technology Act, 2000, the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and the Digital Personal Data Protection Act, 2023 with its Rules, as each applies from time to time. It covers our website and uptime monitoring service.',
        ],
    },
    {
        title: 'Personal data we collect and why',
        body: [
            { list: [
                'Name, email address and password: to create and secure your account, verify your email, sign you in and contact you about the service. Your password is treated as sensitive personal data.',
                'Monitor settings (the websites, APIs, hosts and ports you ask us to check, intervals and alert preferences): to perform the checks you request.',
                'Alert contacts (email addresses and webhook URLs you add): to send alerts to the people you choose. If these belong to other people, you confirm they are aware and agree.',
                'Check results and incident history (status, response time, start and end of outages): to show your dashboard and reports.',
                'Support messages and the details you include: to answer your request.',
                'Technical data in standard server logs, such as IP address, browser type and pages requested: to run, secure and fix the service.',
            ] },
            'We collect only what is needed for these purposes. We do not collect payment card details through this website today, and we do not knowingly collect financial or health data.',
        ],
    },
    {
        title: 'Your consent',
        body: [
            'We process your personal data on the basis of your consent, given when you tick the box at sign-up, and for the legitimate uses the law allows, such as responding to you, complying with legal obligations and preventing fraud or abuse.',
            'You may withdraw consent at any time by deleting your account or writing to us as described in section 11. Withdrawing consent does not affect processing done before, and we may then be unable to provide the service to you.',
        ],
    },
    {
        title: 'Who we share it with',
        body: [
            'We do not sell your personal data and we do not use it for third-party advertising.',
            'We share it only with service providers that help us run Ping Pilott (such as providers that host the website and monitoring service and providers that deliver email), under obligations to protect it and use it only for our purposes. Alerts go to the contacts and webhook URLs you configure.',
            'We may disclose personal data to courts, law enforcement or government bodies when required by Indian law or a lawful order, or to protect rights, safety and security.',
        ],
    },
    {
        title: 'Storage and transfers outside India',
        body: ['Our providers may store or process data on servers located outside India. We transfer personal data abroad only as permitted by Indian law, and we require our providers to keep it protected.'],
    },
    {
        title: 'Cookies and local storage',
        body: [
            'We use your browser\'s local storage to keep you signed in, remember interface preferences and return you to the right page after sign-in. We do not use advertising cookies, and at the time of writing we run no third-party analytics scripts on the website.',
            'You can clear this data in your browser settings; you will be signed out if you do.',
        ],
    },
    {
        title: 'How long we keep personal data',
        body: ['We keep account and monitoring data while your account is active and, for monitoring history, for as long as your plan includes it. When you delete your account, or when the purpose for which we collected data has ended, we erase it, unless we must keep it to meet a legal obligation or to resolve a dispute.'],
    },
    {
        title: 'Security and data breaches',
        body: [
            'We maintain reasonable security safeguards, including access controls and encrypted connections, to protect personal data against unauthorized access, loss and misuse. Please choose a strong, unique password and keep it private.',
            'If a personal data breach affects you, we will tell you and the Data Protection Board of India as the law requires.',
        ],
    },
    {
        title: 'Your rights',
        body: [
            'Under the Digital Personal Data Protection Act, 2023 you have the right to:',
            { list: [
                'obtain a summary of the personal data we process and the other parties we share it with;',
                'ask us to correct, complete or update your personal data;',
                'ask us to erase your personal data, unless the law requires us to keep it;',
                'have your grievance addressed, as described in section 11;',
                'nominate another person to exercise these rights on your behalf if you die or become unable to do so.',
            ] },
            'You can edit your account details and alert contacts in the service at any time. For other requests, contact us as described below.',
        ],
    },
    {
        title: 'Children',
        body: ['Ping Pilott is for people aged 18 or older and is not directed to children. We do not knowingly process the personal data of anyone under 18. If you believe a child has given us personal data, tell us and we will delete it.'],
    },
    {
        title: 'Grievances and contact',
        body: [
            'To exercise your rights, withdraw consent or raise a concern, contact our Grievance Officer:',
            { list: [`Grievance Officer: ${officerLabel()}`, `General contact: ${emailLabel()}`, `Address: ${addressLabel()}`] },
            'We will acknowledge your request and aim to resolve it within the time the law allows, and in any case within 30 days. If you are not satisfied with our response, you may complain to the Data Protection Board of India once that route is available to you under the Act.',
        ],
    },
    {
        title: 'Changes to this policy',
        body: ['We may update this policy as the service or the law changes. We will update the date at the top and, for material changes, notify you by email or in the service.'],
    },
]

export default function Page() {
    return (
        <LegalPage
            path={PATH}
            title="Privacy Policy"
            intro="We collect only what we need to monitor your sites and send your alerts. This page explains what that is, why, and how to exercise your rights under Indian law."
            sections={SECTIONS}
        />
    )
}
