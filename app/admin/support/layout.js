// app/admin/support/layout.js
'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminSupportLayout({ children }) {
    const { user, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Check if user is authenticated and is an admin
        if (!user || !isAdmin()) {
            router.push('/dashboard');
        }
    }, [user, isAdmin, router]);

    return (
        <div className="py-4 px-4 md:px-8">
            {children}
        </div>
    );
}