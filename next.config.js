/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    // Only ignore TypeScript errors on Vercel
    ignoreBuildErrors: false
  },
  eslint: {
    // Only ignore ESLint errors on Vercel
    ignoreDuringBuilds: false
  }
};

module.exports = nextConfig;
