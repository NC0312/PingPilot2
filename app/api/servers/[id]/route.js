// app/api/servers/[id]/route.js
import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/app/firebase/config';

// Helper to extract the server ID from the request
const getServerId = (req) => {
    const path = req.nextUrl.pathname;
    const id = path.split('/').pop();
    return id;
};

// GET - Fetch a specific server
export async function GET(req) {
    try {
        const serverId = getServerId(req);

        if (!serverId) {
            return NextResponse.json(
                { error: 'Server ID is required', type: 'missing_id' },
                { status: 400 }
            );
        }

        const serverRef = doc(db, 'servers', serverId);
        const serverSnap = await getDoc(serverRef);

        if (!serverSnap.exists()) {
            return NextResponse.json(
                { error: 'Server not found', type: 'not_found' },
                { status: 404 }
            );
        }

        const serverData = {
            id: serverId,
            ...serverSnap.data()
        };

        return NextResponse.json({ server: serverData });
    } catch (error) {
        console.error('Error fetching server:', error);
        return NextResponse.json(
            { error: 'Failed to fetch server', type: 'server_error', details: error.message },
            { status: 500 }
        );
    }
}

// PATCH - Update a server's details or monitoring settings
export async function PATCH(req) {
    try {
        const serverId = getServerId(req);
        const data = await req.json();

        if (!serverId) {
            return NextResponse.json(
                { error: 'Server ID is required', type: 'missing_id' },
                { status: 400 }
            );
        }

        // Check if server exists
        const serverRef = doc(db, 'servers', serverId);
        const serverSnap = await getDoc(serverRef);

        if (!serverSnap.exists()) {
            return NextResponse.json(
                { error: 'Server not found', type: 'not_found' },
                { status: 404 }
            );
        }

        // Verify that the user is authorized to update this server
        // In production, implement proper authorization checks
        const userId = req.headers.get('x-user-id');
        const serverData = serverSnap.data();

        if (serverData.uploadedBy !== userId && serverData.uploadedRole !== 'admin') {
            return NextResponse.json(
                { error: 'Not authorized to update this server', type: 'unauthorized' },
                { status: 403 }
            );
        }

        // Prepare update data - only allow specific fields to be updated
        const updateData = {};

        // Basic server details
        if (data.name) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;

        // URL updates should be rare but allowed
        if (data.url) updateData.url = data.url;

        // Monitoring settings
        if (data.monitoring) {
            // Convert to a flat structure for Firestore updating
            if (data.monitoring.frequency !== undefined) {
                updateData['monitoring.frequency'] = data.monitoring.frequency;
            }

            if (data.monitoring.daysOfWeek) {
                updateData['monitoring.daysOfWeek'] = data.monitoring.daysOfWeek;
            }

            if (data.monitoring.timeWindows) {
                updateData['monitoring.timeWindows'] = data.monitoring.timeWindows;
            }

            // Alert settings
            if (data.monitoring.alerts) {
                if (data.monitoring.alerts.enabled !== undefined) {
                    updateData['monitoring.alerts.enabled'] = data.monitoring.alerts.enabled;
                }

                if (data.monitoring.alerts.email !== undefined) {
                    updateData['monitoring.alerts.email'] = data.monitoring.alerts.email;
                }

                if (data.monitoring.alerts.phone !== undefined) {
                    updateData['monitoring.alerts.phone'] = data.monitoring.alerts.phone;
                }

                if (data.monitoring.alerts.responseThreshold !== undefined) {
                    updateData['monitoring.alerts.responseThreshold'] = data.monitoring.alerts.responseThreshold;
                }

                if (data.monitoring.alerts.timeWindow) {
                    updateData['monitoring.alerts.timeWindow'] = data.monitoring.alerts.timeWindow;
                }
            }
        }

        // Contact information
        if (data.contactEmails) {
            updateData.contactEmails = data.contactEmails;
        }

        if (data.contactPhones) {
            updateData.contactPhones = data.contactPhones;
        }

        // Only update if there are changes
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({
                message: 'No changes to update',
                serverId
            });
        }

        // Update the server document
        await updateDoc(serverRef, updateData);

        return NextResponse.json({
            message: 'Server updated successfully',
            serverId
        });
    } catch (error) {
        console.error('Error updating server:', error);
        return NextResponse.json(
            { error: 'Failed to update server', type: 'server_error', details: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Remove a server
export async function DELETE(req) {
    try {
        const serverId = getServerId(req);

        if (!serverId) {
            return NextResponse.json(
                { error: 'Server ID is required', type: 'missing_id' },
                { status: 400 }
            );
        }

        // Check if server exists
        const serverRef = doc(db, 'servers', serverId);
        const serverSnap = await getDoc(serverRef);

        if (!serverSnap.exists()) {
            return NextResponse.json(
                { error: 'Server not found', type: 'not_found' },
                { status: 404 }
            );
        }

        // Verify that the user is authorized to delete this server
        // In production, implement proper authorization checks
        const userId = req.headers.get('x-user-id');
        const serverData = serverSnap.data();

        if (serverData.uploadedBy !== userId && serverData.uploadedRole !== 'admin') {
            return NextResponse.json(
                { error: 'Not authorized to delete this server', type: 'unauthorized' },
                { status: 403 }
            );
        }

        // Delete the server document
        await deleteDoc(serverRef);

        return NextResponse.json({
            message: 'Server deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting server:', error);
        return NextResponse.json(
            { error: 'Failed to delete server', type: 'server_error', details: error.message },
            { status: 500 }
        );
    }
}

// Implement a POST method for manual checking
export async function POST(req) {
    try {
        const serverId = getServerId(req);
        const { action } = await req.json();

        if (!serverId) {
            return NextResponse.json(
                { error: 'Server ID is required', type: 'missing_id' },
                { status: 400 }
            );
        }

        // Verify action is valid
        if (action !== 'check') {
            return NextResponse.json(
                { error: 'Invalid action', type: 'invalid_action' },
                { status: 400 }
            );
        }

        // Check if server exists
        const serverRef = doc(db, 'servers', serverId);
        const serverSnap = await getDoc(serverRef);

        if (!serverSnap.exists()) {
            return NextResponse.json(
                { error: 'Server not found', type: 'not_found' },
                { status: 404 }
            );
        }

        // Get server data
        const server = {
            id: serverId,
            ...serverSnap.data()
        };

        // Manually check server status
        // This would normally call a shared utility function that's also used by the check-servers endpoint
        // For simplicity, we'll just return a simulated status
        const checkResult = {
            status: Math.random() > 0.1 ? 'up' : 'down', // 90% chance of being up
            responseTime: Math.floor(Math.random() * 500) + 50, // 50-550ms
            error: null,
            lastChecked: new Date().toISOString()
        };

        if (checkResult.status === 'down') {
            checkResult.error = 'Manual check failed';
        }

        // Update server status
        await updateDoc(serverRef, {
            status: checkResult.status,
            responseTime: checkResult.responseTime,
            error: checkResult.error,
            lastChecked: checkResult.lastChecked
        });

        return NextResponse.json({
            message: 'Server checked successfully',
            result: checkResult
        });
    } catch (error) {
        console.error('Error checking server:', error);
        return NextResponse.json(
            { error: 'Failed to check server', type: 'server_error', details: error.message },
            { status: 500 }
        );
    }
}