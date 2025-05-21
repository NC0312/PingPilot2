import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, Server, Shield, Clock } from 'lucide-react';
import Link from 'next/link';

const SubscriptionPopup = ({ isOpen, onClose, currentPlan = 'free', serverCount = 0, maxServers = 1 }) => {
    // Define subscription plans for the popup
    const plans = [
        {
            id: 'monthly',
            title: 'MONTHLY',
            price: '$10',
            period: 'per month',
            features: [
                '10 server monitoring',
                'Email alerts',
                'Custom monitoring schedules',
                '24-hour support response'
            ],
            recommended: false,
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
                '12-hour support response'
            ],
            recommended: true,
            buttonLabel: 'Choose Half-Yearly'
        },
        {
            id: 'yearly',
            title: 'YEARLY',
            price: '$105',
            period: 'per year (save 12.5%)',
            features: [
                '25 server monitoring',
                'Priority support (4-hour response)',
                'Historical data analysis',
                'Expert technical assistance'
            ],
            recommended: false,
            buttonLabel: 'Choose Yearly'
        }
    ];

    // Get the current selected plan (default to half-yearly as "recommended")
    const [selectedPlan, setSelectedPlan] = useState('half-yearly');

    // Handle plan selection
    const handleSelectPlan = (planId) => {
        setSelectedPlan(planId);
    };

    // If popup is not open, don't render anything
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="relative w-full max-w-4xl bg-gray-800 rounded-xl shadow-2xl overflow-hidden"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25 }}
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors z-10"
                        aria-label="Close popup"
                    >
                        <X size={24} />
                    </button>

                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white">
                        <h2 className="text-2xl font-bold mb-2">Upgrade Your Plan</h2>
                        <p className="text-blue-100 max-w-2xl">
                            You're currently using {serverCount} of {maxServers} server slots on your {currentPlan.toUpperCase()} plan.
                            Upgrade now to monitor more servers and unlock premium features.
                        </p>
                    </div>

                    {/* Plan selection */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                        {plans.map((plan) => (
                            <motion.div
                                key={plan.id}
                                className={`border rounded-xl p-5 cursor-pointer transition-all ${selectedPlan === plan.id
                                    ? 'border-blue-500 bg-blue-900/20'
                                    : 'border-gray-700 hover:border-gray-500'
                                    }`}
                                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                onClick={() => handleSelectPlan(plan.id)}
                            >
                                {plan.recommended && (
                                    <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full inline-block mb-2">
                                        RECOMMENDED
                                    </div>
                                )}
                                <h3 className="text-xl font-bold text-white">{plan.title}</h3>
                                <div className="flex items-baseline mt-2 mb-4">
                                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                                    <span className="text-gray-400 ml-2">{plan.period}</span>
                                </div>
                                <ul className="space-y-3 mb-6">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start">
                                            <Check size={16} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                                            <span className="text-gray-300">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div
                                    className={`rounded-full h-5 w-5 border absolute top-4 right-4 flex items-center justify-center ${selectedPlan === plan.id ? 'border-blue-500 bg-blue-500' : 'border-gray-600'
                                        }`}
                                >
                                    {selectedPlan === plan.id && <Check size={12} className="text-white" />}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Feature comparison */}
                    <div className="px-6 pb-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Why Upgrade?</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-700 p-4 rounded-lg">
                                <div className="flex items-center mb-2">
                                    <Server className="text-blue-400 mr-2" size={20} />
                                    <span className="text-white font-medium">More Servers</span>
                                </div>
                                <p className="text-gray-300 text-sm">Monitor up to 25 servers simultaneously with our premium plans</p>
                            </div>
                            <div className="bg-gray-700 p-4 rounded-lg">
                                <div className="flex items-center mb-2">
                                    <Clock className="text-blue-400 mr-2" size={20} />
                                    <span className="text-white font-medium">Faster Checks</span>
                                </div>
                                <p className="text-gray-300 text-sm">Check your servers as frequently as every minute for quicker issue detection</p>
                            </div>
                            <div className="bg-gray-700 p-4 rounded-lg">
                                <div className="flex items-center mb-2">
                                    <Shield className="text-blue-400 mr-2" size={20} />
                                    <span className="text-white font-medium">Advanced Alerts</span>
                                </div>
                                <p className="text-gray-300 text-sm">Get SMS notifications and set up custom alert conditions</p>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="border-t border-gray-700 p-6 flex flex-col sm:flex-row justify-between items-center bg-gray-900">
                        <p className="text-gray-400 text-sm mb-4 sm:mb-0">No credit card required. Upgrade or downgrade anytime.</p>
                        <div className="flex space-x-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                            >
                                Keep Free Plan
                            </button>
                            <Link
                                href="/subscription?plan=${selectedPlan}"
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center"
                            >
                                <Zap size={16} className="mr-2" />
                                Upgrade Now
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SubscriptionPopup;