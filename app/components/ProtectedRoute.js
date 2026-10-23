'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

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

    // Skeleton shell while checking authentication, so the layout does not jump on arrival
    if (loading || !isClient) {
        return (
            <div className="min-h-[100dvh]" role="status" aria-label="Loading">
                <div className="fixed bottom-3 left-3 top-3 hidden w-[248px] md:block">
                    <Skeleton className="size-full rounded-[1.375rem]" />
                </div>
                <div className="mx-auto max-w-[1280px] space-y-6 px-4 py-12 sm:px-8 md:pl-[288px]">
                    <Skeleton className="h-10 w-64" />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-3xl" />)}
                    </div>
                    <Skeleton className="h-72 rounded-3xl" />
                </div>
            </div>
        );
    }

    // Render children if authenticated or on auth page
    return children;
}
