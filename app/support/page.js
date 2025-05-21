'use client';

import React from 'react';
import TicketList from '@/app/components/Support/TicketList';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SupportPage() {
    const router = useRouter();

    // Redirect to tickets list
    useEffect(() => {
        router.push('/support/tickets');
    }, [router]);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        </div>
    );
}