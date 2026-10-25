import { SITE_URL } from '@/lib/site';

export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/dashboard', '/servers', '/incidents', '/account', '/subscription', '/admin', '/support', '/auth/reset-password', '/auth/verify-email'],
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}
