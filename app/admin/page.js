// app/admin/page.js

'use client';

import { useState, useEffect } from 'react';
import {
    BarChart4,
    Users,
    Server,
    AlertTriangle,
    Award,
    TrendingUp,
    TrendingDown,
    CheckCircle,
    Activity,
    RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        users: 0,
        servers: 0,
        alerts: 0,
        uptime: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [systemStatus, setSystemStatus] = useState({
        api: 'Operational',
        database: 'Operational',
        notification: 'Operational',
        monitoring: 'Operational'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const { apiRequest } = useAuth();

    // Animation variants
    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 10
            }
        }
    };

    const fetchAdminStats = async (isInitialLoad = true) => {
        if (isInitialLoad) setLoading(true);
        setError(null);
        if (!isInitialLoad) setRefreshing(true);

        try {
            // Get analytics data from the backend
            const analyticsResponse = await apiRequest('/api/admin/analytics', {
                method: 'GET',
                params: {
                    period: 'month' // Use monthly data for dashboard
                }
            });

            if (analyticsResponse.status !== 'success') {
                throw new Error(analyticsResponse.message || 'Failed to fetch analytics data');
            }

            const kpis = analyticsResponse.data.kpis;

            // Set the basic stats
            setStats({
                users: kpis.activeUsers || 0,
                servers: kpis.activeServers || 0,
                alerts: analyticsResponse.data.alertsByType.reduce((total, item) => total + item.value, 0),
                uptime: kpis.uptime || 0
            });

            // Fetch recent activity
            const serversResponse = await apiRequest('/api/servers?admin=true&limit=5&sortBy=updatedAt&sortDir=desc', {
                method: 'GET'
            });

            if (serversResponse.status !== 'success') {
                throw new Error(serversResponse.message || 'Failed to fetch servers data');
            }

            // Transform server data into activity entries
            const recentServers = serversResponse.data.servers || [];
            const activities = [];

            for (const server of recentServers) {
                try {
                    let userData;
                    let displayName = 'Unknown user';

                    // Check if uploadedBy is populated (object) or just an ID (string)
                    if (server.uploadedBy && typeof server.uploadedBy === 'object') {
                        userData = server.uploadedBy;
                        displayName = userData.displayName || userData.email || 'Unknown user';
                    } else {
                        // Fallback: Fetch user info if not populated
                        const userResponse = await apiRequest(`/api/users/${server.uploadedBy}`, {
                            method: 'GET'
                        });

                        if (userResponse.status === 'success') {
                            userData = userResponse.data.user;
                            displayName = userData.displayName || userData.email || 'Unknown user';
                        }
                    }

                    if (displayName) { // Proceed if we have a name (even "Unknown user")
                        // Calculate time ago
                        const uploadedAt = new Date(server.uploadedAt || server.createdAt);
                        const now = new Date();
                        const diffInMilliseconds = now - uploadedAt;

                        let timeAgo;
                        if (diffInMilliseconds < 60000) { // less than a minute
                            timeAgo = 'just now';
                        } else if (diffInMilliseconds < 3600000) { // less than an hour
                            const minutes = Math.floor(diffInMilliseconds / 60000);
                            timeAgo = `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
                        } else if (diffInMilliseconds < 86400000) { // less than a day
                            const hours = Math.floor(diffInMilliseconds / 3600000);
                            timeAgo = `${hours} hour${hours !== 1 ? 's' : ''} ago`;
                        } else {
                            const days = Math.floor(diffInMilliseconds / 86400000);
                            timeAgo = `${days} day${days !== 1 ? 's' : ''} ago`;
                        }

                        activities.push({
                            user: displayName,
                            action: server.lastStatusChange
                                ? `server "${server.name}" status changed to ${server.status}`
                                : `added server "${server.name}"`,
                            time: timeAgo
                        });
                    }
                } catch (err) {
                    console.error('Error processing recent activity:', err);
                }
            }

            setRecentActivity(activities);

            // Check system status
            try {
                const healthResponse = await apiRequest('/health', {
                    method: 'GET'
                });

                if (healthResponse.status === 'success') {
                    setSystemStatus(prevStatus => ({
                        ...prevStatus,
                        api: 'Operational'
                    }));
                }
            } catch (err) {
                setSystemStatus(prevStatus => ({
                    ...prevStatus,
                    api: 'Partial Outage'
                }));
            }

        } catch (err) {
            console.error('Error fetching admin stats:', err);
            setError('Failed to load admin dashboard data. Please try again.');
        } finally {
            if (isInitialLoad) setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAdminStats(true);

        // Set up an interval to refresh data every 60 seconds
        const intervalId = setInterval(() => {
            fetchAdminStats(false);
        }, 60000);

        // Clean up interval on component unmount
        return () => clearInterval(intervalId);
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchAdminStats();
    };

    // Stat card component
    const StatCard = ({ title, value, icon: Icon, color, change }) => {
        const isPositive = typeof change === 'number' ? change >= 0 : true;

        return (
            <motion.div
                className={`bg-gray-700 rounded-lg p-4 shadow-md`}
                variants={fadeIn}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
                        <p className="text-2xl font-bold text-white">{value}</p>
                        {change !== undefined && (
                            <div className="flex items-center mt-1">
                                {isPositive ?
                                    <TrendingUp size={14} className="text-green-500" /> :
                                    <TrendingDown size={14} className="text-red-500" />
                                }
                                <span className={`ml-1 text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                    {isPositive ? '+' : ''}{change}%
                                </span>
                            </div>
                        )}
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
                        <Icon size={20} className="text-white" />
                    </div>
                </div>
            </motion.div>
        );
    };

    if (loading && !refreshing) {
        return (
            <div className="flex justify-center items-center p-16 min-h-[80vh]">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-gray-400">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="text-white"
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: 0.1
                    }
                }
            }}
        >
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Admin Overview</h2>
                <button
                    onClick={handleRefresh}
                    className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg"
                    disabled={refreshing}
                    aria-label="Refresh data"
                    title="Refresh data"
                >
                    <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            {error && (
                <motion.div
                    className="bg-red-900/30 border border-red-600/50 rounded-lg p-4 mb-6 flex items-start"
                    variants={fadeIn}
                >
                    <AlertTriangle className="text-red-500 mr-2 flex-shrink-0 mt-0.5" size={18} />
                    <p className="text-red-200">{error}</p>
                </motion.div>
            )}

            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
                variants={fadeIn}
            >
                <StatCard
                    title="Total Users"
                    value={stats.users}
                    icon={Users}
                    color="bg-blue-600"
                />
                <StatCard
                    title="Monitored Servers"
                    value={stats.servers}
                    icon={Server}
                    color="bg-green-600"
                />
                <StatCard
                    title="Active Alerts"
                    value={stats.alerts}
                    icon={AlertTriangle}
                    color="bg-red-600"
                />
                <StatCard
                    title="System Uptime"
                    value={`${stats.uptime}%`}
                    icon={Award}
                    color="bg-purple-600"
                />
            </motion.div>

            <motion.div
                className="bg-gray-700 rounded-lg p-4 mb-6 shadow-md"
                variants={fadeIn}
            >
                <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
                <div className="space-y-3">
                    {recentActivity.length > 0 ? (
                        recentActivity.map((activity, index) => (
                            <motion.div
                                key={index}
                                className="flex justify-between items-center border-b border-gray-600 pb-2 last:border-0 last:pb-0"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div>
                                    <span className="font-medium text-blue-400">{activity.user}</span>
                                    <span className="text-gray-300"> {activity.action}</span>
                                </div>
                                <span className="text-gray-400 text-sm">{activity.time}</span>
                            </motion.div>
                        ))
                    ) : (
                        <motion.p
                            className="text-gray-400 text-center py-4"
                            variants={fadeIn}
                        >
                            No recent activity found
                        </motion.p>
                    )}
                </div>
            </motion.div>

            <div className="flex flex-col md:flex-row gap-4">
                <motion.div
                    className="bg-gray-700 rounded-lg p-4 flex-1 shadow-md"
                    variants={fadeIn}
                >
                    <h3 className="text-lg font-medium mb-4">System Status</h3>
                    <div className="space-y-3">
                        {Object.entries(systemStatus).map(([service, status], index) => (
                            <motion.div
                                key={service}
                                className="flex justify-between items-center"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <span className="text-gray-300 capitalize">{service} Service</span>
                                <div className="flex items-center">
                                    <div className={`w-2 h-2 rounded-full mr-2 ${status === 'Operational' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                    <span className={`${status === 'Operational' ? 'text-green-400' : 'text-yellow-400'}`}>
                                        {status}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    className="bg-gray-700 rounded-lg p-6 flex-1 shadow-md hover:shadow-lg transition-all border border-gray-700 hover:border-gray-600"
                    variants={fadeIn}
                >
                    <h3 className="text-xl font-semibold mb-5 text-white flex items-center">
                        <span className="bg-indigo-600 p-1.5 rounded-md mr-2 inline-flex">
                            <Activity size={18} className="text-white" />
                        </span>
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Link href="/admin/users" className="group">
                            <motion.button
                                className="w-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg p-4 text-sm flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg"
                                whileHover={{ y: -2, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                                whileTap={{ y: 0, boxShadow: "none" }}
                            >
                                <Users size={18} className="mr-2 group-hover:animate-pulse" />
                                Manage Users
                            </motion.button>
                        </Link>
                        <Link href="/dashboard" className="group">
                            <motion.button
                                className="w-full bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-lg p-4 text-sm flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg"
                                whileHover={{ y: -2, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                                whileTap={{ y: 0, boxShadow: "none" }}
                            >
                                <Server size={18} className="mr-2 group-hover:animate-pulse" />
                                View Servers
                            </motion.button>
                        </Link>
                    </div>

                    <Link href="/admin/analytics">
                        <motion.button
                            className="w-full mt-4 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg p-4 text-sm flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg"
                            whileHover={{ y: -2, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                            whileTap={{ y: 0, boxShadow: "none" }}
                        >
                            <BarChart4 size={18} className="mr-2" />
                            View Detailed Analytics
                        </motion.button>
                    </Link>
                </motion.div>
            </div>
        </motion.div>
    );
}