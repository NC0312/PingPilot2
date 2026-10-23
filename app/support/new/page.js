'use client';

import React from 'react';
import CreateTicketForm from '@/app/components/Support/CreateTicketForm';
import { PageContainer } from '@/app/components/Layout/AppShell';

export default function NewTicketPage() {
    return (
        <PageContainer>
            <CreateTicketForm />
        </PageContainer>
    );
}
