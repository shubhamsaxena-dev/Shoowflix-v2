/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['img.yts.mx', 'yts.mx'],
    unoptimized: true, // Since we're using external images
  },
  // Custom webpack config to handle aliases
  webpack: (config) => {
    config.resolve.alias['@'] = new URL('src', import.meta.url).pathname;
    config.resolve.alias['@shared'] = new URL('shared', import.meta.url).pathname;
    config.resolve.alias['@assets'] = new URL('attached_assets', import.meta.url).pathname;
    return config;
  },
};

export default nextConfig;