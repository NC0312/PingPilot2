/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://3.110.110.240:5000/api/:path*',
            },
        ];
    },
};

export default nextConfig;
