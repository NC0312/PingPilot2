'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Server,
    CheckCircle,
    AlertTriangle,
    Clock,
    ArrowRight,
    Settings,
    RefreshCw,
    ExternalLink,
    Globe,
    ChevronDown,
    BarChart2,
    Activity,
    Mail,
    Phone
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatTimestamp, formatDuration, formatRelativeTime } from '@/app/components/dateTimeUtils';

export default function EnhancedServersPage() {
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedServer, setSelectedServer] = useState(null);
    const [responseTimeData, setResponseTimeData] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const { user, apiRequest } = useAuth();

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                duration: 0.3
            }
        }
    };

    const childVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                damping: 12
            }
        }
    };

    const tabContainerVariants = {
        initial: { opacity: 0, y: -10 },
        animate: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                staggerChildren: 0.1
            }
        }
    };

    const tabVariants = {
        initial: { opacity: 0, y: -5 },
        animate: { opacity: 1, y: 0 }
    };

    // Fetch servers from API
    const fetchServers = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Make API request to get servers
            const response = await apiRequest('/api/servers', {
                method: 'GET'
            });

            if (response.status === 'success' && response.data.servers) {
                const serversList = response.data.servers;

                setServers(serversList);

                // If we have servers, select the first one by default
                if (serversList.length > 0 && !selectedServer) {
                    setSelectedServer(serversList[0]);
                    fetchServerHistory(serversList[0]._id || serversList[0].id);
                } else if (selectedServer) {
                    // Update selected server if it's in the list
                    const serverId = selectedServer._id || selectedServer.id;
                    const updatedServer = serversList.find(s => (s._id === serverId || s.id === serverId));
                    if (updatedServer) {
                        setSelectedServer(updatedServer);
                        fetchServerHistory(serverId);
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching servers:', err);
            setError('Failed to load servers. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Set up initial data loading
    useEffect(() => {
        if (user) {
            fetchServers();

            // Set up refresh interval - every 60 seconds
            const intervalId = setInterval(() => {
                fetchServers();
            }, 60 * 1000);

            return () => clearInterval(intervalId);
        }
    }, [user]);

    // Fetch server history data
    const fetchServerHistory = async (serverId) => {
        try {
            // Get the last 24 hours of history data
            const response = await apiRequest(`/api/servers/${serverId}/history?period=24h`, {
                method: 'GET'
            });

            if (response.status === 'success' && response.data.history) {
                // Transform data for chart and processing
                let historicalData = response.data.history.map(check => {
                    const date = new Date(check.timestamp);
                    return {
                        time: date,
                        avgTime: check.responseTime || 0,
                        status: check.status || 'unknown',
                        // Save original date components for filtering
                        day: date.getDay(), // 0-6 (Sun-Sat)
                        hour: date.getHours(),
                        minute: date.getMinutes()
                    };
                }).sort((a, b) => a.time - b.time); // Sort chronologically

                // If we have a selected server with monitoring settings, filter the data
                if (selectedServer && selectedServer.monitoring) {
                    // Filter by days of week if specified
                    if (selectedServer.monitoring.daysOfWeek && selectedServer.monitoring.daysOfWeek.length > 0) {
                        historicalData = historicalData.filter(item =>
                            selectedServer.monitoring.daysOfWeek.includes(item.day)
                        );
                    }

                    // Filter by time range if specified
                    if (selectedServer.monitoring.timeWindows && selectedServer.monitoring.timeWindows.length > 0) {
                        // Handle the special case of 24/7 monitoring (00:00 to 00:00)
                        const has24x7Window = selectedServer.monitoring.timeWindows.some(window =>
                            window.start === "00:00" && window.end === "00:00");

                        if (!has24x7Window) {
                            historicalData = historicalData.filter(item => {
                                // For each data point, check if it falls within any of the time windows
                                return selectedServer.monitoring.timeWindows.some(window => {
                                    // Convert HH:MM to minutes for easier comparison
                                    const [startHour, startMinute] = window.start.split(':').map(Number);
                                    const [endHour, endMinute] = window.end.split(':').map(Number);

                                    const startMinutes = startHour * 60 + startMinute;
                                    const endMinutes = endHour * 60 + endMinute;
                                    const itemMinutes = item.hour * 60 + item.minute;

                                    return itemMinutes >= startMinutes && itemMinutes <= endMinutes;
                                });
                            });
                        }
                    }
                }

                setResponseTimeData(historicalData);
            }
        } catch (err) {
            console.error('Error fetching server history:', err);
            setError('Failed to load server history');
        }
    };

    // Handle refresh action - manually check server status
    const handleRefresh = async () => {
        if (!selectedServer) return;

        try {
            setRefreshing(true);
            const serverId = selectedServer._id || selectedServer.id;

            // Call the API endpoint to manually check the server
            const response = await apiRequest(`/api/servers/${serverId}/check`, {
                method: 'POST'
            });

            if (response.status === 'success') {
                // Update the selected server with new status
                setSelectedServer(prev => ({
                    ...prev,
                    status: response.data.status,
                    responseTime: response.data.responseTime,
                    error: response.data.error,
                    lastChecked: response.data.lastChecked
                }));

                // Update the server in the servers list
                setServers(prev => prev.map(server =>
                    (server._id === serverId || server.id === serverId)
                        ? {
                            ...server,
                            status: response.data.status,
                            responseTime: response.data.responseTime,
                            error: response.data.error,
                            lastChecked: response.data.lastChecked
                        }
                        : server
                ));

                // Fetch updated server history
                fetchServerHistory(serverId);
            }
        } catch (err) {
            console.error('Error refreshing server:', err);
            setError('Failed to refresh server status. Please try again.');
        } finally {
            setRefreshing(false);
        }
    };

    // Handle server selection
    const handleServerSelect = (server) => {
        setSelectedServer(server);
        fetchServerHistory(server._id || server.id);
        setDropdownOpen(false);
    };

    // Calculate uptime percentage from historical data
    const calculateUptime = (periodHours) => {
        if (!responseTimeData || responseTimeData.length === 0) return '100.0';

        const now = new Date();
        const startTime = new Date(now.getTime() - periodHours * 60 * 60 * 1000);

        // Filter data within the period
        const relevantData = responseTimeData.filter(point => point.time >= startTime);
        if (relevantData.length === 0) return '100.0';

        const upCount = relevantData.filter(point => point.status === 'up').length;
        return ((upCount / relevantData.length) * 100).toFixed(1);
    };

    // Calculate incidents count
    const countIncidents = (periodHours) => {
        if (!responseTimeData || responseTimeData.length === 0) return 0;

        const now = new Date();
        const startTime = new Date(now.getTime() - periodHours * 60 * 60 * 1000);
        const relevantData = responseTimeData.filter(point => point.time >= startTime);

        let incidents = 0;
        let previousStatus = relevantData[0]?.status || 'up';

        for (let i = 0; i < relevantData.length; i++) {
            if (i === 0 && relevantData[i].status === 'down') {
                incidents++;
            } else if (previousStatus === 'up' && relevantData[i].status === 'down') {
                incidents++;
            }
            previousStatus = relevantData[i].status;
        }

        return incidents;
    };

    // Calculate downtime in minutes
    const calculateDowntime = (periodHours) => {
        if (!responseTimeData || !selectedServer) return 0;

        // Get check interval from server settings (default 5 minutes)
        const checkInterval = selectedServer.monitoring?.frequency || 5;
        const now = new Date();
        const startTime = new Date(now.getTime() - periodHours * 60 * 60 * 1000);

        const relevantData = responseTimeData.filter(point => point.time >= startTime);
        const downCount = relevantData.filter(point => point.status === 'down').length;

        return downCount * checkInterval;
    };

    // Format chart data for display
    const formatChartData = (data) => {
        return data.map(item => ({
            ...item,
            formattedTime: formatTimestamp(item.time, selectedServer?.timezone || 'Asia/Kolkata', 'HH:mm:ss'),
        }));
    };

    // Custom tooltip for the response time chart
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            // Get the data point from the payload
            const dataPoint = payload[0]?.payload;
            const status = dataPoint?.status || 'unknown';

            // Use the correct timezone
            const timezone = selectedServer?.timezone || 'Asia/Kolkata';

            // Format the time using the original Date object
            let formattedTime;
            if (dataPoint && dataPoint.time instanceof Date) {
                formattedTime = formatTimestamp(dataPoint.time, timezone);
            } else {
                formattedTime = 'Unknown time';
            }

            return (
                <div className="bg-gray-800 p-3 border border-gray-700 rounded shadow-md">
                    <p className="text-gray-300 text-sm mb-1">{`Time: ${formattedTime}`}</p>
                    <p className="text-blue-400 text-sm mb-1">{`Response Time: ${payload[0].value} ms`}</p>
                    <div className={`text-sm flex items-center ${status === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                        Status:
                        {status === 'up' ?
                            <CheckCircle size={14} className="ml-1 mr-1" /> :
                            <AlertTriangle size={14} className="ml-1 mr-1" />
                        }
                        {status === 'up' ? 'Online' : 'Down'}
                    </div>
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
                        <motion.button
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded flex items-center"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Plus size={18} className="mr-2" />
                            Add Server
                        </motion.button>
                    </Link>
                </div>
                <motion.div
                    className="bg-gray-800 rounded-lg p-8 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <motion.div
                        className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <p className="text-gray-300">Loading servers...</p>
                </motion.div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-white container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold">Server Uptime Monitor</h1>
                    <Link href="/servers/new">
                        <motion.button
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded flex items-center"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Plus size={18} className="mr-2" />
                            Add Server
                        </motion.button>
                    </Link>
                </div>
                <motion.div
                    className="bg-red-900/30 border border-red-600/50 rounded-lg p-6 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 12 }}
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    >
                        <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
                    </motion.div>
                    <h3 className="text-xl font-medium text-white mb-2">Error Loading Servers</h3>
                    <p className="text-red-200 mb-4">{error}</p>
                    <motion.button
                        onClick={() => fetchServers()}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded inline-flex items-center"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <RefreshCw size={18} className="mr-2" />
                        Try Again
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    if (servers.length === 0) {
        return (
            <div className="text-white container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold">Server Uptime Monitor</h1>
                    <Link href="/servers/new">
                        <motion.button
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded flex items-center"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Plus size={18} className="mr-2" />
                            Add Server
                        </motion.button>
                    </Link>
                </div>
                <motion.div
                    className="bg-gray-800 rounded-lg p-8 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 12 }}
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                    >
                        <Server size={48} className="mx-auto text-gray-500 mb-4" />
                    </motion.div>
                    <h3 className="text-xl font-medium text-gray-300 mb-2">Add your first server</h3>
                    <p className="text-gray-400 mb-6">
                        Start monitoring your websites and servers by adding your first URL.
                    </p>
                    <Link href="/servers/new">
                        <motion.button
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded inline-flex items-center"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Plus size={18} className="mr-2" />
                            Add Server
                        </motion.button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <motion.div
            className="text-white container mx-auto px-4 py-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <motion.div
                className="flex justify-between items-center mb-6"
                variants={childVariants}
            >
                <h1 className="text-2xl font-bold">Server Uptime Monitor</h1>
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <motion.button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-gray-800 border border-gray-700 rounded-lg py-2 pl-3 pr-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center min-w-[150px] justify-between"
                        >
                            <span className="truncate">
                                {selectedServer?.name || 'Select Server'}
                            </span>
                            <ChevronDown size={16} className={`ml-2 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </motion.button>

                        {dropdownOpen && (
                            <AnimatePresence>
                                <motion.div
                                    className="absolute top-full left-0 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {servers.map(server => (
                                        <motion.button
                                            key={server._id || server.id}
                                            onClick={() => handleServerSelect(server)}
                                            className={`w-full text-left px-3 py-2 text-sm transition-colors flex justify-between items-center rounded 
            ${server.name === selectedServer?.name
                                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                    : 'text-gray-300 hover:bg-gray-700'
                                                }`}
                                        >
                                            <span className="truncate max-w-[85%] block">
                                                {server.name}
                                            </span>
                                            <span
                                                className={`w-2.5 h-2.5 rounded-full ml-2 flex-shrink-0 ${server.status === 'up' ? 'bg-green-500' : 'bg-red-500'}`}
                                                aria-label={server.status === 'up' ? 'Server online' : 'Server offline'}
                                            ></span>
                                        </motion.button>
                                    ))}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>

                    <motion.button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 flex items-center"
                    >
                        <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </motion.button>

                    <Link href="/servers/new">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium rounded-lg px-4 py-2 flex items-center"
                        >
                            <Plus size={16} className="mr-2" />
                            Add
                        </motion.button>
                    </Link>
                </div>
            </motion.div>

            {selectedServer && (
                <>
                    {/* Server URL & External Link */}
                    <motion.div
                        className="flex items-center mb-6 text-sm text-gray-400 bg-gray-800 rounded-lg px-4 py-3"
                        variants={childVariants}
                    >
                        <Globe size={16} className="mr-2" />
                        <motion.a
                            href={selectedServer.url.startsWith('http') ? selectedServer.url : `https://${selectedServer.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline flex items-center"
                            whileHover={{ color: "#60a5fa" }}
                        >
                            {selectedServer.url}
                            <ExternalLink size={14} className="ml-1" />
                        </motion.a>
                    </motion.div>

                    {/* Status card - spotlight focus */}
                    <motion.div
                        className={`bg-gray-800 rounded-lg p-6 mb-6 ${selectedServer.status === 'up' ? 'border border-green-500/30' : 'border border-red-500/30'}`}
                        variants={childVariants}
                        animate={selectedServer.status === 'up' ? 'pulse' : {}}
                    // variants={pulseVariants}
                    >
                        <div className="flex items-center justify-between">
                            <motion.div
                                className="flex items-start space-x-4"
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ type: "spring", damping: 10 }}
                            >
                                <div className={`p-4 rounded-full ${selectedServer.status === 'up' ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                                    {selectedServer.status === 'up' ? (
                                        <CheckCircle className="text-green-500" size={28} />
                                    ) : (
                                        <AlertTriangle className="text-red-500" size={28} />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-1">
                                        {selectedServer.status === 'up' ? 'Server is Online' : 'Server is Down'}
                                    </h2>
                                    <p className="text-gray-400">
                                        {selectedServer.status === 'up'
                                            ? `Online since ${formatTimestamp(selectedServer.lastStatusChange || selectedServer.lastChecked)}`
                                            : `Down since ${formatTimestamp(selectedServer.lastStatusChange || selectedServer.lastChecked)}`
                                        }
                                    </p>
                                    {selectedServer.status === 'down' && selectedServer.error && (
                                        <p className="text-red-400 mt-2 flex items-center">
                                            <AlertTriangle size={14} className="mr-1" />
                                            {selectedServer.error}
                                        </p>
                                    )}
                                </div>
                            </motion.div>

                            <motion.div
                                className="text-right"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ type: "spring", damping: 10, delay: 0.1 }}
                            >
                                <div className="text-4xl font-bold mb-1">
                                    {selectedServer.responseTime ? `${selectedServer.responseTime}ms` : '—'}
                                </div>
                                <div className="text-sm text-gray-400">Response Time</div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Stats panels row */}
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
                        variants={childVariants}
                    >
                        {/* Last 8 Hours */}
                        <motion.div
                            className="bg-gray-800 rounded-lg p-4"
                            whileHover={{ y: -5, boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        >
                            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">LAST 8 HOURS</h2>
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <div className={`text-3xl font-bold ${parseFloat(calculateUptime(8)) >= 99.9 ? 'text-green-500' : 'text-yellow-500'} mb-2`}>
                                        {calculateUptime(8)}%
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {countIncidents(8)} incident(s), {calculateDowntime(8)}m downtime
                                    </div>
                                </div>
                                <Activity size={32} className="text-gray-600" />
                            </div>
                        </motion.div>

                        {/* Last 16 Hours */}
                        <motion.div
                            className="bg-gray-800 rounded-lg p-4"
                            whileHover={{ y: -5, boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        >
                            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">LAST 16 HOURS</h2>
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <div className={`text-3xl font-bold ${parseFloat(calculateUptime(16)) >= 99.9 ? 'text-green-500' : 'text-yellow-500'} mb-2`}>
                                        {calculateUptime(16)}%
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {countIncidents(16)} incident(s), {calculateDowntime(16)}m downtime
                                    </div>
                                </div>
                                <Activity size={32} className="text-gray-600" />
                            </div>
                        </motion.div>

                        {/* Last 24 Hours */}
                        <motion.div
                            className="bg-gray-800 rounded-lg p-4"
                            whileHover={{ y: -5, boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        >
                            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">LAST 24 HOURS</h2>
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <div className={`text-3xl font-bold ${parseFloat(calculateUptime(24)) >= 99.9 ? 'text-green-500' : 'text-yellow-500'} mb-2`}>
                                        {calculateUptime(24)}%
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {countIncidents(24)} incident(s), {calculateDowntime(24)}m downtime
                                    </div>
                                </div>
                                <Activity size={32} className="text-gray-600" />
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Navigation tabs */}
                    <motion.div
                        className="flex mb-6 bg-gray-800 rounded-lg p-4 gap-2"
                        variants={tabContainerVariants}
                        initial="initial"
                        animate="animate"
                    >
                        {[
                            { id: 'overview', label: 'Overview', icon: <BarChart2 size={16} /> },
                            { id: 'monitoring', label: 'Response Time', icon: <Activity size={16} /> },
                            { id: 'settings', label: 'Server Details', icon: <Settings size={16} /> }
                        ].map(tab => {
                            const isActive = activeTab === tab.id;

                            return (
                                <motion.button
                                    key={tab.id}
                                    variants={tabVariants}
                                    style={{
                                        flex: 1,
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        backgroundColor: isActive ? '#2563eb' : 'transparent',
                                        color: isActive ? 'white' : '#9ca3af',
                                        cursor: 'pointer'
                                    }}
                                    whileHover={{
                                        scale: 1.03,
                                        backgroundColor: isActive ? '#2563eb' : 'rgba(59, 130, 246, 0.1)'
                                    }}
                                    whileTap={{ scale: 0.97 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 400,
                                        damping: 17,
                                        backgroundColor: { duration: 0.2 }
                                    }}
                                    onClick={() => setActiveTab(tab.id)}
                                    layout // Add layout transition for smooth size changes
                                >
                                    <motion.div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        animate={{
                                            color: isActive ? '#ffffff' : '#9ca3af'
                                        }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <motion.span
                                            style={{ marginRight: '8px' }}
                                            animate={{
                                                scale: isActive ? 1.1 : 1,
                                                color: isActive ? '#ffffff' : '#9ca3af'
                                            }}
                                        >
                                            {tab.icon}
                                        </motion.span>
                                        <span>{tab.label}</span>
                                    </motion.div>
                                </motion.button>
                            );
                        })}
                    </motion.div>

                    {/* Tab content */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ type: "spring", damping: 25 }}
                            >
                                {/* Response Time Graph */}
                                <motion.div
                                    className="bg-gray-800 rounded-lg p-6 mb-6"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-medium text-blue-400">Response Time (ms)</h2>
                                        <div className="flex items-center text-sm">
                                            <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                                            <span className="text-gray-400 mr-3">Up</span>
                                            <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span>
                                            <span className="text-gray-400">Down</span>
                                        </div>
                                    </div>

                                    {/* Show the monitoring schedule information */}
                                    {selectedServer && selectedServer.monitoring && (
                                        <div className="text-xs text-gray-400 text-center mb-4">
                                            Monitoring Schedule:
                                            {selectedServer.monitoring.daysOfWeek && selectedServer.monitoring.daysOfWeek.length > 0
                                                ? ` ${selectedServer.monitoring.daysOfWeek.map(day => {
                                                    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                                    return days[day];
                                                }).join(', ')}`
                                                : ' Every day'
                                            }
                                            {selectedServer.monitoring.timeWindows && selectedServer.monitoring.timeWindows.length > 0
                                                ? ` from ${selectedServer.monitoring.timeWindows[0].start} to ${selectedServer.monitoring.timeWindows[0].end}`
                                                : ' 24/7'
                                            }
                                        </div>
                                    )}

                                    <div className="h-72">
                                        {responseTimeData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={formatChartData(responseTimeData)} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                    <XAxis dataKey="formattedTime" stroke="#94a3b8" />
                                                    <YAxis stroke="#94a3b8" />
                                                    <Tooltip content={CustomTooltip} />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="avgTime"
                                                        stroke="#3b82f6"
                                                        strokeWidth={2}
                                                        activeDot={{ r: 5, fill: "#3b82f6" }}
                                                        dot={(props) => {
                                                            const { cx, cy, payload, index } = props;
                                                            const fill = payload.status === 'up' ? '#3b82f6' : '#ef4444';
                                                            return <circle key={`dot-${index}`} cx={cx} cy={cy} r={3} fill={fill} />;
                                                        }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">
                                                <p>No historical data available</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Add a note about data filtering */}
                                    {responseTimeData.length > 0 && (
                                        <div className="text-xs text-gray-400 text-center mt-2">
                                            Note: Chart shows data from monitoring schedule only. Data outside monitoring hours is not displayed.
                                        </div>
                                    )}
                                </motion.div>

                                {/* Server configuration details */}
                                <motion.div
                                    className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <motion.div
                                        className="bg-gray-800 rounded-lg p-4"
                                        whileHover={{ y: -5, boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
                                    >
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
                                                <p className="text-sm">{formatTimestamp(selectedServer.uploadedAt || selectedServer.createdAt)}</p>
                                            </div>
                                            {selectedServer.description && (
                                                <div>
                                                    <p className="text-xs text-gray-400">Description</p>
                                                    <p className="text-sm">{selectedServer.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="bg-gray-800 rounded-lg p-4"
                                        whileHover={{ y: -5, boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
                                    >
                                        <h3 className="text-sm font-semibold text-gray-400 mb-3">Monitoring Status</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-gray-400">Status</p>
                                                <div className="flex items-center">
                                                    {selectedServer.status === 'up' ? (
                                                        <>
                                                            <CheckCircle size={16} className="text-green-500" />
                                                            <span className="ml-2 text-sm text-green-500">
                                                                Online
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertTriangle size={16} className="text-red-500" />
                                                            <span className="ml-2 text-sm text-red-500">
                                                                Down
                                                            </span>
                                                        </>
                                                    )}
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
                                    </motion.div>
                                </motion.div>
                            </motion.div>
                        )}

                        {activeTab === 'monitoring' && (
                            <motion.div
                                key="monitoring"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ type: "spring", damping: 25 }}
                            >
                                {/* Response Time Graph Large */}
                                <motion.div
                                    className="bg-gray-800 rounded-lg p-6 mb-6"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-medium text-blue-400">Response Time (ms)</h2>
                                        <div className="flex items-center text-sm">
                                            <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                                            <span className="text-gray-400 mr-3">Up</span>
                                            <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span>
                                            <span className="text-gray-400">Down</span>
                                        </div>
                                    </div>

                                    <div className="h-96">
                                        {responseTimeData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={formatChartData(responseTimeData)} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                    <XAxis dataKey="formattedTime" stroke="#94a3b8" />
                                                    <YAxis stroke="#94a3b8" />
                                                    <Tooltip content={CustomTooltip} />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="avgTime"
                                                        stroke="#3b82f6"
                                                        strokeWidth={2}
                                                        animationDuration={1500}
                                                        animationBegin={300}
                                                        activeDot={{ r: 6, fill: "#3b82f6" }}
                                                        dot={(props) => {
                                                            const { cx, cy, payload, index } = props;
                                                            const fill = payload.status === 'up' ? '#3b82f6' : '#ef4444';
                                                            return <circle key={`dot-${index}`} cx={cx} cy={cy} r={4} fill={fill} />;
                                                        }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">
                                                <p>No historical data available</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Incident History */}
                                <motion.div
                                    className="bg-gray-800 rounded-lg p-6"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <h3 className="text-lg font-medium text-white mb-4">Response Time Statistics</h3>

                                    {responseTimeData.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="bg-gray-700 p-4 rounded-lg">
                                                <p className="text-xs text-gray-400 mb-1">Average Response</p>
                                                <p className="text-2xl font-semibold text-white">
                                                    {Math.round(responseTimeData.reduce((sum, point) => sum + point.avgTime, 0) / responseTimeData.length)}ms
                                                </p>
                                            </div>
                                            <div className="bg-gray-700 p-4 rounded-lg">
                                                <p className="text-xs text-gray-400 mb-1">Maximum Response</p>
                                                <p className="text-2xl font-semibold text-white">
                                                    {Math.max(...responseTimeData.map(point => point.avgTime))}ms
                                                </p>
                                            </div>
                                            <div className="bg-gray-700 p-4 rounded-lg">
                                                <p className="text-xs text-gray-400 mb-1">Minimum Response</p>
                                                <p className="text-2xl font-semibold text-white">
                                                    {Math.min(...responseTimeData.map(point => point.avgTime))}ms
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-400 py-8">
                                            No response time data available for this server
                                        </div>
                                    )}
                                </motion.div>
                            </motion.div>
                        )}

                        {activeTab === 'settings' && (
                            <motion.div
                                key="settings"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ type: "spring", damping: 25 }}
                            >
                                {/* Monitoring Schedule */}
                                <motion.div
                                    className="bg-gray-800 rounded-lg p-6 mb-6"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <h3 className="text-lg font-medium text-white mb-4">Monitoring Schedule</h3>
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
                                </motion.div>

                                {/* Alert Settings */}
                                <motion.div
                                    className="bg-gray-800 rounded-lg p-6 mb-6"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <h3 className="text-lg font-medium text-white mb-4">Alert Settings</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Alert Preferences</p>
                                            <div className="flex space-x-4">
                                                <div className="flex items-center">
                                                    <span className={`w-4 h-4 rounded border ${selectedServer.monitoring?.alerts?.email ? 'bg-blue-600 border-blue-600' : 'border-gray-500'} inline-block mr-2`}>
                                                        {selectedServer.monitoring?.alerts?.email && (
                                                            <CheckCircle size={14} className="text-white" />
                                                        )}
                                                    </span>
                                                    <span className="text-sm">Email Alerts</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className={`w-4 h-4 rounded border ${selectedServer.monitoring?.alerts?.phone ? 'bg-blue-600 border-blue-600' : 'border-gray-500'} inline-block mr-2`}>
                                                        {selectedServer.monitoring?.alerts?.phone && (
                                                            <CheckCircle size={14} className="text-white" />
                                                        )}
                                                    </span>
                                                    <span className="text-sm">Phone Alerts</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Response Threshold</p>
                                            <p className="text-sm">
                                                Alert if response time exceeds {selectedServer.monitoring?.alerts?.responseThreshold || 1000}ms
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Contact Information */}
                                {(selectedServer.contactEmails?.length > 0 || selectedServer.contactPhones?.length > 0) && (
                                    <motion.div
                                        className="bg-gray-800 rounded-lg p-6 mb-6"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                    >
                                        <h3 className="text-lg font-medium text-white mb-4">Alert Contacts</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {selectedServer.contactEmails?.length > 0 && (
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-2">Email Contacts</p>
                                                    <div className="space-y-2 w-2/5">
                                                        {selectedServer.contactEmails.map((email, i) => (
                                                            <div key={i} className="bg-gray-700 px-3 py-2 rounded-lg text-sm flex items-center">
                                                                <Mail size={14} className="text-gray-400 mr-2" />
                                                                {email}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {selectedServer.contactPhones?.length > 0 && (
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-2">Phone Contacts</p>
                                                    <div className="space-y-2">
                                                        {selectedServer.contactPhones.map((phone, i) => (
                                                            <div key={i} className="bg-gray-700 px-3 py-2 rounded-lg text-sm flex items-center">
                                                                <Phone size={14} className="text-gray-400 mr-2" />
                                                                {phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Action buttons */}
                    <motion.div
                        className="flex justify-end space-x-3"
                        variants={childVariants}
                    >
                        <Link href={`/servers/${selectedServer._id || selectedServer.id}/settings`}>
                            <motion.button
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm px-4 py-2 flex items-center"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Settings size={16} className="mr-2" />
                                Manage Server
                            </motion.button>
                        </Link>
                    </motion.div>
                </>
            )}
        </motion.div>
    );
}