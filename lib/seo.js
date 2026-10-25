import { SITE_NAME } from '@/lib/site';

// A page's own openGraph object replaces the one in the root layout (Next merges metadata one level deep), so a page that
// sets only { url, title } loses the image, site name and type. Every public page builds its metadata here instead.
export const OG_IMAGE = { url: '/og', width: 1200, height: 630, alt: 'Ping Pilott: website and server uptime monitoring' };

/**
 * @param {{ path: string, title: string, description: string, ogTitle?: string, type?: 'website'|'article', publishedTime?: string }} page
 *   title is the page's own title (the site suffix is added by the layout); ogTitle is the longer share-card title.
 */
export function pageMetadata({ path, title, description, ogTitle, type = 'website', publishedTime }) {
    const shareTitle = ogTitle || `${title} | ${SITE_NAME}`;
    return {
        title,
        description,
        alternates: { canonical: path },
        openGraph: { type, url: path, title: shareTitle, description, siteName: SITE_NAME, locale: 'en_US', images: [OG_IMAGE], ...(publishedTime ? { publishedTime } : {}) },
        twitter: { card: 'summary_large_image', title: shareTitle, description, images: [OG_IMAGE.url] },
    };
}

/** FAQPage structured data from [{ q, a }]. Only for questions that are visible on the same page. */
export const faqSchema = (faqs) => ({
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});
