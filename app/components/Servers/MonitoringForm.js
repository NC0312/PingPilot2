// app/components/Server/MonitoringForm.js
'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Mail, Phone, AlertTriangle, CheckCircle, X, Plus, Info } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

export const WeekdaySelector = ({ selectedDays, onChange }) => {
    const days = [
        { id: 1, name: 'Monday' },
        { id: 2, name: 'Tuesday' },
        { id: 3, name: 'Wednesday' },
        { id: 4, name: 'Thursday' },
        { id: 5, name: 'Friday' },
        { id: 6, name: 'Saturday' },
        { id: 0, name: 'Sunday' },
    ];

    const toggleDay = (dayId) => {
        if (selectedDays.includes(dayId)) {
            onChange(selectedDays.filter(id => id !== dayId));
        } else {
            onChange([...selectedDays, dayId]);
        }
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {days.map((day) => (
                <div
                    key={day.id}
                    onClick={() => toggleDay(day.id)}
                    className={`
            flex items-center rounded-lg px-3 py-2 cursor-pointer
            ${selectedDays.includes(day.id)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
          `}
                >
                    <input
                        type="checkbox"
                        checked={selectedDays.includes(day.id)}
                        onChange={() => { }}
                        className="h-4 w-4 mr-2"
                    />
                    <span>{day.name}</span>
                </div>
            ))}
        </div>
    );
};

