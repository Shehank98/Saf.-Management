/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3001', 'https://safari-management.up.railway.app'],
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_GOOGLE_MAPS_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
  },
  async rewrites() {
    return [
      // Serve the PWA index.html when visiting /pwa or /pwa/
      { source: '/pwa', destination: '/pwa/index.html' },
      { source: '/pwa/', destination: '/pwa/index.html' },
    ];
  },
};

module.exports = nextConfig;
