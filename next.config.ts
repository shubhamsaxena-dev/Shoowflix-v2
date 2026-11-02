import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false,

  images: {
    // Images load straight from their hosts (see lib/image-loader.ts); Vercel's optimizer
    // returns 402 once the plan's source-image quota is used up.
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    // YTS poster/backdrop hosts. Add hosts here rather than allowing "**".
    remotePatterns: [
      { protocol: "https", hostname: "yts.mx" },
      { protocol: "https", hostname: "img.yts.mx" },
      { protocol: "https", hostname: "*.yts.mx" },
      { protocol: "https", hostname: "yts.lt" },
      { protocol: "https", hostname: "*.yts.lt" },
      { protocol: "https", hostname: "yts.am" },
      { protocol: "https", hostname: "*.yts.am" },
      { protocol: "https", hostname: "yts.gg" },
      { protocol: "https", hostname: "*.yts.gg" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
    qualities: [60, 70, 75],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920],
    imageSizes: [96, 160, 230, 300],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  async headers() {
    return [
      {
        source: "/:all*(svg|png|jpg|jpeg|webp|avif|ico|woff2)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
      { source: "/auth/signin", destination: "/signin", permanent: true },
    ];
  },
};

export default nextConfig;
