'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/app/context/AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    // Live updates are private to the signed-in user, so the connection exists only while someone is signed in
    // and presents their token. The backend puts the connection in that user's own room.
    const signedIn = !!user;

    useEffect(() => {
        if (!signedIn) return undefined;

        const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

        const socketInstance = io(socketUrl, {
            transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
            // A function, so every (re)connect sends the current token, including one that was just refreshed
            auth: (cb) => cb({ token: localStorage.getItem('token') }),
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
            autoConnect: true,
        });

        socketInstance.on('connect', () => setIsConnected(true));
        socketInstance.on('disconnect', () => setIsConnected(false));
        socketInstance.on('connect_error', (err) => {
            console.warn('Live updates unavailable, falling back to polling:', err.message);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
            setSocket(null);
            setIsConnected(false);
        };
    }, [signedIn]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
