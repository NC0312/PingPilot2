'use client';

import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

export default function AdminAnalytics() {
    // Mock data for visualizations
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        userGrowth: [],
        serverStatus: [],
        alertsByType: [],
        responseTime: []
    });

    useEffect(() => {
        // In a real app, this would fetch from your API
        const fetchAnalyticsData = async () => {
            try {
                // Mock data for demo
                setData({
                    userGrowth: [
                        { name: 'Jan', users: 40 },
                        { name: 'Feb', users: 55 },
                        { name: 'Mar', users: 72 },
                        { name: 'Apr', users: 89 },
                        { name: 'May', users: 110 },
                        { name: 'Jun', users: 142 }
                    ],
                    serverStatus: [
                        { name: 'Up', value: 84 },
                        { name: 'Down', value: 7 },
                        { name: 'Warning', value: 12 },
                    ],
                    alertsByType: [
                        { name: 'Response Time', value: 42 },
                        { name: 'Connection Failed', value: 28 },
                        { name: 'Certificate Error', value: 15 },
                        { name: 'DNS Error', value: 9 },
                        { name: 'Other', value: 6 }
                    ],
                    responseTime: [
                        { name: '1am', avgTime: 235 },
                        { name: '4am', avgTime: 180 },
                        { name: '7am', avgTime: 320 },
                        { name: '10am', avgTime: 450 },
                        { name: '1pm', avgTime: 520 },
                        { name: '4pm', avgTime: 480 },
                        { name: '7pm', avgTime: 390 },
                        { name: '10pm', avgTime: 270 }
                    ]
                });
                setLoading(false);
            } catch (error) {
                console.error('Error fetching analytics data:', error);
                setLoading(false);
            }
        };

        fetchAnalyticsData();
    }, []);

    // Different colors for the pie charts
    const COLORS = ['#0088FE', '#FF8042', '#FFBB28', '#00C49F', '#AF19FF'];

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="text-white">
            <h2 className="text-xl font-bold mb-6">System Analytics</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* User Growth Chart */}
                <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">User Growth</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data.userGrowth}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                <XAxis dataKey="name" stroke="#999" />
                                <YAxis stroke="#999" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#333', borderColor: '#555' }}
                                    itemStyle={{ color: '#fff' }}
                                    labelStyle={{ color: '#fff' }}
                                />
                                <Legend wrapperStyle={{ color: '#fff' }} />
                                <Bar dataKey="users" name="Users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Average Response Time Chart */}
                <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Avg. Response Time (ms)</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={data.responseTime}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                <XAxis dataKey="name" stroke="#999" />
                                <YAxis stroke="#999" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#333', borderColor: '#555' }}
                                    itemStyle={{ color: '#fff' }}
                                    labelStyle={{ color: '#fff' }}
                                />
                                <Legend wrapperStyle={{ color: '#fff' }} />
                                <Line
                                    type="monotone"
                                    dataKey="avgTime"
                                    name="Response Time (ms)"
                                    stroke="#10b981"
                                    activeDot={{ r: 8 }}
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Server Status Pie Chart */}
                <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Server Status</h3>
                    <div className="h-72 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.serverStatus}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                    {data.serverStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#ef4444' : '#f59e0b'} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#333', borderColor: '#555' }}
                                    itemStyle={{ color: '#fff' }}
                                    labelStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Alerts by Type Pie Chart */}
                <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Alerts by Type</h3>
                    <div className="h-72 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.alertsByType}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                    {data.alertsByType.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#333', borderColor: '#555' }}
                                    itemStyle={{ color: '#fff' }}
                                    labelStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Key Performance Indicators</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Avg. Response Time', value: '312ms', change: '+5%', positive: false },
                        { label: 'Uptime', value: '99.8%', change: '+0.2%', positive: true },
                        { label: 'Active Servers', value: '128', change: '+12', positive: true },
                        { label: 'Active Users', value: '142', change: '+32', positive: true },
                    ].map((metric, index) => (
                        <div key={index} className="bg-gray-800 rounded-lg p-4">
                            <div className="text-gray-400 text-sm">{metric.label}</div>
                            <div className="text-2xl font-bold mt-1">{metric.value}</div>
                            <div className={`text-sm mt-2 ${metric.positive ? 'text-green-400' : 'text-red-400'}`}>
                                {metric.change} {metric.positive ? '↑' : '↓'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}