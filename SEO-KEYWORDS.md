# Ping Pilott: Google SEO keyword strategy

Method: SERP and competitor review (UptimeRobot, Better Stack, Pingdom, HetrixTools, Site24x7, OnlineOrNot, StatusCake, Uptime Kuma). **No search-volume tool was available**, so tiers below are judgement of intent and competitiveness, not measured volume. Validate in Google Search Console (Performance > Queries) and Google Keyword Planner after indexing.

## Market read
- Head terms ("uptime monitoring", "website monitoring") are owned by UptimeRobot, Pingdom, Better Stack, Site24x7. Not winnable on a new domain in the short term.
- Searchers compare on: **free plan, check interval (1 min), alert channels, price, status pages, incident history**. Ping Pilott matches the first four of these in its copy.
- Freshping shut down in March 2026, so "Freshping alternative" demand is looking for a home.
- The brand "Ping Pilott" (double t) is easily mistyped as "Ping Pilot"; branded queries return other tools. Build brand signals (Organization schema, consistent name, backlinks).

## Keyword tiers

### Tier 1: Homepage targets (primary + secondary)
| Keyword | Intent | Where used |
|---|---|---|
| website uptime monitoring | commercial | title, H1 eyebrow, description |
| website monitoring tool | commercial | title, schema |
| server monitoring | commercial | title, features H2 |
| uptime monitor | commercial | hero copy |
| website down alert / downtime alerts | commercial | hero copy, OG |
| free uptime monitoring | transactional | CTA, description |
| incident history / response time monitoring | feature | feature bento (already present) |

### Tier 2: Long-tail (winnable first; needs new pages)
- uptime monitoring for small business / for developers / for SaaS
- 1 minute uptime monitoring
- website monitoring with email alerts
- how to check if my website is down
- monitor website response time
- webhook uptime alerts
- uptime monitoring API access
- cheap uptime monitoring / uptime monitoring pricing

### Tier 3: Alternative and comparison pages (high conversion)
- UptimeRobot alternative (do not lead with a commercial-use angle: its terms reportedly changed in 2026; verify first)
- Pingdom alternative (cheaper)
- Better Stack alternative / Freshping alternative
- UptimeRobot vs Ping Pilott

### Tier 4: Informational / blog (links and authority)
- how to monitor website uptime
- what is uptime monitoring / what is a good uptime percentage
- how to calculate uptime (99.9% downtime table)
- HTTP status codes 500 / 502 / 503 / 504 explained
- how to reduce website downtime
- website monitoring checklist

## Page map
| URL | Primary keyword | Status |
|---|---|---|
| `/` | website uptime monitoring | optimised |
| `/website-uptime-monitoring` | website uptime monitoring tool | live |
| `/server-monitoring` | server monitoring | live |
| `/server-resource-monitoring` | server CPU memory disk monitoring | live (2026-10-26) |
| `/public-status-page` | public status page / status page for website | live (2026-10-26) |
| `/pricing` | uptime monitoring pricing | live |
| `/alternatives/uptimerobot`, `/alternatives/pingdom` | X alternative | live |
| `/blog/*` | Tier 4 topics | 6 guides live; add more |
| `/docs/*` | setup, status pages, host agent | live |

## Implemented in code
- Title, meta description, canonical, Open Graph, Twitter card (`app/layout.js`)
- Organization, WebSite, SoftwareApplication JSON-LD with pricing offers (`app/page.js`)
- Homepage copy now uses "website uptime monitoring", "server monitoring", "uptime monitor"
- `app/robots.js` and `app/sitemap.js`; signed-in routes disallowed and sent `X-Robots-Tag: noindex` (`next.config.mjs`)

## Added 2026-10-26 (SEO brought in line with the product)
- Fixed stale claims: server monitoring no longer says there is no agent; alternatives pages no longer say there are no status pages; webhooks wording now matches the plan rules (Slack, Discord, Telegram free).
- New pages: `/public-status-page`, `/server-resource-monitoring`, docs guide `/docs/status-pages`, three blog guides (status page, "down for others but not me", server CPU/memory/disk).
- `lib/seo.js`: `pageMetadata()` gives every page canonical, Open Graph (with image, site name) and Twitter tags. Before, a page's own `openGraph` replaced the root one and dropped the image.
- Removed the root canonical of `/` that every page without its own canonical inherited; `/auth` is now `noindex` and out of the sitemap.
- `/og` draws a 1200x630 share card (the old `banner.png` is square).
- FAQPage JSON-LD on every page with an FAQ, TechArticle on docs, MobileApplication on `/android-app`, Offer prices on `/pricing`, a feature list on the home SoftwareApplication.
- `public/llms.txt` lists the key pages for AI search tools.
- Home page gained a FAQ and a "more than a ping" section linking to the new pages.

## Needs you
1. Site URL defaults to https://pingpilott.vercel.app in production; set `NEXT_PUBLIC_SITE_URL` only if you move to a custom domain.
2. Submit the sitemap in Google Search Console (the verification file is already in `public/`).
3. Add real social proof (reviews, customer count) before adding `aggregateRating`; do not fabricate it.
4. Still open: Better Stack / Freshping alternative pages (needs verified competitor facts), `/ssl-certificate-monitoring` and `/api-monitoring` landing pages, more Tier 4 posts.
5. Add descriptive `alt` text to `HeroPreview` / dashboard images if any are used as `<img>`.

## Measure
Leading indicators in Search Console: impressions for "uptime monitor" variants, indexed pages count, CTR of homepage. Failure signal: homepage not indexed within about 2 weeks of sitemap submission.
