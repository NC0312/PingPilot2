'use client';

import { useState, useEffect } from 'react';
import { BarChart4, Users, Server, AlertTriangle, Award } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        users: 0,
        servers: 0,
        alerts: 0,
        uptime: 0
    });

    useEffect(() => {
        // In a real implementation, this would fetch data from your API
        const fetchAdminStats = async () => {
            try {
                // Mock data for demo purposes
                setStats({
                    users: 42,
                    servers: 128,
                    alerts: 7,
                    uptime: 99.8
                });
            } catch (error) {
                console.error('Error fetching admin stats:', error);
            }
        };

        fetchAdminStats();
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
                    {[
                        { user: 'John Doe', action: 'added a new server', time: '2 minutes ago' },
                        { user: 'Jane Smith', action: 'upgraded to yearly plan', time: '45 minutes ago' },
                        { user: 'Mike Johnson', action: 'reported a downtime issue', time: '1 hour ago' },
                        { user: 'Sarah Williams', action: 'requested support', time: '3 hours ago' },
                    ].map((activity, index) => (
                        <div key={index} className="flex justify-between items-center border-b border-gray-600 pb-2 last:border-0 last:pb-0">
                            <div>
                                <span className="font-medium text-blue-400">{activity.user}</span>
                                <span className="text-gray-300"> {activity.action}</span>
                            </div>
                            <span className="text-gray-400 text-sm">{activity.time}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="bg-gray-700 rounded-lg p-4 flex-1">
                    <h3 className="text-lg font-medium mb-4">System Status</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-300">API Service</span>
                            <span className="text-green-400">Operational</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-300">Database</span>
                            <span className="text-green-400">Operational</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-300">Notification Service</span>
                            <span className="text-green-400">Operational</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-300">Monitoring Service</span>
                            <span className="text-yellow-400">Partial Outage</span>
                        </div>
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