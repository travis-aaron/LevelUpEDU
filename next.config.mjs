import withPWA from 'next-pwa'

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, {isServer}) => {
        if (isServer) {
            // Don't bundle Phaser on the server
            config.externals.push('phaser')
        }
        return config
    },
    // Enable static file serving from public directory
    async headers() {
        return [
            {
                source: '/assets/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ]
    },
}

const pwaConfig = withPWA({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
})

export default pwaConfig(nextConfig)
