import { SITE_URL } from '@/lib/site';

const PAGES = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/website-uptime-monitoring', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/server-monitoring', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/pricing', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/auth?mode=signup', priority: 0.4, changeFrequency: 'yearly' },
];

export default function sitemap() {
    return PAGES.map(({ path, ...rest }) => ({ url: `${SITE_URL}${path === '/' ? '' : path}`, ...rest }));
}
