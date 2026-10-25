const PRIVATE = ['/dashboard', '/servers', '/incidents', '/status-pages', '/account', '/subscription', '/admin', '/support'];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Signed-in pages carry no public content; keep them out of Google's index even if linked.
  async headers() {
    return PRIVATE.flatMap((p) => [p, `${p}/:path*`]).map((source) => ({
      source,
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    }));
  },
};

export default nextConfig;
