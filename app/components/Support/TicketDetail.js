// app/components/Support/TicketDetail.js
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import {
    MessageSquare,
    ArrowLeft,
    Clock,
    Send,
    CheckCircle,
    XCircle,
    AlertTriangle,
    User,
    RefreshCw,
    Settings,
    CreditCard,
    HelpCircle,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const TicketDetail = () => {
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newResponse, setNewResponse] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);

    const router = useRouter();
    const params = useParams();
    const ticketId = params.id;
    const { user, apiRequest, isAdmin } = useAuth();

    // Get ticket data
    const fetchTicket = async () => {
        try {
            setLoading(true);
            setRefreshing(true);

            const response = await apiRequest(`/api/support/tickets/${ticketId}`, {
                method: 'GET'
            });

            if (response.status === 'success') {
                setTicket(response.data.ticket);
            } else {
                throw new Error(response.message || 'Failed to load ticket');
            }
        } catch (err) {
            console.error('Error fetching ticket:', err);
            setError('Failed to load support ticket. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (ticketId) {
            fetchTicket();
        }
    }, [ticketId]);

    // Submit new response
    const handleSubmitResponse = async (e) => {
        e.preventDefault();

        if (!newResponse.trim()) return;

        try {
            setSubmitting(true);

            const response = await apiRequest(`/api/support/tickets/${ticketId}/responses`, {
                method: 'POST',
                body: JSON.stringify({ message: newResponse })
            });

            if (response.status === 'success') {
                setTicket(response.data.ticket);
                setNewResponse('');
            } else {
                throw new Error(response.message || 'Failed to submit response');
            }
        } catch (err) {
            console.error('Error submitting response:', err);
            setError('Failed to submit response. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Update ticket status (admin only)
    const handleStatusUpdate = async (newStatus) => {
        try {
            const response = await apiRequest(`/api/support/tickets/${ticketId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });

            if (response.status === 'success') {
                setTicket(response.data.ticket);
                setStatusUpdateOpen(false);
            } else {
                throw new Error(response.message || 'Failed to update status');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            setError('Failed to update ticket status. Please try again.');
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'technical':
                return <Settings size={16} className="text-blue-400" />;
            case 'billing':
                return <CreditCard size={16} className="text-green-400" />;
            case 'feature_request':
                return <HelpCircle size={16} className="text-purple-400" />;
            default:
                return <MessageSquare size={16} className="text-gray-400" />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'open':
                return (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-900/50 text-blue-300 border border-blue-600/30">
                        Open
                    </span>
                );
            case 'in_progress':
                return (
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-900/50 text-yellow-300 border border-yellow-600/30">
                        In Progress
                    </span>
                );
            case 'resolved':
                return (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-900/50 text-green-300 border border-green-600/30">
                        Resolved
                    </span>
                );
            case 'closed':
                return (
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-900/50 text-gray-300 border border-gray-600/30">
                        Closed
                    </span>
                );
            default:
                return null;
        }
    };

    // Format date to readable format
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                damping: 15
            }
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                    <Link href="/support/tickets">
                        <button className="text-blue-400 hover:text-blue-300 mr-3">
                            <ArrowLeft size={18} />
                        </button>
                    </Link>
                    <h2 className="text-xl font-semibold text-white">Support Ticket</h2>
                </div>
                <button
                    onClick={fetchTicket}
                    className="p-2 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600"
                    disabled={refreshing}
                >
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            {loading && !refreshing ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : error ? (
                <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4 text-center">
                    <AlertCircle size={24} className="mx-auto text-red-400 mb-2" />
                    <p className="text-red-200">{error}</p>
                    <button
                        onClick={fetchTicket}
                        className="mt-4 px-4 py-2 bg-red-600/50 hover:bg-red-700 text-white rounded-lg"
                    >
                        Try Again
                    </button>
                </div>
            ) : ticket ? (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    {/* Ticket Header */}
                    <motion.div
                        className="bg-gray-700 rounded-lg p-4 mb-6"
                        variants={itemVariants}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-start">
                                <div className="p-2 bg-gray-600 rounded-lg mr-3">
                                    {getCategoryIcon(ticket.category)}
                                </div>
                                <div>
                                    <h3 className="font-medium text-white text-lg">{ticket.subject}</h3>
                                    <div className="flex items-center mt-1 text-sm text-gray-400">
                                        <span className="capitalize mr-2">{ticket.category.replace('_', ' ')}</span>
                                        <span className="mx-2">•</span>
                                        <Clock size={12} className="mr-1" />
                                        {formatDate(ticket.createdAt)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                {getStatusBadge(ticket.status)}

                                {isAdmin() && (
                                    <div className="relative mt-2">
                                        <button
                                            onClick={() => setStatusUpdateOpen(!statusUpdateOpen)}
                                            className="text-sm text-blue-400 hover:text-blue-300"
                                        >
                                            Update Status
                                        </button>

                                        {statusUpdateOpen && (
                                            <div className="absolute right-0 top-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg p-2 z-10">
                                                <button
                                                    onClick={() => handleStatusUpdate('open')}
                                                    className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-600 rounded"
                                                >
                                                    Open
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate('in_progress')}
                                                    className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-600 rounded"
                                                >
                                                    In Progress
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate('resolved')}
                                                    className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-600 rounded"
                                                >
                                                    Resolved
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate('closed')}
                                                    className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-600 rounded"
                                                >
                                                    Closed
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-3 bg-gray-800 rounded-lg text-gray-300 whitespace-pre-wrap">
                            {ticket.description}
                        </div>
                    </motion.div>

                    {/* Conversation Thread */}
                    <motion.div
                        className="mb-6"
                        variants={itemVariants}
                    >
                        <h3 className="text-lg font-medium text-white mb-4">Conversation</h3>

                        {ticket.responses && ticket.responses.length > 0 ? (
                            <div className="space-y-4">
                                {ticket.responses.map((response, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * index }}
                                        className={`flex ${response.fromAdmin ? 'justify-start' : 'justify-end'}`}
                                    >
                                        <div className={`rounded-lg p-3 max-w-[80%] ${response.fromAdmin
                                                ? 'bg-gray-700 text-white border-l-4 border-blue-500'
                                                : 'bg-blue-600/20 text-blue-100 border-r-4 border-blue-600'
                                            }`}>
                                            <div className="flex items-center mb-1">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${response.fromAdmin ? 'bg-blue-600/50' : 'bg-gray-600'
                                                    }`}>
                                                    {response.fromAdmin ? (
                                                        <Settings size={12} className="text-white" />
                                                    ) : (
                                                        <User size={12} className="text-white" />
                                                    )}
                                                </div>
                                                <span className="text-xs font-medium">
                                                    {response.fromAdmin ? 'Support Team' : 'You'}
                                                </span>
                                                <span className="mx-2 text-xs">•</span>
                                                <span className="text-xs text-gray-400">
                                                    {formatDate(response.createdAt)}
                                                </span>
                                            </div>
                                            <p className="whitespace-pre-wrap text-sm">{response.message}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-6 bg-gray-700/50 rounded-lg">
                                <MessageSquare size={24} className="mx-auto text-gray-500 mb-2" />
                                <p className="text-gray-400">No responses yet</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Reply Form */}
                    {ticket.status !== 'closed' && (
                        <motion.form
                            onSubmit={handleSubmitResponse}
                            className="mt-6"
                            variants={itemVariants}
                        >
                            <label htmlFor="response" className="block text-sm font-medium text-gray-300 mb-2">
                                Add a Response
                            </label>
                            <div className="relative">
                                <textarea
                                    id="response"
                                    value={newResponse}
                                    onChange={(e) => setNewResponse(e.target.value)}
                                    rows={4}
                                    placeholder="Type your response here..."
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                                    disabled={submitting}
                                    required
                                ></textarea>
                                <button
                                    type="submit"
                                    disabled={submitting || !newResponse.trim()}
                                    className={`absolute bottom-3 right-3 p-2 rounded-lg ${submitting || !newResponse.trim()
                                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                >
                                    {submitting ? (
                                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    ) : (
                                        <Send size={18} />
                                    )}
                                </button>
                            </div>
                        </motion.form>
                    )}

                    {/* Closed Ticket Notice */}
                    {ticket.status === 'closed' && (
                        <motion.div
                            className="mt-6 bg-gray-700 rounded-lg p-4 text-center"
                            variants={itemVariants}
                        >
                            <XCircle size={24} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-gray-300">This ticket is closed and no longer accepting responses</p>
                            <Link href="/support/new">
                                <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                                    Create New Ticket
                                </button>
                            </Link>
                        </motion.div>
                    )}
                </motion.div>
            ) : (
                <div className="text-center p-8">
                    <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">Ticket Not Found</h3>
                    <p className="text-gray-400 mb-6">
                        The ticket you're looking for doesn't exist or you don't have permission to view it.
                    </p>
                    <Link href="/support/tickets">
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                            Back to Tickets
                        </button>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default TicketDetail;