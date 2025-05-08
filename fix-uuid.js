// This script directly modifies the source file to avoid relying on the uuid package
const fs = require('fs');
const path = require('path');

try {
  const filePath = path.join(__dirname, 'src', 'app', 'api', 'heic-convert', 'route.ts');
  
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the file still uses the UUID import
  if (content.includes("import { v4 as uuidv4 } from 'uuid';")) {
    console.log('Fixing UUID dependency in heic-convert route.ts...');
    
    // Replace the import with inline implementation
    content = content.replace(
      "import { v4 as uuidv4 } from 'uuid';",
      `// Simple implementation of UUID v4 instead of requiring the package
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}`
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully fixed UUID dependency in route.ts');
  } else {
    console.log('UUID dependency already fixed or not found in route.ts');
  }
} catch (error) {
  console.error('Error fixing UUID dependency:', error);
  process.exit(1);
} 