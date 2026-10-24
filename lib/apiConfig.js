// Production builds fall back to the hosted API, so a deployment still works if NEXT_PUBLIC_API_URL was never set.
// Set the variable to point a deployment at a different backend. In development it comes from .env.local.
const HOSTED_API_URL = 'https://ping-pilott-backend.onrender.com';

const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? HOSTED_API_URL : '')
).replace(/\/$/, '');

export const getApiUrl = (endpoint) => {
    return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

export default API_BASE_URL;
