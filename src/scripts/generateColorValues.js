const fs = require('fs');
const path = require('path');
const tinycolor = require('tinycolor2');

// Path to your color data file
const COLOR_DATA_PATH = path.resolve(__dirname, '../lib/utils/colorDataStatic.ts');
const OUTPUT_PATH = path.resolve(__dirname, '../lib/utils/completeColorData.ts');

// Basic color keywords that tinycolor2 recognizes
const BASIC_COLORS = [
  'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink',
  'brown', 'black', 'white', 'gray', 'grey', 'cyan', 'magenta',
  'lime', 'maroon', 'navy', 'olive', 'teal', 'violet', 'aqua',
  'fuchsia', 'silver', 'gold', 'indigo', 'coral', 'turquoise'
];

// Function to attempt to determine a color value from its name
function findColorValue(colorName) {
  // Try direct conversion first
  let color = tinycolor(colorName);
  
  // If the color is valid, return it
  if (color.isValid()) {
    const rgb = color.toRgb();
    const hsl = color.toHsl();
    return {
      hex: color.toHexString(),
      rgb: { r: rgb.r, g: rgb.g, b: rgb.b },
      hsl: { h: Math.round(hsl.h), s: Math.round(hsl.s * 100), l: Math.round(hsl.l * 100) }
    };
  }
  
  // Try to find any basic color names in the color name
  const nameLower = colorName.toLowerCase();
  
  // First, check for exact basic color matches (e.g., "Navy Blue" contains "navy")
  for (const basicColor of BASIC_COLORS) {
    if (nameLower.includes(basicColor)) {
      color = tinycolor(basicColor);
      
      // Apply modifiers based on descriptions in the name
      const isDark = nameLower.includes('dark') || nameLower.includes('deep');
      const isLight = nameLower.includes('light') || nameLower.includes('pale');
      const isBright = nameLower.includes('bright') || nameLower.includes('vivid');
      
      let adjustedColor = color;
      if (isDark) adjustedColor = color.darken(20);
      if (isLight) adjustedColor = color.lighten(20);
      if (isBright) adjustedColor = color.saturate(20);
      
      const rgb = adjustedColor.toRgb();
      const hsl = adjustedColor.toHsl();
      return {
        hex: adjustedColor.toHexString(),
        rgb: { r: rgb.r, g: rgb.g, b: rgb.b },
        hsl: { h: Math.round(hsl.h), s: Math.round(hsl.s * 100), l: Math.round(hsl.l * 100) }
      };
    }
  }
  
  // Fall back to a heuristic approach for special color naming patterns
  
  // Check for "X-ish" patterns (e.g., "Reddish Brown")
  for (const basicColor of BASIC_COLORS) {
    const ishPattern = new RegExp(`${basicColor}ish`, 'i');
    if (ishPattern.test(nameLower)) {
      const baseColor = tinycolor(basicColor);
      // Make it less saturated to indicate it's not purely that color
      const adjustedColor = baseColor.desaturate(20);
      
      const rgb = adjustedColor.toRgb();
      const hsl = adjustedColor.toHsl();
      return {
        hex: adjustedColor.toHexString(),
        rgb: { r: rgb.r, g: rgb.g, b: rgb.b },
        hsl: { h: Math.round(hsl.h), s: Math.round(hsl.s * 100), l: Math.round(hsl.l * 100) }
      };
    }
  }
  
  // Check for compound colors (e.g., "Blue-Green")
  const compoundMatch = nameLower.match(/([a-z]+)-([a-z]+)/);
  if (compoundMatch) {
    const color1 = compoundMatch[1];
    const color2 = compoundMatch[2];
    
    if (BASIC_COLORS.includes(color1) && BASIC_COLORS.includes(color2)) {
      const tinycolor1 = tinycolor(color1);
      const tinycolor2 = tinycolor(color2);
      
      // Mix the two colors
      const mixedColor = tinycolor.mix(tinycolor1, tinycolor2);
      
      const rgb = mixedColor.toRgb();
      const hsl = mixedColor.toHsl();
      return {
        hex: mixedColor.toHexString(),
        rgb: { r: rgb.r, g: rgb.g, b: rgb.b },
        hsl: { h: Math.round(hsl.h), s: Math.round(hsl.s * 100), l: Math.round(hsl.l * 100) }
      };
    }
  }
  
  // Last resort - use a placeholder color
  // Generate a pseudorandom color from the name to ensure consistency
  const hashCode = colorName.split('').reduce((hash, char) => {
    return ((hash << 5) - hash) + char.charCodeAt(0);
  }, 0);
  
  // Use the hash to generate HSL values
  const h = Math.abs(hashCode % 360);
  const s = 70; // Moderately saturated
  const l = 50; // Medium lightness
  
  color = tinycolor(`hsl(${h}, ${s}%, ${l}%)`);
  const rgb = color.toRgb();
  return {
    hex: color.toHexString(),
    rgb: { r: rgb.r, g: rgb.g, b: rgb.b },
    hsl: { h, s, l },
    generatedFromName: true
  };
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
    let processedCount = 0;
    let generatedCount = 0;
    
    for (const name of colorNames) {
      processedCount++;
      if (processedCount % 100 === 0) {
        console.log(`Processed ${processedCount} of ${colorNames.length} colors...`);
      }
      
      // Skip quiz entries or other non-color names
      if (name.toLowerCase().includes('quiz') || name.length < 2) {
        continue;
      }
      
      // Find color values for this name
      const colorValues = findColorValue(name);
      
      if (colorValues.generatedFromName) {
        generatedCount++;
      }
      
      // Determine category and tags
      const category = determineColorCategory(colorValues.hsl);
      const tags = assignTags(name, colorValues.hsl);
      
      // Create complete color entry
      const colorEntry = {
        name,
        hue: colorValues.hsl.h,
        saturation: colorValues.hsl.s,
        lightness: colorValues.hsl.l,
        category,
        tags,
        hex: colorValues.hex,
        rgb: colorValues.rgb
      };
      
      completeColors.push(colorEntry);
    }
    
    // Generate the new TypeScript file content
    const outputContent = `
import { ColorEntry, ColorCategory } from './colorDatabase';

/**
 * Complete color database with values generated from color names.
 * Contains ${completeColors.length} colors with names, hex, RGB, and HSL values.
 * Generated on: ${new Date().toISOString()}
 */
export const COMPLETE_COLOR_DATA: ColorEntry[] = ${JSON.stringify(completeColors, null, 2)
      .replace(/"category": "([^"]+)"/g, 'category: "$1" as ColorCategory')
      .replace(/"tags": \[/g, 'tags: [')
      .replace(/"([^"]+)"/g, "'$1'")};
`;
    
    // Write the new file
    fs.writeFileSync(OUTPUT_PATH, outputContent);
    
    console.log(`
Processing complete!
- Total colors processed: ${colorNames.length}
- Complete color entries created: ${completeColors.length}
- Colors with generated values: ${generatedCount}

Output saved to: ${OUTPUT_PATH}
    `);
    
  } catch (error) {
    console.error('Error processing color data:', error);
  }
}

// Run the script
main(); 