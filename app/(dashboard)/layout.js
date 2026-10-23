'use client';

import AppShell from "@/app/components/Layout/AppShell";
import ProtectedRoute from "../components/ProtectedRoute";

export default function DashboardLayout({ children }) {
    return (
        <ProtectedRoute>
            <AppShell>{children}</AppShell>
        </ProtectedRoute>
    );
}
