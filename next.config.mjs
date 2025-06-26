/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Existing API rewrite
      {
        source: '/api/:path*',
        destination: 'http://3.6.230.54:4003/api/:path*',
      },
      // New proxy for the lab orders API
      {
        source: '/api/lab/:path*',
        destination: 'http://192.168.1.53/cgi-bin/:path*',
      },
    ];
  },
  // Enable CORS for development
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ]
  }
};

export default nextConfig;
