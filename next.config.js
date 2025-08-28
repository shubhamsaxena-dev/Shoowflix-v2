/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: false // Using pages router
  },
  images: {
    domains: ['img.yts.mx', 'yts.mx'],
    unoptimized: true
  },
  env: {
    PORT: process.env.PORT || '5000'
  }
}

export default nextConfig