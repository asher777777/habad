import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "desborecontrol.web.app",
        "desborecontrol.firebaseapp.com",
        "localhost:3000",
        "localhost:3001",
        "10.0.0.11:3000",
        "10.0.0.11:3001",
      ],
    },
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
    ],
  },
};

export default nextConfig;
