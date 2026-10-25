// Canonical origin for metadata, sitemap and structured data. Override with NEXT_PUBLIC_SITE_URL (e.g. a custom domain).
const DEFAULT_URL = process.env.NODE_ENV === 'production' ? 'https://pingpilott.vercel.app' : 'http://localhost:3000';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_URL).replace(/\/$/, '');
export const SITE_NAME = 'Ping Pilott';
