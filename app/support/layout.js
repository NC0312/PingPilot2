'use client';

import AppShell from '@/app/components/Layout/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';

export default function SupportLayout({ children }) {
    return (
        <ProtectedRoute>
            <AppShell>{children}</AppShell>
        </ProtectedRoute>
    );
}
