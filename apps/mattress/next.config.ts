import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@core/mm'],
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
