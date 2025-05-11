// utils/serverCheckerWithAlerts.js

import { getServers, updateServerStatus, getServerById } from '../services/serverService';
import { getUserById } from '../services/userService';
import { sendDownAlert, sendRecoveryAlert, sendResponseTimeAlert } from './emailService';

// Check a single server's status
export const checkServerStatus = async (url) => {
    const startTime = Date.now();

    try {
        const response = await fetch(url, {
            method: 'GET',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            timeout: 5000 // 5 second timeout
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Check if response is ok (status code between 200-299)
        if (response.ok) {
            return {
                status: 'up',
                responseTime,
                error: null
            };
        } else {
            return {
                status: 'down',
                responseTime,
                error: `HTTP Status: ${response.status}`
            };
        }
    } catch (error) {
        return {
            status: 'down',
            responseTime: null,
            error: error.message
        };
    }
};

// Check all servers and update their status in Firestore
export const checkAllServersWithAlerts = async () => {
    try {
        // Get all servers from Firestore
        const servers = await getServers();

        // Track status changes for alert management
        const statusChanges = [];
        const responseTimeAlerts = [];

        // Check each server in parallel using Promise.all
        const statusPromises = servers.map(async (server) => {
            try {
                // Check if server should be monitored now based on schedule
                if (!shouldMonitorServer(server)) {
                    return {
                        id: server.id,
                        name: server.name,
                        status: server.status, // Keep existing status
                        message: 'Not scheduled for monitoring at this time'
                    };
                }

                // Check if trial has expired
                if (isTrialExpired(server)) {
                    // Only update if not already marked as expired
                    if (server.status !== 'expired') {
                        await updateServerStatus(server.id, 'expired');
                    }
                    return {
                        id: server.id,
                        name: server.name,
                        status: 'expired',
                        message: 'Trial period has expired'
                    };
                }

                const result = await checkServerStatus(server.url);
                const previousStatus = server.status;

                // Track status changes for alerting
                if (previousStatus !== result.status) {
                    statusChanges.push({
                        serverId: server.id,
                        name: server.name,
                        url: server.url,
                        oldStatus: previousStatus,
                        newStatus: result.status,
                        responseTime: result.responseTime,
                        error: result.error,
                        uploadedBy: server.uploadedBy
                    });
                }

                // Track response time alerts
                if (
                    result.status === 'up' &&
                    server.monitoring?.alerts?.enabled &&
                    server.monitoring?.alerts?.responseThreshold &&
                    result.responseTime > server.monitoring.alerts.responseThreshold
                ) {
                    responseTimeAlerts.push({
                        serverId: server.id,
                        name: server.name,
                        url: server.url,
                        responseTime: result.responseTime,
                        threshold: server.monitoring.alerts.responseThreshold,
                        uploadedBy: server.uploadedBy
                    });
                }

                // Update the server status in Firestore
                await updateServerStatus(
                    server.id,
                    result.status,
                    result.responseTime,
                    result.error
                );

                return {
                    id: server.id,
                    name: server.name,
                    status: result.status,
                    responseTime: result.responseTime,
                    error: result.error || null
                };
            } catch (error) {
                console.error(`Error checking server ${server.name}:`, error);
                // Update the server with error status
                await updateServerStatus(server.id, 'error', null, error.message);

                return {
                    id: server.id,
                    name: server.name,
                    status: 'error',
                    error: error.message
                };
            }
        });

        const results = await Promise.all(statusPromises);

        // Process alerts
        await processAlerts(statusChanges, responseTimeAlerts);

        return results;
    } catch (error) {
        console.error('Error checking all servers:', error);
        throw error;
    }
};

// Determine if a server should be monitored based on its schedule
const shouldMonitorServer = (server) => {
    if (!server.monitoring || !server.monitoring.daysOfWeek) {
        return true; // Default to always monitor if no schedule defined
    }

    const now = new Date();
    const currentDay = now.getDay(); // 0-6, where 0 is Sunday

    // Check if current day is in the monitoring schedule
    if (!server.monitoring.daysOfWeek.includes(currentDay)) {
        return false;
    }

    // Check if current time is within any of the monitoring time windows
    if (server.monitoring.timeWindows && server.monitoring.timeWindows.length > 0) {
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeMinutes = currentHours * 60 + currentMinutes;

        // Check each time window
        for (const window of server.monitoring.timeWindows) {
            const [startHours, startMinutes] = window.start.split(':').map(Number);
            const [endHours, endMinutes] = window.end.split(':').map(Number);

            const startTimeMinutes = startHours * 60 + startMinutes;
            const endTimeMinutes = endHours * 60 + endMinutes;

            // Handle windows that span midnight
            if (endTimeMinutes < startTimeMinutes) {
                if (currentTimeMinutes >= startTimeMinutes || currentTimeMinutes <= endTimeMinutes) {
                    return true;
                }
            } else {
                if (currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes) {
                    return true;
                }
            }
        }

        return false; // Not within any time window
    }

    return true; // No time windows defined, monitor all day
};

// Check if trial has expired
const isTrialExpired = (server) => {
    if (!server.monitoring || !server.monitoring.trialEndsAt) {
        return false; // No trial end date defined
    }

    const now = new Date();
    const trialEnd = server.monitoring.trialEndsAt.toDate();

    return now > trialEnd;
};

// Process alerts for status changes and response time issues
const processAlerts = async (statusChanges, responseTimeAlerts) => {
    // First, handle status change alerts
    for (const change of statusChanges) {
        try {
            // Get the latest server data to check alert settings
            const server = await getServerById(change.serverId);

            // Skip if alerts are disabled
            if (!server.monitoring?.alerts?.enabled) {
                continue;
            }

            // Get the server owner
            const owner = await getUserById(change.uploadedBy);

            // Handle down alerts
            if (change.oldStatus !== 'down' && change.newStatus === 'down') {
                await sendDownAlert({
                    id: change.serverId,
                    name: change.name,
                    url: change.url,
                    error: change.error
                }, owner);
            }

            // Handle recovery alerts
            if (change.oldStatus === 'down' && change.newStatus === 'up') {
                await sendRecoveryAlert({
                    id: change.serverId,
                    name: change.name,
                    url: change.url,
                    responseTime: change.responseTime
                }, owner);
            }
        } catch (error) {
            console.error('Error processing status change alert:', error);
        }
    }

    // Then, handle response time alerts
    for (const alert of responseTimeAlerts) {
        try {
            // Get the latest server data to double-check alert settings
            const server = await getServerById(alert.serverId);

            // Skip if alerts are disabled or response threshold has changed
            if (
                !server.monitoring?.alerts?.enabled ||
                server.monitoring?.alerts?.responseThreshold !== alert.threshold
            ) {
                continue;
            }

            // Get the server owner
            const owner = await getUserById(alert.uploadedBy);

            // Send the response time alert
            await sendResponseTimeAlert({
                id: alert.serverId,
                name: alert.name,
                url: alert.url,
                responseTime: alert.responseTime,
                monitoring: server.monitoring
            }, owner);
        } catch (error) {
            console.error('Error processing response time alert:', error);
        }
    }
};

export default checkAllServersWithAlerts;