export const TimeRangeSelector = ({ label, startTime, endTime, onStartChange, onEndChange }) => {
    // Generate time options in 30-minute increments
    const generateTimeOptions = () => {
        const options = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute of [0, 30]) {
                const formattedHour = hour.toString().padStart(2, '0');
                const formattedMinute = minute.toString().padStart(2, '0');
                const timeValue = `${formattedHour}:${formattedMinute}`;
                const displayText = `${hour}:${formattedMinute.padStart(2, '0')}`;
                options.push({ value: timeValue, label: displayText });
            }
        }
        return options;
    };

    const timeOptions = generateTimeOptions();

    return (
        <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-300">
                {label}
            </label>
            <div className="flex items-center space-x-2">
                <select
                    value={startTime}
                    onChange={(e) => onStartChange(e.target.value)}
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                >
                    {timeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <span className="text-gray-300">to</span>

                <select
                    value={endTime}
                    onChange={(e) => onEndChange(e.target.value)}
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                >
                    {timeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export const EmailListManager = ({ emails, onAdd, onRemove }) => {
    const [newEmail, setNewEmail] = useState('');
    const [error, setError] = useState('');

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleAdd = () => {
        if (!newEmail) {
            setError('Email cannot be empty');
            return;
        }

        if (!validateEmail(newEmail)) {
            setError('Please enter a valid email address');
            return;
        }

        if (emails.includes(newEmail)) {
            setError('This email is already added');
            return;
        }

        onAdd(newEmail);
        setNewEmail('');
        setError('');
    };

    return (
        <div>
            <div className="mb-2">
                <label className="block mb-1 text-sm font-medium text-gray-300">
                    Add Email Addresses For Email Alerts
                </label>
                <div className="flex items-center">
                    <div className="relative flex-1">
                        <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                            placeholder="Enter valid email address"
                        />
                        {error && (
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                <AlertTriangle size={16} className="text-red-500" />
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="ml-2 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg flex items-center justify-center"
                    >
                        <Plus size={16} />
                    </button>
                </div>
                {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
            </div>

            <div className="space-y-2 max-h-32 overflow-y-auto">
                {emails.map((email, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-700 p-2 rounded-lg">
                        <div className="flex items-center">
                            <Mail size={16} className="text-gray-400 mr-2" />
                            <span className="text-sm text-gray-300">{email}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => onRemove(email)}
                            className="text-gray-400 hover:text-red-400"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const PhoneListManager = ({ phones, onAdd, onRemove }) => {
    const [newPhone, setNewPhone] = useState('');
    const [error, setError] = useState('');

    const validatePhone = (phone) => {
        return /^\d{10}$/.test(phone.replace(/\D/g, ''));
    };

    const handleAdd = () => {
        const cleanedPhone = newPhone.replace(/\D/g, '');

        if (!cleanedPhone) {
            setError('Phone number cannot be empty');
            return;
        }

        if (!validatePhone(cleanedPhone)) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }

        if (phones.includes(cleanedPhone)) {
            setError('This phone number is already added');
            return;
        }

        onAdd(cleanedPhone);
        setNewPhone('');
        setError('');
    };

    return (
        <div>
            <div className="mb-2">
                <label className="block mb-1 text-sm font-medium text-gray-300">
                    Add Mobile Numbers For Call Alerts
                </label>
                <div className="flex items-center">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                            placeholder="Enter 10-digit mobile number"
                        />
                        {error && (
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                <AlertTriangle size={16} className="text-red-500" />
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="ml-2 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg flex items-center justify-center"
                    >
                        <Plus size={16} />
                    </button>
                </div>
                {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
            </div>

            <div className="space-y-2 max-h-32 overflow-y-auto">
                {phones.map((phone, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-700 p-2 rounded-lg">
                        <div className="flex items-center">
                            <Phone size={16} className="text-gray-400 mr-2" />
                            <span className="text-sm text-gray-300">
                                {phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => onRemove(phone)}
                            className="text-gray-400 hover:text-red-400"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const FrequencySlider = ({ value, onChange, minValue, maxValue, premiumText }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    // Define the step and min/max based on user's plan or admin status
    const step = 1;
    const min = minValue || 1;
    const max = maxValue || 60;

    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-300">
                    Check Time (minutes)
                </label>
                <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-300 ml-2">
                        {value} {value === 1 ? 'min' : 'mins'}
                    </span>
                    {premiumText && !isAdmin && (
                        <div className="ml-2 group relative">
                            <Info size={16} className="text-blue-400 cursor-help" />
                            <div className="absolute bottom-full mb-2 right-0 w-64 bg-gray-900 text-xs text-gray-300 rounded-lg p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                {premiumText}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-blue-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{min} min</span>
                <span>{Math.floor(max / 2)} mins</span>
                <span>{max} mins</span>
            </div>
        </div>
    );
};

export const ResponseTimeThresholdInput = ({ value, onChange }) => {
    return (
        <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-300">
                Alert if Response Time Exceeds (ms)
            </label>
            <div className="relative">
                <input
                    type="number"
                    min="100"
                    max="10000"
                    step="100"
                    value={value}
                    onChange={(e) => onChange(Math.max(100, parseInt(e.target.value, 10) || 0))}
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400">
                    ms
                </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
                The system will send alerts when your server's response time is higher than this threshold.
            </p>
        </div>
    );
};

export const PlanLimitInfo = ({ userPlan, serverCount, maxServers }) => {
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
                    <CheckCircle className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                    <div className="text-green-200 text-sm">
                        <p className="font-medium mb-1">{userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} Plan</p>
                        <p>You have used {serverCount} of {maxServers} available server slots on your current plan.</p>
                    </div>
                </div>
            </div>
        );
    }
};

export const MonitoringForm = ({ onSave, initialData = {}, isLoading }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const defaultData = {
        alertPreferences: {
            email: true,
            phone: false
        },
        monitoringDays: [1, 2, 3, 4, 5], // Monday through Friday
        alertTimeRange: {
            start: '09:00',
            end: '17:00'
        },
        checkTimeRange: {
            start: '08:00',
            end: '20:00'
        },
        checkFrequency: 5, // 5 minutes
        responseThreshold: 1000, // 1000ms
        emails: [],
        phones: []
    };

    // Merge initial data with defaults
    const mergedData = { ...defaultData, ...initialData };

    const [formData, setFormData] = useState(mergedData);

    // Get min and max check frequency based on user's plan
    const getFrequencyLimits = () => {
        if (isAdmin) {
            return { min: 1, max: 60, premiumText: null };
        }

        switch (user?.subscription?.plan) {
            case 'yearly':
                return { min: 1, max: 60, premiumText: null };
            case 'halfYearly':
                return { min: 1, max: 30, premiumText: "Yearly plan allows up to 30-second checks" };
            case 'monthly':
                return { min: 5, max: 60, premiumText: "Half-yearly plan allows 1-minute checks" };
            default: // free
                return { min: 5, max: 30, premiumText: "Paid plans allow more frequent and extended monitoring" };
        }
    };

    const { min, max, premiumText } = getFrequencyLimits();

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNestedChange = (parent, field, value) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: value
            }
        }));
    };

    const addEmail = (email) => {
        setFormData(prev => ({
            ...prev,
            emails: [...prev.emails, email]
        }));
    };

    const removeEmail = (email) => {
        setFormData(prev => ({
            ...prev,
            emails: prev.emails.filter(e => e !== email)
        }));
    };

    const addPhone = (phone) => {
        setFormData(prev => ({
            ...prev,
            phones: [...prev.phones, phone]
        }));
    };

    const removePhone = (phone) => {
        setFormData(prev => ({
            ...prev,
            phones: prev.phones.filter(p => p !== phone)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Monitoring Settings</h2>

            <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-300">
                    Alert Preferences
                </label>
                <div className="flex space-x-4">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="emailAlert"
                            checked={formData.alertPreferences.email}
                            onChange={(e) => handleNestedChange('alertPreferences', 'email', e.target.checked)}
                            className="w-4 h-4 mr-2 accent-blue-600"
                        />
                        <label htmlFor="emailAlert" className="text-sm text-gray-300">
                            Email Alert
                        </label>
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="phoneAlert"
                            checked={formData.alertPreferences.phone}
                            onChange={(e) => handleNestedChange('alertPreferences', 'phone', e.target.checked)}
                            className="w-4 h-4 mr-2 accent-blue-600"
                        />
                        <label htmlFor="phoneAlert" className="text-sm text-gray-300">
                            Call Alert
                        </label>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-300">
                    Monitoring Days
                </label>
                <WeekdaySelector
                    selectedDays={formData.monitoringDays}
                    onChange={(days) => handleChange('monitoringDays', days)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <TimeRangeSelector
                    label="Alert Range"
                    startTime={formData.alertTimeRange.start}
                    endTime={formData.alertTimeRange.end}
                    onStartChange={(time) => handleNestedChange('alertTimeRange', 'start', time)}
                    onEndChange={(time) => handleNestedChange('alertTimeRange', 'end', time)}
                />

                <TimeRangeSelector
                    label="Check Range"
                    startTime={formData.checkTimeRange.start}
                    endTime={formData.checkTimeRange.end}
                    onStartChange={(time) => handleNestedChange('checkTimeRange', 'start', time)}
                    onEndChange={(time) => handleNestedChange('checkTimeRange', 'end', time)}
                />
            </div>

            <div className="mb-6">
                <FrequencySlider
                    value={formData.checkFrequency}
                    onChange={(value) => handleChange('checkFrequency', value)}
                    minValue={min}
                    maxValue={max}
                    premiumText={premiumText}
                />
            </div>

            <div className="mb-6">
                <ResponseTimeThresholdInput
                    value={formData.responseThreshold}
                    onChange={(value) => handleChange('responseThreshold', value)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {formData.alertPreferences.phone && (
                    <PhoneListManager
                        phones={formData.phones}
                        onAdd={addPhone}
                        onRemove={removePhone}
                    />
                )}

                {formData.alertPreferences.email && (
                    <EmailListManager
                        emails={formData.emails}
                        onAdd={addEmail}
                        onRemove={removeEmail}
                    />
                )}
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`${isLoading ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'
                        } text-white font-medium rounded-lg text-sm px-5 py-2.5 transition-colors flex items-center`}
                >
                    {isLoading ? (
                        <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Updating Settings...
                        </>
                    ) : (
                        'Update Settings'
                    )}
                </button>
            </div>
        </form>
    );
};