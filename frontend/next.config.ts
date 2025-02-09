/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/account/googleresponse', 
        destination: `${process.env.BACKEND_ROOT_URL}/api/account/googleresponse`,
      },
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_ROOT_URL}/api/:path*`, // Proxy to backend
      },
    ];
  },
};

module.exports = nextConfig;