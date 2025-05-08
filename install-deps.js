const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if react-icons is in package.json
console.log('Checking package.json for react-icons...');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

if (!packageJson.dependencies['react-icons']) {
  console.log('react-icons not found in package.json, adding it...');
  packageJson.dependencies['react-icons'] = '^5.5.0';
  fs.writeFileSync(path.join(__dirname, 'package.json'), JSON.stringify(packageJson, null, 2));
  console.log('Added react-icons to package.json');
} else {
  console.log('react-icons is already in package.json');
}

console.log('Installing react-icons explicitly...');
try {
  execSync('npm install react-icons@5.5.0 --no-save', { stdio: 'inherit' });
  console.log('Successfully installed react-icons!');
} catch (error) {
  console.error('Error installing react-icons:', error);
  process.exit(1);
} 