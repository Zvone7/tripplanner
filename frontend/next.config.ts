/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_ROOT_URL || "https://dev-wapp-tripplanner-be-e9eyezate0caefes.northeurope-01.azurewebsites.net";

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