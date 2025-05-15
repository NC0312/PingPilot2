// app/api/check-servers/route.js
import { NextResponse } from 'next/server';
import { collection, getDocs, query, where, doc, updateDoc, getDoc, writeBatch, addDoc, serverTimestamp, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/app/firebase/config';
import nodemailer from 'nodemailer';

// Collections
const SERVERS_COLLECTION = 'servers';
const CRONJOB_COLLECTION = 'cronJobs';

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

    const now = new Date();
    const result = {
        status,
        responseTime,
        error,
        lastChecked: now.toISOString(),
        timestamp: Timestamp.fromDate(now)
    };

    // Store the check result in history
    await storeServerCheckHistory(server.id, result);

    return result;
};

// Store server check history in Firestore
const storeServerCheckHistory = async (serverId, checkResult) => {
    try {
        const now = new Date();
        // Add to the cronJob collection for dashboard charts
        const cronJobRef = collection(db, CRONJOB_COLLECTION);
        await addDoc(cronJobRef, {
            serverId,
            status: checkResult.status,
            responseTime: checkResult.responseTime,
            error: checkResult.error,
            timestamp: checkResult.timestamp || Timestamp.now(),
            date: now.toISOString().split('T')[0], // YYYY-MM-DD
            hour: now.getHours(),
            minute: now.getMinutes(),
            timeSlot: Math.floor(now.getMinutes() / 15), // 15-minute slots (0-3)
            hourMinute: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
            created: serverTimestamp()
        });

        console.log(`Stored check history for server ${serverId}`);

        // Check for data retention at midnight
        if (now.getHours() === 0 && now.getMinutes() < 5) {
            console.log("Midnight detected, running data retention policy");
            await runDataRetentionPolicy();
        }
    } catch (err) {
        console.error(`Error storing server check history for ${serverId}:`, err);
    }
};

const getAggregatedData = async (serverId, hours = 24) => {
    try {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (hours * 60 * 60 * 1000));

        // Query the last 24 hours of data
        const cronJobRef = collection(db, CRONJOB_COLLECTION);
        const q = query(
            cronJobRef,
            where('serverId', '==', serverId),
            where('timestamp', '>=', Timestamp.fromDate(startDate)),
            where('timestamp', '<=', Timestamp.fromDate(endDate)),
            orderBy('timestamp', 'asc')
        );

        const snapshot = await getDocs(q);
        const hourlyData = new Map();

        // Initialize hourly slots
        for (let i = 0; i < hours; i++) {
            const slotTime = new Date(endDate.getTime() - (i * 60 * 60 * 1000));
            const hourKey = slotTime.getHours().toString().padStart(2, '0');
            hourlyData.set(hourKey, {
                hour: hourKey,
                avgResponseTime: 0,
                upCount: 0,
                downCount: 0,
                totalChecks: 0,
                totalResponseTime: 0
            });
        }

        // Aggregate data by hour
        snapshot.forEach(doc => {
            const data = doc.data();
            const hour = data.hour.toString().padStart(2, '0');

            if (hourlyData.has(hour)) {
                const hourData = hourlyData.get(hour);
                hourData.totalChecks++;

                if (data.status === 'up') {
                    hourData.upCount++;
                    if (data.responseTime) {
                        hourData.totalResponseTime += data.responseTime;
                    }
                } else {
                    hourData.downCount++;
                }

                // Calculate average response time
                if (hourData.upCount > 0) {
                    hourData.avgResponseTime = Math.round(hourData.totalResponseTime / hourData.upCount);
                }
            }
        });

        // Convert Map to Array and sort by hour
        return Array.from(hourlyData.values())
            .sort((a, b) => a.hour.localeCompare(b.hour))
            .map(data => ({
                time: `${data.hour}:00`,
                avgTime: data.avgResponseTime,
                uptime: data.totalChecks > 0 ? (data.upCount / data.totalChecks) * 100 : 0,
                status: data.upCount >= data.downCount ? 'up' : 'down'
            }));

    } catch (error) {
        console.error('Error getting aggregated data:', error);
        return [];
    }
};

