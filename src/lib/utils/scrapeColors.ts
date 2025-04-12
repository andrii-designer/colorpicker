/**
 * This file provides utilities to scrape all color names and their values from the color register website
 * and format them for use in our color database.
 * 
 * Usage:
 * 1. Import this scraper in a Node.js script or browser console
 * 2. Call the scrapeColorRegister function with the HTML content from the website
 * 3. Use the resulting formatted array in our color database
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
    // Clean up color name (trim whitespace, handle special characters)
    let colorName = match[1].trim();
    if (colorName) {
      // Since the website doesn't directly provide color values in the list,
      // we'll need to follow the links to get the actual values
      // For now, create an entry with just the name
      colors.push({ name: colorName });
    }
  }

  return colors;
}

/**
 * Extract the color value from a dedicated color page
 * @param pageHtml HTML content of the color detail page
 * @returns The color value in hex format if found
 */
export function extractColorValueFromPage(pageHtml: string): string | null {
  // Extract the hex code from the page
  const hexRegex = /<div[^>]*class="color-sample"[^>]*style="background-color:\s*([#][0-9a-fA-F]{6})[^"]*"[^>]*>/i;
  const match = hexRegex.exec(pageHtml);
  
  if (match && match[1]) {
    return match[1].toUpperCase();
  }
  
  return null;
}

/**
 * Converts a hex color value to RGB
 * @param hex Hexadecimal color value
 * @returns RGB color values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
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
 * Groups color data by their first letter for better organization
 * @param colors Array of color data
 * @returns A record of letter groups to color arrays
 */
export function groupColorsByFirstLetter(colors: ColorData[]): Record<string, ColorData[]> {
  const groups: Record<string, ColorData[]> = {};
  
  colors.forEach(color => {
    const firstChar = color.name.charAt(0).toUpperCase();
    if (!groups[firstChar]) {
      groups[firstChar] = [];
    }
    groups[firstChar].push(color);
  });
  
  return groups;
}

/**
 * Formats color data as a JavaScript object with color names and their values
 * @param colors Array of color data to format
 * @returns Formatted JavaScript code for the color database
 */
export function formatColorDatabase(colors: ColorData[]): string {
  const groups = groupColorsByFirstLetter(colors);
  let output = "const colorDatabase = {\n";
  
  // Add each letter group with a comment
  Object.keys(groups).sort().forEach(letter => {
    output += `  // ${letter}\n`;
    
    groups[letter].forEach(color => {
      const rgbValue = color.rgb ? 
        `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})` : 
        (color.hex ? `"${color.hex}"` : 'null');
      
      output += `  "${color.name}": ${rgbValue},\n`;
    });
    
    output += "\n";
  });
  
  // Remove the last comma and newline
  output = output.slice(0, -2);
  output += "\n};";
  
  return output;
}

/**
 * Advanced scraper that follows links to get actual color values
 * This should be run server-side or in a scraper script
 * @param baseUrl Base URL of the color register website
 * @param colorNames Array of color names to look up
 */
export async function scrapeColorValues(
  baseUrl: string,
  colorNames: string[]
): Promise<ColorData[]> {
  const result: ColorData[] = [];
  
  // Convert color names to URL-friendly format
  for (const name of colorNames) {
    const urlName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const url = `${baseUrl}/color/${urlName}`;
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        const html = await response.text();
        const hexValue = extractColorValueFromPage(html);
        
        const colorData: ColorData = { name };
        
        if (hexValue) {
          colorData.hex = hexValue;
          const rgb = hexToRgb(hexValue);
          if (rgb) {
            colorData.rgb = rgb;
          }
        }
        
        result.push(colorData);
        
        // Throttle requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // If we can't find the color page, still add the name
        result.push({ name });
      }
    } catch (error) {
      console.error(`Error fetching color data for ${name}:`, error);
      // Add the name even if we can't get the value
      result.push({ name });
    }
  }
  
  return result;
}

/**
 * Example of how to use this scraper in a browser environment
 */
export function exampleUsageInBrowser(): void {
  console.log(`
To use this scraper in a browser console:
1. Visit https://color-register.org/color/color-names-index
2. Run the following code in the console to get color names:
   
   const htmlContent = document.body.innerHTML;
   const colors = scrapeColorRegister(htmlContent);
   console.log(colors);
   
3. For a complete scrape with color values, use a server-side script.
`);
}

/**
 * Generates a color entry with the appropriate structure for our database
 * @param color Color data including name and values
 * @returns A properly formatted color entry for our database
 */
export function generateColorEntry(color: ColorData): any {
  // Default fallback color if no value provided
  const defaultHex = '#808080'; // Medium gray
  
  // Get the hex value or use default
  const hex = color.hex || defaultHex;
  
  // Convert hex to RGB if needed
  const rgb = color.rgb || hexToRgb(hex) || { r: 128, g: 128, b: 128 };
  
  // Convert RGB to HSL for our database format
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  // Determine category based on hue
  const category = categorizeByHue(h);
  
  // Extract tags from name
  const tags = extractTags(color.name);
  
  return {
    name: color.name,
    hex,
    rgb,
    hue: h,
    saturation: s,
    lightness: l,
    category,
    tags
  };
}

/**
 * Converts RGB to HSL values
 * @param r Red (0-255)
 * @param g Green (0-255)
 * @param b Blue (0-255)
 * @returns HSL values
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h /= 6;
  }

  return { 
    h: Math.round(h * 360), 
    s: Math.round(s * 100), 
    l: Math.round(l * 100) 
  };
}

/**
 * Determine color category based on hue angle
 * @param hue Hue angle (0-360)
 * @returns Color category
 */
function categorizeByHue(hue: number): string {
  if (hue <= 15 || hue >= 345) return 'red';
  if (hue < 45) return 'orange';
  if (hue < 70) return 'yellow';
  if (hue < 150) return 'green';
  if (hue < 240) return 'blue';
  if (hue < 320) return 'purple';
  return 'pink';
}

/**
 * Extract tags from color name for better organization
 * @param name Color name
 * @returns Array of tags
 */
function extractTags(name: string): string[] {
  const tags: string[] = [];
  const words = name.toLowerCase().split(' ');
  
  // Common descriptive prefixes
  const descriptors = {
    vintage: ['vintage', 'antique', 'classic', 'retro'],
    vivid: ['vivid', 'bright', 'vibrant', 'deep'],
    aesthetic: ['aesthetic', 'beautiful', 'artistic'],
    warm: ['warm', 'hot', 'sunny'],
    cool: ['cool', 'cold', 'icy'],
    muted: ['muted', 'soft', 'gentle', 'light'],
    dark: ['dark', 'deep', 'rich'],
    metallic: ['metallic', 'metal', 'chrome', 'silver', 'gold']
  };

  // Check each word against our descriptor lists
  words.forEach(word => {
    Object.entries(descriptors).forEach(([tag, keywords]) => {
      if (keywords.includes(word) && !tags.includes(tag)) {
        tags.push(tag);
      }
    });
  });
  
  // Check if name contains a color word to add that as a tag
  const colorWords = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 
                      'pink', 'brown', 'grey', 'gray', 'black', 'white'];
  
  colorWords.forEach(color => {
    if (words.includes(color) && !tags.includes(color)) {
      tags.push(color);
    }
  });

  return tags;
}

export default {
  scrapeColorRegister,
  extractColorValueFromPage,
  hexToRgb,
  groupColorsByFirstLetter,
  formatColorDatabase,
  scrapeColorValues,
  exampleUsageInBrowser,
  generateColorEntry
}; 