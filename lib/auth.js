// lib/auth.js
import { getApiUrl } from './apiConfig';

export const login = async (email, password) => {
    const response = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
    }

    // Store tokens in localStorage
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('refreshToken', data.data.refreshToken);

    return data.data.user;
};

export const register = async (email, password, name) => {
    const response = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
    }

    // Store tokens in localStorage
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('refreshToken', data.data.refreshToken);

    return data.data.user;
};

export const logout = async () => {
    // Clear tokens from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
};

export const refreshAuthToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    const response = await fetch(getApiUrl('/api/auth/refresh-token'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
        // If refresh fails, logout user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        throw new Error(data.message || 'Failed to refresh token');
    }

    // Update token in localStorage
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('refreshToken', data.data.refreshToken);

    return data.data;
};