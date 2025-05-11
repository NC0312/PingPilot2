// app/api/servers/route.js
import { NextResponse } from 'next/server';
import { getServers, addServer, updateServer, deleteServer } from '../../../services/serverService';

export async function GET(request) {
    try {
        const servers = await getServers();
        return NextResponse.json({ servers });
    } catch (error) {
        console.error('Error fetching servers:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const newServer = await addServer(data);
        return NextResponse.json({ server: newServer }, { status: 201 });
    } catch (error) {
        console.error('Error adding server:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
