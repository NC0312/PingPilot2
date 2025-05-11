// app/subscribe/page.js
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Check, Shield, Server, Clock, Zap, AlertCircle } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

const SubscribePage = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loading, setLoading] = useState(false);

    // Mock function for handling subscription
    // In a real application, this would connect to a payment processor like Stripe
    const handleSubscribe = async () => {
        if (!selectedPlan) return;

        setLoading(true);

        try {
            // This would be a call to your payment API in a real app
            await new Promise(resolve => setTimeout(resolve, 1500));

            // After successful payment, redirect to dashboard
            router.push('/');
        } catch (error) {
            console.error('Subscription error:', error);
            setLoading(false);
        }
    };

    const plans = [
        {
            id: 'monthly',
            name: 'Monthly',
            price: '$10',
            period: 'month',
            features: [
                'Unlimited monitoring duration',
                'Up to 5 servers',
                '5-minute check frequency',
                'Email alerts',
                'Basic dashboard'
            ],
            recommended: false
        },
        {
            id: 'half-yearly',
            name: 'Half-Yearly',
            price: '$45',
            period: '6 months',
            features: [
                'Unlimited monitoring duration',
                'Up to 15 servers',
                '1-minute check frequency',
                'Priority email alerts',
                'Multiple alert recipients',
                'Advanced dashboard'
            ],
            recommended: true
        },
        {
            id: 'yearly',
            name: 'Yearly',
            price: '$85',
            period: 'year',
            features: [
                'Unlimited monitoring duration',
                'Up to 50 servers',
                'Custom check frequency',
                'Advanced alert options',
                'Multiple alert recipients',
                'Custom integration options',
                'Premium support'
            ],
            recommended: false
        }
    ];

    return (
        <div className="min-h-screen bg-[#031D27] text-white pt-20 md:pl-64">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
                <p className="text-gray-400 mb-8">Select the monitoring plan that works best for your needs.</p>

                {/* Free Trial Info */}
                <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-4 mb-8">
                    <div className="flex items-start">
                        <AlertCircle className="text-blue-400 mt-1 mr-3 flex-shrink-0" size={20} />
                        <div>
                            <h3 className="font-medium text-blue-100 mb-1">Free Trial</h3>
                            <p className="text-blue-200 text-sm">
                                Each server includes a 2-day free trial. After that, you'll need to subscribe to continue monitoring.
                            </p>
                        </div>
                    </div>
                    // app/subscribe/page.js (continued)
                </div>

                {/* Subscription Plans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`bg-gray-800 rounded-lg p-6 border-2 transition-all ${selectedPlan === plan.id
                                ? 'border-blue-500 transform scale-[1.02]'
                                : 'border-transparent hover:border-gray-700'
                                } ${plan.recommended ? 'relative' : ''}`}
                        >
                            {plan.recommended && (
                                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                                    Recommended
                                </div>
                            )}

                            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                            <div className="flex items-baseline mb-4">
                                <span className="text-3xl font-bold">{plan.price}</span>
                                <span className="text-gray-400 ml-1">/{plan.period}</span>
                            </div>

                            <ul className="space-y-3 mb-6">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start">
                                        <Check className="text-green-500 mr-2 flex-shrink-0 mt-1" size={16} />
                                        <span className="text-gray-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => setSelectedPlan(plan.id)}
                                className={`w-full py-3 rounded-lg font-medium transition-colors ${selectedPlan === plan.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-white hover:bg-gray-600'
                                    }`}
                            >
                                {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Checkout Button */}
                <div className="flex justify-center">
                    <button
                        onClick={handleSubscribe}
                        disabled={!selectedPlan || loading}
                        className={`${selectedPlan
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-gray-700 cursor-not-allowed'
                            } text-white font-medium px-8 py-3 rounded-lg flex items-center transition-colors`}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            <>
                                <CreditCard className="mr-2" size={18} />
                                {selectedPlan ? 'Subscribe Now' : 'Select a Plan'}
                            </>
                        )}
                    </button>
                </div>

                {/* Features Comparison */}
                <div className="mt-16">
                    <h2 className="text-2xl font-bold mb-6">Why Choose Ping Pilot?</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-gray-800 rounded-lg p-6">
                            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                                <Server className="text-blue-400" size={24} />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Multiple Server Monitoring</h3>
                            <p className="text-gray-400">
                                Keep track of all your websites and servers from a single dashboard. Get comprehensive insights into their performance.
                            </p>
                        </div>

                        <div className="bg-gray-800 rounded-lg p-6">
                            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4">
                                <Clock className="text-green-400" size={24} />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Custom Check Frequencies</h3>
                            <p className="text-gray-400">
                                Set how often we check your servers, from 1 minute to hourly intervals, based on your specific needs.
                            </p>
                        </div>

                        <div className="bg-gray-800 rounded-lg p-6">
                            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                                <Shield className="text-purple-400" size={24} />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Instant Notifications</h3>
                            <p className="text-gray-400">
                                Receive immediate alerts when your servers go down or experience issues, so you can address problems before users notice.
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-16">
                    <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>

                    <div className="space-y-4">
                        <div className="bg-gray-800 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-2">How does the trial work?</h3>
                            <p className="text-gray-400">
                                Each server you add comes with a 2-day free trial. After that, you'll need to subscribe to one of our plans to continue monitoring.
                            </p>
                        </div>

                        <div className="bg-gray-800 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-2">Can I change my plan later?</h3>
                            <p className="text-gray-400">
                                Yes, you can upgrade or downgrade your plan at any time. If you upgrade, we'll prorate the difference. If you downgrade, we'll apply a credit to your account.
                            </p>
                        </div>

                        <div className="bg-gray-800 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-2">How do refunds work?</h3>
                            <p className="text-gray-400">
                                We offer a 14-day money-back guarantee for all subscription plans. If you're not satisfied, contact our support team for a full refund.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscribePage;