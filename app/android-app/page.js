import MarketingPage, { Section, FeatureGrid, Prose } from '@/app/components/Marketing/MarketingPage'
import AndroidDownloadPanel from '@/app/components/AndroidDownloadPanel'

const PATH = '/android-app'

export const metadata = {
    title: 'Android App: Server Downtime Alerts on Your Phone',
    description:
        'Get a notification on your Android phone the moment a website or server goes down, comes back or slows down. Check now and snooze from the notification. Works with your Ping Pilott account.',
    alternates: { canonical: PATH },
    openGraph: { url: PATH, title: 'Ping Pilott for Android: downtime alerts on your phone' },
}

const FEATURES = [
    { title: 'Alerts that find you', body: 'The app keeps a live connection running in the background, so an alert arrives as soon as it is raised, even when the app is closed. It does not depend on Google push services.' },
    { title: 'Act from the notification', body: 'A down alert has Check now and Snooze 1h buttons. Re-check a server, or silence it for an hour, without opening the app.' },
    { title: 'Quiet when you need it', body: 'Pause every alert for 1, 8 or 24 hours, or set quiet hours for the night. Outages can still come through while recoveries and slow-response alerts wait.' },
    { title: 'Warns you when monitoring stops', body: 'If Ping Pilott itself has a problem, such as the scheduler stopping or the server being unreachable, the app tells you instead of showing an old, healthy-looking status.' },
    { title: 'Live status and history', body: 'See every server at a glance, with response-time charts, recent checks and a timeline for each incident that you can share with your team.' },
    { title: 'Locked when you want it', body: 'Turn on the app lock to ask for your fingerprint, face or screen lock when the app opens. Alerts keep arriving while it is locked.' },
]

const FAQS = [
    { q: 'Is the app on Google Play?', a: 'No. It is installed directly from a file, which is why Android asks for permission once. Installing a newer file over the old one keeps you signed in, and the app tells you when a new version is out.' },
    { q: 'Is it safe to install?', a: 'The file is published on our releases page on GitHub. The app signs in to your Ping Pilott account and shows your alerts. It asks for permission to show notifications, and optionally uses your fingerprint or screen lock for the app lock. You can turn the install permission for your browser off again afterwards.' },
    { q: 'Does it work on iPhone?', a: 'Not yet. There is only an Android app today. On an iPhone the dashboard works in the browser, and alerts still arrive by email.' },
    { q: 'Why is there a permanent notification?', a: 'It is what keeps the connection alive while the app is closed. Without it Android would stop the app and alerts would arrive late or not at all. You can switch it off in the app, but then alerts only arrive while the app is open.' },
    { q: 'Will it drain my battery?', a: 'It holds one idle connection, which uses very little. Some phones restrict background apps to save battery, which can delay alerts. The setup guide in the app shows how to exempt it.' },
    { q: 'Which account do I use?', a: 'The same one as the dashboard. The app shows and alerts on the servers in that account, and anything you change in either place appears in both.' },
]

export default function Page() {
    return (
        <MarketingPage
            path={PATH}
            crumb="Android app"
            eyebrow="Android app"
            title="Server alerts on your phone, the moment they happen."
            intro="The Ping Pilott app for Android tells you when a website or server goes down, comes back or slows down, even when the app is closed. Sign in with your Ping Pilott account."
            faqs={FAQS}
        >
            <Section id="download" eyebrow="Download" title="Get the app">
                <AndroidDownloadPanel />
            </Section>
            <Section eyebrow="What you get" title="Built for being woken up for the right reasons">
                <FeatureGrid items={FEATURES} />
            </Section>
            <Section eyebrow="Install" title="Up and running in a few minutes">
                <ol className="max-w-[62ch] list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted-foreground">
                    <li>Download the file on your phone, or scan the code above from your computer.</li>
                    <li>Open it. If Android asks, allow installs from your browser, then tap Install.</li>
                    <li>Open Ping Pilott, sign in with your account, and allow notifications when asked.</li>
                    <li>Follow the short setup guide: it helps you set the battery option that keeps alerts reliable.</li>
                </ol>
            </Section>
            <Section eyebrow="Reliable alerts" title="Tell your phone not to put the app to sleep">
                <Prose>
                    <p>Android saves battery by stopping apps it thinks you are not using. For an app whose job is to wake you up, that can mean a late alert. In the app, set Ping Pilott to Unrestricted battery use. The setup guide opens the right settings for you.</p>
                    <p>Some makers, including Xiaomi, Oppo, Vivo and Samsung, add their own restrictions on top. If alerts ever stop arriving, allow Ping Pilott to start automatically and lock it in the recent apps list. The Diagnostics screen in the app shows whether it is connected and when it last heard from the server.</p>
                </Prose>
            </Section>
        </MarketingPage>
    )
}
