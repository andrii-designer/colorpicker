const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Print environment info for debugging
console.log('Node version:', process.version);
console.log('NPM version:', execSync('npm --version').toString().trim());
console.log('Working directory:', process.cwd());

// Check if necessary packages are in package.json and add them if missing
console.log('Checking package.json for required dependencies...');
const packageJsonPath = path.join(__dirname, 'package.json');

if (!fs.existsSync(packageJsonPath)) {
  console.error('package.json not found at:', packageJsonPath);
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
let changed = false;

// List of critical dependencies to check in dependencies
const criticalDependencies = {
  'react-icons': '^5.5.0',
  'tailwindcss': '^3.4.1',
  'postcss': '^8',
  'uuid': '^9.0.0',
  'heic-convert': '^2.1.0'
};

// List of critical dev dependencies to check
const criticalDevDependencies = {
  '@types/uuid': '^9.0.1',
  'eslint': '^8.57.0',
  'typescript': '^5'
};

// Check and add all critical dependencies
Object.entries(criticalDependencies).forEach(([dep, version]) => {
  if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
    console.log(`${dep} not found in dependencies, adding it...`);
    if (!packageJson.dependencies) {
      packageJson.dependencies = {};
    }
    packageJson.dependencies[dep] = version;
    
    // Remove from devDependencies if it exists there
    if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
      console.log(`Removing ${dep} from devDependencies as it's now in dependencies`);
      delete packageJson.devDependencies[dep];
    }
    
    changed = true;
  }
});

// Check and add all critical dev dependencies
Object.entries(criticalDevDependencies).forEach(([dep, version]) => {
  if (!packageJson.devDependencies || !packageJson.devDependencies[dep]) {
    console.log(`${dep} not found in devDependencies, adding it...`);
    if (!packageJson.devDependencies) {
      packageJson.devDependencies = {};
    }
    packageJson.devDependencies[dep] = version;
    changed = true;
  }
});

if (changed) {
  console.log('Writing updated package.json...');
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('Updated package.json with required dependencies');
}

// Ensure we have all modules installed
console.log('Installing dependencies explicitly to ensure they are available...');

try {
  // First ensure the basic Node.js tools are available
  console.log('Installing critical production dependencies...');
  execSync('npm install --no-save react-icons@5.5.0 tailwindcss@3.4.1 postcss@8 uuid@9.0.0 heic-convert@2.1.0', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' } // Force development mode for the install
  });
  
  console.log('Installing critical development dependencies...');
  execSync('npm install --save-dev --no-save @types/uuid@9.0.1 eslint@8.57.0 typescript@5.2.2', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });
  
  console.log('Successfully installed required dependencies!');
} catch (error) {
  console.error('Error installing dependencies:', error);
  // Continue instead of exiting, as we might have partial success
  console.log('Continuing despite installation errors...');
}

// Verify the critical modules are available
console.log('Verifying critical modules...');
const criticalModules = ['react-icons', 'tailwindcss', 'postcss', 'uuid', 'heic-convert'];

criticalModules.forEach(module => {
  try {
    // Check if we can resolve the module
    require.resolve(module);
    console.log(`✅ ${module} is available`);
  } catch (error) {
    console.error(`❌ ${module} is NOT available, attempting emergency install...`);
    try {
      execSync(`npm install --no-save ${module}`, { stdio: 'inherit' });
      console.log(`Emergency install of ${module} completed`);
    } catch (installError) {
      console.error(`Failed emergency install of ${module}:`, installError);
    }
  }
});

console.log('Dependency verification and installation complete'); 