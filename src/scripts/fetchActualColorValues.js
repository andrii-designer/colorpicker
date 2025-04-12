const fs = require('fs');
const path = require('path');
const https = require('https');
const tinycolor = require('tinycolor2');

// Path to your color data file
const COLOR_DATA_PATH = path.resolve(__dirname, '../lib/utils/colorDataStatic.ts');
const OUTPUT_PATH = path.resolve(__dirname, '../lib/utils/accurateColorData.ts');

// Function to convert color name to URL-friendly format
function formatColorForUrl(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .trim(); // Remove leading/trailing spaces
}

// Function to fetch color data from the website
function fetchColorData(colorName) {
  return new Promise((resolve, reject) => {
    const formattedName = formatColorForUrl(colorName);
    const url = `https://color-register.org/color/${formattedName}`;
    
    https.get(url, (res) => {
      if (res.statusCode === 404) {
        resolve({ 
          notFound: true,
          name: colorName,
          url: url
        });
        return;
      }
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // Extract hex code using regex - look for the pattern from the website
          const hexMatch = data.match(/#([A-F0-9]{6})\s*-\s*[^<]+color image/i);
          
          if (hexMatch && hexMatch[1]) {
            const hex = `#${hexMatch[1].toUpperCase()}`;
            const color = tinycolor(hex);
            const rgb = color.toRgb();
            const hsl = color.toHsl();
            
            resolve({
              name: colorName,
              hex: hex,
              rgb: { r: rgb.r, g: rgb.g, b: rgb.b },
              hsl: { h: Math.round(hsl.h), s: Math.round(hsl.s * 100), l: Math.round(hsl.l * 100) }
            });
          } else {
            // Try a more general approach - look for the hex value in the main content area
            const altHexMatch = data.match(/<h1[^>]*>.*?<\/h1>.*?#([A-F0-9]{6})/is);
            if (altHexMatch && altHexMatch[1]) {
              const hex = `#${altHexMatch[1].toUpperCase()}`;
              const color = tinycolor(hex);
              const rgb = color.toRgb();
              const hsl = color.toHsl();
              
              resolve({
                name: colorName,
                hex: hex,
                rgb: { r: rgb.r, g: rgb.g, b: rgb.b },
                hsl: { h: Math.round(hsl.h), s: Math.round(hsl.s * 100), l: Math.round(hsl.l * 100) }
              });
            } else {
              resolve({ 
                parseError: true,
                name: colorName,
                url: url
              });
            }
          }
        } catch (error) {
          resolve({ 
            error: error.message,
            name: colorName,
            url: url
          });
        }
      });
    }).on('error', (error) => {
      resolve({ 
        networkError: error.message,
        name: colorName,
        url: url
      });
    });
  });
}

// Function to determine the category based on HSL values
function determineColorCategory(hsl) {
  const { h, s, l } = hsl;
  
  // Black, white, and gray require special handling
  if (l <= 10) return 'black';
  if (l >= 90 && s <= 15) return 'white';
  if (s <= 15) return 'gray';
  
  // Metallic check
  if (s <= 30 && l >= 60 && l <= 80) return 'metallic';
  
  // Basic color categories based on hue
  if (h <= 15 || h >= 345) return 'red';
  if (h < 45) return 'orange';
  if (h < 70) return 'yellow';
  if (h < 150) return 'green';
  if (h < 240) return 'blue';
  if (h < 320) return 'purple';
  return 'pink';
}

// Function to assign tags based on color properties
function assignTags(name, hsl) {
  const tags = [];
  const nameLower = name.toLowerCase();
  
  // Brightness tags
  if (hsl.l < 30) tags.push('dark');
  if (hsl.l > 70) tags.push('light');
  
  // Saturation tags
  if (hsl.s < 30) tags.push('muted');
  if (hsl.s > 70) tags.push('vibrant');
  
  // Temperature tags
  if ((hsl.h >= 0 && hsl.h < 70) || hsl.h > 280) tags.push('warm');
  if (hsl.h >= 70 && hsl.h <= 280) tags.push('cool');
  
  // Special tags based on name
  if (nameLower.includes('vintage') || nameLower.includes('antique')) tags.push('vintage');
  if (nameLower.includes('metallic') || nameLower.includes('metal') || 
      nameLower.includes('gold') || nameLower.includes('silver')) tags.push('metallic');
  if (nameLower.includes('earth') || nameLower.includes('natural')) tags.push('earthy');
  
  return tags;
}

