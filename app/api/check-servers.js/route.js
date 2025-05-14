// app/api/check-servers/route.js
import { NextResponse } from 'next/server';
import { collection, getDocs, query, where, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/app/firebase/config';
import nodemailer from 'nodemailer';

// Utility function to check if current time is within a time window
const isWithinTimeWindow = (timeWindow) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    return timeWindow.start <= currentTime && currentTime <= timeWindow.end;
};

// Utility function to check if today is included in the monitoring days
const isMonitoringDay = (daysOfWeek) => {
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    return daysOfWeek.includes(today);
};

// Utility function to check if server should be monitored based on schedule
const shouldMonitor = (server) => {
    // Check if trial has ended for free users
    if (server.monitoring.trialEndsAt && server.monitoring.trialEndsAt < Date.now()) {
        return false;
    }

    // Check if today is a monitoring day
    if (!isMonitoringDay(server.monitoring.daysOfWeek)) {
        return false;
    }

    // Check if current time is within any monitoring window
    for (const timeWindow of server.monitoring.timeWindows) {
        if (isWithinTimeWindow(timeWindow)) {
            return true;
        }
    }

    return false;
};

// Function to check a server and return status
const checkServerStatus = async (server) => {
    const startTime = Date.now();
    let status = 'unknown';
    let responseTime = null;
    let error = null;

    try {
        // Different check methods based on server type
        if (server.type === 'tcp') {
            // For TCP servers, use a simple connection check
            // This is simplified; in production, use a proper TCP client
            const [host, portStr] = server.url.split(':');
            const port = parseInt(portStr, 10) || 80;

            // Simulate TCP check (in production, use a real TCP connection)
            const isUp = Math.random() > 0.1; // 90% success rate for demo

            if (isUp) {
                status = 'up';
                responseTime = Math.floor(Math.random() * 100) + 20; // 20-120ms
            } else {
                status = 'down';
                error = 'Connection refused';
            }
        } else {
            // For HTTP/HTTPS resources, use fetch
            const response = await fetch(server.url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'PingPilot-Monitoring/1.0',
                },
                signal: AbortSignal.timeout(10000), // 10 second timeout
            });

            responseTime = Date.now() - startTime;

            if (response.ok) {
                status = 'up';
            } else {
                status = 'error';
                error = `HTTP ${response.status}: ${response.statusText}`;
            }
        }
    } catch (err) {
        responseTime = Date.now() - startTime;
        status = 'down';
        error = err.message || 'Unknown error';
    }

    return {
        status,
        responseTime,
        error,
        lastChecked: new Date().toISOString()
    };
};

// Send alert email for a server status change
const sendAlertEmail = async (server, status, oldStatus) => {
    if (!server.monitoring.alerts.email || !server.contactEmails || server.contactEmails.length === 0) {
        return;
    }

    // Only send alerts during alert window
    if (!isWithinTimeWindow(server.monitoring.alerts.timeWindow)) {
        return;
    }

    // Configure email transport
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    // Determine alert type and content
    let subject, htmlContent;

    if (oldStatus === 'up' && (status === 'down' || status === 'error')) {
        // Server went down
        subject = `🚨 ALERT: ${server.name} is DOWN`;
        htmlContent = `
            <h1>Server Down Alert</h1>
            <p>Your server <strong>${server.name}</strong> is currently <strong style="color: red;">DOWN</strong>.</p>
            <p>URL: ${server.url}</p>
            <p>Time of detection: ${new Date().toLocaleString()}</p>
            <p>Error: ${server.error || 'Unknown error'}</p>
            <p>We'll notify you when the server is back online.</p>
            <p>This is an automated message from Ping Pilot monitoring.</p>
        `;
    } else if (oldStatus !== 'up' && status === 'up') {
        // Server recovered
        subject = `✅ RESOLVED: ${server.name} is back UP`;
        htmlContent = `
            <h1>Server Recovery Alert</h1>
            <p>Your server <strong>${server.name}</strong> is now <strong style="color: green;">UP</strong> again.</p>
            <p>URL: ${server.url}</p>
            <p>Time of recovery: ${new Date().toLocaleString()}</p>
            <p>Current response time: ${server.responseTime}ms</p>
            <p>This is an automated message from Ping Pilot monitoring.</p>
        `;
    } else if (status === 'up' && server.responseTime > server.monitoring.alerts.responseThreshold) {
        // Slow response
        subject = `⚠️ WARNING: ${server.name} is responding slowly`;
        htmlContent = `
            <h1>Server Performance Warning</h1>
            <p>Your server <strong>${server.name}</strong> is <strong style="color: orange;">responding slowly</strong>.</p>
            <p>URL: ${server.url}</p>
            <p>Time of detection: ${new Date().toLocaleString()}</p>
            <p>Current response time: ${server.responseTime}ms (threshold: ${server.monitoring.alerts.responseThreshold}ms)</p>
            <p>This is an automated message from Ping Pilot monitoring.</p>
        `;
    } else {
        // No alert needed
        return;
    }

    // Send email to all contacts
    try {
        for (const email of server.contactEmails) {
            await transporter.sendMail({
                from: process.env.SMTP_FROM_EMAIL,
                to: email,
                subject,
                html: htmlContent,
            });
        }
        console.log(`Alert email sent for ${server.name}`);
    } catch (error) {
        console.error('Error sending alert email:', error);
    }
};

// Main route handler
export async function GET(req) {
    try {
        // This endpoint should be triggered by a scheduled job
        // Check for API key or other authentication in production

        // Get servers that need to be checked
        const serversRef = collection(db, 'servers');
        const querySnapshot = await getDocs(serversRef);

        const results = {
            total: querySnapshot.size,
            checked: 0,
            up: 0,
            down: 0,
            error: 0,
            skipped: 0
        };

        // Process each server
        for (const serverDoc of querySnapshot.docs) {
            const server = {
                id: serverDoc.id,
                ...serverDoc.data()
            };

            // Skip servers that shouldn't be monitored now
            if (!shouldMonitor(server)) {
                results.skipped++;
                continue;
            }

            // Check how long since last check
            const lastChecked = server.lastChecked ? new Date(server.lastChecked) : null;
            const now = new Date();
            const minutesSinceLastCheck = lastChecked
                ? Math.floor((now - lastChecked) / (1000 * 60))
                : Infinity;

            // Skip if checked recently (based on frequency)
            if (lastChecked && minutesSinceLastCheck < server.monitoring.frequency) {
                results.skipped++;
                continue;
            }

            // Check server status
            const oldStatus = server.status;
            const checkResult = await checkServerStatus(server);

            // Update server status in database
            await updateDoc(doc(db, 'servers', server.id), {
                status: checkResult.status,
                responseTime: checkResult.responseTime,
                error: checkResult.error,
                lastChecked: checkResult.lastChecked
            });

            // Increment counters
            results.checked++;
            results[checkResult.status]++;

            // Send alerts if status changed or response time exceeds threshold
            if (oldStatus !== checkResult.status ||
                (checkResult.status === 'up' &&
                    checkResult.responseTime > server.monitoring.alerts.responseThreshold)) {
                await sendAlertEmail(
                    { ...server, ...checkResult },
                    checkResult.status,
                    oldStatus
                );
            }
        }

        return NextResponse.json({ results });
    } catch (error) {
        console.error('Error checking servers:', error);
        return NextResponse.json(
            { error: 'Failed to check servers', type: 'server_error', details: error.message },
            { status: 500 }
        );
    }
}