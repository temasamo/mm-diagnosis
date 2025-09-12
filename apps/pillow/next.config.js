const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@core/mm'],
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      // 楽天
      { protocol: 'https', hostname: 'thumbnail.image.rakuten.co.jp' },
      { protocol: 'https', hostname: 'image.rakuten.co.jp' },
      { protocol: 'https', hostname: '**.rakuten.co.jp' },
      // Yahoo
      { protocol: 'https', hostname: 'shopping.c.yimg.jp' },
      { protocol: 'https', hostname: 'item-shopping.c.yimg.jp' },
      { protocol: 'https', hostname: '**.yimg.jp' },
      { protocol: 'https', hostname: '**.shopping.yahoo.co.jp' },
      // AWS
      { protocol: 'https', hostname: '**.amazonaws.com' },
    ],
  },
  async redirects() {
    return [
      { source: "/", destination: "/pillow", permanent: false },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname, "src"),
      "@lib": path.resolve(__dirname, "lib"),
      "@shared": path.resolve(__dirname, "..", "..", "src")
    };
    return config;
  },
};

module.exports = nextConfig;
