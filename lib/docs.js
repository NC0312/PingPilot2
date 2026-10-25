// The documentation at /docs: what it says, in order, as data, so the pages, the menu, the contents list and the sitemap all
// come from one place and a page cannot be in one and missing from another.
//
// Text may hold `code` and [links](/path or https://...). Block types: p, h2, ul / ol (items), code (text, label),
// note (text, tone: 'info' | 'warning'), table (head, rows).

export const AGENT_RELEASES = 'https://github.com/Jatin-1111/pingpilot-agent/releases/latest';
export const AGENT_REPO = 'https://github.com/Jatin-1111/pingpilot-agent';

/**
 * Splits text into plain, code and link pieces. Only links to this site (a path) or to https addresses are kept as links;
 * anything else is shown as the text it was written as, so a typo or a copied address can never become a `javascript:` link.
 * @returns {{ type: 'text'|'code'|'link', text: string, href?: string, external?: boolean }[]}
 */
export function parseInline(source) {
    const out = [];
    const pattern = /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;
    const text = String(source ?? '');
    let last = 0;
    for (const m of text.matchAll(pattern)) {
        if (m.index > last) out.push({ type: 'text', text: text.slice(last, m.index) });
        if (m[1] !== undefined) {
            out.push({ type: 'code', text: m[1] });
        } else if (/^\/(?!\/)/.test(m[3]) || /^https:\/\//i.test(m[3])) {
            out.push({ type: 'link', text: m[2], href: m[3], external: !m[3].startsWith('/') });
        } else {
            out.push({ type: 'text', text: m[2] });
        }
        last = m.index + m[0].length;
    }
    if (last < text.length) out.push({ type: 'text', text: text.slice(last) });
    return out;
}

