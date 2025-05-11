// utils/serverChecker.js
import { getServers, updateServerStatus } from '../services/serverService';

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
                responseTime
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
            responseTime: Date.now() - startTime,
            error: error.message
        };
    }
};

// Check all servers and update their status in Firestore
export const checkAllServers = async () => {
    try {
        // Get all servers from Firestore
        const servers = await getServers();

        // Check each server in parallel using Promise.all
        const statusPromises = servers.map(async (server) => {
            try {
                const result = await checkServerStatus(server.url);

                // Update the server status in Firestore
                await updateServerStatus(
                    server.id,
                    result.status,
                    result.responseTime
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
                await updateServerStatus(server.id, 'error');

                return {
                    id: server.id,
                    name: server.name,
                    status: 'error',
                    error: error.message
                };
            }
        });

        return await Promise.all(statusPromises);
    } catch (error) {
        console.error('Error checking all servers:', error);
        throw error;
    }
};