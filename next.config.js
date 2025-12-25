import withPWA from "next-pwa";

const getImageDomains = () => {
  const domains = new Set([
    "yts.mx",
    "yts.lt",
    "img.yts.mx",
    "img.yts.lt",
    "st.yts.mx",
    "st.yts.lt",
  ]);

  if (process.env.NEXT_PUBLIC_API_ROOT) {
    const host = process.env.NEXT_PUBLIC_API_ROOT.replace(
      /^https?:\/\//,
      ""
    ).split("/")[0];
    domains.add(host);
    domains.add(`img.${host}`);
  }

  if (process.env.IMAGE_DOMAINS) {
    process.env.IMAGE_DOMAINS.split(",").forEach((d) => domains.add(d.trim()));
  }

  return Array.from(domains).filter(Boolean);
};

const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: getImageDomains(),
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

  // 🔥 CRITICAL: never cache auth routes
  runtimeCaching: [
    {
      urlPattern: /^\/api\/auth\/.*/i,
      handler: "NetworkOnly",
    },
  ],
})(nextConfig);
