// app/admin/support/tickets/[id]/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import {
    MessageSquare, ArrowLeft, Clock, Send, CheckCircle, XCircle,
    AlertTriangle, User, RefreshCw, Settings, CreditCard,
    HelpCircle, AlertCircle, Tag, Mail, UserCheck, Shield
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AdminTicketDetail() {
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newResponse, setNewResponse] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loadingUserData, setLoadingUserData] = useState(false);

    const router = useRouter();
    const params = useParams();
    const ticketId = params.id;
    const { user, apiRequest, isAdmin } = useAuth();

    // Verify admin status on component mount
    useEffect(() => {
        if (!isAdmin()) {
            router.push('/dashboard');
        }
    }, []);

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
                // Fetch user data once we have the ticket
                fetchUserData(response.data.ticket.userId);
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

    // Fetch user data for additional context
    const fetchUserData = async (userId) => {
        try {
            setLoadingUserData(true);
            const response = await apiRequest(`/api/users/${userId}`, {
                method: 'GET'
            });

            if (response.status === 'success') {
                setUserData(response.data.user);
            }
        } catch (err) {
            console.error('Error fetching user data:', err);
            // Non-critical error, so don't show to user
        } finally {
            setLoadingUserData(false);
        }
    };

    useEffect(() => {
        if (ticketId) {
            fetchTicket();
        }
    }, [ticketId]);

    // Submit admin response
    const handleSubmitResponse = async (e) => {
        e.preventDefault();

        if (!newResponse.trim()) return;

        try {
            setSubmitting(true);

            // Use the response endpoint matching the backend route
            const response = await apiRequest(`/api/support/tickets/${ticketId}/responses`, {
                method: 'POST',
                body: JSON.stringify({ message: newResponse })
            });

            if (response.status === 'success') {
                setTicket(response.data.ticket);
                setNewResponse('');

                // If the ticket was previously open, automatically set it to in-progress
                if (ticket.status === 'open') {
                    await handleStatusUpdate('in_progress');
                }
            } else {
                throw new Error(response.message || 'Failed to submit response');
            }
        } catch (err) {
            console.error('Error submitting response:', err);
            alert('Failed to submit response. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Update ticket status
    const handleStatusUpdate = async (newStatus) => {
        try {
            // Use the admin-specific status update endpoint
            const response = await apiRequest(`/api/support/admin/tickets/${ticketId}/status`, {
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
            alert('Failed to update ticket status. Please try again.');
        }
    };

    // Helper functions
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

    const getPriorityBadge = (priority) => {
        switch (priority) {
            case 'high':
                return (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-900/50 text-red-300 border border-red-600/30">
                        High Priority
                    </span>
                );
            case 'medium':
                return (
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-900/50 text-yellow-300 border border-yellow-600/30">
                        Medium Priority
                    </span>
                );
            case 'low':
                return (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-900/50 text-blue-300 border border-blue-600/30">
                        Low Priority
                    </span>
                );
            default:
                return null;
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

    // Get plan badge
    const getPlanBadge = (plan) => {
        switch (plan) {
            case 'free':
                return (
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300">
                        Free
                    </span>
                );
            case 'monthly':
                return (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-900/50 text-blue-300 border border-blue-600/30">
                        Monthly
                    </span>
                );
            case 'halfYearly':
                return (
                    <span className="px-2 py-1 text-xs rounded-full bg-indigo-900/50 text-indigo-300 border border-indigo-600/30">
                        Half-Yearly
                    </span>
                );
            case 'yearly':
                return (
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-900/50 text-purple-300 border border-purple-600/30">
                        Yearly
                    </span>
                );
            case 'admin':
                return (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-900/50 text-red-300 border border-red-600/30">
                        Admin
                    </span>
                );
            default:
                return null;
        }
    };

    // Format date to readable format
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                    <Link href="/admin/support">
                        <button className="text-blue-400 hover:text-blue-300 mr-3">
                            <ArrowLeft size={20} />
                        </button>
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Ticket Details</h1>
                </div>
                <button
                    onClick={fetchTicket}
                    className="p-2 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600"
                    disabled={refreshing}
                >
                    <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
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
                <div className="space-y-6">
                    {/* Ticket Header */}
                    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                        <div className="flex flex-col md:flex-row justify-between mb-4">
                            <div className="flex-1 mb-4 md:mb-0">
                                <h2 className="text-xl font-bold text-white mb-2">{ticket.subject}</h2>
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    {getStatusBadge(ticket.status)}
                                    {getPriorityBadge(ticket.priority)}
                                    {getPlanBadge(ticket.userPlan)}
                                    <span className="flex items-center text-sm text-gray-400">
                                        <Clock size={14} className="mr-1" />
                                        {formatDate(ticket.createdAt)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <div className="flex items-center">
                                        {getCategoryIcon(ticket.category)}
                                        <span className="ml-1 capitalize">{ticket.category.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col md:items-end">
                                <div className="relative mb-2">
                                    <button
                                        onClick={() => setStatusUpdateOpen(!statusUpdateOpen)}
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center"
                                    >
                                        Update Status
                                    </button>

                                    {statusUpdateOpen && (
                                        <div className="absolute right-0 top-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg p-2 z-10 w-40">
                                            <button
                                                onClick={() => handleStatusUpdate('open')}
                                                className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-600 rounded"
                                            >
                                                Set as Open
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
                                                Mark Resolved
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate('closed')}
                                                className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-600 rounded"
                                            >
                                                Close Ticket
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-700 rounded-lg p-4 text-gray-300 whitespace-pre-wrap">
                            {ticket.description}
                        </div>
                    </div>

                    {/* User Information */}
                    {userData && (
                        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                                <UserCheck size={18} className="mr-2 text-blue-400" />
                                User Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-700 rounded-lg p-3">
                                    <div className="text-sm text-gray-400">Name</div>
                                    <div className="text-white">
                                        {userData.displayName || 'Not provided'}
                                    </div>
                                </div>
                                <div className="bg-gray-700 rounded-lg p-3">
                                    <div className="text-sm text-gray-400">Email</div>
                                    <div className="text-white flex items-center">
                                        <Mail size={14} className="mr-1 text-gray-400" />
                                        {userData.email}
                                    </div>
                                </div>
                                <div className="bg-gray-700 rounded-lg p-3">
                                    <div className="text-sm text-gray-400">Account Type</div>
                                    <div className="text-white flex items-center">
                                        <Tag size={14} className="mr-1 text-gray-400" />
                                        {userData.subscription?.plan || 'Free'}
                                    </div>
                                </div>
                                <div className="bg-gray-700 rounded-lg p-3">
                                    <div className="text-sm text-gray-400">Role</div>
                                    <div className="text-white flex items-center">
                                        <Shield size={14} className="mr-1 text-gray-400" />
                                        <span className="capitalize">{userData.role || 'user'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Conversation Thread */}
                    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                        <h3 className="text-lg font-medium text-white mb-4">Conversation</h3>

                        {ticket.responses && ticket.responses.length > 0 ? (
                            <div className="space-y-4 mb-6">
                                {ticket.responses.map((response, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${response.fromAdmin ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`rounded-lg p-4 max-w-[80%] ${response.fromAdmin
                                            ? 'bg-blue-600/30 text-blue-100 border-r-4 border-blue-600'
                                            : 'bg-gray-700 text-white border-l-4 border-gray-500'
                                            }`}>
                                            <div className="flex items-center mb-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${response.fromAdmin ? 'bg-blue-700' : 'bg-gray-600'
                                                    }`}>
                                                    {response.fromAdmin ? (
                                                        <Shield size={14} className="text-white" />
                                                    ) : (
                                                        <User size={14} className="text-white" />
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium">
                                                        {response.fromAdmin ? 'Support Team' : 'Customer'}
                                                    </span>
                                                    <div className="text-xs opacity-70">
                                                        {formatDate(response.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="whitespace-pre-wrap">{response.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-6 bg-gray-700/50 rounded-lg mb-6">
                                <MessageSquare size={24} className="mx-auto text-gray-500 mb-2" />
                                <p className="text-gray-400">No responses yet</p>
                            </div>
                        )}

                        {/* Reply Form */}
                        {ticket.status !== 'closed' ? (
                            <form onSubmit={handleSubmitResponse} className="relative">
                                <textarea
                                    value={newResponse}
                                    onChange={(e) => setNewResponse(e.target.value)}
                                    placeholder="Type your response here..."
                                    className="w-full bg-gray-700 rounded-lg border border-gray-600 text-white placeholder-gray-400 p-4 min-h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={submitting}
                                ></textarea>
                                <button
                                    type="submit"
                                    disabled={submitting || !newResponse.trim()}
                                    className={`absolute bottom-4 right-4 p-2 rounded-lg ${submitting || !newResponse.trim()
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
                            </form>
                        ) : (
                            <div className="text-center p-4 bg-gray-700 rounded-lg">
                                <XCircle size={24} className="mx-auto text-gray-400 mb-2" />
                                <p className="text-gray-300">This ticket is closed and no longer accepting responses</p>
                                <button
                                    onClick={() => handleStatusUpdate('open')}
                                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                                >
                                    Reopen Ticket
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center p-8 bg-gray-800 rounded-lg">
                    <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">Ticket Not Found</h3>
                    <p className="text-gray-400 mb-6">
                        The ticket you're looking for doesn't exist or has been deleted.
                    </p>
                    <Link href="/admin/support">
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                            Back to Tickets
                        </button>
                    </Link>
                </div>
            )}
        </div>
    );
}