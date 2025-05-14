'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/firebase/config';
import { useAuth } from '@/app/context/AuthContext';
import { ServerForm } from '@/app/components/Servers/ServerForm';
import { MonitoringForm } from '@/app/components/Servers/MonitoringForm';
import { AlertTriangle, CheckCircle, ArrowLeft, Server, ArrowRight, Layers } from 'lucide-react';
import Link from 'next/link';
import { getPlanLimits } from '@/app/components/subscriptionPlans';


export default function NewServerPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [serverData, setServerData] = useState(null);
    const [monitoringData, setMonitoringData] = useState(null);
    const [userPlan, setUserPlan] = useState('free');
    const [serverCount, setServerCount] = useState(0);
    const [maxServers, setMaxServers] = useState(1);
    const [fetchingUserData, setFetchingUserData] = useState(true);

    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;

            try {
                setFetchingUserData(true);
                // Get user data including subscription info
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const userData = userSnap.data();

                    // Set plan type from subscription 
                    const planType = userData.subscription?.plan || 'free';
                    setUserPlan(planType);

                    // Get limits based on user role and plan
                    // If user is admin, they get unlimited servers regardless of plan
                    if (userData.role === 'admin') {
                        setMaxServers(Infinity);
                    } else {
                        // Get max servers from plan limits
                        const planLimits = getPlanLimits(userData);
                        setMaxServers(planLimits.maxServers);
                    }

                    // Count current servers
                    const serversRef = collection(db, 'servers');
                    const q = query(serversRef, where('uploadedBy', '==', user.uid));
                    const querySnapshot = await getDocs(q);
                    setServerCount(querySnapshot.size);
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('Failed to fetch user data. Please try again.');
            } finally {
                setFetchingUserData(false);
            }
        };

        fetchUserData();
    }, [user]);

    const handleServerFormSubmit = (data) => {
        setServerData(data);
        setStep(2);
    };

    const handleMonitoringFormSubmit = async (data) => {
        setMonitoringData(data);
        await createServer(serverData, data);
    };

    const createServer = async (serverFormData, monitoringFormData) => {
        setLoading(true);
        setError(null);

        try {
            // First, check if user has reached their server limit
            if (serverCount >= maxServers && user.role !== 'admin') {
                throw new Error(`You've reached your plan's limit of ${maxServers} servers. Please upgrade to add more servers.`);
            }

            // Calculate trial end date (2 days from now) for free users
            const trialEnd = userPlan === 'free'
                ? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).getTime()
                : null;

            // Prepare server document
            const serverDoc = {
                name: serverFormData.name,
                url: serverFormData.url,
                type: serverFormData.type || 'website',
                description: serverFormData.description || '',
                uploadedBy: user.uid,
                uploadedAt: new Date().toISOString(),
                uploadedRole: user.role || 'user',
                uploadedPlan: userPlan, // Store the plan used when adding the server
                status: 'unknown',
                lastChecked: null,
                responseTime: null,
                error: null,
                monitoring: {
                    frequency: monitoringFormData.checkFrequency || 5,
                    daysOfWeek: monitoringFormData.monitoringDays || [1, 2, 3, 4, 5],
                    timeWindows: [
                        {
                            start: monitoringFormData.checkTimeRange?.start || '09:00',
                            end: monitoringFormData.checkTimeRange?.end || '17:00'
                        }
                    ],
                    alerts: {
                        enabled: monitoringFormData.alertPreferences?.email || monitoringFormData.alertPreferences?.phone || false,
                        email: monitoringFormData.alertPreferences?.email || false,
                        phone: monitoringFormData.alertPreferences?.phone || false,
                        responseThreshold: monitoringFormData.responseThreshold || 1000,
                        timeWindow: {
                            start: monitoringFormData.alertTimeRange?.start || '09:00',
                            end: monitoringFormData.alertTimeRange?.end || '17:00'
                        }
                    },
                    trialEndsAt: trialEnd
                },
                contactEmails: monitoringFormData.emails || [],
                contactPhones: monitoringFormData.phones || [],
            };

            // Add to Firestore
            const serverRef = await addDoc(collection(db, 'servers'), serverDoc);

            setSuccess(true);

            // Redirect to server details after 2 seconds
            setTimeout(() => {
                router.push('/servers');
            }, 2000);
        } catch (err) {
            console.error('Error adding server:', err);
            setError(err.message || 'Failed to add server');
            setStep(1); // Go back to first step on error
        } finally {
            setLoading(false);
        }
    };

    // Calculate step completion
    const steps = [
        { number: 1, title: 'Server Details', completed: !!serverData },
        { number: 2, title: 'Monitoring Settings', completed: !!monitoringData }
    ];

    // If loading user data, show loading state
    if (fetchingUserData) {
        return (
            <div className="flex justify-center items-center p-8 h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="text-white container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center">
                    <h1 className="text-2xl font-bold">Add New Server</h1>
                </div>
                <Link href="/servers" className="flex items-center text-blue-400 hover:text-blue-300">
                    <ArrowLeft size={16} className="mr-1" />
                    Back to Servers
                </Link>
            </div>

            {/* Step indicator */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {steps.map((s, i) => (
                        <React.Fragment key={s.number}>
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center 
                                        ${step === s.number
                                            ? 'bg-blue-600 text-white'
                                            : s.completed
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-700 text-gray-300'}`}
                                >
                                    {s.completed && step !== s.number ? (
                                        <CheckCircle size={18} />
                                    ) : (
                                        s.number
                                    )}
                                </div>
                                <span className="mt-2 text-sm font-medium text-gray-300">{s.title}</span>
                            </div>

                            {i < steps.length - 1 && (
                                <div className={`flex-1 h-1 mx-2 ${steps[i].completed ? 'bg-green-600' : 'bg-gray-700'}`}></div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {success ? (
                <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-6 text-center">
                    <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                    <h2 className="text-xl font-semibold text-white mb-2">Server Added Successfully!</h2>
                    <p className="text-green-200 mb-4">
                        Your server has been added and is now being monitored. Redirecting to server details...
                    </p>
                </div>
            ) : (
                <>
                    {step === 1 && (
                        <ServerForm
                            onSubmit={handleServerFormSubmit}
                            loading={loading}
                            error={error}
                            userPlan={userPlan}
                            serverCount={serverCount}
                            maxServers={maxServers}
                        />
                    )}

                    {step === 2 && (
                        <div>
                            {/* Server Summary */}
                            <div className="mb-6 bg-gray-700 rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-medium text-white mb-1">{serverData.name}</h3>
                                        <div className="flex items-center text-sm text-gray-300 mb-2">
                                            <Server size={14} className="mr-1 text-gray-400" />
                                            <span>{serverData.url}</span>
                                        </div>
                                        {serverData.description && (
                                            <p className="text-sm text-gray-400">{serverData.description}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setStep(1)}
                                        className="text-blue-400 hover:text-blue-300 text-sm"
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-3 mb-4 flex items-start">
                                    <AlertTriangle className="text-red-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                                    <p className="text-red-200 text-sm">{error}</p>
                                </div>
                            )}

                            <MonitoringForm
                                onSave={handleMonitoringFormSubmit}
                                isLoading={loading}
                            />
                        </div>
                    )}

                    {/* Navigation buttons (only needed in step 1 since step 2 has its own submit button) */}
                    {step === 1 && (
                        <div className="flex justify-between mt-6">
                            <Link
                                href="/servers"
                                className="px-4 py-2 text-gray-300 hover:text-white"
                            >
                                Cancel
                            </Link>

                            <button
                                type="button"
                                onClick={() => document.querySelector('form').requestSubmit()}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm px-5 py-2.5 flex items-center"
                            >
                                Continue to Monitoring Settings
                                <ArrowRight size={16} className="ml-2" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}