'use client';

import React, { useState } from 'react';
import { AlertTriangle, Globe, Server as ServerIcon, HardDrive, Database, Info, Clock } from 'lucide-react';
import moment from 'moment-timezone';

const getSortedTimezones = () => {
    const timezoneGroups = {};

    // Group timezones by region
    moment.tz.names().forEach(name => {
        const parts = name.split('/');
        const region = parts[0];
        if (!timezoneGroups[region]) {
            timezoneGroups[region] = [];
        }
        timezoneGroups[region].push({
            name: name,
            offset: moment().tz(name).format('Z')
        });
    });

    // Sort each group by offset
    Object.keys(timezoneGroups).forEach(region => {
        timezoneGroups[region].sort((a, b) => {
            // First sort by offset numerically
            const offsetA = parseInt(a.offset.replace(':', ''));
            const offsetB = parseInt(b.offset.replace(':', ''));

            if (offsetA !== offsetB) {
                return offsetA - offsetB;
            }

            // If offset is the same, sort alphabetically
            return a.name.localeCompare(b.name);
        });
    });

    return timezoneGroups;
};

const sortedTimezones = getSortedTimezones();

// Component for displaying plan limits info
const PlanLimitInfo = ({ userPlan, serverCount, maxServers }) => {
    if (userPlan === 'free') {
        return (
            <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-3 mb-4">
                <div className="flex items-start">
                    <Info className="text-blue-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                    <div className="text-blue-200 text-sm">
                        <p className="font-medium mb-1">Free Trial Period</p>
                        <p>Each server you add has a 2-day free trial period. After that, you'll need to upgrade to a paid plan to continue monitoring.</p>
                    </div>
                </div>
            </div>
        );
    } else if (serverCount >= maxServers) {
        return (
            <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-3 mb-4">
                <div className="flex items-start">
                    <AlertTriangle className="text-yellow-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                    <div className="text-yellow-200 text-sm">
                        <p className="font-medium mb-1">Server Limit Reached</p>
                        <p>You've reached the maximum number of servers allowed on your current plan ({maxServers}). Upgrade your plan to add more servers.</p>
                    </div>
                </div>
            </div>
        );
    } else {
        return (
            <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-3 mb-4">
                <div className="flex items-start">
                    <Info className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                    <div className="text-green-200 text-sm">
                        <p className="font-medium mb-1">{userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} Plan</p>
                        <p>You have used {serverCount} of {maxServers} available server slots on your current plan.</p>
                    </div>
                </div>
            </div>
        );
    }
};

