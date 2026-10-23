'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/app/components/Layout/AppShell';
import { Skeleton } from '@/components/ui/skeleton';

// /support has no content of its own: it hands off to the ticket list.
export default function SupportPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/support/tickets');
    }, [router]);

    return (
        <PageContainer>
            <div className="space-y-6" role="status" aria-label="Loading">
                <Skeleton className="h-10 w-56" />
                <Skeleton className="h-64 rounded-3xl" />
            </div>
        </PageContainer>
    );
}
