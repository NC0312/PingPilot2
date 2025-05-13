'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Globe, AlertTriangle, Check, Info } from 'lucide-react';

export default function NewServerPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        defaultValues: {
            name: '',
            url: ''
        }
    });

    const onSubmit = async (data) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // This is a mock submission, in production this would call your API
            // const response = await fetch('/api/servers', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(data)
            // });

            // if (!response.ok) throw new Error('Failed to add server');

            // Mock success after 1 second
            await new Promise(resolve => setTimeout(resolve, 1000));

            setSuccess(true);

            // Redirect to servers page after 2 seconds
            setTimeout(() => {
                router.push('/servers');
            }, 2000);
        } catch (err) {
            console.error('Error adding server:', err);
            setError(err.message || 'Failed to add server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="text-white container mx-auto px-4 py-8 max-w-3xl">
            <h1 className="text-2xl font-bold mb-8">Add New Server</h1>

            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                {error && (
                    <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-3 mb-6 flex items-start">
                        <AlertTriangle className="text-red-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                        <p className="text-red-200 text-sm">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-3 mb-6 flex items-start">
                        <Check className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                        <p className="text-green-200 text-sm">
                            Server added successfully! Redirecting to server list...
                        </p>
                    </div>
                )}

                <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-3 mb-6 flex items-start">
                    <Info className="text-blue-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                    <div className="text-blue-200 text-sm">
                        <p className="font-medium mb-1">Free Trial Period</p>
                        <p>Each server you add has a 2-day free trial period. After that, you'll need to upgrade to a paid plan to continue monitoring.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block mb-1 text-sm font-medium text-gray-300">
                            Server Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            className={`bg-gray-700 border ${errors.name ? 'border-red-500' : 'border-gray-600'} 
                text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                            placeholder="My Website"
                            {...register('name', {
                                required: 'Server name is required',
                                minLength: {
                                    value: 2,
                                    message: 'Server name must be at least 2 characters'
                                }
                            })}
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="url" className="block mb-1 text-sm font-medium text-gray-300">
                            Server URL
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Globe className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="url"
                                type="text"
                                className={`bg-gray-700 border ${errors.url ? 'border-red-500' : 'border-gray-600'} 
                  text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5`}
                                placeholder="https://example.com"
                                {...register('url', {
                                    required: 'Server URL is required',
                                    pattern: {
                                        value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
                                        message: 'Enter a valid URL'
                                    }
                                })}
                            />
                        </div>
                        {errors.url && (
                            <p className="mt-1 text-sm text-red-500">{errors.url.message}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-400">Enter the full URL including http:// or https://</p>
                    </div>

                    <div className="pt-4 border-t border-gray-700">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full ${loading ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} 
                focus:ring-4 focus:ring-blue-900 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors`}
                        >
                            {loading ? (
                                <div className="flex justify-center items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Adding Server...
                                </div>
                            ) : (
                                'Add Server'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}