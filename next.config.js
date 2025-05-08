
/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  typescript: {
    // Disable TypeScript checking
    ignoreBuildErrors: true,
  },
  eslint: {
    // Disable ESLint checking
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Add fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    
    // Resolve aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };
    
    return config;
  },
  // Transpile packages if needed
  transpilePackages: ['react-icons'],
};

module.exports = nextConfig;
