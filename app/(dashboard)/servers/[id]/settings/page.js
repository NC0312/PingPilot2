'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { ServerForm } from '@/app/components/Servers/ServerForm';
import { MonitoringForm } from '@/app/components/Servers/MonitoringForm';
import { ArrowLeft, Server as ServerIcon, AlertTriangle, Check, Settings as SettingsIcon, Trash2, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function ServerSettingsPage() {
    const [server, setServer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('general');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteInput, setDeleteInput] = useState('');

    const router = useRouter();
    const params = useParams();
    const serverId = params.id;
    const { user, apiRequest } = useAuth();

    useEffect(() => {
        const fetchServer = async () => {
            if (!serverId || !user) return;

            try {
                setLoading(true);

                // Fetch server from API
                const response = await apiRequest(`/api/servers/${serverId}`, {
                    method: 'GET'
                });

                if (response.status !== 'success' || !response.data.server) {
                    throw new Error('Server not found');
                }

                const serverData = response.data.server;

                // Debug logging
                console.log('Authorization check:', {
                    serverUploadedBy: serverData.uploadedBy,
                    userId: user._id || user.id, // Check both _id and id
                    userRole: user.role,
                    match: String(serverData.uploadedBy) === String(user._id || user.id)
                });

                // Check if user is authorized to access this server (convert to strings for comparison)
                const currentUserId = user._id || user.id; // Support both _id and id
                if (String(serverData.uploadedBy) !== String(currentUserId) && user.role !== 'admin') {
                    console.error('Authorization failed - redirecting to /servers');
                    router.push('/servers');
                    return;
                }

                setServer(serverData);
            } catch (err) {
                console.error('Error fetching server:', err);
                setError(err.message || 'Failed to load server details');
            } finally {
                setLoading(false);
            }
        };

        fetchServer();
    }, [serverId, user, router, apiRequest]);

    const handleServerUpdate = async (updatedData) => {
        if (!server) return;

        try {
            setSaving(true);
            setError(null);
            setSuccessMessage(null);

            // Prepare data for API
            const data = {
                name: updatedData.name,
                url: updatedData.url,
                type: updatedData.type,
                description: updatedData.description,
                priority: updatedData.priority
            };

            // Call API to update server
            const response = await apiRequest(`/api/servers/${serverId}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });

            if (response.status !== 'success') {
                throw new Error(response.message || 'Failed to update server');
            }

            // Update local state
            setServer({
                ...server,
                ...data
            });

            setSuccessMessage('Server details updated successfully');
        } catch (err) {
            console.error('Error updating server:', err);
            setError(err.message || 'Failed to update server');
        } finally {
            setSaving(false);
        }
    };

    const handleMonitoringUpdate = async (updatedData) => {
        if (!server) return;

        try {
            setSaving(true);
            setError(null);
            setSuccessMessage(null);

            // Prepare data for API
            const data = {
                monitoring: {
                    frequency: updatedData.checkFrequency,
                    daysOfWeek: updatedData.monitoringDays,
                    timeWindows: [
                        {
                            start: updatedData.checkTimeRange?.start || '00:00',
                            end: updatedData.checkTimeRange?.end || '23:59'
                        }
                    ],
                    alerts: {
                        enabled: updatedData.alertPreferences?.email || updatedData.alertPreferences?.phone || false,
                        email: updatedData.alertPreferences?.email || false,
                        phone: updatedData.alertPreferences?.phone || false,
                        responseThreshold: updatedData.responseThreshold || 1000,
                        timeWindow: {
                            start: updatedData.alertTimeRange?.start || '00:00',
                            end: updatedData.alertTimeRange?.end || '23:59'
                        }
                    }
                },
                contactEmails: updatedData.emails || [],
                contactPhones: updatedData.phones || []
            };

            // Call API to update server
            const response = await apiRequest(`/api/servers/${serverId}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });

            if (response.status !== 'success') {
                throw new Error(response.message || 'Failed to update monitoring settings');
            }

            // Update local state
            setServer({
                ...server,
                ...data
            });

            setSuccessMessage('Monitoring settings updated successfully');
        } catch (err) {
            console.error('Error updating monitoring settings:', err);
            setError(err.message || 'Failed to update monitoring settings');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteServer = async () => {
        if (!server || deleteInput !== server.name) return;

        try {
            setSaving(true);
            setError(null);

            // Call API to delete server
            const response = await apiRequest(`/api/servers/${serverId}`, {
                method: 'DELETE'
            });

            if (response.status !== 'success') {
                throw new Error(response.message || 'Failed to delete server');
            }

            router.push('/servers');
        } catch (err) {
            console.error('Error deleting server:', err);
            setError(err.message || 'Failed to delete server');
            setSaving(false);
            setDeleteConfirmOpen(false);
        }
    };

    // Prepare initial form data for server form
    const getServerFormData = () => {
        if (!server) return null;

        return {
            name: server.name,
            url: server.url,
            type: server.type || 'website',
            type: server.type || 'website',
            description: server.description || '',
            priority: server.priority || 'medium'
        };
    };

    // Prepare initial form data for monitoring form
    const getMonitoringFormData = () => {
        if (!server) return null;

        return {
            alertPreferences: {
                email: server.monitoring?.alerts?.email || false,
                phone: server.monitoring?.alerts?.phone || false
            },
            monitoringDays: server.monitoring?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
            alertTimeRange: server.monitoring?.alerts?.timeWindow || {
                start: '00:00',
                end: '23:59'
            },
            checkTimeRange: server.monitoring?.timeWindows?.[0] || {
                start: '00:00',
                end: '23:59'
            },
            checkFrequency: server.monitoring?.frequency || 5,
            responseThreshold: server.monitoring?.alerts?.responseThreshold || 1000,
            emails: server.contactEmails || [],
            phones: server.contactPhones || []
        };
    };

    // Format timestamp to readable date
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';

        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    // Render loading state
    if (loading) {
        return (
            <div className="text-white container mx-auto px-4 py-8 max-w-4xl">
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    // Render error state
    if (error && !server) {
        return (
            <div className="text-white container mx-auto px-4 py-8 max-w-4xl">
                <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-6 text-center">
                    <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
                    <h2 className="text-xl font-semibold text-white mb-2">Error Loading Server</h2>
                    <p className="text-red-200 mb-4">{error}</p>
                    <Link href="/servers">
                        <button className="bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg text-sm px-5 py-2.5">
                            Back to Servers
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="text-white container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center">
                    <h1 className="text-2xl font-bold">Server Settings</h1>
                </div>
                <Link href={`/servers`} className="flex items-center text-blue-400 hover:text-blue-300">
                    <ArrowLeft size={16} className="mr-1" />
                    Back to Servers
                </Link>
            </div>

            {/* Server overview */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-start">
                    <div className="flex items-center">
                        <div className="bg-gray-700 p-2 rounded-lg mr-3">
                            <ServerIcon size={24} className="text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-medium text-white">{server?.name}</h2>
                            <p className="text-sm text-gray-400">{server?.url}</p>
                        </div>
                    </div>
                    <div className="text-sm text-gray-400 flex items-center">
                        <Calendar size={14} className="mr-1" />
                        Added: {formatDate(server?.uploadedAt || server?.createdAt)}
                    </div>
                </div>
            </div>

            {/* Success message */}
            {successMessage && (
                <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-3 mb-4 flex items-start">
                    <Check className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-green-200 text-sm">{successMessage}</p>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-3 mb-4 flex items-start">
                    <AlertTriangle className="text-red-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-red-200 text-sm">{error}</p>
                </div>
            )}

            {/* Tab navigation */}
            <div className="flex border-b border-gray-700 mb-6">
                <button
                    className={`py-3 px-4 font-medium text-sm ${activeTab === 'general'
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-gray-400 hover:text-gray-300'
                        }`}
                    onClick={() => setActiveTab('general')}
                >
                    General Settings
                </button>
                <button
                    className={`py-3 px-4 font-medium text-sm ${activeTab === 'monitoring'
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-gray-400 hover:text-gray-300'
                        }`}
                    onClick={() => setActiveTab('monitoring')}
                >
                    Monitoring & Alerts
                </button>
                <button
                    className={`py-3 px-4 font-medium text-sm ${activeTab === 'danger'
                        ? 'text-red-400 border-b-2 border-red-400'
                        : 'text-gray-400 hover:text-gray-300'
                        }`}
                    onClick={() => setActiveTab('danger')}
                >
                    Danger Zone
                </button>
            </div>

            {/* Tab content */}
            <div>
                {activeTab === 'general' && (
                    <ServerForm
                        onSubmit={handleServerUpdate}
                        loading={saving}
                        error={null}
                        initialData={getServerFormData()}
                        userPlan={user?.subscription?.plan || 'free'}
                        serverCount={1}
                        maxServers={10}
                        isEdit={true}
                    />
                )}

                {activeTab === 'monitoring' && (
                    <MonitoringForm
                        onSave={handleMonitoringUpdate}
                        initialData={getMonitoringFormData()}
                        isLoading={saving}
                    />
                )}

                {activeTab === 'danger' && (
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-white mb-6">Danger Zone</h2>

                        <div className="bg-red-900/20 border border-red-600/40 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-medium text-red-300">Delete This Server</h3>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Once deleted, this server and all its monitoring data will be permanently removed.
                                        This action cannot be undone.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setDeleteConfirmOpen(true)}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                                >
                                    Delete Server
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete confirmation modal */}
            {deleteConfirmOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-xl font-semibold text-white mb-4">Confirm Deletion</h3>
                        <p className="text-gray-300 mb-4">
                            This action cannot be undone. All monitoring data for this server will be permanently deleted.
                        </p>
                        <p className="text-gray-300 mb-4">
                            Type <span className="font-mono bg-gray-700 px-1 py-0.5 rounded">{server?.name}</span> to confirm.
                        </p>

                        <input
                            type="text"
                            value={deleteInput}
                            onChange={(e) => setDeleteInput(e.target.value)}
                            placeholder="Enter server name"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white mb-4"
                        />

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setDeleteConfirmOpen(false)}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteServer}
                                disabled={deleteInput !== server?.name || saving}
                                className={`${deleteInput === server?.name && !saving
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-red-800 cursor-not-allowed'
                                    } text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center`}
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} className="mr-2" />
                                        Delete Permanently
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}