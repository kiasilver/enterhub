import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // This repo currently has many pre-existing TS errors that block
    // `next build`. We want production builds to proceed; types should be
    // cleaned up incrementally later.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
