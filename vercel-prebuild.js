const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Running Vercel prebuild checks and fixes...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Current directory:', process.cwd());

// Function to fix the problematic route.ts file
function fixHeicConvertRoute() {
  try {
    const routePath = path.join(process.cwd(), 'src', 'app', 'api', 'heic-convert', 'route.ts');
    
    if (!fs.existsSync(routePath)) {
      console.log('heic-convert route.ts file not found, creating directory structure...');
      
      // Make sure the directory exists
      const dirPath = path.join(process.cwd(), 'src', 'app', 'api', 'heic-convert');
      fs.mkdirSync(dirPath, { recursive: true });
      
      // Create a clean implementation
      const cleanCode = `import { NextRequest, NextResponse } from 'next/server';

// Simple implementation of UUID v4
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Dynamic import for heic-convert
let heicConvert: any = null;

async function getHeicConverter() {
  if (!heicConvert) {
    try {
      const module = await import('heic-convert');
      heicConvert = module.default;
    } catch (error) {
      console.error('Failed to import heic-convert:', error);
      throw new Error('Failed to load heic-convert module');
    }
  }
  return heicConvert;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(\`Processing HEIC file: \${file.name}, size: \${buffer.length} bytes\`);
    
    try {
      const converter = await getHeicConverter();
      const outputBuffer = await converter({
        buffer: buffer,
        format: 'JPEG',
        quality: 0.85
      });
      
      const base64 = \`data:image/jpeg;base64,\${outputBuffer.toString('base64')}\`;
      
      return NextResponse.json({ 
        success: true, 
        data: base64,
        id: uuidv4()
      });
    } catch (error) {
      console.error('Error converting HEIC to JPEG:', error);
      return NextResponse.json(
        { error: 'Failed to convert HEIC image' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Server error processing HEIC file:', error);
    return NextResponse.json(
      { error: 'Server error processing image' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}`;

      fs.writeFileSync(routePath, cleanCode, 'utf8');
      console.log('Created clean heic-convert route.ts file');
    } else {
      console.log('heic-convert route.ts exists, checking for issues...');
      
      const content = fs.readFileSync(routePath, 'utf8');
      
      // Check for duplicate uuidv4 function declarations
      const uuidCount = (content.match(/function uuidv4\(\)/g) || []).length;
      
      if (uuidCount > 1) {
        console.log('Found duplicate uuidv4 function declarations, fixing...');
        
        // Create a clean implementation with only one uuidv4 function
        let lines = content.split('\n');
        let seenUuidv4 = false;
        let cleanedLines = [];
        
        for (const line of lines) {
          if (line.includes('function uuidv4()')) {
            if (!seenUuidv4) {
              cleanedLines.push(line);
              seenUuidv4 = true;
            }
            // Skip duplicate declarations
          } else {
            cleanedLines.push(line);
          }
        }
        
        fs.writeFileSync(routePath, cleanedLines.join('\n'), 'utf8');
        console.log('Fixed duplicate uuidv4 function declarations');
      } else {
        console.log('No duplicate uuidv4 function declarations found');
      }
    }
  } catch (error) {
    console.error('Error fixing heic-convert route:', error);
  }
}

// Function to ensure all dependencies are installed
function ensureDependencies() {
  try {
    console.log('Ensuring all required dependencies are installed...');
    
    // List of essential dependencies
    const dependencies = [
      'react-icons@5.5.0',
      'tailwindcss@3.4.1',
      'postcss@8',
      'uuid@9.0.0',
      'heic-convert@2.1.0'
    ];
    
    // Install dependencies individually to avoid a single failure stopping everything
    for (const dep of dependencies) {
      try {
        console.log(`Installing ${dep}...`);
        execSync(`npm install --no-save ${dep}`, { stdio: 'inherit' });
      } catch (err) {
        console.error(`Failed to install ${dep}:`, err.message);
        // Continue despite failure
      }
    }
    
    console.log('Dependency installation complete');
  } catch (error) {
    console.error('Error ensuring dependencies:', error);
  }
}

// Fix Tailwind PostCSS config
function fixPostCSSConfig() {
  try {
    const postcssConfigPath = path.join(process.cwd(), 'postcss.config.mjs');
    
    if (fs.existsSync(postcssConfigPath)) {
      console.log('Checking PostCSS config...');
      const content = fs.readFileSync(postcssConfigPath, 'utf8');
      
      if (!content.includes('tailwindcss')) {
        console.log('Adding Tailwind to PostCSS config...');
        const newConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
        fs.writeFileSync(postcssConfigPath, newConfig, 'utf8');
      }
    } else {
      console.log('Creating PostCSS config...');
      const newConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
      fs.writeFileSync(postcssConfigPath, newConfig, 'utf8');
    }
  } catch (error) {
    console.error('Error fixing PostCSS config:', error);
  }
}

// Run all fixes
fixHeicConvertRoute();
ensureDependencies();
fixPostCSSConfig();

console.log('Vercel prebuild checks and fixes completed'); 