/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  webpack: (config) => {
    // Add fallbacks for Node.js modules used in browser context
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    
    // Explicitly add alias resolution for src paths
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };
    
    return config;
  },
  // Add react-icons to transpiled packages
  transpilePackages: ['react-icons'],
  // Add any other Next.js config options here
};

module.exports = nextConfig; 