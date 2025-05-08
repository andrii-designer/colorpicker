const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if necessary packages are in package.json and add them if missing
console.log('Checking package.json for required dependencies...');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
let changed = false;

// Check react-icons
if (!packageJson.dependencies['react-icons']) {
  console.log('react-icons not found in package.json, adding it...');
  packageJson.dependencies['react-icons'] = '^5.5.0';
  changed = true;
}

// Check tailwindcss 
if (!packageJson.dependencies['tailwindcss']) {
  console.log('tailwindcss not found in dependencies, moving/adding it...');
  packageJson.dependencies['tailwindcss'] = '^3.4.1';
  // Remove from devDependencies if it exists there
  if (packageJson.devDependencies && packageJson.devDependencies['tailwindcss']) {
    delete packageJson.devDependencies['tailwindcss'];
  }
  changed = true;
}

// Check postcss
if (!packageJson.dependencies['postcss']) {
  console.log('postcss not found in dependencies, moving/adding it...');
  packageJson.dependencies['postcss'] = '^8';
  // Remove from devDependencies if it exists there
  if (packageJson.devDependencies && packageJson.devDependencies['postcss']) {
    delete packageJson.devDependencies['postcss'];
  }
  changed = true;
}

if (changed) {
  fs.writeFileSync(path.join(__dirname, 'package.json'), JSON.stringify(packageJson, null, 2));
  console.log('Updated package.json with required dependencies');
}

// Install dependencies explicitly
console.log('Installing required dependencies explicitly...');
try {
  execSync('npm install react-icons@5.5.0 tailwindcss@3.4.1 postcss@8 --no-save', { stdio: 'inherit' });
  console.log('Successfully installed required dependencies!');
} catch (error) {
  console.error('Error installing dependencies:', error);
  process.exit(1);
} 