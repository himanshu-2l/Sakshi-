import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.resolve(__dirname),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
