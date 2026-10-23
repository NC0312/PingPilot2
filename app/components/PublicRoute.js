'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * A component to protect public routes (like landing page)
 * Redirects to dashboard if user is already logged in
 */
export default function PublicRoute({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    // This ensures we only perform client-side logic after hydration
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        // Only run after component mounts and auth state is determined
        if (isClient && !loading) {
            // If user is authenticated and email is verified, redirect to dashboard
            if (user && user.emailVerified) {
                router.push('/dashboard');
            }
        }
    }, [user, loading, router, isClient]);

    // Show loading state while checking authentication
    if (loading || !isClient) {
        return (
            <div className="grid min-h-[100dvh] w-full place-items-center px-4" role="status" aria-label="Loading">
                <Skeleton className="h-64 w-full max-w-md rounded-[1.75rem]" />
            </div>
        );
    }

    // Render children if not authenticated
    return children;
}