'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isClient, setIsClient] = useState(false);

    // This ensures we only perform client-side logic after hydration
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        // Only run after component mounts and auth state is determined
        if (isClient && !loading) {
            // If user is not authenticated and not on an auth page, redirect to login
            if (!user && !pathname.startsWith('/auth')) {
                router.push('/auth');
            }
        }
    }, [user, loading, router, pathname, isClient]);

    // Show loading state while checking authentication
    if (loading || !isClient) {
        return (
            <div className="flex items-center justify-center h-screen w-full bg-[#031D27]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Render children if authenticated or on auth page
    return children;
}