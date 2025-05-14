'use client';

import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { collection, query, getDocs, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/app/firebase/config';
import { Calendar, ArrowDownUp, Filter, RefreshCw, AlertTriangle } from 'lucide-react';

export default function AdminAnalytics() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        userGrowth: [],
        serverStatus: [],
        alertsByType: [],
        responseTime: []
    });
    const [dateRange, setDateRange] = useState('month'); // 'week', 'month', 'year'
    const [refreshing, setRefreshing] = useState(false);
    const [kpis, setKpis] = useState({
        avgResponseTime: 0,
        uptime: 0,
        activeServers: 0,
        activeUsers: 0,
        responseTimeChange: 0,
        uptimeChange: 0,
        serversChange: 0,
        usersChange: 0
    });

    // Different colors for the pie charts
    const COLORS = ['#0088FE', '#FF8042', '#FFBB28', '#00C49F', '#AF19FF'];
    const SERVER_STATUS_COLORS = ['#10b981', '#ef4444']; // green, red

    const fetchAnalyticsData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Calculate date range
            const now = new Date();
            let startDate;
            let previousPeriodStart;
            let previousPeriodEnd;

            switch (dateRange) {
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    previousPeriodStart = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                    previousPeriodEnd = new Date(startDate.getTime() - 1);
                    break;
                case 'month':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    previousPeriodStart = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
                    previousPeriodEnd = new Date(startDate.getTime() - 1);
                    break;
                case 'year':
                    startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    previousPeriodStart = new Date(startDate.getTime() - 365 * 24 * 60 * 60 * 1000);
                    previousPeriodEnd = new Date(startDate.getTime() - 1);
                    break;
                default:
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    previousPeriodStart = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
                    previousPeriodEnd = new Date(startDate.getTime() - 1);
            }

            // User growth data - aggregate users by signup date
            const usersRef = collection(db, 'users');

            // Current period users
            const usersQuery = query(
                usersRef,
                where('createdAt', '>=', startDate.getTime()),
                orderBy('createdAt', 'asc')
            );

            const usersSnapshot = await getDocs(usersQuery);

            // Previous period users for comparison
            const previousUsersQuery = query(
                usersRef,
                where('createdAt', '>=', previousPeriodStart.getTime()),
                where('createdAt', '<=', previousPeriodEnd.getTime())
            );

            const previousUsersSnapshot = await getDocs(previousUsersQuery);

            // Group users by date for the chart
            const usersByDate = {};

            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                const createdAt = new Date(userData.createdAt);

                // Format date based on range
                let dateKey;
                if (dateRange === 'week') {
                    dateKey = createdAt.toLocaleDateString('en-US', { weekday: 'short' });
                } else if (dateRange === 'month') {
                    dateKey = createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                } else { // year
                    dateKey = createdAt.toLocaleDateString('en-US', { month: 'short' });
                }

                if (!usersByDate[dateKey]) {
                    usersByDate[dateKey] = 0;
                }
                usersByDate[dateKey]++;
            });

            // Convert to array format for chart
            const userGrowthData = Object.keys(usersByDate).map(date => ({
                name: date,
                users: usersByDate[date]
            }));

            // Server status data - get current status distribution
            const serversRef = collection(db, 'servers');
            const serversSnapshot = await getDocs(serversRef);

            // Current period servers
            const currentServersQuery = query(
                serversRef,
                where('uploadedAt', '>=', startDate.toISOString())
            );

            const currentServersSnapshot = await getDocs(currentServersQuery);

            // Previous period servers for comparison
            const previousServersQuery = query(
                serversRef,
                where('uploadedAt', '>=', previousPeriodStart.toISOString()),
                where('uploadedAt', '<=', previousPeriodEnd.toISOString())
            );

            const previousServersSnapshot = await getDocs(previousServersQuery);

            const statusCounts = { up: 0, down: 0 };
            let totalResponseTime = 0;
            let responseTimeCount = 0;

            serversSnapshot.forEach(doc => {
                const serverData = doc.data();
                if (serverData.status === 'up') {
                    statusCounts.up++;

                    // Calculate average response time
                    if (serverData.responseTime) {
                        totalResponseTime += serverData.responseTime;
                        responseTimeCount++;
                    }
                } else {
                    // Any status that's not 'up' is considered 'down'
                    statusCounts.down++;
                }
            });

            const serverStatusData = [
                { name: 'Up', value: statusCounts.up },
                { name: 'Down', value: statusCounts.down }
            ];

            // For alerts by type, in a real implementation, you would have a dedicated collection
            // For this example, we'll analyze server error messages to categorize issues
            const alertsQuery = query(
                serversRef,
                where('status', 'in', ['down', 'error'])
            );

            const alertsSnapshot = await getDocs(alertsQuery);

            const alertsByType = {
                'Response Time': 0,
                'Connection Failed': 0,
                'Certificate Error': 0,
                'DNS Error': 0,
                'Other': 0
            };

            alertsSnapshot.forEach(doc => {
                const serverData = doc.data();
                const errorMessage = serverData.error || '';

                if (errorMessage.includes('timeout') || errorMessage.includes('slow')) {
                    alertsByType['Response Time']++;
                } else if (errorMessage.includes('connect') || errorMessage.includes('refused')) {
                    alertsByType['Connection Failed']++;
                } else if (errorMessage.includes('certificate') || errorMessage.includes('SSL')) {
                    alertsByType['Certificate Error']++;
                } else if (errorMessage.includes('DNS') || errorMessage.includes('resolve')) {
                    alertsByType['DNS Error']++;
                } else {
                    alertsByType['Other']++;
                }
            });

            const alertsData = Object.keys(alertsByType).map(type => ({
                name: type,
                value: alertsByType[type]
            }));

            // Response time data - in a real implementation, you would have historical data
            // For this example, we'll generate hourly averages from current server data
            const hourlyResponseTimes = {};

            serversSnapshot.forEach(doc => {
                const serverData = doc.data();
                if (serverData.status === 'up' && serverData.responseTime) {
                    // Only use servers with valid response times
                    const lastChecked = new Date(serverData.lastChecked);
                    const hour = lastChecked.getHours();

                    // Group by 3-hour intervals for a cleaner chart
                    const hourGroup = Math.floor(hour / 3) * 3;
                    const hourKey = `${hourGroup}:00`;

                    if (!hourlyResponseTimes[hourKey]) {
                        hourlyResponseTimes[hourKey] = {
                            total: 0,
                            count: 0
                        };
                    }

                    hourlyResponseTimes[hourKey].total += serverData.responseTime;
                    hourlyResponseTimes[hourKey].count++;
                }
            });

            const responseTimeData = Object.keys(hourlyResponseTimes)
                .sort((a, b) => {
                    const hourA = parseInt(a.split(':')[0]);
                    const hourB = parseInt(b.split(':')[0]);
                    return hourA - hourB;
                })
                .map(hour => ({
                    name: hour,
                    avgTime: Math.round(hourlyResponseTimes[hour].total / hourlyResponseTimes[hour].count)
                }));

            // Calculate KPIs and changes
            const totalServers = serversSnapshot.size;
            const avgResponseTime = responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : 0;
            const uptime = totalServers > 0 ? ((statusCounts.up / totalServers) * 100).toFixed(1) : 0;

            // Calculate changes compared to previous period
            // For demonstration, we'll generate relative changes
            // In a real implementation, you'd calculate this from historical data
            const prevUptime = 99.6; // Placeholder - in a real scenario, calculate from previous data
            const prevAvgResponseTime = 320; // Placeholder

            const currentUsers = usersSnapshot.size;
            const previousUsers = previousUsersSnapshot.size;
            const usersChange = previousUsers > 0 ? ((currentUsers - previousUsers) / previousUsers * 100).toFixed(0) : '+100';

            const currentServers = currentServersSnapshot.size;
            const previousServers = previousServersSnapshot.size;
            const serversChange = previousServers > 0 ? ((currentServers - previousServers) / previousServers * 100).toFixed(0) : '+100';

            const uptimeChange = ((parseFloat(uptime) - prevUptime) / prevUptime * 100).toFixed(1);
            const responseTimeChange = ((avgResponseTime - prevAvgResponseTime) / prevAvgResponseTime * 100).toFixed(0);

            setData({
                userGrowth: userGrowthData,
                serverStatus: serverStatusData,
                alertsByType: alertsData,
                responseTime: responseTimeData
            });

            setKpis({
                avgResponseTime,
                uptime,
                activeServers: totalServers,
                activeUsers: usersSnapshot.size,
                responseTimeChange,
                uptimeChange,
                serversChange,
                usersChange
            });

        } catch (error) {
            console.error('Error fetching analytics data:', error);
            setError('Failed to load analytics data. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAnalyticsData();

        // Set up refresh interval - every 5 minutes
        const intervalId = setInterval(() => {
            fetchAnalyticsData();
        }, 5 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [dateRange]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchAnalyticsData();
    };

    if (loading && !refreshing) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Custom tooltip component for charts with dark theme
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-800 p-3 border border-gray-700 rounded shadow-lg">
                    <p className="text-gray-300 font-medium">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={`item-${index}`} style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="text-white">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">System Analytics</h2>

                <div className="flex space-x-2">
                    <div className="bg-gray-700 rounded-lg flex p-1">
                        <button
                            onClick={() => setDateRange('week')}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${dateRange === 'week' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setDateRange('month')}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${dateRange === 'month' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => setDateRange('year')}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${dateRange === 'year' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`}
                        >
                            Year
                        </button>
                    </div>

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
            </div>

            {error && (
                <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4 mb-6 flex items-start">
                    <AlertTriangle className="text-red-500 mr-2 flex-shrink-0 mt-0.5" size={18} />
                    <p className="text-red-200">{error}</p>
                </div>
            )}

            {/* Key Metrics */}
            <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium mb-4">Key Performance Indicators</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-800 rounded-lg p-4">
                        <div className="text-gray-400 text-sm">Avg. Response Time</div>
                        <div className="text-2xl font-bold mt-1">{kpis.avgResponseTime}ms</div>
                        <div className={`text-sm mt-2 ${parseInt(kpis.responseTimeChange) < 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {kpis.responseTimeChange}% {parseInt(kpis.responseTimeChange) < 0 ? '↓' : '↑'}
                        </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                        <div className="text-gray-400 text-sm">Uptime</div>
                        <div className="text-2xl font-bold mt-1">{kpis.uptime}%</div>
                        <div className={`text-sm mt-2 ${parseFloat(kpis.uptimeChange) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {kpis.uptimeChange}% {parseFloat(kpis.uptimeChange) > 0 ? '↑' : '↓'}
                        </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                        <div className="text-gray-400 text-sm">Active Servers</div>
                        <div className="text-2xl font-bold mt-1">{kpis.activeServers}</div>
                        <div className={`text-sm mt-2 ${parseInt(kpis.serversChange) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {kpis.serversChange}% {parseInt(kpis.serversChange) > 0 ? '↑' : '↓'}
                        </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                        <div className="text-gray-400 text-sm">Active Users</div>
                        <div className="text-2xl font-bold mt-1">{kpis.activeUsers}</div>
                        <div className={`text-sm mt-2 ${parseInt(kpis.usersChange) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {kpis.usersChange}% {parseInt(kpis.usersChange) > 0 ? '↑' : '↓'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* User Growth Chart */}
                <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">User Growth</h3>
                    {data.userGrowth.length > 0 ? (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={data.userGrowth}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                    <XAxis dataKey="name" stroke="#999" />
                                    <YAxis stroke="#999" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ color: '#fff' }} />
                                    <Area
                                        type="monotone"
                                        dataKey="users"
                                        name="Users"
                                        stroke="#3b82f6"
                                        fill="#3b82f6"
                                        fillOpacity={0.3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-72 flex items-center justify-center">
                            <p className="text-gray-400">No user growth data available for this period</p>
                        </div>
                    )}
                </div>

                {/* Average Response Time Chart */}
                <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Avg. Response Time (ms)</h3>
                    {data.responseTime.length > 0 ? (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={data.responseTime}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                    <XAxis dataKey="name" stroke="#999" />
                                    <YAxis stroke="#999" />
                                    <Tooltip content={<CustomTooltip />} />
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
                    ) : (
                        <div className="h-72 flex items-center justify-center">
                            <p className="text-gray-400">No response time data available</p>
                        </div>
                    )}
                </div>

                {/* Server Status Pie Chart */}
                <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Server Status</h3>
                    {data.serverStatus.some(item => item.value > 0) ? (
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
                                            <Cell key={`cell-${index}`} fill={SERVER_STATUS_COLORS[index % SERVER_STATUS_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-72 flex items-center justify-center">
                            <p className="text-gray-400">No server status data available</p>
                        </div>
                    )}
                </div>

                {/* Alerts by Type Pie Chart */}
                <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Alerts by Type</h3>
                    {data.alertsByType.some(item => item.value > 0) ? (
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
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-72 flex items-center justify-center">
                            <p className="text-gray-400">No alerts data available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}