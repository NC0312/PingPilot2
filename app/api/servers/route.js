// app/api/servers/route.js
import { NextResponse } from 'next/server';
import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/app/firebase/config';

export async function GET(req) {
    try {
        // Get user ID from authorization header or session
        // This is a simplified example; in production, use proper auth middleware
        const url = new URL(req.url);
        const userId = url.searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized access', type: 'auth_error' },
                { status: 401 }
            );
        }

        // Query servers for this user
        const serversRef = collection(db, 'servers');
        const q = query(
            serversRef,
            where('uploadedBy', '==', userId),
            orderBy('uploadedAt', 'desc')
        );

        const querySnapshot = await getDocs(q);

        // Format response
        const servers = [];
        querySnapshot.forEach((doc) => {
            servers.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return NextResponse.json({ servers });
    } catch (error) {
        console.error('Error fetching servers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch servers', type: 'server_error', details: error.message },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        const data = await req.json();

        // Validate required fields
        if (!data.name || !data.url || !data.uploadedBy) {
            return NextResponse.json(
                { error: 'Missing required fields', type: 'validation_error' },
                { status: 400 }
            );
        }

        // Prepare server document with proper structure
        const serverDoc = {
            name: data.name,
            url: data.url,
            type: data.type || 'website',
            description: data.description || '',
            uploadedBy: data.uploadedBy,
            uploadedAt: new Date().toISOString(),
            uploadedRole: data.uploadedRole || 'user',
            status: 'unknown',
            lastChecked: null,
            responseTime: null,
            error: null,
            monitoring: {
                frequency: data.monitoring?.frequency || 5,
                daysOfWeek: data.monitoring?.daysOfWeek || [1, 2, 3, 4, 5],
                timeWindows: data.monitoring?.timeWindows || [
                    { start: '09:00', end: '17:00' }
                ],
                alerts: {
                    enabled: data.monitoring?.alerts?.enabled || false,
                    email: data.monitoring?.alerts?.email || false,
                    phone: data.monitoring?.alerts?.phone || false,
                    responseThreshold: data.monitoring?.alerts?.responseThreshold || 1000,
                    timeWindow: data.monitoring?.alerts?.timeWindow || {
                        start: '09:00',
                        end: '17:00'
                    }
                },
                trialEndsAt: data.monitoring?.trialEndsAt || null
            },
            contactEmails: data.contactEmails || [],
            contactPhones: data.contactPhones || []
        };

        // Add to Firestore
        const serverRef = await addDoc(collection(db, 'servers'), serverDoc);

        return NextResponse.json({
            message: 'Server added successfully',
            serverId: serverRef.id
        });
    } catch (error) {
        console.error('Error adding server:', error);
        return NextResponse.json(
            { error: 'Failed to add server', type: 'server_error', details: error.message },
            { status: 500 }
        );
    }
}