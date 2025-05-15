'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Server,
    CheckCircle,
    AlertTriangle,
    Clock,
    ArrowRight,
    Settings,
    Trash2,
    RefreshCw,
    ExternalLink,
    Globe
} from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, orderBy, getDocs, onSnapshot, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/app/firebase/config';
import { useAuth } from '@/app/context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ServersPage() {
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedServer, setSelectedServer] = useState(null);
    const [responseTimeData, setResponseTimeData] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();

    // Fetch servers from Firestore
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const serversRef = collection(db, 'servers');
            const q = query(
                serversRef,
                where('uploadedBy', '==', user.uid),
                orderBy('uploadedAt', 'desc')
            );

            // Set up real-time listener
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const serversList = [];
                querySnapshot.forEach((doc) => {
                    serversList.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                setServers(serversList);

                // If we have servers, select the first one by default
                if (serversList.length > 0 && !selectedServer) {
                    setSelectedServer(serversList[0]);
                    fetchServerHistory(serversList[0].id);
                } else if (selectedServer) {
                    // Update selected server if it's in the list
                    const updatedServer = serversList.find(s => s.id === selectedServer.id);
                    if (updatedServer) {
                        setSelectedServer(updatedServer);
                    }
                }

                setLoading(false);
            }, (err) => {
                console.error('Error fetching servers:', err);
                setError('Failed to load servers. Please try again.');
                setLoading(false);
            });

            return () => unsubscribe();
        } catch (err) {
            console.error('Error setting up server listener:', err);
            setError('Failed to load servers. Please try again.');
            setLoading(false);
        }
    }, [user]);


    // Handle refresh action - manually check server status
    const handleRefresh = async () => {
        if (!selectedServer) return;

        try {
            setRefreshing(true);

            // Call the API endpoint to manually check the server
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

            const result = await response.json();

            // Fetch updated server history
            fetchServerHistory(selectedServer.id);

            setRefreshing(false);
        } catch (err) {
            console.error('Error refreshing server:', err);
            setError('Failed to refresh server status. Please try again.');
            setRefreshing(false);
        }
    };

    // Handle server selection
    const handleServerSelect = (server) => {
        setSelectedServer(server);
        fetchServerHistory(server.id);
    };

    // Format a timestamp into a readable format
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Never';

        let date;
        if (timestamp instanceof Timestamp) {
            date = timestamp.toDate();
        } else if (typeof timestamp === 'string') {
            date = new Date(timestamp);
        } else if (typeof timestamp === 'object' && timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else {
            date = new Date(timestamp);
        }

        return date.toLocaleString();
    };

    // Calculate uptime percentage from historical data
    const calculateUptime = (period = 24) => {
        if (!responseTimeData || responseTimeData.length === 0) {
            return '100';
        }

        // Filter data points for the specified period
        const relevantData = responseTimeData.slice(-period);

        // Count how many data points have an 'up' status
        const upCount = relevantData.filter(point => point.status === 'up').length;

        // Calculate percentage
        const percentage = (upCount / relevantData.length) * 100;

        return percentage.toFixed(1);
    };

    // Calculate incidents count
    const countIncidents = (period = 24) => {
        if (!responseTimeData || responseTimeData.length === 0) {
            return 0;
        }

        // Filter data points for the specified period
        const relevantData = responseTimeData.slice(-period);

        // Count status transitions from 'up' to 'down'
        let incidents = 0;
        for (let i = 1; i < relevantData.length; i++) {
            if (relevantData[i - 1].status === 'up' && relevantData[i].status === 'down') {
                incidents++;
            }
        }

        // Check if the first data point is 'down' as well
        if (relevantData[0].status === 'down') {
            incidents++;
        }

        return incidents;
    };

    // Calculate downtime in minutes
    const calculateDowntime = (period = 24) => {
        if (!responseTimeData || responseTimeData.length === 0) {
            return 0;
        }

        // Filter data points for the specified period
        const relevantData = responseTimeData.slice(-period);

        // Estimate downtime (this is approximate since we don't have continuous data)
        const downtimePoints = relevantData.filter(point => point.status === 'down').length;

        // Assuming each data point represents approximately one hour in a 24-hour period
        const downtimeHours = downtimePoints * (24 / relevantData.length);

        // Convert to minutes
        return Math.round(downtimeHours * 60);
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

    // Custom tooltip for the response time chart
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            // Get the status from the payload data
            const status = payload[0]?.payload?.status || 'unknown';

            return (
                <div className="bg-gray-800 p-2 border border-gray-700 rounded shadow-md">
                    <p className="text-gray-300 text-sm">{`${label}`}</p>
                    <p className="text-blue-400 text-sm">{`Response Time: ${payload[0].value} ms`}</p>
                    <p className={`text-sm ${status === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                        Status: {status === 'up' ? 'Online' : 'Down'}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading && servers.length === 0) {
        return (
            <div className="text-white container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold">Server Uptime Monitor</h1>
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
                    <h1 className="text-2xl font-bold">Server Uptime Monitor</h1>
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
                    <h1 className="text-2xl font-bold">Server Uptime Monitor</h1>
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
                <h1 className="text-2xl font-bold">Server Uptime Monitor</h1>
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <select
                            value={selectedServer?.id || ''}
                            onChange={(e) => {
                                const selected = servers.find(s => s.id === e.target.value);
                                handleServerSelect(selected);
                            }}
                            className="bg-gray-800 border border-gray-700 rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {servers.map(server => (
                                <option key={server.id} value={server.id}>
                                    {server.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 flex items-center"
                    >
                        <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Fetch Latest Data
                    </button>

                    <Link href="/servers/new">
                        <button className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium rounded-lg px-4 py-2 flex items-center">
                            <Plus size={16} className="mr-2" />
                            Add New
                        </button>
                    </Link>
                </div>
            </div>

            {selectedServer && (
                <>
                    {/* Server URL & External Link */}
                    <div className="flex items-center mb-6 text-sm text-gray-400 bg-gray-800 rounded-lg px-4 py-3">
                        <Globe size={16} className="mr-2" />
                        <a
                            href={selectedServer.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline flex items-center"
                        >
                            {selectedServer.url}
                            <ExternalLink size={14} className="ml-1" />
                        </a>
                    </div>

                    {/* Status panels row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        {/* Current Status */}
                        <div className="bg-gray-800 rounded-lg p-4">
                            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">CURRENT STATUS</h2>
                            <div className="flex flex-col items-start mb-2">
                                <div className={`flex items-center text-xl font-medium ${selectedServer.status === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                    <span className="inline-block w-3 h-3 rounded-full mr-2 bg-current"></span>
                                    {selectedServer.status === 'up' ? 'Up' : 'Down'}
                                </div>
                                <div className="text-sm text-gray-400 mt-2">
                                    {selectedServer.status === 'up' && (
                                        <>Online since {formatTimestamp(selectedServer.lastStatusChange || selectedServer.lastChecked)}</>
                                    )}
                                    {selectedServer.status === 'down' && (
                                        <>Down since {formatTimestamp(selectedServer.lastStatusChange || selectedServer.lastChecked)}</>
                                    )}
                                </div>
                                <div className="flex items-center text-sm text-gray-400 mt-1">
                                    {selectedServer.status === 'up' ? (
                                        <>
                                            <CheckCircle size={14} className="mr-1 text-green-500" />
                                            Responding normally
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle size={14} className="mr-1 text-red-500" />
                                            {selectedServer.error || 'Connection failed'}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Last 8 Hours */}
                        <div className="bg-gray-800 rounded-lg p-4">
                            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">LAST 8 HOURS</h2>
                            <div className="flex flex-col items-start">
                                <div className={`text-3xl font-bold ${parseFloat(calculateUptime(8)) >= 99.9 ? 'text-green-500' : 'text-yellow-500'} mb-2`}>
                                    {calculateUptime(8)}%
                                </div>
                                <div className="text-sm text-gray-400">
                                    {countIncidents(8)} incident(s), {calculateDowntime(8)}m downtime
                                </div>
                            </div>
                        </div>

                        {/* Last 16 Hours */}
                        <div className="bg-gray-800 rounded-lg p-4">
                            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">LAST 16 HOURS</h2>
                            <div className="flex flex-col items-start">
                                <div className={`text-3xl font-bold ${parseFloat(calculateUptime(16)) >= 99.9 ? 'text-green-500' : 'text-yellow-500'} mb-2`}>
                                    {calculateUptime(16)}%
                                </div>
                                <div className="text-sm text-gray-400">
                                    {countIncidents(16)} incident(s), {calculateDowntime(16)}m downtime
                                </div>
                            </div>
                        </div>

                        {/* Last 24 Hours */}
                        <div className="bg-gray-800 rounded-lg p-4">
                            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">LAST 24 HOURS</h2>
                            <div className="flex flex-col items-start">
                                <div className={`text-3xl font-bold ${parseFloat(calculateUptime(24)) >= 99.9 ? 'text-green-500' : 'text-yellow-500'} mb-2`}>
                                    {calculateUptime(24)}%
                                </div>
                                <div className="text-sm text-gray-400">
                                    {countIncidents(24)} incident(s), {calculateDowntime(24)}m downtime
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Response Time Graph */}
                    <div className="bg-gray-800 rounded-lg p-4 mb-8">
                        <h2 className="text-center text-sm font-medium text-blue-400 mb-2">Response Time (ms)</h2>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={responseTimeData} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="time" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line
                                        type="monotone"
                                        dataKey="avgTime"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        activeDot={{ r: 5, fill: "#3b82f6" }}
                                        // Customize the dot color based on server status
                                        dot={(props) => {
                                            const { cx, cy, payload } = props;
                                            const fill = payload.status === 'up' ? '#3b82f6' : '#ef4444';
                                            return <circle cx={cx} cy={cy} r={3} fill={fill} />;
                                        }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Server configuration details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-gray-800 rounded-lg p-4">
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
                                {selectedServer.description && (
                                    <div>
                                        <p className="text-xs text-gray-400">Description</p>
                                        <p className="text-sm">{selectedServer.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-800 rounded-lg p-4">
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
                                {selectedServer.error && (
                                    <div>
                                        <p className="text-xs text-gray-400">Error Message</p>
                                        <p className="text-sm text-red-400">{selectedServer.error}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Monitoring Schedule */}
                    <div className="bg-gray-800 rounded-lg p-4 mb-6">
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

                    {/* Action buttons */}
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg text-sm px-4 py-2 flex items-center"
                        >
                            <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh Status
                        </button>

                        <Link href={`/servers/${selectedServer.id}/settings`}>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm px-4 py-2 flex items-center">
                                <Settings size={16} className="mr-2" />
                                Manage Server
                            </button>
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}