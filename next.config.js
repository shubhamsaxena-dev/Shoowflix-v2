/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['img.yts.mx', 'yts.mx'],
    unoptimized: true
  },
  env: {
    PORT: process.env.PORT || '5000'
  },
  // For Vercel deployment
  output: 'standalone'
}

export default nextConfig