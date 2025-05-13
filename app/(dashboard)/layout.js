'use client';

import SideBar from "@/app/components/Layout/SideBar";
import ProtectedRoute from "../components/ProtectedRoute";

export default function DashboardLayout({ children }) {
    return (
        <ProtectedRoute>
            <div className="flex min-h-screen bg-[#031D27]">
                <SideBar />
                <main className="md:ml-64 flex-1 flex flex-col min-h-screen">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}