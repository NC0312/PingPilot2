'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import AppShell from '@/app/components/Layout/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';

// Admin pages render their own PageHeader inside AppShell, like every other screen.
export default function AdminShell({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Signed-in non-admins are sent back to their dashboard instead of seeing pages that cannot load.
    useEffect(() => {
        if (!loading && user && user.role !== 'admin') {
            router.replace('/dashboard');
        }
    }, [user, loading, router]);

    return (
        <ProtectedRoute>
            <AppShell>{user?.role === 'admin' ? children : null}</AppShell>
        </ProtectedRoute>
    );
}
