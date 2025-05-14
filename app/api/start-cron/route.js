import { NextResponse } from 'next/server';
import cron from 'node-cron';
import fetch from 'node-fetch';

// Using a more reliable approach to track cron job status
let cronJob = null;

export async function GET(req) {
    // Check if cron is already running
    if (cronJob) {
        return NextResponse.json({ 
            message: 'Cron already running', 
            success: true 
        }, { status: 200 });
    }

    try {
        // Use environment variables for base URL configuration
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 
                       (process.env.NODE_ENV === 'production' 
                        ? 'https://pingpilott.vercel.app' 
                        : 'http://localhost:3000');
        
        // Schedule cron job with appropriate timing
        // For production, you might want a different schedule than every minute
        const schedule = process.env.CRON_SCHEDULE || '* * * * *'; // Default to every 5 minutes
        
        // Create the cron job
        cronJob = cron.schedule(schedule, async () => {
            const timestamp = new Date().toISOString();
            console.log(`Running server check at: ${timestamp}`);
            
            try {
                const response = await fetch(`${baseUrl}/api/check-servers`, { 
                    method: 'GET',
                    headers: { 
                        'Content-Type': 'application/json',
                        // Add authentication if needed
                        'x-api-key': process.env.MONITORING_API_KEY || ''
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`API returned ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Server check complete:', data);
            } catch (error) {
                console.error('Cron job error:', error.message);
            }
        });
        
        // Start the cron job
        cronJob.start();
        
        console.log(`Cron scheduler started on ${baseUrl}. Running with schedule: ${schedule}`);
        return NextResponse.json({ 
            message: 'Cron job started successfully', 
            schedule,
            baseUrl,
            success: true 
        }, { status: 200 });
    } catch (error) {
        console.error('Failed to start cron job:', error);
        return NextResponse.json({
            message: 'Failed to start cron job',
            error: error.message,
            success: false
        }, { status: 500 });
    }
}
