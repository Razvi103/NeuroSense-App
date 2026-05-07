import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "1000mb",
  },
  async rewrites() {
    return [
      {
        source: "/api/recordings/:path*",
        destination: "http://127.0.0.1:8000/api/recordings/:path*",
      },
      {
        source: "/api/patients/:path*",
        destination: "http://127.0.0.1:8000/api/patients/:path*",
      },
      {
        source: "/api/stats",
        destination: "http://127.0.0.1:8000/api/stats",
      },
    ];
  },
};

export default nextConfig;
