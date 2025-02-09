/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5156";

    return [
      {
        source: "/api/account/googleresponse",
        destination: `${backendUrl}/api/account/googleresponse`,
      },
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`, // Proxy to backend
      },
    ];
  },
};

module.exports = nextConfig;