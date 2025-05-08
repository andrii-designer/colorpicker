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

// Check uuid
if (!packageJson.dependencies['uuid']) {
  console.log('uuid not found in dependencies, adding it...');
  packageJson.dependencies['uuid'] = '^9.0.0';
  changed = true;
}

// Check @types/uuid
if (!packageJson.devDependencies['@types/uuid']) {
  console.log('@types/uuid not found in devDependencies, adding it...');
  if (!packageJson.devDependencies) {
    packageJson.devDependencies = {};
  }
  packageJson.devDependencies['@types/uuid'] = '^9.0.1';
  changed = true;
}

// Check eslint
if (!packageJson.devDependencies['eslint']) {
  console.log('eslint not found in devDependencies, adding it...');
  if (!packageJson.devDependencies) {
    packageJson.devDependencies = {};
  }
  packageJson.devDependencies['eslint'] = '^8.57.0';
  changed = true;
}

// Check typescript
if (!packageJson.devDependencies['typescript']) {
  console.log('typescript not found in devDependencies, adding it...');
  if (!packageJson.devDependencies) {
    packageJson.devDependencies = {};
  }
  packageJson.devDependencies['typescript'] = '^5.0.4';
  changed = true;
}

// Check @types/react
if (!packageJson.devDependencies['@types/react']) {
  console.log('@types/react not found in devDependencies, adding it...');
  if (!packageJson.devDependencies) {
    packageJson.devDependencies = {};
  }
  packageJson.devDependencies['@types/react'] = '^18.2.0';
  changed = true;
}

// Check @types/react-dom
if (!packageJson.devDependencies['@types/react-dom']) {
  console.log('@types/react-dom not found in devDependencies, adding it...');
  if (!packageJson.devDependencies) {
    packageJson.devDependencies = {};
  }
  packageJson.devDependencies['@types/react-dom'] = '^18.2.1';
  changed = true;
}

// Check @types/node
if (!packageJson.devDependencies['@types/node']) {
  console.log('@types/node not found in devDependencies, adding it...');
  if (!packageJson.devDependencies) {
    packageJson.devDependencies = {};
  }
  packageJson.devDependencies['@types/node'] = '^20.1.0';
  changed = true;
}

if (changed) {
  fs.writeFileSync(path.join(__dirname, 'package.json'), JSON.stringify(packageJson, null, 2));
  console.log('Updated package.json with required dependencies');
}

// Install dependencies explicitly
console.log('Installing required dependencies explicitly...');
try {
  execSync('npm install react-icons@5.5.0 tailwindcss@3.4.1 postcss@8 uuid@9.0.0 --no-save', { stdio: 'inherit' });
  execSync('npm install @types/uuid@9.0.1 eslint@8.57.0 typescript@5.0.4 @types/react@18.2.0 @types/react-dom@18.2.1 @types/node@20.1.0 --save-dev --no-save', { stdio: 'inherit' });
  console.log('Successfully installed required dependencies!');
} catch (error) {
  console.error('Error installing dependencies:', error);
  process.exit(1);
} 