// app/api/servers/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerById, updateServer, deleteServer } from '../../../../services/serverService';

export async function GET(request, { params }) {
    try {
        const { id } = params;
        const server = await getServerById(id);
        return NextResponse.json({ server });
    } catch (error) {
        console.error(`Error fetching server ${params.id}:`, error);
        return NextResponse.json({ error: error.message }, { status: 404 });
    }
}

export async function PATCH(request, { params }) {
    try {
        const { id } = params;
        const data = await request.json();
        await updateServer(id, data);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(`Error updating server ${params.id}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = params;
        await deleteServer(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(`Error deleting server ${params.id}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}