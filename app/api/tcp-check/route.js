// app/api/tcp-check/route.js
import { NextResponse } from 'next/server';
import net from 'net';

export async function POST(req) {
    try {
        const { host, port } = await req.json();

        if (!host || !port) {
            return NextResponse.json(
                { error: 'Host and port are required', success: false },
                { status: 400 }
            );
        }

        console.log(`Checking TCP connection to ${host}:${port}`);
        const startTime = Date.now();

        // Create a promise-based TCP connection
        const checkTcp = () => {
            return new Promise((resolve, reject) => {
                const socket = net.createConnection({ host, port }, () => {
                    // Connection successful
                    const responseTime = Date.now() - startTime;
                    socket.end();
                    resolve({ success: true, responseTime });
                });

                socket.setTimeout(5000, () => {
                    socket.destroy();
                    reject(new Error('Connection timeout'));
                });

                socket.on('error', (err) => {
                    reject(err);
                });
            });
        };

        try {
            const result = await checkTcp();
            console.log(`TCP connection successful: ${host}:${port} (${result.responseTime}ms)`);
            return NextResponse.json({
                success: true,
                responseTime: result.responseTime,
                message: 'Connection successful'
            });
        } catch (tcpError) {
            console.error(`TCP connection failed: ${host}:${port}`, tcpError);
            return NextResponse.json({
                success: false,
                error: tcpError.message || 'Connection failed',
                message: 'Connection failed'
            });
        }
    } catch (error) {
        console.error('Error in TCP check:', error);
        return NextResponse.json(
            { error: error.message, success: false },
            { status: 500 }
        );
    }
}