export const slugify = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const DOCS = [
    {
        slug: 'getting-started',
        title: 'Getting started',
        summary: 'From sign-up to your first alert in about five minutes.',
        blocks: [
            { type: 'p', text: 'Ping Pilott checks your websites, APIs, ports and databases from outside your network, tells you when one stops answering, and says what to look at first. With the host agent installed it also shows the server\'s CPU, memory, disk and network, so you can see whether the machine itself was the problem.' },
            { type: 'h2', text: 'Set up in five steps' },
            { type: 'ol', items: [
                '[Create an account](/auth?mode=signup) and confirm your email address. The free plan needs no card.',
                'Add your first monitor from the [dashboard](/dashboard) or go straight to [New monitor](/servers/new). See [Add a monitor](/docs/monitors).',
                'Choose who is told when it fails: email addresses, and a Slack, Discord, Telegram or other webhook. See [Alerts](/docs/alerts).',
                'Install the [Android app](/android-app) if you want alerts on your phone.',
                'Optional: install the host agent on the server so the page can show its resources. See [Install the host agent](/docs/host-agent).',
            ] },
            { type: 'h2', text: 'What is on each plan' },
            { type: 'table', head: ['', 'Free', 'Starter', 'Pro', 'Business'], rows: [
                ['Monitors', '5', '20', '60', '200'],
                ['Shortest check interval', '5 minutes', '1 minute', '1 minute', '1 minute'],
                ['Slack, Discord and Telegram alerts', 'Yes', 'Yes', 'Yes', 'Yes'],
                ['Any other webhook', 'No', 'Yes', 'Yes', 'Yes'],
                ['Detailed failure diagnosis', 'Summary only', 'Yes', 'Yes', 'Yes'],
                ['Host agents', 'No', '3', '15', '60'],
                ['Status pages', '1', '1', '3', '10'],
            ] },
            { type: 'p', text: 'Prices and the full list are on the [pricing page](/pricing).' },
            { type: 'h2', text: 'Where to go next' },
            { type: 'ul', items: [
                '[Understand a failure](/docs/failures): read the diagnosis when a check fails.',
                '[Publish a status page](/docs/status-pages): show customers what is up.',
                '[Host alerts and limits](/docs/host-alerts): get told before the disk fills.',
                '[Troubleshooting](/docs/troubleshooting): when something does not work.',
                'Questions that are not answered here: [contact support](/support).',
            ] },
        ],
    },
    {
        slug: 'monitors',
        title: 'Add a monitor',
        summary: 'What you can watch, and the two steps to add it.',
        blocks: [
            { type: 'p', text: 'A monitor is one thing Ping Pilott checks on a schedule. Add one from [New monitor](/servers/new). It takes two steps: what to watch, then how often to check and who to tell.' },
            { type: 'h2', text: 'What you can watch' },
            { type: 'table', head: ['Type', 'It is up when', 'Use it for'], rows: [
                ['Website', 'The address answers with a good status', 'A site or a page that must load'],
                ['API', 'The endpoint answers with a good status', 'An endpoint other software calls'],
                ['TCP port', 'A connection to the host and port opens', 'A service that is not HTTP'],
                ['Database', 'A connection to the host and port opens', 'A database that must accept connections'],
            ] },
            { type: 'h2', text: 'Step 1: what to watch' },
            { type: 'ul', items: [
                'Give it a name. It is shown on your dashboard and in alerts.',
                'Enter the address, or the host and port for a TCP or database monitor. Addresses that point at private networks are refused, because checks run from the public internet.',
                'Add a note if you want one. Only you see it.',
            ] },
            { type: 'h2', text: 'Step 2: checks and alerts' },
            { type: 'ul', items: [
                'Choose how often to check. The free plan checks every 5 minutes or slower; paid plans can check every minute.',
                'Add the email addresses and webhook that should be told. See [Alerts](/docs/alerts).',
            ] },
            { type: 'note', tone: 'info', text: 'A check from outside can only see that something stopped answering. [Understand a failure](/docs/failures) explains how Ping Pilott narrows down why.' },
            { type: 'h2', text: 'Change or remove a monitor' },
            { type: 'p', text: 'Open the monitor from [Servers](/servers) to edit its address, interval or alert contacts, run a check now, or delete it. Deleting a monitor also deletes its history and its host agent token.' },
        ],
    },
    {
        slug: 'alerts',
        title: 'Alerts',
        summary: 'Who is told, how, and how to set up Slack, Discord or Telegram.',
        blocks: [
            { type: 'p', text: 'You are told when a monitor goes down and again when it recovers, so you know when to stop looking. Alerts are sent to the people and places you add to the monitor.' },
            { type: 'h2', text: 'Where alerts go' },
            { type: 'ul', items: [
                'Email: add one or more addresses. Send to more than one person so a missed message does not hide an outage.',
                'Webhook: Slack, Discord and Telegram addresses work on every plan. Any other address that accepts a POST is on Starter, Pro and Business.',
                'The [Android app](/android-app): notifications on your phone, once you sign in to it. Host alerts can be turned off there if you only want website alerts.',
            ] },
            { type: 'h2', text: 'Slack, Discord and Telegram' },
            { type: 'p', text: 'Paste the address into the webhook field. The form says "Slack detected" (or Discord, or Telegram) when it recognises it, and the message is then shaped for that app.' },
            { type: 'table', head: ['App', 'What to paste'], rows: [
                ['Slack', 'An incoming webhook address, `https://hooks.slack.com/services/...`'],
                ['Discord', 'A channel webhook address, `https://discord.com/api/webhooks/...`'],
                ['Telegram', '`https://api.telegram.org/bot<token>/sendMessage?chat_id=<id>` with your own bot token and chat id'],
            ] },
            { type: 'p', text: 'Any other https address receives a JSON message describing the event.' },
            { type: 'note', tone: 'warning', text: 'A webhook address is a secret: anyone who has it can post to your channel. Do not paste it into a public place.' },
            { type: 'h2', text: 'What triggers an alert' },
            { type: 'ul', items: [
                'A monitor goes down, and when it comes back.',
                'A slow response, when you have asked for slow alerts.',
                'A certificate that is about to expire.',
                'Host alerts, if you install the agent: high CPU, memory or disk, and an agent that stopped reporting. See [Host alerts and limits](/docs/host-alerts).',
            ] },
            { type: 'p', text: 'The [Incidents page](/incidents) lists every outage with when it started, how long it lasted and, on paid plans, what Ping Pilott thinks caused it.' },
        ],
    },
    {
        slug: 'failures',
        title: 'Understand a failure',
        summary: 'Read the diagnosis: where the check stopped, the likely causes, what to check.',
        blocks: [
            { type: 'p', text: 'When a check fails, the monitor shows what happened in plain words and where the check stopped. That narrows the search before you open a terminal.' },
            { type: 'h2', text: 'Where it stopped' },
            { type: 'p', text: 'Every check is a short journey, and the page shows which step failed:' },
            { type: 'ol', items: [
                'Name lookup (DNS): finding the address of the host.',
                'Connect: opening a connection to it.',
                'Secure connection (TLS): the certificate and encryption.',
                'Response: the server answering, and with what status.',
                'Content: the answer containing what you asked it to contain.',
            ] },
            { type: 'p', text: 'A failure at name lookup is a different problem from a failure at the response, and the bar of timings shows how long each step took before it failed.' },
            { type: 'h2', text: 'Likely causes and what to check' },
            { type: 'p', text: 'On paid plans each failure lists the likely causes, most likely first, with the evidence behind each (a status code, a header the server sent, a timing). Below them is a checklist in order, with commands you can copy. Ping Pilott only says "likely": from outside it sees the symptom, never the cause.' },
            { type: 'p', text: 'Free plans show the summary: what happened, the usual cause and what to try first.' },
            { type: 'h2', text: 'When the server was overloaded' },
            { type: 'p', text: 'If the [host agent](/docs/host-agent) is installed, the diagnosis also looks at the ten minutes before the failure. A 504 while CPU averaged 98% says so, with the figures, and lists a command to find the busiest process. If the host looked normal, the diagnosis says that too, which makes running out of resources less likely.' },
            { type: 'ul', items: [
                'It is used only for connection, response and content failures. A 404, a refused login or a certificate error is not explained by load, so it is not mentioned.',
                'Readings are kept for 24 hours, so an older incident shows no host information.',
            ] },
            { type: 'h2', text: 'What the server said' },
            { type: 'p', text: 'For a failed HTTP check, paid plans also show the headers the server sent and a short piece of its answer, shown as plain text and collapsed until you open it.' },
        ],
    },
    {
        slug: 'status-pages',
        title: 'Publish a status page',
        summary: 'Show customers which services are up, with 30 days of history.',
        blocks: [
            { type: 'p', text: 'A status page is a public web page built from your monitors. It shows whether each service you list is working now, the last 30 days one day at a time, and recent incidents. It updates itself from your checks, so nobody has to edit it during an outage. See also [the status page feature](/public-status-page).' },
            { type: 'h2', text: 'What is on each plan' },
            { type: 'table', head: ['Plan', 'Status pages', 'Footer line'], rows: [
                ['Free', '1', '"Powered by Ping Pilott"'],
                ['Starter', '1', '"Powered by Ping Pilott"'],
                ['Pro', '3', 'None'],
                ['Business', '10', 'None'],
            ] },
            { type: 'h2', text: 'Create a page' },
            { type: 'ol', items: [
                'Open [Status pages](/status-pages) in the dashboard and choose to add one.',
                'Enter a title (what visitors see at the top, such as your company or product name) and an address using lowercase letters, numbers and hyphens. The page is served at `/status/your-address`.',
                'Optionally add a description of one or two sentences.',
                'Pick the monitors to list. Put them in the order you want and give each a name visitors will understand.',
                'Leave Published on and save. Share the link.',
            ] },
            { type: 'h2', text: 'What visitors see' },
            { type: 'ul', items: [
                'An overall banner: everything working, or which services have problems.',
                'Each service with its current state, a bar for the last 30 days and its uptime percentage.',
                'Incidents from the last 14 days, with when they started and how long they lasted.',
                'All times in UTC, and when the page was last updated. It refreshes about once a minute.',
            ] },
            { type: 'h2', text: 'Search engines and privacy' },
            { type: 'p', text: 'New pages ask search engines not to list them. Turn on "Let search engines list it" for a page you want people to find through Google. Turn off Published to hide a page without deleting it; deleting a page stops its link working straight away and does not touch your monitors.' },
            { type: 'note', tone: 'info', text: 'Only the names you choose and the status of the monitors you list are shown. Addresses, alert contacts and notes are never on the page.' },
            { type: 'h2', text: 'Limits today' },
            { type: 'ul', items: [
                'Pages are served from this site, not from your own domain.',
                'Visitors cannot subscribe to updates; they open the link.',
            ] },
        ],
    },
    {
        slug: 'host-agent',
        title: 'Install the host agent',
        summary: 'See CPU, memory, disk and network for a server, with the exact commands.',
        blocks: [
            { type: 'p', text: 'The agent is a small program that reports a server\'s CPU, memory, disk and network to Ping Pilott once a minute. It is one static file of 6 to 7 MB, needs nothing installed, and opens no port: it only makes outbound HTTPS requests. Host metrics are on Starter (3 servers), Pro (15) and Business (60).' },
            { type: 'h2', text: 'Before you start' },
            { type: 'ul', items: [
                'A monitor for the server, on a paid plan.',
                'A Linux server with systemd and a user that can run `sudo`, or a host that runs Docker. For macOS, Windows or Linux without systemd, see "Anywhere else" below.',
                'The server must be able to reach Ping Pilott over HTTPS.',
            ] },
            { type: 'h2', text: 'Step 1: get your command' },
            { type: 'ol', items: [
                'Open the monitor from [Servers](/servers).',
                'In the Host metrics panel, choose Set up host metrics. A token is created for this server only.',
                'Copy the command for your system. It already has your token in it.',
            ] },
            { type: 'note', tone: 'warning', text: 'The token is shown once. If you lose it, choose Manage, then Replace token, and put the new one on every machine that used the old one.' },
            { type: 'h2', text: 'Step 2: run it' },
            { type: 'p', text: 'A Linux server (systemd). The command in the app has the right address for your account; it looks like this:' },
            { type: 'code', label: 'Install on Linux', text: 'curl -fsSL https://<your-ping-pilott-address>/install.sh | sudo PINGPILOT_TOKEN=ppa_... sh' },
            { type: 'p', text: 'It downloads the agent for the machine\'s processor (x86-64, arm64 or 32-bit arm) and refuses to go on unless the file matches its published checksum. It then creates an unprivileged `pingpilot-agent` user, keeps the token readable by that user only, installs a hardened systemd service, starts it, and runs a self-test so you see it work. Running it again upgrades the agent and keeps the token.' },
            { type: 'p', text: 'Want to read the script first? Download it, read it, then run it:' },
            { type: 'code', label: 'Download the installer to read first', text: 'curl -fsSLO https://<your-ping-pilott-address>/install.sh\nsudo PINGPILOT_TOKEN=ppa_... sh install.sh' },
            { type: 'p', text: 'A host that runs containers:' },
            { type: 'code', label: 'Install with Docker', text: 'docker run -d --name pingpilot-agent --restart unless-stopped \\\n  --pid=host --net=host --uts=host -v /:/host:ro \\\n  -e PINGPILOT_HOST_ROOT=/host -e PINGPILOT_TOKEN=ppa_... \\\n  ghcr.io/jatin-1111/pingpilot-agent' },
            { type: 'p', text: 'The agent reports on the machine, not on its own container, so it is given the machine: the host\'s processes (by name), network interfaces and name, and its disks, read only.' },
            { type: 'p', text: 'Anywhere else (macOS, Windows, Linux without systemd): download the file for your system and `checksums.txt` from the [latest release](' + AGENT_RELEASES + '), check the file against the checksums, and run `pingpilot-agent run` under your own service manager.' },
            { type: 'h2', text: 'Step 3: check it works' },
            { type: 'p', text: 'Back on the monitor, the panel changes from "Waiting for the first reading" to "Connected", usually within a minute, and the charts start to fill. You can also test from the server:' },
            { type: 'code', label: 'Test the agent', text: 'pingpilot-agent check' },
            { type: 'p', text: 'It checks the token, the network and the reading in the order a real report goes, and stops at the step that fails, saying what to fix.' },
            { type: 'h2', text: 'What it sends, and what it never does' },
            { type: 'table', head: ['Sent every minute', 'Detail'], rows: [
                ['CPU', 'Percent busy, number of cores, load average'],
                ['Memory', 'Total and used, not counting cache; swap'],
                ['Disks', 'Total and used for each real disk, at most 16'],
                ['Network', 'Bytes per second in and out'],
                ['Uptime', 'Seconds'],
                ['Processes', 'The 5 busiest, by name only, with CPU and memory'],
            ] },
            { type: 'ul', items: [
                'It never sends a command line, a file, an environment variable or a path other than a disk\'s mount point.',
                'It never accepts a command. The only thing it receives is "thanks, send the next one in 60 seconds".',
                'It never opens a port and does not need root to run.',
            ] },
            { type: 'p', text: 'The source and releases are on [GitHub](' + AGENT_REPO + ').' },
            { type: 'h2', text: 'Update or remove it' },
            { type: 'ul', items: [
                'Update: run the install command again.',
                'Remove it from a server: run the installer with `--uninstall`, as shown in the agent\'s [README](' + AGENT_REPO + '#install).',
                'Stop collecting: on the monitor, choose Manage, then Turn off. The token stops working at once and everything the agent sent for this server is deleted. The agent stays installed until you remove it.',
            ] },
            { type: 'p', text: 'Raw readings are kept for 24 hours and 5-minute averages for 30 days. Next: [set alert limits](/docs/host-alerts).' },
        ],
    },
    {
        slug: 'host-alerts',
        title: 'Host alerts and limits',
        summary: 'Get told when CPU, memory or disk stays high, or the agent goes quiet.',
        blocks: [
            { type: 'p', text: 'Once an agent is reporting, Ping Pilott can alert you when a number stays above a limit for a set time, and again when it is back to normal. A short spike does not alert; a sustained problem does.' },
            { type: 'h2', text: 'The four alerts' },
            { type: 'table', head: ['Alert', 'Default'], rows: [
                ['High CPU', 'Above 90% for at least 5 minutes'],
                ['High memory', 'Above 90% for at least 5 minutes'],
                ['High disk', 'The fullest disk above 90% for at least 2 minutes'],
                ['No data', 'The agent has not reported for 5 minutes'],
            ] },
            { type: 'h2', text: 'Change the limits' },
            { type: 'ol', items: [
                'Open the monitor from [Servers](/servers) and find the Host metrics panel.',
                'Choose Manage, then Alert limits.',
                'Set the percentage and the number of minutes for each alert. 0 minutes means at once. Choose Reset to defaults to start over.',
                'Save. Untick "Send these alerts" to keep collecting without alerts.',
            ] },
            { type: 'p', text: 'An alert that has been sent is not sent again while the value stays high, and a recovery message follows when it drops back. Small ups and downs around a limit do not cause repeated messages.' },
            { type: 'h2', text: 'Where they are sent' },
            { type: 'p', text: 'Host alerts go to the same email addresses and webhook as the monitor\'s other alerts (see [Alerts](/docs/alerts)), and arrive in the Android app.' },
            { type: 'h2', text: 'When "no data" fires' },
            { type: 'p', text: 'The agent stopped reporting: the server is off, the agent was stopped, the token was replaced or turned off, or the network is cut. If the website monitor is also down, start with [Understand a failure](/docs/failures); if only the agent went quiet, see [Troubleshooting](/docs/troubleshooting).' },
        ],
    },
    {
        slug: 'troubleshooting',
        title: 'Troubleshooting',
        summary: 'The usual problems and what fixes them.',
        blocks: [
            { type: 'h2', text: 'The host agent' },
            { type: 'p', text: 'On the server, run the self-test first. It stops at the step that fails and says what to fix.' },
            { type: 'code', label: 'Test the agent', text: 'pingpilot-agent check' },
            { type: 'table', head: ['What you see', 'Likely reason', 'What to do'], rows: [
                ['Stays on "Waiting for the first reading"', 'The agent is not running, or cannot reach Ping Pilott', 'Run `pingpilot-agent check`. On Linux, `systemctl status pingpilot-agent` shows whether it runs.'],
                ['The agent says the token was refused (401)', 'The token was replaced, turned off or mistyped', 'Choose Manage, then Replace token, and put the new one in the token file. The agent picks it up on its next try.'],
                ['The agent says the plan has no host metrics (403)', 'The account is on the free plan, or has no free agent slot', 'See [pricing](/pricing). The agent asks again every 15 minutes by itself.'],
                ['Shows "Offline"', 'No reading for more than 3 minutes', 'The server may be off or cut off. Readings sent while it was offline are kept (up to 10) and arrive in order when it is back.'],
                ['The installer stops with a checksum error', 'The download was cut off or changed', 'Nothing was installed. Run it again; if it repeats, download from the [releases page](' + AGENT_RELEASES + ') and compare checksums by hand.'],
                ['Docker shows the container\'s numbers, not the machine\'s', 'The container was started without the host options', 'Use the full command from [Install the host agent](/docs/host-agent), including the three host options and the read-only root mount.'],
                ['The charts are empty for a new period', 'Not enough readings yet', 'Charts fill as readings arrive. The 30 day view uses 5-minute averages.'],
            ] },
            { type: 'h2', text: 'Monitors and alerts' },
            { type: 'table', head: ['What you see', 'Likely reason', 'What to do'], rows: [
                ['The monitor is down but the site works for you', 'It is blocked or slow only from outside, or only for some visitors', 'Open the failure on the monitor: it shows the step that failed. See [Understand a failure](/docs/failures).'],
                ['The address is refused when adding', 'It points at a private network', 'Checks run from the public internet and cannot reach private addresses.'],
                ['No alert arrived', 'The contact was not saved, or the message is in spam', 'Open the monitor, check the contacts, and run a check now. For a webhook, make sure the address is the one the app gave you.'],
                ['A webhook is not accepted on my plan', 'Slack, Discord and Telegram addresses work on every plan; other webhooks are on Starter and above', 'See [pricing](/pricing).'],
                ['Too many host alerts', 'The limits are lower than the normal load', 'Raise the percentage or the minutes under Alert limits. See [Host alerts and limits](/docs/host-alerts).'],
            ] },
            { type: 'h2', text: 'Still stuck?' },
            { type: 'p', text: '[Contact support](/support) and include the monitor\'s name, what you expected and what you saw. For an agent problem, include the output of `pingpilot-agent check` with the token left out.' },
        ],
    },
];

export const getDoc = (slug) => DOCS.find((d) => d.slug === slug) ?? null;

/** The page before and after, for the links at the foot of each page */
export function neighbours(slug) {
    const i = DOCS.findIndex((d) => d.slug === slug);
    return { prev: i > 0 ? DOCS[i - 1] : null, next: i >= 0 && i < DOCS.length - 1 ? DOCS[i + 1] : null };
}

/** The headings of a page, with the ids the page gives them, for "On this page" */
export const headingsOf = (doc) => doc.blocks.filter((b) => b.type === 'h2').map((b) => ({ text: b.text, id: slugify(b.text) }));

export default { DOCS, getDoc, neighbours, headingsOf, parseInline, slugify };
