// app/components/Support/TicketList.js
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import {
    MessageSquare, Clock, AlertCircle, CheckCircle,
    HelpCircle, CreditCard, Settings, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const TicketList = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [refreshing, setRefreshing] = useState(false);

    const router = useRouter();
    const { apiRequest } = useAuth();

    const fetchTickets = async () => {
        try {
            setLoading(true);
            setRefreshing(true);

            const response = await apiRequest('/api/support/tickets', {
                method: 'GET',
                params: statusFilter !== 'all' ? { status: statusFilter } : {}
            });

            if (response.status === 'success') {
                setTickets(response.data.tickets);
            } else {
                throw new Error(response.message || 'Failed to load tickets');
            }
        } catch (err) {
            console.error('Error fetching tickets:', err);
            setError('Failed to load support tickets. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [statusFilter]);

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

    return (
        <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Support Tickets</h2>
                <div className="flex space-x-2">
                    <div className="flex p-1 bg-gray-700 rounded-lg">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1 text-sm rounded ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setStatusFilter('open')}
                            className={`px-3 py-1 text-sm rounded ${statusFilter === 'open' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
                        >
                            Open
                        </button>
                        <button
                            onClick={() => setStatusFilter('in_progress')}
                            className={`px-3 py-1 text-sm rounded ${statusFilter === 'in_progress' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
                        >
                            In Progress
                        </button>
                        <button
                            onClick={() => setStatusFilter('resolved')}
                            className={`px-3 py-1 text-sm rounded ${statusFilter === 'resolved' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
                        >
                            Resolved
                        </button>
                    </div>
                    <button
                        onClick={() => fetchTickets()}
                        className="p-2 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600"
                        disabled={refreshing}
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
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
                        onClick={fetchTickets}
                        className="mt-4 px-4 py-2 bg-red-600/50 hover:bg-red-700 text-white rounded-lg"
                    >
                        Try Again
                    </button>
                </div>
            ) : tickets.length === 0 ? (
                <div className="text-center py-12">
                    <MessageSquare size={48} className="mx-auto text-gray-500 mb-4" />
                    <h3 className="text-xl font-medium text-gray-300 mb-2">No tickets found</h3>
                    <p className="text-gray-400 mb-6">
                        {statusFilter !== 'all'
                            ? `You don't have any ${statusFilter} tickets`
                            : "You haven't created any support tickets yet"}
                    </p>
                    <Link href="/support/new">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                        >
                            Create New Ticket
                        </motion.button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {tickets.map((ticket) => (
                        <motion.div
                            key={ticket._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 cursor-pointer"
                            onClick={() => router.push(`/support/tickets/${ticket._id}`)}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-start">
                                    <div className="p-2 bg-gray-600 rounded-lg mr-3">
                                        {getCategoryIcon(ticket.category)}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-white">{ticket.subject}</h3>
                                        <p className="text-sm text-gray-400 mt-1 line-clamp-1">
                                            {ticket.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    {getStatusBadge(ticket.status)}
                                    <div className="flex items-center mt-2 text-xs text-gray-400">
                                        <Clock size={12} className="mr-1" />
                                        {new Date(ticket.updatedAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-4 text-xs">
                                <div className="flex items-center text-gray-400">
                                    <MessageSquare size={12} className="mr-1" />
                                    {ticket.responses?.length || 0} responses
                                </div>
                                <div className="text-blue-400 hover:text-blue-300">
                                    View Details →
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    <div className="flex justify-center mt-6">
                        <Link href="/support/new">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                            >
                                Create New Ticket
                            </motion.button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketList;