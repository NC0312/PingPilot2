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
| uptime monitoring free trial | transactional | CTA, description |
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
- UptimeRobot alternative (paid-plan commercial-use angle)
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
| `/website-uptime-monitoring` | website uptime monitoring tool | to build |
| `/server-monitoring` | server monitoring | to build |
| `/pricing` (split from homepage anchor) | uptime monitoring pricing | to build |
| `/alternatives/uptimerobot`, `/alternatives/pingdom` | X alternative | to build |
| `/blog/*` | Tier 4 topics | to build |

## Implemented in code
- Title, meta description, canonical, Open Graph, Twitter card (`app/layout.js`)
- Organization, WebSite, SoftwareApplication JSON-LD with pricing offers (`app/page.js`)
- Homepage copy now uses "website uptime monitoring", "server monitoring", "uptime monitor"
- `app/robots.js` and `app/sitemap.js`; signed-in routes disallowed and sent `X-Robots-Tag: noindex` (`next.config.mjs`)

## Needs you
1. Site URL defaults to https://pingpilott.vercel.app in production; set `NEXT_PUBLIC_SITE_URL` only if you move to a custom domain.
2. Submit the sitemap in Google Search Console (the verification file is already in `public/`).
3. Add real social proof (reviews, customer count) before adding `aggregateRating`; do not fabricate it.
4. Create the Tier 3 and 4 pages above; pricing and comparison pages should be separate crawlable URLs.
5. Add descriptive `alt` text to `HeroPreview` / dashboard images if any are used as `<img>`.

## Measure
Leading indicators in Search Console: impressions for "uptime monitor" variants, indexed pages count, CTR of homepage. Failure signal: homepage not indexed within about 2 weeks of sitemap submission.
