import { SITE_URL } from '@/lib/site';

export default function sitemap() {
    return [
        { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
        { url: `${SITE_URL}/auth?mode=signup`, changeFrequency: 'monthly', priority: 0.5 },
    ];
}
