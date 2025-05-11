// app/servers/[id]/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Server, Clock, Calendar, Bell, Settings, Trash2, ExternalLink, Activity } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { getServerById, updateServer, deleteServer } from '@/services/serverService';
import { getUserById } from '@/services/userService';

const ServerDetailsPage = ({ params }) => {
    const { id } = params;
    const router = useRouter();
    const { user } = useAuth();
    const [server, setServer] = useState(null);
    const [serverOwner, setServerOwner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        const fetchServerDetails = async () => {
            try {
                if (!id) return;

                const serverData = await getServerById(id);
                setServer(serverData);

                // Also fetch the server owner's info
                if (serverData.uploadedBy) {
                    const ownerData = await getUserById(serverData.uploadedBy);
                    setServerOwner(ownerData);
                }

                setLoading(false);
            } catch (error) {
                console.error('Error fetching server details:', error);
                setLoading(false);
            }
        };

        fetchServerDetails();
    }, [id]);

    const handleDeleteServer = async () => {
        setDeleteLoading(true);
        try {
            await deleteServer(id);
            router.push('/dashboard');
        } catch (error) {
            console.error('Error deleting server:', error);
            setDeleteLoading(false);
            setIsDeleteModalOpen(false);
        }
    };

    // Calculate uptime percentage (mockup for now)
    const calculateUptime = () => {
        // In a real app, this would use historical data from the database
        return '99.8%';
    };

    // Format date for display
    const formatDate = (timestamp) => {
        if (!timestamp) return 'Never';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    // Get status badge
    const getStatusBadge = (status) => {
        switch (status) {
            case 'up':
                return <span className="bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">Up</span>;
            case 'down':
                return <span className="bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">Down</span>;
            case 'error':
                return <span className="bg-yellow-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">Error</span>;
            default:
                return <span className="bg-gray-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">Unknown</span>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#031D27] text-white pt-20 md:pl-64">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!server) {
        return (
            <div className="min-h-screen bg-[#031D27] text-white pt-20 md:pl-64">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Server Not Found</h1>
                        <p className="text-gray-400 mb-6">The server you're looking for doesn't exist or you don't have access to it.</p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center mx-auto"
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#031D27] text-white pt-20 md:pl-64">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="text-blue-400 hover:text-blue-300 mb-2 flex items-center"
                        >
                            <ArrowLeft size={16} className="mr-1" />
                            Back to Dashboard
                        </button>
                        <h1 className="text-2xl font-bold flex items-center">
                            <Server className="mr-2" size={24} />
                            {server.name}
                            <span className="ml-3">{getStatusBadge(server.status)}</span>
                        </h1>
                        <p className="text-gray-400 mt-1">{server.url}</p>
                    </div>
                    <div className="flex space-x-3 mt-4 md:mt-0">
                        <button
                            onClick={() => window.open(server.url, '_blank')}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center"
                        >
                            <ExternalLink size={16} className="mr-2" />
                            Visit Site
                        </button>
                        <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center"
                        >
                            <Trash2 size={16} className="mr-2" />
                            Delete
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-700 mb-6">
                    <nav className="flex space-x-6 overflow-x-auto pb-2">
                        <button
                            className={`px-1 py-2 text-sm font-medium ${activeTab === 'overview' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            Overview
                        </button>
                        <button
                            className={`px-1 py-2 text-sm font-medium ${activeTab === 'settings' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            Settings
                        </button>
                        <button
                            className={`px-1 py-2 text-sm font-medium ${activeTab === 'alerts' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
                            onClick={() => setActiveTab('alerts')}
                        >
                            Alerts
                        </button>
                    </nav>
                </div>

                {/* Main Content */}
                <div className="bg-gray-800 rounded-lg p-6">
                    {activeTab === 'overview' && (
                        <div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-gray-700 rounded-lg p-5">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-gray-400">Current Status</p>
                                            <div className="mt-1 flex items-center">
                                                <div className={`h-3 w-3 rounded-full mr-2 ${server.status === 'up' ? 'bg-green-500' :
                                                        server.status === 'down' ? 'bg-red-500' :
                                                            'bg-yellow-500'
                                                    }`}></div>
                                                <p className="text-2xl font-semibold">
                                                    {server.status === 'up' ? 'Online' :
                                                        server.status === 'down' ? 'Offline' :
                                                            'Error'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-700 rounded-lg p-5">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-gray-400">Response Time</p>
                                            <p className="text-2xl font-semibold mt-1">
                                                {server.responseTime ? `${server.responseTime} ms` : 'N/A'}
                                            </p>
                                        </div>
                                        <Clock className="text-gray-500" size={20} />
                                    </div>
                                </div>

                                <div className="bg-gray-700 rounded-lg p-5">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-gray-400">Uptime</p>
                                            <p className="text-2xl font-semibold mt-1">{calculateUptime()}</p>
                                        </div>
                                        <Activity className="text-gray-500" size={20} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-700 rounded-lg p-5">
                                    <h3 className="text-lg font-medium mb-4">Server Details</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-400">URL</p>
                                            <p className="text-base mt-1">{server.url}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">Last Checked</p>
                                            <p className="text-base mt-1">{formatDate(server.lastChecked)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">Created</p>
                                            <p className="text-base mt-1">{formatDate(server.createdAt)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">Monitoring Frequency</p>
                                            <p className="text-base mt-1">Every {server.monitoring.frequency} {server.monitoring.frequency === 1 ? 'minute' : 'minutes'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-700 rounded-lg p-5">
                                    <h3 className="text-lg font-medium mb-4">Owner</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-400">Owner</p>
                                            <p className="text-base mt-1">{serverOwner ? serverOwner.name || serverOwner.email : 'Unknown'}</p>
                                        </div>
                                        {server.description && (
                                            <div>
                                                <p className="text-sm text-gray-400">Description</p>
                                                <p className="text-base mt-1">{server.description}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm text-gray-400">Trial Status</p>
                                            <p className="text-base mt-1">
                                                {server.monitoring.trialEndsAt ?
                                                    `Expires on ${formatDate(server.monitoring.trialEndsAt)}` :
                                                    'No trial period'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div>
                            <h2 className="text-xl font-semibold mb-6">Server Settings</h2>
                            {/* Server Settings Form - To be implemented */}
                            <p className="text-gray-400">Server settings implementation would go here.</p>
                        </div>
                    )}

                    {activeTab === 'alerts' && (
                        <div>
                            <h2 className="text-xl font-semibold mb-6">Alert Settings</h2>
                            {/* Alert Settings Form - To be implemented */}
                            <p className="text-gray-400">Alert settings implementation would go here.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Delete Server</h3>
                        <p className="text-gray-300 mb-6">
                            Are you sure you want to delete <strong>{server.name}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                                disabled={deleteLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteServer}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete Server'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServerDetailsPage;