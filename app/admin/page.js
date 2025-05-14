'use client';

import { useState, useEffect } from 'react';
import { BarChart4, Users, Server, AlertTriangle, Award } from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/app/firebase/config';

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

    useEffect(() => {
        const fetchAdminStats = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch total users count
                const usersRef = collection(db, 'users');
                const usersSnapshot = await getDocs(usersRef);
                const userCount = usersSnapshot.size;

                // Fetch total servers count
                const serversRef = collection(db, 'servers');
                const serversSnapshot = await getDocs(serversRef);
                const serverCount = serversSnapshot.size;

                // Count active alerts (servers with status 'down' or 'error')
                const alertQuery = query(
                    serversRef,
                    where('status', 'in', ['down', 'error'])
                );
                const alertSnapshot = await getDocs(alertQuery);
                const alertCount = alertSnapshot.size;

                // Calculate uptime percentage based on server status
                let uptimePercentage = 0;
                if (serverCount > 0) {
                    const upServers = query(
                        serversRef,
                        where('status', '==', 'up')
                    );
                    const upServersSnapshot = await getDocs(upServers);
                    uptimePercentage = ((upServersSnapshot.size / serverCount) * 100).toFixed(1);
                }

                setStats({
                    users: userCount,
                    servers: serverCount,
                    alerts: alertCount,
                    uptime: uptimePercentage
                });

                // Fetch recent activity
                // In a real implementation, you would have an activityLogs collection
                // For now, we'll synthesize activity from servers and users collections

                // Get recent server additions
                const recentServersQuery = query(
                    serversRef,
                    orderBy('uploadedAt', 'desc'),
                    limit(5)
                );
                const recentServersSnapshot = await getDocs(recentServersQuery);

                const serverActivities = [];
                for (const serverDoc of recentServersSnapshot.docs) {
                    const serverData = serverDoc.data();

                    // Get user info for each server
                    if (serverData.uploadedBy) {
                        const userRef = collection(db, 'users');
                        const userQuery = query(userRef, where('uid', '==', serverData.uploadedBy));
                        const userSnapshot = await getDocs(userQuery);

                        if (!userSnapshot.empty) {
                            const userData = userSnapshot.docs[0].data();
                            const displayName = userData.displayName || userData.email || 'Unknown user';

                            // Calculate time ago
                            const uploadedAt = new Date(serverData.uploadedAt);
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

                            serverActivities.push({
                                user: displayName,
                                action: `added a new server "${serverData.name}"`,
                                time: timeAgo
                            });
                        }
                    }
                }

                // Fetch system status (this would typically come from a status collection)
                // For now, we'll simulate this with a random issue for demo purposes
                const services = ['api', 'database', 'notification', 'monitoring'];
                const randomService = services[Math.floor(Math.random() * services.length)];
                const randomStatus = Math.random() > 0.8 ? 'Partial Outage' : 'Operational';

                setSystemStatus({
                    ...systemStatus,
                    [randomService]: randomStatus
                });

                setRecentActivity(serverActivities);
            } catch (error) {
                console.error('Error fetching admin stats:', error);
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

                <div className="bg-gray-700 rounded-lg p-4 flex-1">
                    <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3 text-sm flex items-center justify-center">
                            <Users size={16} className="mr-2" />
                            Manage Users
                        </button>
                        <button className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-3 text-sm flex items-center justify-center">
                            <Server size={16} className="mr-2" />
                            View Servers
                        </button>
                        <button className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg p-3 text-sm flex items-center justify-center">
                            <Award size={16} className="mr-2" />
                            Subscription Plans
                        </button>
                        <button className="bg-red-600 hover:bg-red-700 text-white rounded-lg p-3 text-sm flex items-center justify-center">
                            <AlertTriangle size={16} className="mr-2" />
                            View Alerts
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}