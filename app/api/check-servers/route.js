// app/api/check-servers/route.js
import { NextResponse } from 'next/server';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/firebase/config';
import nodemailer from 'nodemailer';

// Utility function to check if current time is within a time window
const isWithinTimeWindow = (timeWindow) => {
    if (!timeWindow || !timeWindow.start || !timeWindow.end) {
        return true; // If no time window is specified, always monitor
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    return timeWindow.start <= currentTime && currentTime <= timeWindow.end;
};

// Utility function to check if today is included in the monitoring days
const isMonitoringDay = (daysOfWeek) => {
    if (!daysOfWeek || daysOfWeek.length === 0) {
        return true; // If no days are specified, monitor every day
    }

    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    return daysOfWeek.includes(today);
};

// Utility function to check if server should be monitored based on schedule
const shouldMonitor = async (server) => {
    if (!server.monitoring) {
        return true; // If no monitoring settings, always monitor
    }

    // If the server was uploaded by an admin or with an admin plan, always monitor
    if (server.uploadedRole === 'admin' || server.uploadedPlan === 'admin') {
        return true;
    }

    // Check if trial has ended for free users
    if (server.monitoring.trialEndsAt && server.monitoring.trialEndsAt < Date.now()) {
        console.log(`Trial ended for server ${server.name}, checking subscription status`);

        // Check if user has an active subscription
        try {
            const userRef = doc(db, 'users', server.uploadedBy);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                console.log(`User not found for server ${server.name}, skipping check`);
                return false;
            }

            const userData = userSnap.data();
            const subscription = userData.subscription;

            // If user has no subscription or it's expired or still on free plan, skip monitoring
            if (!subscription ||
                subscription.plan === 'free' ||
                (subscription.endDate && subscription.endDate < Date.now())) {
                console.log(`No active paid subscription for server ${server.name}, skipping check`);
                return false;
            }

            // User has an active paid subscription, proceed with monitoring
            console.log(`Active subscription found for server ${server.name}, proceeding with check`);
        } catch (err) {
            console.error(`Error checking subscription for server ${server.name}:`, err);
            return false;
        }
    }

    // Check if today is a monitoring day
    if (!isMonitoringDay(server.monitoring.daysOfWeek)) {
        console.log(`Today is not a monitoring day for server ${server.name}, skipping check`);
        return false;
    }

    // Check if current time is within any monitoring window
    if (server.monitoring.timeWindows && server.monitoring.timeWindows.length > 0) {
        for (const timeWindow of server.monitoring.timeWindows) {
            if (isWithinTimeWindow(timeWindow)) {
                return true;
            }
        }
        console.log(`Current time is outside monitoring windows for server ${server.name}, skipping check`);
        return false;
    }

    return true; // If no time windows, monitor all the time
};

// Function to check a server and return status
const checkServerStatus = async (server) => {
    const startTime = Date.now();
    let status = 'unknown';
    let responseTime = null;
    let error = null;

    // Threshold for slow response (in milliseconds)
    const responseThreshold = server.monitoring?.alerts?.responseThreshold || 1000;

    try {
        console.log(`Checking server ${server.name} (${server.url})`);

        // Different check methods based on server type
        if (server.type === 'tcp') {
            // For TCP servers, use a proper endpoint to check
            try {
                const tcpResponse = await fetch('/api/tcp-check', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        host: server.url.split(':')[0],
                        port: parseInt(server.url.split(':')[1], 10) || 80
                    }),
                    signal: AbortSignal.timeout(10000), // 10 second timeout
                });

                responseTime = Date.now() - startTime;
                const tcpResult = await tcpResponse.json();

                if (tcpResponse.status === 200 && tcpResult.success) {
                    status = 'up';
                    // Check if response is slow
                    if (responseTime > responseThreshold) {
                        error = `Slow response: ${responseTime}ms exceeds threshold of ${responseThreshold}ms`;
                    }
                } else {
                    status = 'down';
                    error = tcpResult.error || `TCP check failed with status: ${tcpResponse.status}`;
                }
            } catch (tcpErr) {
                status = 'down';
                error = tcpErr.message || 'TCP check failed';
                responseTime = Date.now() - startTime;
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

            if (response.status === 200) {
                status = 'up';
                // Check if response is slow
                if (responseTime > responseThreshold) {
                    error = `Slow response: ${responseTime}ms exceeds threshold of ${responseThreshold}ms`;
                }
            } else {
                status = 'down';
                error = `HTTP ${response.status}: ${response.statusText}`;
            }
        }
    } catch (err) {
        responseTime = Date.now() - startTime;
        status = 'down';
        error = err.message || 'Unknown error';
    }

    console.log(`Server ${server.name} status: ${status}, response time: ${responseTime}ms, error: ${error || 'none'}`);

    return {
        status,
        responseTime,
        error,
        lastChecked: new Date().toISOString()
    };
};

