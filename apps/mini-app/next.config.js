/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Allow images from external sources
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },

    // Expose environment variables to the browser
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_TON_MANIFEST_URL: process.env.NEXT_PUBLIC_TON_MANIFEST_URL,
    },

    // Headers for Telegram Mini App
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'ALLOW-FROM https://web.telegram.org',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org",
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
