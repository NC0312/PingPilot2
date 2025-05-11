import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Server, Globe, Clock, Bell, AlertTriangle, Info, Check, X } from 'lucide-react';

const ServerUpload = () => {
    const { user } = useAuth();
    const [serverData, setServerData] = useState({
        name: '',
        url: '',
        description: '',
        monitoring: {
            frequency: 5, // Default to 5 minutes
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // All days selected by default
            timeWindows: [{ start: '00:00', end: '23:59' }], // 24/7 by default
            alerts: {
                enabled: true,
                email: true,
                responseThreshold: 1000 // 1 second in ms
            }
        }
    });
    const [formStep, setFormStep] = useState(1);
    const [showTrialInfo, setShowTrialInfo] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setServerData({
                ...serverData,
                [parent]: {
                    ...serverData[parent],
                    [child]: value
                }
            });
        } else {
            setServerData({
                ...serverData,
                [name]: value
            });
        }
    };

    const handleFrequencyChange = (value) => {
        setServerData({
            ...serverData,
            monitoring: {
                ...serverData.monitoring,
                frequency: value
            }
        });
    };

    const handleDayToggle = (day) => {
        const currentDays = [...serverData.monitoring.daysOfWeek];
        const index = currentDays.indexOf(day);

        if (index === -1) {
            currentDays.push(day);
        } else {
            currentDays.splice(index, 1);
        }

        setServerData({
            ...serverData,
            monitoring: {
                ...serverData.monitoring,
                daysOfWeek: currentDays
            }
        });
    };

    const handleTimeWindowChange = (index, field, value) => {
        const timeWindows = [...serverData.monitoring.timeWindows];
        timeWindows[index] = {
            ...timeWindows[index],
            [field]: value
        };

        setServerData({
            ...serverData,
            monitoring: {
                ...serverData.monitoring,
                timeWindows
            }
        });
    };

    const addTimeWindow = () => {
        setServerData({
            ...serverData,
            monitoring: {
                ...serverData.monitoring,
                timeWindows: [
                    ...serverData.monitoring.timeWindows,
                    { start: '09:00', end: '17:00' }
                ]
            }
        });
    };

    const removeTimeWindow = (index) => {
        const timeWindows = [...serverData.monitoring.timeWindows];
        if (timeWindows.length > 1) {
            timeWindows.splice(index, 1);
            setServerData({
                ...serverData,
                monitoring: {
                    ...serverData.monitoring,
                    timeWindows
                }
            });
        }
    };

    const handleAlertToggle = (field) => {
        setServerData({
            ...serverData,
            monitoring: {
                ...serverData.monitoring,
                alerts: {
                    ...serverData.monitoring.alerts,
                    [field]: !serverData.monitoring.alerts[field]
                }
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            // Add the uploadedBy field with the current user ID
            const serverDataWithUser = {
                ...serverData,
                uploadedBy: user.uid,
                uploadedRole: user.role || 'user'
            };

            const response = await fetch('/api/servers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(serverDataWithUser),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add server');
            }

            setSuccess(true);
            // Reset form after success if needed
            // setServerData({ name: '', url: '', description: '', ... });
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const nextStep = () => {
        setFormStep(formStep + 1);
    };

    const prevStep = () => {
        setFormStep(formStep - 1);
    };

    const renderTrialInfo = () => (
        <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-4 mb-6">
            <div className="flex items-start">
                <Info className="text-blue-400 mt-1 mr-3 flex-shrink-0" size={20} />
                <div>
                    <h3 className="font-medium text-blue-100 mb-1">Free Trial Period</h3>
                    <p className="text-blue-200 text-sm mb-2">
                        Each server will be monitored for a 2-day trial period. After that, you'll need to subscribe to a plan to continue monitoring.
                    </p>
                    <button
                        onClick={() => setShowTrialInfo(false)}
                        className="text-xs text-blue-300 hover:text-blue-100 flex items-center"
                    >
                        <Check size={12} className="mr-1" />
                        Got it, don't show again
                    </button>
                </div>
            </div>
        </div>
    );

    // Step 1: Basic Server Information
    const renderBasicInfo = () => (
        <div className="space-y-6">
            <div>
                <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-200">
                    Server Name
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={serverData.name}
                    onChange={handleChange}
                    placeholder="E.g., Production API"
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    required
                />
            </div>

            <div>
                <label htmlFor="url" className="block mb-2 text-sm font-medium text-gray-200">
                    Server URL
                </label>
                <div className="flex">
                    <span className="inline-flex items-center px-3 text-sm text-gray-300 bg-gray-600 border border-r-0 border-gray-600 rounded-l-lg">
                        <Globe size={16} />
                    </span>
                    <input
                        type="url"
                        id="url"
                        name="url"
                        value={serverData.url}
                        onChange={handleChange}
                        placeholder="https://example.com"
                        className="bg-gray-700 border border-gray-600 text-white text-sm rounded-r-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        required
                    />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                    Include http:// or https:// in the URL
                </p>
            </div>

            <div>
                <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-200">
                    Description (optional)
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={serverData.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Add notes about this server..."
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                />
            </div>

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={nextStep}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
                >
                    Next: Monitoring Settings
                </button>
            </div>
        </div>
    );

    // Step 2: Monitoring Configuration
    const renderMonitoringConfig = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-200 mb-3">Check Frequency</h3>
                <div className="grid grid-cols-3 gap-3">
                    {[1, 5, 15, 30, 60].map((mins) => (
                        <button
                            key={mins}
                            type="button"
                            className={`py-2 px-4 rounded-lg border ${serverData.monitoring.frequency === mins
                                    ? 'bg-blue-600 border-blue-500 text-white'
                                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                                }`}
                            onClick={() => handleFrequencyChange(mins)}
                        >
                            {mins === 1 ? '1 minute' : `${mins} minutes`}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-medium text-gray-200 mb-3">Days to Monitor</h3>
                <div className="flex flex-wrap gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                        <button
                            key={day}
                            type="button"
                            className={`py-2 px-3 rounded-lg ${serverData.monitoring.daysOfWeek.includes(index)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            onClick={() => handleDayToggle(index)}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-gray-200">Time Windows</h3>
                    <button
                        type="button"
                        onClick={addTimeWindow}
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
                    >
                        Add Window
                    </button>
                </div>

                {serverData.monitoring.timeWindows.map((window, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-3">
                        <div className="flex-1 flex space-x-2">
                            <div>
                                <label htmlFor={`start-${index}`} className="block mb-1 text-xs text-gray-400">
                                    Start Time
                                </label>
                                <input
                                    type="time"
                                    id={`start-${index}`}
                                    value={window.start}
                                    onChange={(e) => handleTimeWindowChange(index, 'start', e.target.value)}
                                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                />
                            </div>
                            <div>
                                <label htmlFor={`end-${index}`} className="block mb-1 text-xs text-gray-400">
                                    End Time
                                </label>
                                <input
                                    type="time"
                                    id={`end-${index}`}
                                    value={window.end}
                                    onChange={(e) => handleTimeWindowChange(index, 'end', e.target.value)}
                                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                />
                            </div>
                        </div>

                        {serverData.monitoring.timeWindows.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeTimeWindow(index)}
                                className="p-2 text-gray-400 hover:text-red-400"
                                aria-label="Remove time window"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex justify-between mt-8">
                <button
                    type="button"
                    onClick={prevStep}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={nextStep}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                >
                    Next: Alert Settings
                </button>
            </div>
        </div>
    );

    // Step 3: Alert Configuration
    const renderAlertConfig = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-200">Enable Alerts</h3>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={serverData.monitoring.alerts.enabled}
                        onChange={() => handleAlertToggle('enabled')}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            {serverData.monitoring.alerts.enabled && (
                <>
                    <div className="pl-4 border-l-2 border-gray-700 space-y-4">
                        <div className="flex items-center">
                            <input
                                id="email-alert"
                                type="checkbox"
                                checked={serverData.monitoring.alerts.email}
                                onChange={() => handleAlertToggle('email')}
                                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 focus:ring-offset-gray-800"
                            />
                            <label htmlFor="email-alert" className="ms-2 text-sm font-medium text-gray-300">
                                Email notifications
                            </label>
                        </div>

                        <div>
                            <label htmlFor="responseThreshold" className="block mb-2 text-sm font-medium text-gray-300">
                                Response Time Threshold (ms)
                            </label>
                            <input
                                type="number"
                                id="responseThreshold"
                                min="100"
                                step="100"
                                value={serverData.monitoring.alerts.responseThreshold}
                                onChange={(e) => {
                                    const threshold = parseInt(e.target.value, 10);
                                    if (threshold >= 100) {
                                        setServerData({
                                            ...serverData,
                                            monitoring: {
                                                ...serverData.monitoring,
                                                alerts: {
                                                    ...serverData.monitoring.alerts,
                                                    responseThreshold: threshold
                                                }
                                            }
                                        });
                                    }
                                }}
                                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                            />
                            <p className="mt-1 text-xs text-gray-400">
                                Alert when response time exceeds this value (in milliseconds)
                            </p>
                        </div>
                    </div>
                </>
            )}

            <div className="flex justify-between mt-8">
                <button
                    type="button"
                    onClick={prevStep}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg"
                >
                    Back
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className={`${submitting ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'
                        } text-white font-medium py-2 px-4 rounded-lg flex items-center`}
                >
                    {submitting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Adding Server...
                        </>
                    ) : (
                        'Add Server'
                    )}
                </button>
            </div>
        </div>
    );

    const renderSuccessMessage = () => (
        <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-900 mb-4">
                <Check className="h-6 w-6 text-green-300" />
            </div>
            <h3 className="text-lg font-medium text-green-200 mb-2">Server Added Successfully</h3>
            <p className="text-green-300 mb-6">
                Your server has been added and will start being monitored immediately.
            </p>
            <div className="flex space-x-4 justify-center">
                <a
                    href="/servers"
                    className="bg-green-700 hover:bg-green-800 text-white font-medium py-2 px-4 rounded-lg"
                >
                    View All Servers
                </a>
                <button
                    onClick={() => {
                        setServerData({
                            name: '',
                            url: '',
                            description: '',
                            monitoring: {
                                frequency: 5,
                                daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                                timeWindows: [{ start: '00:00', end: '23:59' }],
                                alerts: {
                                    enabled: true,
                                    email: true,
                                    responseThreshold: 1000
                                }
                            }
                        });
                        setFormStep(1);
                        setSuccess(false);
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg"
                >
                    Add Another Server
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#031D27] text-white">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6 flex items-center">
                    <Server className="mr-2" size={24} />
                    Add New Server
                </h1>

                {showTrialInfo && renderTrialInfo()}

                {error && (
                    <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4 mb-6">
                        <div className="flex">
                            <AlertTriangle className="text-red-500 mr-3 flex-shrink-0" />
                            <div>
                                <h3 className="font-medium text-red-300">Error</h3>
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-gray-800 rounded-lg p-6">
                    {success ? (
                        renderSuccessMessage()
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {formStep === 1 && renderBasicInfo()}
                            {formStep === 2 && renderMonitoringConfig()}
                            {formStep === 3 && renderAlertConfig()}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServerUpload;