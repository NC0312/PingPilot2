'use client';

import React from 'react';
import TicketList from '@/app/components/Support/TicketList';
import { PageContainer } from '@/app/components/Layout/AppShell';

export default function TicketsPage() {
    return (
        <PageContainer>
            <TicketList />
        </PageContainer>
    );
}
