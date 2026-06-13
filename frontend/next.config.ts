import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    proxyClientMaxBodySize: "1000mb",
  },
  async rewrites() {
    return [
      {
        source: "/api/recordings/:path*",
        destination: `${backendUrl}/api/recordings/:path*`,
      },
      {
        source: "/api/patients/:path*",
        destination: `${backendUrl}/api/patients/:path*`,
      },
      {
        source: "/api/stats",
        destination: `${backendUrl}/api/stats`,
      },
    ];
  },
};

export default nextConfig;
