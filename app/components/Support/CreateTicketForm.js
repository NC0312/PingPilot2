// app/components/Support/CreateTicketForm.js
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import {
    AlertTriangle,
    Check,
    MessageSquare,
    ArrowLeft,
    Settings,
    CreditCard,
    HelpCircle,
    RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';

const categoryIcons = {
    technical: <Settings className="h-5 w-5 text-blue-400" />,
    billing: <CreditCard className="h-5 w-5 text-green-400" />,
    feature_request: <MessageSquare className="h-5 w-5 text-purple-400" />,
    general: <HelpCircle className="h-5 w-5 text-amber-400" />
};

const categoryLabels = {
    technical: 'Technical Support',
    billing: 'Billing & Account',
    feature_request: 'Feature Request',
    general: 'General Question'
};

const CreateTicketForm = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const { apiRequest } = useAuth();

    const {
        register,
        handleSubmit: hookFormSubmit,
        formState: { errors },
        watch
    } = useForm({
        defaultValues: {
            subject: '',
            description: '',
            category: 'technical'
        }
    });

    const selectedCategory = watch('category');

    const onSubmit = async (data) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiRequest('/api/support/tickets', {
                method: 'POST',
                body: JSON.stringify(data)
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

    const formVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 100 }
        }
    };

    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 shadow-xl border border-gray-700">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center">
                    <MessageSquare className="text-blue-400 mr-3" />
                    Create Support Ticket
                </h2>
                <Link href="/support/tickets">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center text-gray-300 hover:text-blue-400 transition-colors px-4 py-2 rounded-lg border border-gray-600 hover:border-blue-500"
                    >
                        <ArrowLeft size={18} className="mr-2" />
                        Back to Tickets
                    </motion.button>
                </Link>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-900/40 border border-red-600/50 rounded-lg p-4 mb-6 flex items-start shadow-lg"
                >
                    <AlertTriangle className="text-red-400 mr-3 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-red-100 text-sm">{error}</p>
                </motion.div>
            )}

            {success ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-600/50 rounded-lg p-8 text-center shadow-lg"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                        className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4"
                    >
                        <Check size={32} className="text-green-400" />
                    </motion.div>
                    <h3 className="text-xl font-medium text-white mb-3">Ticket Created Successfully!</h3>
                    <p className="text-green-100 mb-6 opacity-90">
                        Your support ticket has been submitted. We'll respond as soon as possible.
                    </p>
                    <p className="text-sm text-green-200/70">
                        Redirecting you to your tickets...
                    </p>
                </motion.div>
            ) : (
                <motion.form
                    initial="hidden"
                    animate="visible"
                    variants={formVariants}
                    onSubmit={hookFormSubmit(onSubmit)}
                    className="space-y-6"
                >
                    <motion.div variants={itemVariants}>
                        <label className="block mb-2 text-sm font-medium text-gray-200">
                            Category
                        </label>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {Object.keys(categoryLabels).map((cat) => (
                                <label
                                    key={cat}
                                    className={`
                    flex flex-col items-center justify-center p-4 rounded-lg border transition-all cursor-pointer
                    ${selectedCategory === cat
                                            ? 'bg-gray-700/60 border-blue-500 shadow-md shadow-blue-500/10'
                                            : 'bg-gray-800 border-gray-600 hover:border-gray-500'
                                        }
                  `}
                                >
                                    <input
                                        type="radio"
                                        value={cat}
                                        {...register("category")}
                                        className="sr-only"
                                    />
                                    <div className="mb-2">
                                        {categoryIcons[cat]}
                                    </div>
                                    <span className="text-sm text-center text-gray-200">{categoryLabels[cat]}</span>
                                </label>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <label htmlFor="subject" className="block mb-2 text-sm font-medium text-gray-200">
                            Subject
                        </label>
                        <div className="relative">
                            <input
                                id="subject"
                                {...register("subject", {
                                    required: "Subject is required",
                                    minLength: { value: 5, message: "Subject must be at least 5 characters" },
                                    maxLength: { value: 100, message: "Subject cannot exceed 100 characters" }
                                })}
                                className={`
                  bg-gray-800 border text-white text-sm rounded-lg block w-full p-3 pl-4
                  focus:ring-2 focus:outline-none transition-all duration-200
                  ${errors.subject
                                        ? 'border-red-500 focus:ring-red-500/50'
                                        : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500/50'
                                    }
                `}
                                placeholder="Brief summary of your issue"
                            />
                        </div>
                        {errors.subject && (
                            <p className="mt-2 text-sm text-red-400">{errors.subject.message}</p>
                        )}
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-200">
                            Description
                        </label>
                        <textarea
                            id="description"
                            {...register("description", {
                                required: "Description is required",
                                minLength: { value: 20, message: "Description must be at least 20 characters" }
                            })}
                            rows={6}
                            className={`
                bg-gray-800 border text-white text-sm rounded-lg block w-full p-3
                focus:ring-2 focus:outline-none transition-all duration-200
                ${errors.description
                                    ? 'border-red-500 focus:ring-red-500/50'
                                    : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500/50'
                                }
              `}
                            placeholder="Please provide as much detail as possible..."
                        ></textarea>
                        {errors.description && (
                            <p className="mt-2 text-sm text-red-400">{errors.description.message}</p>
                        )}
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className="flex justify-end pt-2"
                    >
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className={`
                ${loading ? 'bg-blue-700' : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600'} 
                text-white font-medium rounded-lg text-sm px-6 py-3 transition-all duration-200 shadow-lg shadow-blue-500/20
                flex items-center
              `}
                        >
                            {loading ? (
                                <>
                                    <RefreshCw size={18} className="mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <MessageSquare size={18} className="mr-2" />
                                    Submit Ticket
                                </>
                            )}
                        </motion.button>
                    </motion.div>
                </motion.form>
            )}
        </div>
    );
};

export default CreateTicketForm;