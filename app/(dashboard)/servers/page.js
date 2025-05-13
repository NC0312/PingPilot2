'use client';

import React from 'react';
import { Plus, Server } from 'lucide-react';
import Link from 'next/link';

export default function ServersPage() {
    return (
        <div className="text-white container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">My Servers</h1>
                <Link href="/servers/new">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded flex items-center cursor-pointer">
                        <Plus size={18} className="mr-2" />
                        Add Server
                    </button>
                </Link>
            </div>

            <div className="bg-gray-800 rounded-lg p-8 text-center">
                <Server size={48} className="mx-auto text-gray-500 mb-4" />
                <h3 className="text-xl font-medium text-gray-300 mb-2">Add your first server</h3>
                <p className="text-gray-400 mb-6">
                    Start monitoring your websites and servers by adding your first URL.
                </p>
                <Link href="/servers/new">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded inline-flex items-center cursor-pointer">
                        <Plus size={18} className="mr-2" />
                        Add Server
                    </button>
                </Link>
            </div>
        </div>
    );
}