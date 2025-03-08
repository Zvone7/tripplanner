/** @type {import('next').NextConfig} */
const https = require("https");
const fs = require("fs");

// Path to the self-signed certificate
const certPath = "./aspnet-dev-cert.pem";

if (fs.existsSync(certPath)) {
  process.env.NODE_EXTRA_CA_CERTS = certPath;
  console.log("✅ Custom CA certificate loaded for HTTPS requests.");
} else {
  console.warn("⚠️ Self-signed certificate not found. Using default CA.");
}

const nextConfig = {
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_ROOT_URL || "https://dev-wapp-tripplanner-be-e9eyezate0caefes.northeurope-01.azurewebsites.net";

    return [
      {
        source: "/api/account/googleresponse",
        destination: `${backendUrl}/api/account/googleresponse`
      },
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
        headers: {
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Origin": backendUrl,
        },
      },
    ];
  },
};

module.exports = nextConfig;
