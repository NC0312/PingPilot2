// services/userService.js
import {
    collection,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const usersCollection = collection(db, 'users');

// Get all users (admin only)
export const getUsers = async () => {
    try {
        const q = query(usersCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting users:', error);
        throw error;
    }
};

// Get user by ID
export const getUserById = async (userId) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            return { id: userDoc.id, ...userDoc.data() };
        } else {
            throw new Error('User not found');
        }
    } catch (error) {
        console.error(`Error getting user with ID ${userId}:`, error);
        throw error;
    }
};

// Update user role (admin only)
export const updateUserRole = async (userId, role) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { role });
    } catch (error) {
        console.error(`Error updating role for user ${userId}:`, error);
        throw error;
    }
};