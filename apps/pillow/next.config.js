/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@core/mm'],
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.rakuten.co.jp" },
      { protocol: "https", hostname: "shopping.c.yimg.jp" },
      { protocol: "https", hostname: "**.yimg.jp" },
    ],
  },
  async redirects() {
    return [
      { source: "/", destination: "/pillow", permanent: false },
    ];
  },
};

module.exports = nextConfig; 