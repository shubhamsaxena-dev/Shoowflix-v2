/** @type {import('next').NextConfig} */

// Extract hostname from environment variable
const getImageDomains = () => {
  const domains = new Set();

  // Add MOVIES_HOST and its variants
  if (process.env.MOVIES_HOST) {
    const host = process.env.MOVIES_HOST.replace(/^https?:\/\//, "").split(
      "/"
    )[0];
    domains.add(host);
    domains.add(`img.${host}`);
  }

  // Add additional domains from env variable if provided
  if (process.env.IMAGE_DOMAINS) {
    process.env.IMAGE_DOMAINS.split(",").forEach((domain) => {
      domains.add(domain.trim());
    });
  }

  return Array.from(domains).filter(Boolean);
};

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: getImageDomains(),
    unoptimized: false,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    formats: ["image/avif", "image/webp"],
  },
  env: {
    PORT: process.env.PORT || "5000",
  },
  // For Vercel deployment
  output: "standalone",
  // Increase timeout for image optimization
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
};

export default nextConfig;
