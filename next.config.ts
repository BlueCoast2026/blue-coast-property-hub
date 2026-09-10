import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "zxjpgaiwvruhkwhmummo.supabase.co", pathname: "/storage/v1/object/public/blog-media/**" }],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "16mb",
    },
  },
};

export default nextConfig;
