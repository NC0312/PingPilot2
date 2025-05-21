// app/admin/analytics/page.js

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Scatter, ScatterChart
} from 'recharts';
import {
    Calendar,
    ArrowDownUp,
    Filter,
    RefreshCw,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Database,
    Users,
    Clock,
    Zap
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { motion } from 'framer-motion';

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

    // Different colors for the charts
    const COLORS = ['#0088FE', '#FF8042', '#FFBB28', '#00C49F', '#AF19FF'];
    const SERVER_STATUS_COLORS = ['#10b981', '#ef4444']; // green, red

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

    const fetchAnalyticsData = async () => {
        setLoading(true);
        setError(null);
        setRefreshing(true);

        try {
            // Calculate date range
            const now = new Date();
            let startDate;

            switch (dateRange) {
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case 'year':
                    startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            }

            // Calculate previous period
            const previousPeriodStart = new Date(startDate);
            previousPeriodStart.setTime(startDate.getTime() - (now.getTime() - startDate.getTime()));
            const previousPeriodEnd = new Date(startDate);
            previousPeriodEnd.setTime(previousPeriodEnd.getTime() - 1);

            // Format dates for API query
            const startDateStr = startDate.toISOString();
            const endDateStr = now.toISOString();
            const prevStartDateStr = previousPeriodStart.toISOString();
            const prevEndDateStr = previousPeriodEnd.toISOString();

            // Fetch analytics data from API
            const response = await apiRequest('/api/admin/analytics', {
                method: 'GET',
                params: {
                    startDate: startDateStr,
                    endDate: endDateStr,
                    prevStartDate: prevStartDateStr,
                    prevEndDate: prevEndDateStr,
                    period: dateRange
                }
            });

            if (response.status !== 'success') {
                throw new Error(response.message || 'Failed to fetch analytics data');
            }

            const analyticsData = response.data;

            // Set the data for charts and KPIs
            setData({
                userGrowth: analyticsData.userGrowth || [],
                serverStatus: analyticsData.serverStatus || [],
                alertsByType: analyticsData.alertsByType || [],
                responseTime: analyticsData.responseTime || []
            });
            setKpis(analyticsData.kpis || {});
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

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-800 p-3 border border-gray-700 rounded shadow-lg">
                    <p className="text-gray-300 font-medium">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={`item-${index}`} style={{ color: entry.color || entry.fill }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Helper to format large numbers
    const formatNumber = (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num;
    };

    // KPI card component
    const KpiCard = ({ title, value, change, icon, colorClass }) => {
        const isPositive = parseFloat(change) >= 0;
        const changeText = `${isPositive ? '+' : ''}${change}%`;

        return (
            <motion.div
                className="bg-gray-800 rounded-lg p-4 shadow-md"
                variants={fadeIn}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="text-gray-400 text-sm">{title}</div>
                    <div className={`p-2 rounded-full ${colorClass}`}>
                        {icon}
                    </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">{value}</div>
                <div className="flex items-center text-sm">
                    {isPositive ?
                        <TrendingUp size={14} className="text-green-400 mr-1" /> :
                        <TrendingDown size={14} className="text-red-400 mr-1" />
                    }
                    <span className={isPositive ? "text-green-400" : "text-red-400"}>
                        {changeText}
                    </span>
                </div>
            </motion.div>
        );
    };

    const pieConfig = useMemo(() => ({
        cx: "50%",
        cy: "50%",
        outerRadius: 80,
        fill: "#8884d8",
        label: ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`,
        labelLine: { stroke: "#555", strokeWidth: 1 }
    }), []);

    if (loading && !refreshing) {
        return (
            <div className="flex justify-center items-center p-16 min-h-[80vh]">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-gray-400">Loading analytics data...</p>
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
                <motion.div
                    className="bg-red-900/30 border border-red-600/50 rounded-lg p-4 mb-6 flex items-start"
                    variants={fadeIn}
                >
                    <AlertTriangle className="text-red-500 mr-2 flex-shrink-0 mt-0.5" size={18} />
                    <p className="text-red-200">{error}</p>
                </motion.div>
            )}

            {/* Key Metrics */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
                variants={fadeIn}
            >
                <KpiCard
                    title="Avg. Response Time"
                    value={`${kpis.avgResponseTime}ms`}
                    change={kpis.responseTimeChange}
                    icon={<Clock size={18} className="text-blue-400" />}
                    colorClass="bg-blue-900/40"
                />
                <KpiCard
                    title="Uptime"
                    value={`${kpis.uptime}%`}
                    change={kpis.uptimeChange}
                    icon={<Zap size={18} className="text-green-400" />}
                    colorClass="bg-green-900/40"
                />
                <KpiCard
                    title="Active Servers"
                    value={formatNumber(kpis.activeServers)}
                    change={kpis.serversChange}
                    icon={<Database size={18} className="text-yellow-400" />}
                    colorClass="bg-yellow-900/40"
                />
                <KpiCard
                    title="Active Users"
                    value={formatNumber(kpis.activeUsers)}
                    change={kpis.usersChange}
                    icon={<Users size={18} className="text-purple-400" />}
                    colorClass="bg-purple-900/40"
                />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* User Growth Chart */}
                <motion.div
                    className="bg-gray-800 rounded-lg p-4 shadow-md"
                    variants={fadeIn}
                >
                    <h3 className="text-lg font-medium mb-4">User Growth</h3>
                    {data.userGrowth.length > 0 ? (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={data.userGrowth}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <defs>
                                        <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                    <XAxis dataKey="name" stroke="#999" />
                                    <YAxis stroke="#999" allowDecimals={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ color: '#fff' }} />
                                    <Area
                                        type="monotone"
                                        dataKey="users"
                                        name="Users"
                                        stroke="#3b82f6"
                                        fillOpacity={1}
                                        fill="url(#userGrowthGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-72 flex items-center justify-center">
                            <p className="text-gray-400">No user growth data available for this period</p>
                        </div>
                    )}
                </motion.div>

                {/* Average Response Time Chart */}
                <motion.div
                    className="bg-gray-800 rounded-lg p-4 shadow-md"
                    variants={fadeIn}
                >
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
                </motion.div>

                {/* Server Status Pie Chart */}
                <motion.div
                    className="bg-gray-800 rounded-lg p-4 shadow-md"
                    variants={fadeIn}
                >
                    <h3 className="text-lg font-medium mb-4">Server Status</h3>
                    {data.serverStatus.some(item => item.value > 0) ? (
                        <div className="h-72 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.serverStatus}
                                        {...pieConfig}
                                        dataKey="value"
                                    >
                                        {data.serverStatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={SERVER_STATUS_COLORS[index % SERVER_STATUS_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend formatter={(value) => <span style={{ color: '#fff' }}>{value}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-72 flex items-center justify-center">
                            <p className="text-gray-400">No server status data available</p>
                        </div>
                    )}
                </motion.div>

                {/* Alerts by Type Pie Chart */}
                <motion.div
                    className="bg-gray-800 rounded-lg p-4 shadow-md"
                    variants={fadeIn}
                >
                    <h3 className="text-lg font-medium mb-4">Alerts by Type</h3>
                    {data.alertsByType.some(item => item.value > 0) ? (
                        <div className="h-72 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.alertsByType}
                                        {...pieConfig}
                                        dataKey="value"
                                    >
                                        {data.alertsByType.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend formatter={(value) => <span style={{ color: '#fff' }}>{value}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-72 flex items-center justify-center">
                            <p className="text-gray-400">No alerts data available</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}