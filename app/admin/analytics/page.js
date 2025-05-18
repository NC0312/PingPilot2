'use client';

import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Calendar, ArrowDownUp, Filter, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { getApiUrl } from '@/lib/apiConfig';

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

    const { apiRequest } = useAuth();

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

            // Format dates for API queries
            const startDateStr = startDate.toISOString();
            const previousPeriodStartStr = previousPeriodStart.toISOString();
            const previousPeriodEndStr = previousPeriodEnd.toISOString();

            // Fetch analytics data from API
            const analyticsResponse = await apiRequest('/api/admin/analytics', {
                method: 'GET',
                params: {
                    startDate: startDateStr,
                    endDate: now.toISOString(),
                    prevStartDate: previousPeriodStartStr,
                    prevEndDate: previousPeriodEndStr,
                    period: dateRange
                }
            });

            if (analyticsResponse.status !== 'success') {
                throw new Error(analyticsResponse.message || 'Failed to fetch analytics data');
            }

            const analyticsData = analyticsResponse.data;

            // If API returns formatted data, use it directly
            if (analyticsData && analyticsData.userGrowth && analyticsData.serverStatus &&
                analyticsData.alertsByType && analyticsData.responseTime && analyticsData.kpis) {

                setData({
                    userGrowth: analyticsData.userGrowth,
                    serverStatus: analyticsData.serverStatus,
                    alertsByType: analyticsData.alertsByType,
                    responseTime: analyticsData.responseTime
                });

                setKpis(analyticsData.kpis);
            } else {
                // If API doesn't return formatted data, we need to fetch and process separately

                // Fetch users
                const usersResponse = await apiRequest('/api/users', {
                    method: 'GET'
                });

                // Fetch servers
                const serversResponse = await apiRequest('/api/servers?admin=true', {
                    method: 'GET'
                });

                if (usersResponse.status !== 'success' || serversResponse.status !== 'success') {
                    throw new Error('Failed to fetch required data');
                }

                const users = usersResponse.data.users || [];
                const servers = serversResponse.data.servers || [];

                // Process user growth data
                const usersByDate = {};

                // Filter users by creation date
                const currentPeriodUsers = users.filter(user => {
                    const createdAt = new Date(user.createdAt);
                    return createdAt >= startDate && createdAt <= now;
                });

                const previousPeriodUsers = users.filter(user => {
                    const createdAt = new Date(user.createdAt);
                    return createdAt >= previousPeriodStart && createdAt <= previousPeriodEnd;
                });

                // Group users by date
                currentPeriodUsers.forEach(user => {
                    const createdAt = new Date(user.createdAt);

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

                const userGrowthData = Object.keys(usersByDate).map(date => ({
                    name: date,
                    users: usersByDate[date]
                }));

                // Process server status data
                const statusCounts = { up: 0, down: 0 };
                let totalResponseTime = 0;
                let responseTimeCount = 0;

                servers.forEach(server => {
                    if (server.status === 'up') {
                        statusCounts.up++;

                        // Calculate average response time
                        if (server.responseTime) {
                            totalResponseTime += server.responseTime;
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

                // Process alerts by type
                const downServers = servers.filter(server => server.status !== 'up');

                const alertsByType = {
                    'Response Time': 0,
                    'Connection Failed': 0,
                    'Certificate Error': 0,
                    'DNS Error': 0,
                    'Other': 0
                };

                downServers.forEach(server => {
                    const errorMessage = server.error || '';

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

                // Process response time data
                // For hourly averages, we'll use the check history if available
                // Otherwise, simulate from current server data
                const hourlyResponseTimes = {};

                // Try to get server check history
                try {
                    // For each server, get check history
                    for (const server of servers) {
                        if (server.status !== 'up') continue;

                        // Placeholder - in a real implementation, fetch history from your API
                        const lastChecked = new Date(server.lastChecked);
                        if (!lastChecked) continue;

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

                        if (server.responseTime) {
                            hourlyResponseTimes[hourKey].total += server.responseTime;
                            hourlyResponseTimes[hourKey].count++;
                        }
                    }
                } catch (err) {
                    console.error('Error processing response time data:', err);
                }

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

                // Calculate KPIs
                const totalServers = servers.length;
                const avgResponseTime = responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : 0;
                const uptime = totalServers > 0 ? ((statusCounts.up / totalServers) * 100).toFixed(1) : 0;

                // Calculate changes compared to previous period
                // For demonstration, use some placeholder values
                const prevUptime = 99.6;
                const prevAvgResponseTime = 320;

                const currentUsers = currentPeriodUsers.length;
                const previousUsers = previousPeriodUsers.length;
                const usersChange = previousUsers > 0 ? ((currentUsers - previousUsers) / previousUsers * 100).toFixed(0) : '+100';

                // Filter servers by creation date for comparison
                const currentPeriodServers = servers.filter(server => {
                    const createdAt = new Date(server.createdAt || server.uploadedAt);
                    return createdAt >= startDate && createdAt <= now;
                });

                const previousPeriodServers = servers.filter(server => {
                    const createdAt = new Date(server.createdAt || server.uploadedAt);
                    return createdAt >= previousPeriodStart && createdAt <= previousPeriodEnd;
                });

                const currentServers = currentPeriodServers.length;
                const previousServers = previousPeriodServers.length;
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
                    activeUsers: users.length,
                    responseTimeChange,
                    uptimeChange,
                    serversChange,
                    usersChange
                });
            }
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