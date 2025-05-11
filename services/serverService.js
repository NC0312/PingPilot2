// services/serverService.js
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const serversCollection = collection(db, 'servers');

// Add a new server to monitor
export const addServer = async (serverData) => {
    try {
        const newServer = {
            ...serverData,
            status: 'unknown', // Initial status
            lastChecked: null,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };
        const docRef = await addDoc(serversCollection, newServer);
        return { id: docRef.id, ...newServer };
    } catch (error) {
        console.error('Error adding server:', error);
        throw error;
    }
};

// Get all servers
export const getServers = async () => {
    try {
        const q = query(serversCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting servers:', error);
        throw error;
    }
};

// Get a single server by ID
export const getServerById = async (id) => {
    try {
        const serverDoc = await getDoc(doc(db, 'servers', id));
        if (serverDoc.exists()) {
            return { id: serverDoc.id, ...serverDoc.data() };
        } else {
            throw new Error('Server not found');
        }
    } catch (error) {
        console.error(`Error getting server with ID ${id}:`, error);
        throw error;
    }
};

// Update server status
export const updateServerStatus = async (id, status, responseTime = null) => {
    try {
        const serverRef = doc(db, 'servers', id);
        await updateDoc(serverRef, {
            status,
            responseTime,
            lastChecked: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error(`Error updating server status for ID ${id}:`, error);
        throw error;
    }
};

// Update server details
export const updateServer = async (id, serverData) => {
    try {
        const serverRef = doc(db, 'servers', id);
        await updateDoc(serverRef, {
            ...serverData,
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error(`Error updating server with ID ${id}:`, error);
        throw error;
    }
};

// Delete a server
export const deleteServer = async (id) => {
    try {
        await deleteDoc(doc(db, 'servers', id));
    } catch (error) {
        console.error(`Error deleting server with ID ${id}:`, error);
        throw error;
    }
};
