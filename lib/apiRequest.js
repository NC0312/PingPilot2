// lib/apiRequest.js
import { getApiUrl } from './apiConfig';
import { refreshAuthToken } from './auth';

export const apiRequest = async (endpoint, options = {}) => {
    // Set up default headers
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Make the request
    let response = await fetch(getApiUrl(endpoint), {
        ...options,
        headers
    });

    // Handle 401 Unauthorized (token expired)
    if (response.status === 401 && token) {
        try {
            // Try to refresh the token
            await refreshAuthToken();

            // Retry the request with the new token
            const newToken = localStorage.getItem('token');
            headers['Authorization'] = `Bearer ${newToken}`;

            response = await fetch(getApiUrl(endpoint), {
                ...options,
                headers
            });
        } catch (err) {
            // If refresh fails, redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            window.location.href = '/auth';
            throw new Error('Session expired. Please login again.');
        }
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Request failed');
    }

    return data;
};