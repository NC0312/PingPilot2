// app/api/users/[id]/route.js
import { NextResponse } from 'next/server';
import { getUserById, updateUserRole } from '../../../../services/userService';

export async function GET(request, { params }) {
    try {
        const { id } = params;
        const user = await getUserById(id);
        return NextResponse.json({ user });
    } catch (error) {
        console.error(`Error fetching user ${params.id}:`, error);
        return NextResponse.json({ error: error.message }, { status: 404 });
    }
}

export async function PATCH(request, { params }) {
    try {
        const { id } = params;
        const { role } = await request.json();
        await updateUserRole(id, role);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(`Error updating user ${params.id}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}