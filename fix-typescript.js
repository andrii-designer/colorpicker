/**
 * Script to fix TypeScript installation issues on Vercel
 */
const { execSync } = require('child_process');

console.log('Installing TypeScript dependencies...');

try {
  // Force install TypeScript and React types with exact versions
  execSync('npm install --save-dev typescript@5.0.4 @types/react@18.2.0 @types/react-dom@18.2.1 @types/node@20.1.0', { stdio: 'inherit' });
  console.log('Successfully installed TypeScript dependencies!');
} catch (error) {
  console.error('Error installing TypeScript dependencies:', error);
  process.exit(1);
} 