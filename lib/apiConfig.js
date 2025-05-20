const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ping-pilott-backend.onrender.com';

export const getApiUrl = (endpoint) => {
    return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

export default API_BASE_URL;