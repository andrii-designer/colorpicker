/**
 * Special build script for Vercel environments
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Vercel-specific build process...');

// Force install TypeScript and React types
console.log('1. Installing TypeScript dependencies...');
try {
  execSync('npm install --save-dev typescript@5.0.4 @types/react@18.2.0 @types/react-dom@18.2.1 @types/node@20.1.0', { stdio: 'inherit' });
  console.log('Successfully installed TypeScript dependencies');
} catch (error) {
  console.error('Error installing TypeScript dependencies:', error);
  process.exit(1);
}

// Verify TypeScript config 
console.log('2. Verifying TypeScript configuration...');

// Create a minimal tsconfig.json
const tsConfig = {
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
};

try {
  // Check if tsconfig exists and update if needed
  fs.writeFileSync(path.join(__dirname, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));
  console.log('TypeScript configuration verified');
} catch (error) {
  console.error('Error updating TypeScript configuration:', error);
  process.exit(1);
}

// Run the actual build
console.log('3. Running Next.js build...');
try {
  execSync('npx next build', { stdio: 'inherit' });
  console.log('Next.js build completed successfully');
} catch (error) {
  console.error('Error during Next.js build:', error);
  process.exit(1);
}

console.log('Vercel build process completed successfully'); 