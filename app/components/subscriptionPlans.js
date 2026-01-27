// app/utils/subscriptionPlans.js

// Define plan types
export const PLAN_TYPES = {
    FREE: 'free',
    STARTER_MONTHLY: 'starter_monthly',
    STARTER_YEARLY: 'starter_yearly',
    PRO_MONTHLY: 'pro_monthly',
    PRO_YEARLY: 'pro_yearly',
    BUSINESS_MONTHLY: 'business_monthly',
    BUSINESS_YEARLY: 'business_yearly',
    ADMIN: 'admin'
};

// Plan details and features
export const SUBSCRIPTION_PLANS = {
    [PLAN_TYPES.FREE]: {
        title: "FREE",
        price: "$0",
        period: "2-day trial",
        description: "Perfect for testing our platform.",
        features: {
            maxServers: 1,
            minCheckFrequency: 5,
            maxCheckFrequency: 30,
            advancedAlerts: false,
            apiAccess: false,
            prioritySupport: false,
            webhookIntegrations: false,
            historicalReporting: false,
            supportResponseTime: "48 hours",
            prioritySupport: false,
        },
        trialDays: 2
    },
    [PLAN_TYPES.STARTER_MONTHLY]: {
        title: "STARTER",
        price: "$10",
        period: "per month",
        description: "For individual developers.",
        features: {
            maxServers: 10,
            minCheckFrequency: 3,
            maxCheckFrequency: 60,
            advancedAlerts: false,
            apiAccess: false,
            prioritySupport: false,
            webhookIntegrations: false,
            historicalReporting: true,
            supportResponseTime: "24 hours",
            prioritySupport: false,
        },
        durationDays: 30
    },
    [PLAN_TYPES.STARTER_YEARLY]: {
        title: "STARTER",
        price: "$100",
        period: "per year (save 17%)",
        description: "For individual developers.",
        features: { // Same as monthly
            maxServers: 10,
            minCheckFrequency: 3,
            maxCheckFrequency: 60,
            advancedAlerts: false,
            apiAccess: false,
            prioritySupport: false,
            webhookIntegrations: false,
            historicalReporting: true,
            supportResponseTime: "24 hours",
            prioritySupport: false,
        },
        durationDays: 365
    },
    [PLAN_TYPES.PRO_MONTHLY]: {
        title: "PRO",
        price: "$29",
        period: "per month",
        description: "For growing websites.",
        features: {
            maxServers: 30,
            minCheckFrequency: 1,
            maxCheckFrequency: 60,
            advancedAlerts: true,
            apiAccess: false,
            prioritySupport: true,
            webhookIntegrations: false,
            historicalReporting: true,
            supportResponseTime: "12 hours",
            prioritySupport: true,
        },
        durationDays: 30
    },
    [PLAN_TYPES.PRO_YEARLY]: {
        title: "PRO",
        price: "$290",
        period: "per year (save 17%)",
        description: "For growing websites.",
        features: { // Same as monthly
            maxServers: 30,
            minCheckFrequency: 1,
            maxCheckFrequency: 60,
            advancedAlerts: true,
            apiAccess: false,
            prioritySupport: true,
            webhookIntegrations: false,
            historicalReporting: true,
            supportResponseTime: "12 hours",
            prioritySupport: true,
        },
        durationDays: 365
    },
    [PLAN_TYPES.BUSINESS_MONTHLY]: {
        title: "BUSINESS",
        price: "$79",
        period: "per month",
        description: "For SaaS & Enterprise.",
        features: {
            maxServers: 100,
            minCheckFrequency: 1,
            maxCheckFrequency: 60,
            advancedAlerts: true,
            apiAccess: true,
            prioritySupport: true,
            webhookIntegrations: true,
            historicalReporting: true,
            supportResponseTime: "4 hours",
            prioritySupport: true,
        },
        durationDays: 30
    },
    [PLAN_TYPES.BUSINESS_YEARLY]: {
        title: "BUSINESS",
        price: "$790",
        period: "per year (save 17%)",
        description: "For SaaS & Enterprise.",
        features: { // Same as monthly
            maxServers: 100,
            minCheckFrequency: 1,
            maxCheckFrequency: 60,
            advancedAlerts: true,
            apiAccess: true,
            prioritySupport: true,
            webhookIntegrations: true,
            historicalReporting: true,
            supportResponseTime: "4 hours",
            prioritySupport: true,
        },
        durationDays: 365
    },
    [PLAN_TYPES.ADMIN]: {
        title: "ADMIN",
        price: "$0",
        period: "Unlimited",
        description: "Administrative access with unlimited capabilities.",
        features: {
            maxServers: Infinity,
            minCheckFrequency: 1,
            maxCheckFrequency: 60,
            advancedAlerts: true,
            apiAccess: true,
            prioritySupport: true,
            webhookIntegrations: true,
            historicalReporting: true,
            supportResponseTime: "immediate",
            prioritySupport: true,
        },
        durationDays: null // Unlimited
    }
};

// Function to create subscription object based on plan type
export const createSubscription = (planType) => {
    const now = Date.now();
    const planDetails = SUBSCRIPTION_PLANS[planType];

    if (!planDetails) {
        throw new Error(`Invalid plan type: ${planType}`);
    }

    // Calculate end date based on plan duration
    let endDate = null;
    if (planType === PLAN_TYPES.FREE) {
        endDate = now + (planDetails.trialDays * 24 * 60 * 60 * 1000);
    } else if (planType === PLAN_TYPES.ADMIN) {
        endDate = null; // Admin plan never expires
    } else if (planDetails.durationDays) {
        endDate = now + (planDetails.durationDays * 24 * 60 * 60 * 1000);
    }

    return {
        plan: planType,
        startDate: now,
        endDate: endDate,
        status: planType === PLAN_TYPES.FREE ? 'trial' : 'active',
        features: planDetails.features,
        paymentId: null // This would be set during payment processing
    };
};

// Function to check if a subscription is active
export const isSubscriptionActive = (subscription) => {
    if (!subscription) return false;

    // Admin plan is always active
    if (subscription.plan === PLAN_TYPES.ADMIN) {
        return true;
    }

    // Check if subscription has expired
    const now = Date.now();
    return subscription.status === 'active' &&
        (subscription.endDate === null || subscription.endDate > now);
};

// Function to get plan-specific constraints
export const getPlanLimits = (user) => {
    // Default to free plan if no subscription exists
    if (!user || !user.subscription || !user.subscription.plan) {
        return SUBSCRIPTION_PLANS[PLAN_TYPES.FREE].features;
    }

    // If user is admin, use admin plan regardless of actual subscription
    if (user.role === 'admin') {
        return SUBSCRIPTION_PLANS[PLAN_TYPES.ADMIN].features;
    }

    // Return features based on the user's subscription plan
    const planType = user.subscription.plan;
    if (SUBSCRIPTION_PLANS[planType]) {
        return SUBSCRIPTION_PLANS[planType].features;
    }

    // Fallback to free plan if something goes wrong
    return SUBSCRIPTION_PLANS[PLAN_TYPES.FREE].features;
};