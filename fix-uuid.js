// This script directly modifies the source file to avoid relying on the uuid package
const fs = require('fs');
const path = require('path');

try {
  const filePath = path.join(__dirname, 'src', 'app', 'api', 'heic-convert', 'route.ts');
  
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check for duplicate uuidv4 function declarations
  const uuidFunctionCount = (content.match(/function uuidv4\(\)/g) || []).length;
  
  if (uuidFunctionCount > 1) {
    console.log('Found multiple uuidv4 function declarations, cleaning up...');
    
    // Remove all uuidv4 function declarations and imports
    content = content.replace(/\/\/ Simple implementation of UUID v4[^]*?function uuidv4\(\)[^]*?\}\n/g, '');
    content = content.replace(/\/\/ Adding inline uuid function[^]*?\/\/ import[^\n]*\n/g, '');
    content = content.replace(/import \{ v4 as uuidv4 \} from ['"]uuid['"];?\n*/g, '');
    
    // Add a single implementation at the top of the file
    const uuidImpl = `// Simple implementation of UUID v4 instead of requiring the package
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
`;
    
    // Insert after the import statements, before the first function or interface
    const importEndIndex = content.lastIndexOf('import');
    const importLineEndIndex = content.indexOf('\n', importEndIndex) + 1;
    
    content = content.slice(0, importLineEndIndex) + '\n' + uuidImpl + content.slice(importLineEndIndex);
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully cleaned up duplicate uuidv4 functions in route.ts');
  } else if (content.includes("import { v4 as uuidv4 } from 'uuid';")) {
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
    console.log('UUID dependency already fixed properly in route.ts');
  }
} catch (error) {
  console.error('Error fixing UUID dependency:', error);
  process.exit(1);
} 