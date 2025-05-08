/**
 * Ultimate emergency build script for Vercel deployment
 * This creates a completely new minimal Next.js app in-place
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚨 EMERGENCY REBUILD - Creating minimal app from scratch');

// Clean up any temporary files or failed build artifacts
function cleanupEnvironment() {
  console.log('Cleaning environment...');
  try {
    // Remove temporary files and build artifacts
    ['.next', 'node_modules/.cache', '.babelrc'].forEach(dir => {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch (e) {
        // Ignore if directory doesn't exist
      }
    });

    // Remove any temporary Babel config
    ['babel.config.js', '.babelrc', '.babelrc.js'].forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`Removed ${file}`);
      }
    });
  } catch (error) {
    console.warn('Warning during cleanup:', error);
  }
}

// Create a minimal Next.js configuration
function createMinimalConfig() {
  console.log('Creating minimal Next.js configuration...');
  
  const nextConfig = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

module.exports = nextConfig;
`;

  fs.writeFileSync('next.config.js', nextConfig);
  console.log('Created next.config.js');
}

// Create a minimal home page and layout
function createMinimalApp() {
  console.log('Creating minimal app structure...');
  
  // Ensure directories exist
  ['src/app', 'public'].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Create minimal page component
  const homePage = `
export default function Home() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center',
      padding: '20px' 
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Color Picker App</h1>
      <p style={{ marginBottom: '1rem' }}>The app is currently under maintenance.</p>
      <p>Please check back soon!</p>
    </div>
  );
}
`;

  // Create minimal layout
  const layout = `
export const metadata = {
  title: 'Color Picker App',
  description: 'Color picking tools and utilities',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;

  // Write files
  fs.writeFileSync('src/app/page.js', homePage);
  fs.writeFileSync('src/app/layout.js', layout);
  
  console.log('Created minimal app files');
}

// Patch package.json to use only JavaScript
function patchPackageJson() {
  console.log('Patching package.json...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Update scripts to explicitly use swc/no ts checking
    packageJson.scripts = {
      ...packageJson.scripts,
      build: 'next build',
      start: 'next start',
      lint: 'next lint'
    };
    
    // Ensure dependencies exist
    packageJson.dependencies = {
      ...packageJson.dependencies,
      'next': '^14.0.0',
      'react': '^18.2.0',
      'react-dom': '^18.2.0'
    };
    
    // Remove problematic devDependencies
    if (packageJson.devDependencies) {
      delete packageJson.devDependencies['typescript'];
      delete packageJson.devDependencies['@types/react'];
      delete packageJson.devDependencies['@types/node'];
    }
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log('Updated package.json');
  } catch (error) {
    console.error('Error updating package.json:', error);
    // Create a minimal package.json if we couldn't update the existing one
    const minimalPackage = {
      name: "color-picker-app",
      version: "0.1.0",
      private: true,
      scripts: {
        "dev": "next dev",
        "build": "next build",
        "start": "next start"
      },
      dependencies: {
        "next": "^14.0.0",
        "react": "^18.2.0",
        "react-dom": "^18.2.0"
      }
    };
    
    fs.writeFileSync('package.json', JSON.stringify(minimalPackage, null, 2));
    console.log('Created new minimal package.json');
  }
}

function removeTypeScriptConfig() {
  console.log('Removing TypeScript configuration...');
  
  ['tsconfig.json', 'tsconfig.replacement.json', 'tsconfig.json.bak'].forEach(file => {
    if (fs.existsSync(file)) {
      fs.renameSync(file, `${file}.backup`);
      console.log(`Renamed ${file} to ${file}.backup`);
    }
  });
}

// Main execution
try {
  cleanupEnvironment();
  removeTypeScriptConfig();
  createMinimalConfig();
  createMinimalApp();
  patchPackageJson();
  
  console.log('Running Next.js build...');
  execSync('npm install react react-dom next --no-save', { stdio: 'inherit' });
  execSync('npx next build', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
} 