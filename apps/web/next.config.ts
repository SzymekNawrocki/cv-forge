import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["react-markdown", "remark-gfm"],
  },
};

export default nextConfig;