export const ServerForm = ({ onSubmit, loading, error, userPlan, serverCount, maxServers, initialData = {} }) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        url: initialData?.url || '',
        type: initialData?.type || 'website',
        description: initialData?.description || '',
        timezone: initialData?.timezone || 'Asia/Kolkata' // Default to Indian timezone
    });

    const timezoneGroups = {};
    moment.tz.names().forEach(name => {
        const parts = name.split('/');
        const region = parts[0];
        if (!timezoneGroups[region]) {
            timezoneGroups[region] = [];
        }
        timezoneGroups[region].push(name);
    });

    const [validationErrors, setValidationErrors] = useState({});

    // Server type options
    const serverTypes = [
        { id: 'website', name: 'Website', icon: Globe },
        { id: 'api', name: 'API Endpoint', icon: ServerIcon },
        { id: 'tcp', name: 'TCP Service', icon: HardDrive },
        { id: 'database', name: 'Database', icon: Database }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear validation error when field is edited
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const validateUrl = (url) => {
        // Allow TCP format like 123.123.123.123:8080
        if (formData.type === 'tcp') {
            const tcpRegex = /^[\w.-]+(?::\d+)?$/;
            return tcpRegex.test(url);
        }

        // For websites and APIs, require http(s)://
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.name.trim()) {
            errors.name = 'Server name is required';
        }

        if (!formData.url.trim()) {
            errors.url = 'URL or address is required';
        } else if (!validateUrl(formData.url)) {
            if (formData.type === 'tcp') {
                errors.url = 'Invalid format. Use host:port (e.g., db.example.com:5432)';
            } else {
                errors.url = 'Invalid URL. Include http:// or https://';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            onSubmit(formData);
        }
    };

    // Disable form if server limit is reached for non-admin users
    const isFormDisabled = userPlan !== 'admin' && serverCount >= maxServers;

    return (
        <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Server Details</h2>

            <PlanLimitInfo
                userPlan={userPlan}
                serverCount={serverCount}
                maxServers={maxServers}
            />

            {error && (
                <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-3 mb-4 flex items-start">
                    <AlertTriangle className="text-red-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-red-200 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-300">
                        Server Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={isFormDisabled || loading}
                        className={`bg-gray-700 border ${validationErrors.name ? 'border-red-500' : 'border-gray-600'
                            } text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                        placeholder="My Production Server"
                    />
                    {validationErrors.name && (
                        <p className="mt-1 text-xs text-red-400">{validationErrors.name}</p>
                    )}
                </div>

                <div className="mb-4">
                    <label htmlFor="url" className="block mb-2 text-sm font-medium text-gray-300">
                        URL or Address
                    </label>
                    <input
                        type="text"
                        id="url"
                        name="url"
                        value={formData.url}
                        onChange={handleChange}
                        disabled={isFormDisabled || loading}
                        className={`bg-gray-700 border ${validationErrors.url ? 'border-red-500' : 'border-gray-600'
                            } text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                        placeholder={
                            formData.type === 'tcp'
                                ? 'host:port (e.g., db.example.com:5432)'
                                : 'https://example.com'
                        }
                    />
                    {validationErrors.url && (
                        <p className="mt-1 text-xs text-red-400">{validationErrors.url}</p>
                    )}
                </div>

                <div className="mb-4">
                    <label htmlFor="timezone" className="block mb-2 text-sm font-medium text-gray-300">
                        Server Timezone
                    </label>
                    <div className="flex items-center">
                        <Clock size={20} className="text-gray-400 mr-2" />
                        <select
                            id="timezone"
                            name="timezone"
                            value={formData.timezone}
                            onChange={handleChange}
                            disabled={isFormDisabled || loading}
                            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        >
                            {Object.keys(sortedTimezones).sort().map(region => (
                                <optgroup key={region} label={region}>
                                    {sortedTimezones[region].map(tz => (
                                        <option key={tz.name} value={tz.name}>
                                            {tz.name} ({tz.offset})
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                        All monitoring times and reports will use this timezone
                    </p>
                </div>

                <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium text-gray-300">
                        Server Type
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {serverTypes.map((type) => {
                            const TypeIcon = type.icon;
                            return (
                                <div
                                    key={type.id}
                                    onClick={() => {
                                        if (!isFormDisabled && !loading) {
                                            handleChange({
                                                target: { name: 'type', value: type.id }
                                            });
                                        }
                                    }}
                                    className={`
                                        flex items-center justify-center rounded-lg px-3 py-2 cursor-pointer
                                        ${isFormDisabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
                                        ${formData.type === type.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
                                    `}
                                >
                                    <TypeIcon size={16} className="mr-2" />
                                    <span>{type.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mb-4">
                    <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-300">
                        Description (Optional)
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        disabled={isFormDisabled || loading}
                        rows="3"
                        className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        placeholder="Add details about this server..."
                    ></textarea>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isFormDisabled || loading}
                        className={`${isFormDisabled
                            ? 'bg-gray-600 cursor-not-allowed'
                            : loading
                                ? 'bg-blue-800'
                                : 'bg-blue-600 hover:bg-blue-700'
                            } text-white font-medium rounded-lg text-sm px-5 py-2.5 transition-colors flex items-center`}
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                Processing...
                            </>
                        ) : (
                            'Continue'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};