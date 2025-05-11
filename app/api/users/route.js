// app/api/users/route.js
import { NextResponse } from 'next/server';
import { getUsers } from '../../../services/userService';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export async function GET(request) {
    try {
        // Check if user is admin (implement middleware for this)
        const users = await getUsers();
        return NextResponse.json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}