// Send alert email for a server status change
const sendAlertEmail = async (server, status, oldStatus) => {
    // Skip if alerts are disabled or no emails configured
    if (!server.monitoring?.alerts?.email ||
        !server.contactEmails ||
        server.contactEmails.length === 0) {
        console.log(`Skipping email alert for ${server.name}: alerts disabled or no contact emails configured`);
        return;
    }

    // Only send alerts during alert window if configured
    if (server.monitoring?.alerts?.timeWindow &&
        !isWithinTimeWindow(server.monitoring.alerts.timeWindow)) {
        console.log(`Skipping email alert for ${server.name}: outside alert time window`);
        return;
    }

    console.log(`Preparing email alert for ${server.name}: status changed from ${oldStatus} to ${status}`);

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
    const responseThreshold = server.monitoring?.alerts?.responseThreshold || 1000;

    if (oldStatus === 'up' && status === 'down') {
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
    } else if (status === 'up' && server.responseTime > responseThreshold) {
        // Slow response
        subject = `⚠️ WARNING: ${server.name} is responding slowly`;
        htmlContent = `
            <h1>Server Performance Warning</h1>
            <p>Your server <strong>${server.name}</strong> is <strong style="color: orange;">responding slowly</strong>.</p>
            <p>URL: ${server.url}</p>
            <p>Time of detection: ${new Date().toLocaleString()}</p>
            <p>Current response time: ${server.responseTime}ms (threshold: ${responseThreshold}ms)</p>
            <p>This is an automated message from Ping Pilot monitoring.</p>
        `;
    } else {
        // No alert needed for other transitions
        console.log(`No alert needed for ${server.name} status transition from ${oldStatus} to ${status}`);
        return;
    }

    // Send email to all contacts
    try {
        console.log(`Sending alert email for ${server.name} to ${server.contactEmails.join(', ')}`);

        // Verify SMTP configuration
        await transporter.verify();

        for (const email of server.contactEmails) {
            const info = await transporter.sendMail({
                from: process.env.SMTP_FROM_EMAIL || 'noreply@pingpilot.com',
                to: email,
                subject,
                html: htmlContent,
            });

            console.log(`Email sent to ${email}: ${info.messageId}`);
        }

        console.log(`Alert email sent successfully for ${server.name}`);
        return true;
    } catch (error) {
        console.error(`Error sending alert email for ${server.name}:`, error);

        // Log detailed error information
        if (error.response) {
            console.error('SMTP Response:', error.response);
        }

        return false;
    }
};

