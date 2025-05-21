'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, CreditCard, Shield, AlertTriangle, Zap, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionPage() {
    const [selectedPlan, setSelectedPlan] = useState('half-yearly');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [userDetails, setUserDetails] = useState({
        name: '',
        email: '',
        plan: 'free'
    });

    // For form data
    const [formData, setFormData] = useState({
        cardName: '',
        cardNumber: '',
        expiry: '',
        cvv: ''
    });

    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, apiRequest } = useAuth();

    // Animation variants
    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 10
            }
        }
    };

    // Define subscription plans
    const plans = [
        {
            id: 'monthly',
            title: 'MONTHLY',
            price: '$10',
            period: 'per month',
            features: [
                '10 server monitoring',
                'Email & SMS alerts',
                'Custom monitoring schedules',
                '24/7 support'
            ],
            maxServers: 10,
            checkFrequency: '5 minutes',
            buttonLabel: 'Choose Monthly'
        },
        {
            id: 'half-yearly',
            title: 'HALF-YEARLY',
            price: '$55',
            period: 'per 6 months (save 8.3%)',
            features: [
                '15 server monitoring',
                '1-minute check frequency',
                'Advanced reporting',
                'Webhook integrations'
            ],
            maxServers: 15,
            checkFrequency: '1 minute',
            buttonLabel: 'Choose Half-Yearly',
            recommended: true
        },
        {
            id: 'yearly',
            title: 'YEARLY',
            price: '$105',
            period: 'per year (save 12.5%)',
            features: [
                '25 server monitoring',
                'All premium features',
                'API access',
                'Priority support'
            ],
            maxServers: 25,
            checkFrequency: '30 seconds',
            buttonLabel: 'Choose Yearly'
        }
    ];

    useEffect(() => {
        // Get plan from URL if available
        const planFromUrl = searchParams.get('plan');
        if (planFromUrl && plans.some(p => p.id === planFromUrl)) {
            setSelectedPlan(planFromUrl);
        }

        // Set user details if logged in
        if (user) {
            setUserDetails({
                name: user.displayName || '',
                email: user.email || '',
                plan: user.subscription?.plan || 'free'
            });
        }
    }, [searchParams, user]);

    // Handle plan selection
    const handlePlanSelect = (planId) => {
        setSelectedPlan(planId);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Format card number with spaces every 4 digits
        if (name === 'cardNumber') {
            const formattedValue = value
                .replace(/\s/g, '')
                .replace(/(\d{4})/g, '$1 ')
                .trim()
                .slice(0, 19);

            setFormData({ ...formData, [name]: formattedValue });
            return;
        }

        // Format expiry date as MM/YY
        if (name === 'expiry') {
            let formattedValue = value.replace(/\D/g, '');
            if (formattedValue.length > 2) {
                formattedValue = `${formattedValue.slice(0, 2)}/${formattedValue.slice(2, 4)}`;
            }

            setFormData({ ...formData, [name]: formattedValue });
            return;
        }

        // Format CVV to max 3 digits
        if (name === 'cvv') {
            const formattedValue = value.replace(/\D/g, '').slice(0, 3);
            setFormData({ ...formData, [name]: formattedValue });
            return;
        }

        setFormData({ ...formData, [name]: value });
    };

    // Get selected plan details
    const getSelectedPlanDetails = () => {
        return plans.find(p => p.id === selectedPlan);
    };

    // Handle subscription submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // In a real app, this would send payment details to a payment processor
            // For this example, we'll just simulate a successful payment

            // Wait for 1.5 seconds to simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Update user subscription - this would be a real API call in production
            const response = await apiRequest('/api/users/me', {
                method: 'PATCH',
                body: JSON.stringify({
                    subscription: {
                        plan: selectedPlan,
                        status: 'active',
                        startDate: new Date(),
                        endDate: null
                    }
                })
            });

            if (response.status !== 'success') {
                throw new Error(response.message || 'Failed to update subscription');
            }

            // Show success message
            setSuccess(true);

            // Redirect to servers page after 3 seconds
            setTimeout(() => {
                router.push('/servers');
            }, 3000);

        } catch (err) {
            console.error('Error processing subscription:', err);
            setError(err.message || 'Failed to process subscription. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-4xl text-white">
                <motion.div
                    className="bg-gray-800 rounded-xl shadow-xl p-8 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                        <CheckCircle size={40} className="text-green-500" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white mb-4">Subscription Upgraded Successfully!</h2>
                    <p className="text-gray-300 mb-6">
                        Your account has been upgraded to the {getSelectedPlanDetails().title} plan. You can now monitor
                        up to {getSelectedPlanDetails().maxServers} servers with check frequencies as low as {getSelectedPlanDetails().checkFrequency}.
                    </p>
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Link href="/servers">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
                                Return to Servers
                            </button>
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl text-white">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center">
                    <h1 className="text-2xl font-bold">Upgrade Subscription</h1>
                </div>
                <Link href="/servers" className="flex items-center text-blue-400 hover:text-blue-300">
                    <ArrowLeft size={16} className="mr-1" />
                    Back to Servers
                </Link>
            </div>

            {error && (
                <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-3 mb-4 flex items-start">
                    <AlertTriangle className="text-red-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-red-200 text-sm">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <motion.div
                        className="bg-gray-800 rounded-xl shadow-lg p-6 mb-6"
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                    >
                        <h2 className="text-xl font-semibold mb-6">Select Your Plan</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {plans.map((plan) => (
                                <div
                                    key={plan.id}
                                    className={`relative border rounded-xl p-5 cursor-pointer transition-all ${selectedPlan === plan.id
                                        ? 'border-blue-500 bg-blue-900/20'
                                        : 'border-gray-700 hover:border-gray-500'
                                        }`}
                                    onClick={() => handlePlanSelect(plan.id)}
                                >
                                    {plan.recommended && (
                                        <div className="absolute -top-3 right-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                                            BEST VALUE
                                        </div>
                                    )}
                                    <h3 className="text-lg font-bold text-white">{plan.title}</h3>
                                    <div className="flex items-baseline mt-2 mb-4">
                                        <span className="text-2xl font-bold text-white">{plan.price}</span>
                                        <span className="text-gray-400 ml-2 text-sm">{plan.period}</span>
                                    </div>
                                    <ul className="space-y-2 mb-4 text-sm">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start">
                                                <Check size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-300">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div
                                        className={`absolute top-4 right-4 rounded-full h-4 w-4 ${selectedPlan === plan.id ? 'bg-blue-500' : 'border border-gray-600'
                                            }`}
                                    />
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-gray-800 rounded-xl shadow-lg p-6 mb-6"
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.2 }}
                    >
                        <h2 className="text-xl font-semibold mb-4">Benefits Comparison</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-gray-700">
                                    <tr>
                                        <th className="px-2 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Feature</th>
                                        <th className="px-2 py-3 text-center text-sm font-medium text-gray-400 uppercase tracking-wider">Free</th>
                                        <th className="px-2 py-3 text-center text-sm font-medium text-gray-400 uppercase tracking-wider">Monthly</th>
                                        <th className="px-2 py-3 text-center text-sm font-medium text-gray-400 uppercase tracking-wider">Half-Yearly</th>
                                        <th className="px-2 py-3 text-center text-sm font-medium text-gray-400 uppercase tracking-wider">Yearly</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    <tr>
                                        <td className="px-2 py-3 text-sm text-gray-300">Server Limit</td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300">1</td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300">10</td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300">15</td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300">25</td>
                                    </tr>
                                    <tr>
                                        <td className="px-2 py-3 text-sm text-gray-300">Min Check Frequency</td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300">5 min</td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300">5 min</td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300">1 min</td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300">1 min</td>
                                    </tr>
                                    <tr>
                                        <td className="px-2 py-3 text-sm text-gray-300">Email Alerts</td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300"><Check size={16} className="text-green-500 mx-auto" /></td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300"><Check size={16} className="text-green-500 mx-auto" /></td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300"><Check size={16} className="text-green-500 mx-auto" /></td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300"><Check size={16} className="text-green-500 mx-auto" /></td>
                                    </tr>
                                    <tr>
                                        <td className="px-2 py-3 text-sm text-gray-300">Advanced Reporting</td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300"><AlertTriangle size={16} className="text-red-500 mx-auto" /></td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300"><AlertTriangle size={16} className="text-red-500 mx-auto" /></td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300"><Check size={16} className="text-green-500 mx-auto" /></td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300"><Check size={16} className="text-green-500 mx-auto" /></td>
                                    </tr>
                                    <tr>
                                        <td className="px-2 py-3 text-sm text-gray-300">Support Response</td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300">48 hours</td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300">24 hours</td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300">12 hours</td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300">4 hours</td>
                                    </tr>
                                    <tr>
                                        <td className="px-2 py-3 text-sm text-gray-300">Custom Schedules</td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300"><Check size={16} className="text-green-500 mx-auto" /></td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300"><Check size={16} className="text-green-500 mx-auto" /></td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300"><Check size={16} className="text-green-500 mx-auto" /></td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300"><Check size={16} className="text-green-500 mx-auto" /></td>
                                    </tr>
                                    <tr>
                                        <td className="px-2 py-3 text-sm text-gray-300">Service Period</td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300">2-day trial</td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300">30 days</td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300">180 days</td>
                                        <td className="px-2 py-3 text-center text-sm text-gray-300">365 days</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>

                <div className="lg:col-span-1">
                    <motion.div
                        className="bg-gray-800 rounded-xl shadow-lg p-6 sticky top-8"
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.3 }}
                    >
                        <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-4">Payment Details</h2>
                        <div className="mb-4">
                            <h3 className="text-lg font-medium text-white">{getSelectedPlanDetails().title}</h3>
                            <div className="flex justify-between items-baseline mt-1">
                                <span className="text-2xl font-bold text-white">{getSelectedPlanDetails().price}</span>
                                <span className="text-gray-400">{getSelectedPlanDetails().period}</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="cardName" className="block text-sm font-medium text-gray-400 mb-1">
                                        Name on Card
                                    </label>
                                    <input
                                        type="text"
                                        id="cardName"
                                        name="cardName"
                                        value={formData.cardName}
                                        onChange={handleInputChange}
                                        placeholder="John Doe"
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-400 mb-1">
                                        Card Number
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="cardNumber"
                                            name="cardNumber"
                                            value={formData.cardNumber}
                                            onChange={handleInputChange}
                                            placeholder="1234 5678 9012 3456"
                                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-blue-500 focus:border-blue-500 pl-10"
                                            maxLength={19}
                                            required
                                        />
                                        <CreditCard size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="expiry" className="block text-sm font-medium text-gray-400 mb-1">
                                            Expiry Date
                                        </label>
                                        <input
                                            type="text"
                                            id="expiry"
                                            name="expiry"
                                            value={formData.expiry}
                                            onChange={handleInputChange}
                                            placeholder="MM/YY"
                                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-blue-500 focus:border-blue-500"
                                            maxLength={5}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="cvv" className="block text-sm font-medium text-gray-400 mb-1">
                                            CVV
                                        </label>
                                        <input
                                            type="text"
                                            id="cvv"
                                            name="cvv"
                                            value={formData.cvv}
                                            onChange={handleInputChange}
                                            placeholder="123"
                                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-blue-500 focus:border-blue-500"
                                            maxLength={3}
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full ${loading ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} 
                                    text-white py-3 rounded-lg font-medium flex items-center justify-center mt-4`}
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Zap size={18} className="mr-2" />
                                            Upgrade Now
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-6 flex items-center justify-center space-x-2 text-center">
                            <Shield size={16} className="text-gray-400" />
                            <p className="text-gray-400 text-xs">Secure payment processing. No credit card info will be stored.</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}