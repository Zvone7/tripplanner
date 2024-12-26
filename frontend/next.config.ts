/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5156/api/:path*', // todo - you might have to figure out https eventually
        // destination: "https://localhost:7048/api/:path*", // Proxy to backend
      },
    ];
  },
};

module.exports = nextConfig;