// Data retention policy - dump old data
const runDataRetentionPolicy = async () => {
    try {
        console.log("Running data retention policy");

        // Get yesterday's date in YYYY-MM-DD format
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // For each server, archive yesterday's data
        const serversRef = collection(db, SERVERS_COLLECTION);
        const serversSnapshot = await getDocs(serversRef);

        for (const serverDoc of serversSnapshot.docs) {
            const serverId = serverDoc.id;

            // Query all cronJob entries for this server from yesterday
            const cronJobsRef = collection(db, CRONJOB_COLLECTION);
            const q = query(
                cronJobsRef,
                where('serverId', '==', serverId),
                where('date', '==', yesterdayStr)
            );

            const cronJobsSnapshot = await getDocs(q);

            // If there's data to archive
            if (!cronJobsSnapshot.empty) {
                // Calculate daily statistics
                let totalResponseTime = 0;
                let totalChecks = 0;
                let upChecks = 0;
                let maxResponseTime = 0;
                let minResponseTime = Number.MAX_SAFE_INTEGER;

                cronJobsSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.responseTime) {
                        totalResponseTime += data.responseTime;
                        maxResponseTime = Math.max(maxResponseTime, data.responseTime);
                        minResponseTime = Math.min(minResponseTime, data.responseTime);
                        totalChecks++;

                        if (data.status === 'up') {
                            upChecks++;
                        }
                    }
                });

                // Store the daily summary
                const dailySummaryRef = collection(db, 'serverDailySummary');
                await addDoc(dailySummaryRef, {
                    serverId,
                    date: yesterdayStr,
                    totalChecks,
                    upChecks,
                    uptime: totalChecks > 0 ? (upChecks / totalChecks) * 100 : 0,
                    avgResponseTime: totalChecks > 0 ? totalResponseTime / totalChecks : 0,
                    maxResponseTime: maxResponseTime !== 0 ? maxResponseTime : null,
                    minResponseTime: minResponseTime !== Number.MAX_SAFE_INTEGER ? minResponseTime : null,
                    createdAt: Timestamp.now()
                });

                console.log(`Archived data for server ${serverId} on ${yesterdayStr}`);

                // Delete the daily data from cronJobs collection
                const batch = writeBatch(db);
                let count = 0;

                cronJobsSnapshot.forEach(doc => {
                    batch.delete(doc.ref);
                    count++;

                    // Firestore batches are limited to 500 operations
                    if (count >= 450) {
                        // Commit batch and start a new one
                        batch.commit();
                        count = 0;
                    }
                });

                // Commit any remaining operations
                if (count > 0) {
                    await batch.commit();
                }

                console.log(`Deleted ${cronJobsSnapshot.size} records for server ${serverId} on ${yesterdayStr}`);
            }
        }

        console.log("Data retention policy completed successfully");
    } catch (err) {
        console.error("Error running data retention policy:", err);
    }
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
    console.log('Starting server check process with parallel processing...');

    try {
        // Authentication check
        // const apiKey = req.headers.get('x-api-key');
        // if (process.env.NODE_ENV === 'production' && apiKey !== process.env.MONITORING_API_KEY) {
        //     console.error('Unauthorized access attempt to check-servers endpoint');
        //     return NextResponse.json(
        //         { error: 'Unauthorized access', type: 'auth_error' },
        //         { status: 401 }
        //     );
        // }

        // Get servers that need to be checked
        const serversRef = collection(db, SERVERS_COLLECTION);
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

        console.log(`Found ${querySnapshot.size} servers to process in parallel`);

        // Create batched write for better performance
        const batch = writeBatch(db);

        // Process servers in parallel
        const serverProcessPromises = querySnapshot.docs.map(async (serverDoc) => {
            try {
                const server = {
                    id: serverDoc.id,
                    ...serverDoc.data()
                };

                console.log(`Processing server ${server.name} (${server.id})`);

                // Skip servers that shouldn't be monitored now
                if (!(await shouldMonitor(server))) {
                    return { action: 'skipped', server };
                }

                // Check how long since last check with precise timing
                const lastChecked = server.lastChecked ? new Date(server.lastChecked) : null;
                const now = new Date();
                const millisecondsSinceLastCheck = lastChecked
                    ? (now - lastChecked)
                    : Infinity;

                // Calculate minimum check interval in milliseconds
                const frequency = server.monitoring?.frequency || 5;
                const minimumCheckInterval = frequency * 60 * 1000;

                // Log timing information
                console.log(`Server ${server.name} timing:`, {
                    lastChecked: lastChecked ? lastChecked.toISOString() : 'Never',
                    millisecondsSinceLastCheck,
                    minimumCheckInterval,
                    frequencyMinutes: frequency
                });

                // Skip if checked recently
                if (lastChecked && millisecondsSinceLastCheck < minimumCheckInterval) {
                    const minutesSinceLastCheck = (millisecondsSinceLastCheck / (1000 * 60)).toFixed(2);
                    console.log(`Skipping check for ${server.name}: last checked ${millisecondsSinceLastCheck} ms (${minutesSinceLastCheck} minutes) ago (frequency: ${frequency} minutes)`);
                    return { action: 'skipped', server };
                }

                // Check server status
                const oldStatus = server.status || 'unknown';
                const checkResult = await checkServerStatus(server);

                // Prepare data for batch update
                const updateData = {
                    status: checkResult.status,
                    responseTime: checkResult.responseTime,
                    error: checkResult.error,
                    lastChecked: checkResult.lastChecked
                };

                // Record the last status change if status changed
                if (oldStatus !== checkResult.status) {
                    updateData.lastStatusChange = checkResult.lastChecked;
                }

                // Queue update in batch
                batch.update(doc(db, SERVERS_COLLECTION, server.id), updateData);

                // Determine if alert should be sent
                const shouldSendAlert =
                    oldStatus !== checkResult.status ||
                    (checkResult.status === 'up' &&
                        server.monitoring?.alerts?.responseThreshold &&
                        checkResult.responseTime > server.monitoring.alerts.responseThreshold);

                // Include result in return value
                return {
                    action: 'checked',
                    server,
                    oldStatus,
                    checkResult,
                    shouldSendAlert
                };
            } catch (serverError) {
                console.error(`Error processing server ${serverDoc.id}:`, serverError);
                return { action: 'error', serverId: serverDoc.id, error: serverError };
            }
        });

        // Wait for all server processing to complete
        const serverResults = await Promise.all(serverProcessPromises);

        // Process results and send alerts (alerts still run sequentially to avoid overwhelming email service)
        for (const result of serverResults) {
            if (result.action === 'skipped') {
                results.skipped++;
            } else if (result.action === 'checked') {
                results.checked++;
                results[result.checkResult.status]++;

                if (result.shouldSendAlert) {
                    console.log(`Alert condition detected for ${result.server.name}: status change or slow response`);

                    // Include the check result in server object for alert email
                    const alertSent = await sendAlertEmail(
                        {
                            ...result.server,
                            ...result.checkResult,
                            monitoring: {
                                ...result.server.monitoring,
                                ...result.checkResult.monitoring
                            }
                        },
                        result.checkResult.status,
                        result.oldStatus
                    );

                    if (alertSent) {
                        results.alertsSent++;
                    }
                }
            } else if (result.action === 'error') {
                results.error++;
            }
        }

        for (const result of serverResults) {
            if (result.action === 'checked') {
                result.aggregatedData = await getAggregatedData(result.server.id);
            }
        }

        // Commit all database updates at once
        await batch.commit();

        console.log('Parallel server check process completed:', results);
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
        const serverDoc = await getDoc(doc(db, SERVERS_COLLECTION, serverId));

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
        const updateData = {
            status: checkResult.status,
            responseTime: checkResult.responseTime,
            error: checkResult.error,
            lastChecked: checkResult.lastChecked
        };

        // Record the last status change if status changed
        if (oldStatus !== checkResult.status) {
            updateData.lastStatusChange = checkResult.lastChecked;
        }

        await updateDoc(doc(db, SERVERS_COLLECTION, server.id), updateData);

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

        const aggregatedData = await getAggregatedData(server.id);

        return NextResponse.json({
            message: 'Server checked successfully',
            result: checkResult,
            aggregatedData
        });
    } catch (error) {
        console.error('Error checking server:', error);
        return NextResponse.json(
            { error: 'Failed to check server', type: 'server_error', details: error.message },
            { status: 500 }
        );
    }
}