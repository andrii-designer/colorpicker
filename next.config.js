/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Add fallbacks for Node.js modules used in browser context
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    
    return config;
  },
  // Add react-icons to transpiled packages
  transpilePackages: ['react-icons'],
  // Add any other Next.js config options here
};

module.exports = nextConfig; 