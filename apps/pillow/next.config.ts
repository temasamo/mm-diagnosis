import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  transpilePackages: ['@core/mm'],
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.rakuten.co.jp" },
      { protocol: "https", hostname: "shopping.c.yimg.jp" },
      { protocol: "https", hostname: "**.yimg.jp" },
    ],
  },
};
export default nextConfig;
