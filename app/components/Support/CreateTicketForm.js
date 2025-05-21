// app/components/Support/CreateTicketForm.js
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import {
    AlertTriangle, Check, MessageSquare, ArrowLeft,
    Settings, CreditCard, HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const CreateTicketForm = () => {
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        category: 'technical',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const router = useRouter();
    const { apiRequest } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await apiRequest('/api/support/tickets', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (response.status === 'success') {
                setSuccess(true);
                // Redirect after a short delay
                setTimeout(() => {
                    router.push('/support/tickets');
                }, 2000);
            } else {
                throw new Error(response.message || 'Failed to create ticket');
            }
        } catch (err) {
            console.error('Error creating ticket:', err);
            setError(err.message || 'Failed to create support ticket');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Create Support Ticket</h2>
                <Link href="/support/tickets">
                    <button className="flex items-center text-blue-400 hover:text-blue-300">
                        <ArrowLeft size={16} className="mr-1" />
                        Back to Tickets
                    </button>
                </Link>
            </div>

            {error && (
                <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-3 mb-4 flex items-start">
                    <AlertTriangle className="text-red-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-red-200 text-sm">{error}</p>
                </div>
            )}

            {success ? (
                <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-6 text-center">
                    <Check size={48} className="mx-auto text-green-500 mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">Ticket Created Successfully!</h3>
                    <p className="text-green-200 mb-4">
                        Your support ticket has been submitted. We'll respond as soon as possible.
                        Redirecting you to your tickets...
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="category" className="block mb-2 text-sm font-medium text-gray-300">
                            Category
                        </label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                            required
                        >
                            <option value="technical">Technical Support</option>
                            <option value="billing">Billing & Account</option>
                            <option value="feature_request">Feature Request</option>
                            <option value="general">General Question</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="subject" className="block mb-2 text-sm font-medium text-gray-300">
                            Subject
                        </label>
                        <input
                            type="text"
                            id="subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                            placeholder="Brief summary of your issue"
                            required
                            minLength={5}
                            maxLength={100}
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-300">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={6}
                            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                            placeholder="Please provide as much detail as possible..."
                            required
                            minLength={20}
                        ></textarea>
                    </div>

                    <div className="flex justify-end">
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`${loading ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium rounded-lg text-sm px-5 py-2.5 transition-colors flex items-center`}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <MessageSquare size={16} className="mr-2" />
                                    Submit Ticket
                                </>
                            )}
                        </motion.button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default CreateTicketForm;