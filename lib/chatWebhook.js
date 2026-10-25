// Which chat app an alert address belongs to, for the hint under the webhook field and the plan check in the form.
//
// The backend decides what to send (utils/chatWebhook.js there, which also builds each message). This is a small copy
// of its detection so the form can say "Slack detected" before saving. Keep the two in step.

export const CHAT_LABELS = { slack: 'Slack', discord: 'Discord', telegram: 'Telegram' };

const SLACK_HOSTS = ['hooks.slack.com', 'hooks.slack-gov.com'];
const DISCORD_HOSTS = ['discord.com', 'discordapp.com', 'ptb.discord.com', 'canary.discord.com'];

/** 'slack' | 'discord' | 'telegram', or null for anything else (an ordinary webhook) */
export function detectChat(raw) {
    let url;
    try {
        url = new URL(String(raw || '').trim());
    } catch {
        return null;
    }
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();

    if (SLACK_HOSTS.includes(host) && /^\/services\/[^/]+\/[^/]+\/[^/]+\/?$/.test(url.pathname)) return 'slack';
    if (DISCORD_HOSTS.includes(host) && /^\/api(?:\/v\d+)?\/webhooks\/\d+\/[A-Za-z0-9._-]+\/?$/.test(url.pathname)) return 'discord';
    if (host === 'api.telegram.org' && /^\/bot[^/]+\/sendMessage\/?$/i.test(url.pathname)) {
        return /^(-?\d+|@[A-Za-z0-9_]{5,})$/.test((url.searchParams.get('chat_id') || '').trim()) ? 'telegram' : null;
    }
    return null;
}

/** The label to show for a saved address: "Slack", "Discord", "Telegram", or "Webhook" */
export const channelLabel = (raw) => CHAT_LABELS[detectChat(raw)] || 'Webhook';