// Main route handler
export async function GET(req) {
    console.log('Starting server check process...');

    try {
        // This endpoint should be triggered by a scheduled job
        // In production, implement proper authentication
        const apiKey = req.headers.get('x-api-key');
        if (process.env.NODE_ENV === 'production' && apiKey !== process.env.MONITORING_API_KEY) {
            console.error('Unauthorized access attempt to check-servers endpoint');
            return NextResponse.json(
                { error: 'Unauthorized access', type: 'auth_error' },
                { status: 401 }
            );
        }

        // Get servers that need to be checked
        const serversRef = collection(db, 'servers');
        const querySnapshot = await getDocs(serversRef);

        const results = {
            total: querySnapshot.size,
            checked: 0,
            up: 0,
            down: 0,
            error: 0,
            skipped: 0,
            alertsSent: 0
        };

        console.log(`Found ${querySnapshot.size} servers to process`);

        // Process each server
        for (const serverDoc of querySnapshot.docs) {
            try {
                const server = {
                    id: serverDoc.id,
                    ...serverDoc.data()
                };

                console.log(`Processing server ${server.name} (${server.id})`);

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
                if (lastChecked && minutesSinceLastCheck < (server.monitoring?.frequency || 5)) {
                    console.log(`Skipping check for ${server.name}: last checked ${minutesSinceLastCheck} minutes ago (frequency: ${server.monitoring?.frequency || 5} minutes)`);
                    results.skipped++;
                    continue;
                }

                // Check server status
                const oldStatus = server.status || 'unknown';
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
                if (checkResult.status in results) {
                    results[checkResult.status]++;
                }

                // Determine if alert should be sent
                const shouldSendAlert =
                    // Status has changed
                    oldStatus !== checkResult.status ||
                    // Server is up but responding slowly
                    (checkResult.status === 'up' &&
                        server.monitoring?.alerts?.responseThreshold &&
                        checkResult.responseTime > server.monitoring.alerts.responseThreshold);

                // Send alerts if needed
                if (shouldSendAlert) {
                    console.log(`Alert condition detected for ${server.name}: status change or slow response`);

                    // Include the check result in the server object for alert email
                    const alertSent = await sendAlertEmail(
                        {
                            ...server,
                            ...checkResult,
                            // Ensure monitoring data is preserved
                            monitoring: {
                                ...server.monitoring,
                                ...checkResult.monitoring
                            }
                        },
                        checkResult.status,
                        oldStatus
                    );

                    if (alertSent) {
                        results.alertsSent++;
                    }
                }
            } catch (serverError) {
                console.error(`Error processing server ${serverDoc.id}:`, serverError);
                // Continue processing other servers even if one fails
            }
        }

        console.log('Server check process completed:', results);
        return NextResponse.json({ results });
    } catch (error) {
        console.error('Error checking servers:', error);
        return NextResponse.json(
            { error: 'Failed to check servers', type: 'server_error', details: error.message },
            { status: 500 }
        );
    }
}

// Also support direct POST requests for manual checks
export async function POST(req) {
    try {
        const { serverId } = await req.json();

        if (!serverId) {
            return NextResponse.json(
                { error: 'Server ID is required', type: 'missing_id' },
                { status: 400 }
            );
        }

        // Get server data
        const serverDoc = await getDoc(doc(db, 'servers', serverId));

        if (!serverDoc.exists()) {
            return NextResponse.json(
                { error: 'Server not found', type: 'not_found' },
                { status: 404 }
            );
        }

        const server = {
            id: serverDoc.id,
            ...serverDoc.data()
        };

        // Check server status
        const oldStatus = server.status || 'unknown';
        const checkResult = await checkServerStatus(server);

        // Update server status in database
        await updateDoc(doc(db, 'servers', server.id), {
            status: checkResult.status,
            responseTime: checkResult.responseTime,
            error: checkResult.error,
            lastChecked: checkResult.lastChecked
        });

        // Send alert if status changed
        if (oldStatus !== checkResult.status ||
            (checkResult.status === 'up' &&
                server.monitoring?.alerts?.responseThreshold &&
                checkResult.responseTime > server.monitoring.alerts.responseThreshold)) {

            await sendAlertEmail(
                { ...server, ...checkResult },
                checkResult.status,
                oldStatus
            );
        }

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