'use client';

import React from 'react';
import CreateTicketForm from '@/app/components/Support/CreateTicketForm';

export default function NewTicketPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <CreateTicketForm />
        </div>
    );
}