'use client';

import { useState, useEffect } from 'react';
import { BarChart4, Users, Server, AlertTriangle, Award } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

// Set the base URL for API requests
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ping-pilott-backend.onrender.com/api';

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

    // Get token from local storage for authentication
    const getToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return null;
    };

    // Setup axios instance with authorization headers
    const authAxios = axios.create({
        baseURL: API_BASE_URL,
        headers: {
            'Content-Type': 'application/json'
        }
    });

    // Add interceptor to add token to every request
    authAxios.interceptors.request.use(
        config => {
            const token = getToken();
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            return config;
        },
        error => {
            return Promise.reject(error);
        }
    );

    useEffect(() => {
        const fetchAdminStats = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch total users count
                const usersResponse = await authAxios.get('/users');
                const userCount = usersResponse.data.total || 0;

                // Fetch total servers count and active alerts
                const serversResponse = await authAxios.get('/servers?admin=true');
                const serverCount = serversResponse.data.total || 0;

                // Count servers with status 'down' or 'error'
                const alertCount = serversResponse.data.data.servers.filter(
                    server => server.status === 'down' || server.error
                ).length;

                // Calculate uptime percentage based on server status
                let uptimePercentage = 0;
                if (serverCount > 0) {
                    const upServers = serversResponse.data.data.servers.filter(
                        server => server.status === 'up'
                    ).length;
                    uptimePercentage = ((upServers / serverCount) * 100).toFixed(1);
                }

                setStats({
                    users: userCount,
                    servers: serverCount,
                    alerts: alertCount,
                    uptime: uptimePercentage
                });

                // Fetch recent activity from servers, ordered by most recent
                const recentServersResponse = await authAxios.get('/servers?admin=true&sortBy=uploadedAt&sortDir=desc&limit=5');
                const recentServers = recentServersResponse.data.data.servers;

                // Transform server data into activity entries
                const activities = await Promise.all(recentServers.map(async server => {
                    try {
                        // Get user info for each server
                        const userResponse = await authAxios.get(`/users/${server.uploadedBy}`);
                        const userData = userResponse.data.data.user;
                        const displayName = userData.displayName || userData.email || 'Unknown user';

                        // Calculate time ago
                        const uploadedAt = new Date(server.uploadedAt);
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

                        return {
                            user: displayName,
                            action: `added a new server "${server.name}"`,
                            time: timeAgo
                        };
                    } catch (err) {
                        console.error('Error fetching user data:', err);
                        return null;
                    }
                }));

                // Filter out any null values from the activities array
                setRecentActivity(activities.filter(activity => activity !== null));

                // Check system status (API health endpoint)
                try {
                    await authAxios.get('/health');
                    setSystemStatus({
                        ...systemStatus,
                        api: 'Operational'
                    });
                } catch (err) {
                    setSystemStatus({
                        ...systemStatus,
                        api: 'Partial Outage'
                    });
                }

                // Simulate other system status checks
                // In a real implementation, you would check each service individually
                const services = ['database', 'notification', 'monitoring'];
                const randomService = services[Math.floor(Math.random() * services.length)];
                const randomStatus = Math.random() > 0.8 ? 'Partial Outage' : 'Operational';

                setSystemStatus(prevStatus => ({
                    ...prevStatus,
                    [randomService]: randomStatus
                }));
            } catch (err) {
                console.error('Error fetching admin stats:', err);
                setError('Failed to load admin dashboard data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchAdminStats();

        // Set up an interval to refresh data every 60 seconds
        const intervalId = setInterval(fetchAdminStats, 60000);

        // Clean up interval on component unmount
        return () => clearInterval(intervalId);
    }, []);

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className={`bg-gray-700 rounded-lg p-4 flex justify-between items-center`}>
            <div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
                <Icon size={20} className="text-white" />
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="text-white p-6">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-white p-6">
                <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4 text-center">
                    <AlertTriangle size={32} className="mx-auto text-red-500 mb-2" />
                    <h3 className="text-xl font-medium text-white mb-2">Error Loading Dashboard</h3>
                    <p className="text-red-200">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="text-white">
            <h2 className="text-xl font-bold mb-6">Admin Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
            </div>

            <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
                <div className="space-y-3">
                    {recentActivity.length > 0 ? (
                        recentActivity.map((activity, index) => (
                            <div key={index} className="flex justify-between items-center border-b border-gray-600 pb-2 last:border-0 last:pb-0">
                                <div>
                                    <span className="font-medium text-blue-400">{activity.user}</span>
                                    <span className="text-gray-300"> {activity.action}</span>
                                </div>
                                <span className="text-gray-400 text-sm">{activity.time}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400 text-center py-4">No recent activity found</p>
                    )}
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="bg-gray-700 rounded-lg p-4 flex-1">
                    <h3 className="text-lg font-medium mb-4">System Status</h3>
                    <div className="space-y-3">
                        {Object.entries(systemStatus).map(([service, status]) => (
                            <div key={service} className="flex justify-between items-center">
                                <span className="text-gray-300 capitalize">{service} Service</span>
                                <span className={`${status === 'Operational' ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-6 flex-1 shadow-lg border border-gray-700 hover:border-gray-600 transition-all">
                    <h3 className="text-xl font-semibold mb-5 text-white flex items-center">
                        <span className="bg-indigo-600 p-1.5 rounded-md mr-2 inline-flex">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                        </span>
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Link href="/admin/users" className="group">
                            <button className="w-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg p-4 text-sm flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg group-hover:translate-y-[-2px]">
                                <Users size={18} className="mr-2 group-hover:animate-pulse" />
                                Manage Users
                            </button>
                        </Link>
                        <Link href="/dashboard" className="group">
                            <button className="w-full bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-lg p-4 text-sm flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg group-hover:translate-y-[-2px]">
                                <Server size={18} className="mr-2 group-hover:animate-pulse" />
                                View Servers
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}