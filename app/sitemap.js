import { SITE_URL } from '@/lib/site';
import { POSTS } from '@/lib/posts';

const PAGES = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/website-uptime-monitoring', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/server-monitoring', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/pricing', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/alternatives/uptimerobot', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/alternatives/pingdom', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/blog', priority: 0.6, changeFrequency: 'weekly' },
    ...POSTS.map((p) => ({ path: `/blog/${p.slug}`, priority: 0.6, changeFrequency: 'monthly', lastModified: p.date })),
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/auth?mode=signup', priority: 0.4, changeFrequency: 'yearly' },
];

export default function sitemap() {
    return PAGES.map(({ path, ...rest }) => ({ url: `${SITE_URL}${path === '/' ? '' : path}`, ...rest }));
}
