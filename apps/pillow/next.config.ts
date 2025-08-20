import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { turbo: {} },
  transpilePackages: ["@core/mm"],
};

export default nextConfig;
