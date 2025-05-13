'use client';

import { useAuth } from '@/app/context/AuthContext';
import SideBar from '@/app/components/Layout/SideBar';
import { useState, useEffect } from 'react';

export default function AdminLayout({ children }) {
    const { user, isAdmin } = useAuth();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (user && isAdmin()) {
            setAuthorized(true);
        }
    }, [user, isAdmin]);

    return (
        <div className="flex">
            <SideBar />
            <div className="flex-1 md:ml-64">
                <div className="py-4 px-4 md:px-8">
                    <h1 className="text-2xl font-bold text-white mb-4">Admin Dashboard</h1>
                    <div className="bg-gray-800 rounded-lg p-4">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}