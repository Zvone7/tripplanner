/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5156/api/:path*', // todo - you might have to figure out https eventually
      },
    ];
  },
};

module.exports = nextConfig;