import withPWA from "next-pwa";

const nextConfig = {
  reactStrictMode: true,

  images: {
    // ✅ Allow ALL image domains (dynamic 3rd party)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],

    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },

  output: "standalone",

  env: {
    PORT: process.env.PORT || "5000",
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,

  runtimeCaching: [
    {
      // ❌ Do NOT cache Next image optimizer
      urlPattern: /^\/_next\/image.*/i,
      handler: "NetworkOnly",
    },
    {
      // ❌ Do NOT cache auth APIs
      urlPattern: /^\/api\/auth\/.*/i,
      handler: "NetworkOnly",
    },
  ],
})(nextConfig);
