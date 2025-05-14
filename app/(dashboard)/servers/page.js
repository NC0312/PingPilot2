'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Server, CheckCircle, AlertTriangle, Clock, ArrowRight, Settings, Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/app/firebase/config';
import { useAuth } from '@/app/context/AuthContext';

export default function ServersPage() {
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedServer, setSelectedServer] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchServers = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const serversRef = collection(db, 'servers');
                const q = query(
                    serversRef,
                    where('uploadedBy', '==', user.uid),
                    orderBy('uploadedAt', 'desc')
                );

                const querySnapshot = await getDocs(q);
                const serversList = [];

                querySnapshot.forEach((doc) => {
                    serversList.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                setServers(serversList);

                // If we have servers, select the first one by default
                if (serversList.length > 0) {
                    setSelectedServer(serversList[0]);
                }
            } catch (err) {
                console.error('Error fetching servers:', err);
                setError('Failed to load servers. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchServers();
    }, [user]);

    const handleRefresh = async () => {
        if (!selectedServer) return;

        try {
            setLoading(true);

            // Call the POST endpoint to manually check the server
            const response = await fetch(`/api/servers/${selectedServer.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.uid
                },
                body: JSON.stringify({ action: 'check' })
            });

            if (!response.ok) {
                throw new Error('Failed to check server');
            }

            // Refresh the server list to get updated status
            const serversRef = collection(db, 'servers');
            const q = query(
                serversRef,
                where('uploadedBy', '==', user.uid),
                orderBy('uploadedAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const serversList = [];

            querySnapshot.forEach((doc) => {
                serversList.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            setServers(serversList);

            // Update the selected server
            if (serversList.length > 0) {
                const updatedSelectedServer = serversList.find(s => s.id === selectedServer.id);
                if (updatedSelectedServer) {
                    setSelectedServer(updatedSelectedServer);
                }
            }
        } catch (err) {
            console.error('Error refreshing server:', err);
            setError('Failed to refresh server status. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Format a timestamp into a readable format
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Never';

        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    // Get status indicator color
    const getStatusColor = (status) => {
        switch (status) {
            case 'up':
                return 'text-green-500';
            case 'down':
                return 'text-red-500';
            default:
                return 'text-gray-400';
        }
    };

    // Get status text
    const getStatusText = (status) => {
        switch (status) {
            case 'up':
                return 'Online';
            case 'down':
                return 'Down';
            default:
                return 'Unknown';
        }
    };

    // Get status icon
    const StatusIcon = ({ status }) => {
        switch (status) {
            case 'up':
                return <CheckCircle size={16} className="text-green-500" />;
            case 'down':
                return <AlertTriangle size={16} className="text-red-500" />;
            default:
                return <Clock size={16} className="text-gray-400" />;
        }
    };

    if (loading && servers.length === 0) {
        return (
            <div className="text-white container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold">My Servers</h1>
                    <Link href="/servers/new">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded flex items-center">
                            <Plus size={18} className="mr-2" />
                            Add Server
                        </button>
                    </Link>
                </div>
                <div className="bg-gray-800 rounded-lg p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading servers...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-white container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold">My Servers</h1>
                    <Link href="/servers/new">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded flex items-center">
                            <Plus size={18} className="mr-2" />
                            Add Server
                        </button>
                    </Link>
                </div>
                <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-6 text-center">
                    <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">Error Loading Servers</h3>
                    <p className="text-red-200 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded inline-flex items-center"
                    >
                        <RefreshCw size={18} className="mr-2" />
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (servers.length === 0) {
        return (
            <div className="text-white container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold">My Servers</h1>
                    <Link href="/servers/new">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded flex items-center">
                            <Plus size={18} className="mr-2" />
                            Add Server
                        </button>
                    </Link>
                </div>
                <div className="bg-gray-800 rounded-lg p-8 text-center">
                    <Server size={48} className="mx-auto text-gray-500 mb-4" />
                    <h3 className="text-xl font-medium text-gray-300 mb-2">Add your first server</h3>
                    <p className="text-gray-400 mb-6">
                        Start monitoring your websites and servers by adding your first URL.
                    </p>
                    <Link href="/servers/new">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded inline-flex items-center">
                            <Plus size={18} className="mr-2" />
                            Add Server
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="text-white container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">My Servers</h1>
                <Link href="/servers/new">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded flex items-center">
                        <Plus size={18} className="mr-2" />
                        Add Server
                    </button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Server List - Left Sidebar */}
                <div className="md:col-span-1 bg-gray-800 rounded-lg p-4 h-fit">
                    <h2 className="text-lg font-semibold mb-4">Servers</h2>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {servers.map((server) => (
                            <div
                                key={server.id}
                                onClick={() => setSelectedServer(server)}
                                className={`p-3 rounded-lg cursor-pointer flex items-center
                                    ${server.id === selectedServer?.id
                                        ? 'bg-blue-800 border border-blue-600'
                                        : 'bg-gray-700 hover:bg-gray-600'}`}
                            >
                                <StatusIcon status={server.status} />
                                <span className="ml-2 text-sm font-medium truncate">{server.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Server Details - Right Panel */}
                {selectedServer && (
                    <div className="md:col-span-3 bg-gray-800 rounded-lg">
                        <div className="border-b border-gray-700 p-4 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-semibold">{selectedServer.name}</h2>
                                <div className="flex items-center mt-1">
                                    <StatusIcon status={selectedServer.status} />
                                    <span className={`ml-2 text-sm ${getStatusColor(selectedServer.status)}`}>
                                        {getStatusText(selectedServer.status)}
                                    </span>
                                    {selectedServer.responseTime && selectedServer.status === 'up' && (
                                        <span className="ml-3 text-sm text-gray-400">
                                            {selectedServer.responseTime}ms
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleRefresh}
                                    disabled={loading}
                                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300"
                                    title="Refresh Status"
                                >
                                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                </button>
                                <Link href={`/servers/${selectedServer.id}/settings`}>
                                    <button
                                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300"
                                        title="Server Settings"
                                    >
                                        <Settings size={16} />
                                    </button>
                                </Link>
                                <a
                                    href={selectedServer.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300"
                                    title="Visit Site"
                                >
                                    <ExternalLink size={16} />
                                </a>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Server Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-gray-700 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-gray-400 mb-3">Server Information</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-gray-400">URL</p>
                                            <p className="text-sm">{selectedServer.url}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Type</p>
                                            <p className="text-sm capitalize">{selectedServer.type || 'Website'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Added On</p>
                                            <p className="text-sm">{formatTimestamp(selectedServer.uploadedAt)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-700 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-gray-400 mb-3">Monitoring Status</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-gray-400">Status</p>
                                            <div className="flex items-center">
                                                <StatusIcon status={selectedServer.status} />
                                                <span className={`ml-2 text-sm ${getStatusColor(selectedServer.status)}`}>
                                                    {getStatusText(selectedServer.status)}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Last Checked</p>
                                            <p className="text-sm">{formatTimestamp(selectedServer.lastChecked)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Response Time</p>
                                            <p className="text-sm">
                                                {selectedServer.responseTime ? `${selectedServer.responseTime}ms` : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Check Frequency */}
                            <div className="bg-gray-700 rounded-lg p-4 mb-6">
                                <h3 className="text-sm font-semibold text-gray-400 mb-3">Monitoring Schedule</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-400">Check Frequency</p>
                                        <p className="text-sm">
                                            Every {selectedServer.monitoring?.frequency || 5} minutes
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Monitoring Days</p>
                                        <p className="text-sm">
                                            {selectedServer.monitoring?.daysOfWeek?.map(day => {
                                                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                                return days[day];
                                            }).join(', ') || 'Every day'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Time Windows</p>
                                        <p className="text-sm">
                                            {selectedServer.monitoring?.timeWindows?.map(window => (
                                                `${window.start} - ${window.end}`
                                            )).join(', ') || '24/7'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Alerts & Contacts */}
                            <div className="bg-gray-700 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-gray-400 mb-3">Alerts</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-400">Alert Status</p>
                                        <p className="text-sm">
                                            {selectedServer.monitoring?.alerts?.enabled ? 'Enabled' : 'Disabled'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Alert Threshold</p>
                                        <p className="text-sm">
                                            {selectedServer.monitoring?.alerts?.responseThreshold || 1000}ms
                                        </p>
                                    </div>
                                </div>

                                {/* Contact methods */}
                                <div className="mt-4">
                                    <p className="text-xs text-gray-400 mb-2">Contact Methods</p>
                                    <div className="space-y-2">
                                        {selectedServer.contactEmails && selectedServer.contactEmails.length > 0 && (
                                            <div>
                                                <p className="text-xs text-gray-400">Email Alerts</p>
                                                <ul className="list-disc pl-5 text-sm">
                                                    {selectedServer.contactEmails.map((email, index) => (
                                                        <li key={index}>{email}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {selectedServer.contactPhones && selectedServer.contactPhones.length > 0 && (
                                            <div>
                                                <p className="text-xs text-gray-400">Phone Alerts</p>
                                                <ul className="list-disc pl-5 text-sm">
                                                    {selectedServer.contactPhones.map((phone, index) => (
                                                        <li key={index}>
                                                            {phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {(!selectedServer.contactEmails || selectedServer.contactEmails.length === 0) &&
                                            (!selectedServer.contactPhones || selectedServer.contactPhones.length === 0) && (
                                                <p className="text-sm text-gray-400">No contact methods configured</p>
                                            )}
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex justify-end mt-6 space-x-3">
                                <Link href={`/servers/${selectedServer.id}/settings`}>
                                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm px-4 py-2 flex items-center">
                                        <Settings size={16} className="mr-2" />
                                        Manage Server
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}