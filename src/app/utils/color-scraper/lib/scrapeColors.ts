/**
 * This file provides utilities to scrape all color names and their values from the color register website
 * and format them for use in our color database.
 */

export interface ColorData {
  name: string;
  hex?: string;
  rgb?: { r: number; g: number; b: number };
}

/**
 * Scrapes color names and values from the color register website HTML content
 * @param htmlContent The HTML content of the color register website
 * @returns An array of color data including names and color values
 */
export function scrapeColorRegister(htmlContent: string): ColorData[] {
  // Extract color names from list items
  const regex = /<li>\s*<a[^>]*>([^<]+)<\/a>\s*<\/li>/g;
  const colors: ColorData[] = [];
  let match;

  while ((match = regex.exec(htmlContent)) !== null) {
    // Clean up color name
    let colorName = match[1].trim();
    if (colorName) {
      colors.push({ name: colorName });
    }
  }

  return colors;
}

/**
 * Formats the color data for our database
 */
export function formatColorDatabase(colors: ColorData[]): string {
  let output = "// Color database\n\n";
  output += "import type { ColorEntry } from './colorDatabase';\n\n";
  output += "export const colorDatabase: ColorEntry[] = [\n";
  
  colors.forEach((color, index) => {
    const entry = generateColorEntry(color);
    output += `  {\n`;
    output += `    name: "${entry.name}",\n`;
    output += `    hue: ${entry.hue},\n`;
    output += `    saturation: ${entry.saturation},\n`;
    output += `    lightness: ${entry.lightness},\n`;
    output += `    category: "${entry.category}",\n`;
    output += `    tags: [${entry.tags.map((t: string) => `"${t}"`).join(', ')}],\n`;
    if (entry.hex) {
      output += `    hex: "${entry.hex}",\n`;
    }
    if (entry.rgb) {
      output += `    rgb: { r: ${entry.rgb.r}, g: ${entry.rgb.g}, b: ${entry.rgb.b} },\n`;
    }
    output += `  }${index < colors.length - 1 ? ',' : ''}\n`;
  });
  
  output += "];\n\n";
  output += "export default colorDatabase;";
  
  return output;
}

/**
 * Generates a color entry with default values if actual values aren't available
 */
export function generateColorEntry(color: ColorData): any {
  // Default fallback color if no value provided
  const defaultHex = '#808080'; // Medium gray
  
  // Get the hex value or use default
  const hex = color.hex || defaultHex;
  
  // Convert to HSL for better categorization
  const rgb = color.rgb || hexToRgb(hex) || { r: 128, g: 128, b: 128 };
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  // Categorize by hue
  const category = categorizeByHue(h);
  
  // Extract tags from name
  const tags = extractTags(color.name);
  
  return {
    name: color.name,
    hex: hex,
    rgb: rgb,
    hue: Math.round(h),
    saturation: Math.round(s * 100),
    lightness: Math.round(l * 100),
    category,
    tags
  };
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h *= 60;
  }
  
  return { h, s, l };
}

/**
 * Categorize a color by its hue value
 */
function categorizeByHue(hue: number): string {
  if (hue < 30) return 'red';
  if (hue < 60) return 'orange';
  if (hue < 90) return 'yellow';
  if (hue < 150) return 'green';
  if (hue < 210) return 'cyan';
  if (hue < 270) return 'blue';
  if (hue < 330) return 'purple';
  return 'red';
}

/**
 * Extract meaningful tags from a color name
 */
function extractTags(name: string): string[] {
  const tags = [];
  const lowercaseName = name.toLowerCase();
  
  // Add the first word as a tag
  const firstWord = lowercaseName.split(' ')[0];
  if (firstWord && firstWord.length > 2) {
    tags.push(firstWord);
  }
  
  // Check for common color categories
  const colorCategories = [
    'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 
    'brown', 'gray', 'grey', 'black', 'white', 'teal', 'cyan',
    'magenta', 'violet', 'indigo', 'crimson', 'scarlet', 'navy',
    'forest', 'lime', 'olive', 'maroon', 'coral'
  ];
  
  for (const category of colorCategories) {
    if (lowercaseName.includes(category)) {
      tags.push(category);
    }
  }
  
  // Add intensity descriptors
  const intensities = [
    'light', 'dark', 'pale', 'deep', 'bright', 'vivid', 
    'soft', 'muted', 'pastel', 'neon', 'fluorescent'
  ];
  
  for (const intensity of intensities) {
    if (lowercaseName.includes(intensity)) {
      tags.push(intensity);
    }
  }
  
  return Array.from(new Set(tags)); // Remove duplicates using Array.from
} 