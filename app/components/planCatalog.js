// View helpers over subscriptionPlans.js (the source of truth for prices and limits).
import { SUBSCRIPTION_PLANS } from './subscriptionPlans';

export const TIERS = [
    { key: 'starter', name: 'Starter' },
    { key: 'pro', name: 'Pro', recommended: true },
    { key: 'business', name: 'Business' },
];

export const BILLING = ['monthly', 'yearly'];

export const planId = (tier, billing) => `${tier}_${billing}`;

export const getPlan = (id) => SUBSCRIPTION_PLANS[id];

/** "pro_yearly" -> { tier: "pro", billing: "yearly" }, anything else -> null. */
export function parsePlanParam(value) {
    const m = /^(starter|pro|business)_(monthly|yearly)$/.exec(value || '');
    return m ? { tier: m[1], billing: m[2] } : null;
}

/** Human label for any plan id, including free and admin. */
export function planLabel(id) {
    const plan = SUBSCRIPTION_PLANS[id];
    if (!plan) return 'Free';
    const name = plan.title.charAt(0) + plan.title.slice(1).toLowerCase();
    if (id.endsWith('_monthly')) return `${name} monthly`;
    if (id.endsWith('_yearly')) return `${name} yearly`;
    return name;
}

export function serverLimitLabel(max) {
    return max === -1 || max === Infinity ? 'Unlimited' : String(max);
}

/** Plain-language feature bullets derived from the plan's feature flags. */
export function featureList(id) {
    const f = SUBSCRIPTION_PLANS[id]?.features;
    if (!f) return [];
    return [
        `${f.maxServers} servers monitored`,
        `Checks every ${f.minCheckFrequency} min or slower`,
        f.historicalReporting && 'Historical reporting',
        f.advancedAlerts && 'Advanced alerts',
        f.webhookIntegrations && 'Webhook integrations',
        f.apiAccess && 'API access',
        f.prioritySupport && 'Priority support',
        `${f.supportResponseTime} support response`,
    ].filter(Boolean);
}