// Function to delay execution (for rate limiting)
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  try {
    // Read the current color data file
    console.log('Reading color data file...');
    const fileContent = fs.readFileSync(COLOR_DATA_PATH, 'utf8');
    
    // Extract the color entries using regex
    // This pattern looks for objects with a "name" property
    const namePattern = /"name": "([^"]+)"/g;
    let match;
    const colorNames = [];
    
    while ((match = namePattern.exec(fileContent)) !== null) {
      colorNames.push(match[1]);
    }
    
    console.log(`Found ${colorNames.length} color names.`);
    
    // Process each color name to add values
    const completeColors = [];
    const errorColors = [];
    let processedCount = 0;
    const totalColors = colorNames.length;
    
    // Process in batches to avoid overwhelming the server
    const batchSize = 10;
    for (let i = 0; i < totalColors; i += batchSize) {
      const batch = colorNames.slice(i, i + batchSize);
      const batchPromises = batch.map(async (name) => {
        // Skip quiz entries or other non-color names
        if (name.toLowerCase().includes('quiz') || name.length < 2) {
          return { skipped: true, name };
        }
        
        // Fetch color data from the website
        const result = await fetchColorData(name);
        return result;
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      for (const result of batchResults) {
        processedCount++;
        
        // Log progress
        if (processedCount % 10 === 0 || processedCount === totalColors) {
          console.log(`Processed ${processedCount} of ${totalColors} colors (${Math.round(processedCount / totalColors * 100)}%)...`);
        }
        
        // Skip entries with errors
        if (result.skipped) {
          continue;
        }
        
        if (result.notFound || result.parseError || result.error || result.networkError) {
          errorColors.push(result);
          continue;
        }
        
        // Determine category and tags
        const category = determineColorCategory(result.hsl);
        const tags = assignTags(result.name, result.hsl);
        
        // Create complete color entry
        const colorEntry = {
          name: result.name,
          hue: result.hsl.h,
          saturation: result.hsl.s,
          lightness: result.hsl.l,
          category,
          tags,
          hex: result.hex,
          rgb: result.rgb
        };
        
        completeColors.push(colorEntry);
      }
      
      // Add a delay between batches to avoid overwhelming the server
      await delay(2000);
    }
    
    // Generate the new TypeScript file content
    const outputContent = `
import { ColorEntry, ColorCategory } from './colorDatabase';

/**
 * Accurate color database with values fetched from color-register.org.
 * Contains ${completeColors.length} colors with names, hex, RGB, and HSL values.
 * Generated on: ${new Date().toISOString()}
 */
export const ACCURATE_COLOR_DATA: ColorEntry[] = ${JSON.stringify(completeColors, null, 2)
      .replace(/"category": "([^"]+)"/g, 'category: "$1" as ColorCategory')
      .replace(/"tags": \[/g, 'tags: [')
      .replace(/"([^"]+)"/g, "'$1'")};
`;
    
    // Write the new file
    fs.writeFileSync(OUTPUT_PATH, outputContent);
    
    // If there were errors, write them to a log file
    if (errorColors.length > 0) {
      const errorLogPath = path.resolve(__dirname, '../lib/utils/colorFetchErrors.json');
      fs.writeFileSync(errorLogPath, JSON.stringify(errorColors, null, 2));
    }
    
    console.log(`
Processing complete!
- Total colors processed: ${totalColors}
- Colors successfully fetched: ${completeColors.length}
- Colors with errors: ${errorColors.length}

Output saved to: ${OUTPUT_PATH}
${errorColors.length > 0 ? `Error log saved to: ${path.resolve(__dirname, '../lib/utils/colorFetchErrors.json')}` : ''}
    `);
    
  } catch (error) {
    console.error('Error processing color data:', error);
  }
}

// Run the script
main(); 