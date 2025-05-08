/**
 * This file provides utilities to scrape all color names and their values from the color register website
 * and format them for use in our color database.
 * 
 * Usage * 1. Import this scraper in a Node.js script or browser console
 * 2. Call the scrapeColorRegister function with the HTML content from the website
 * 3. Use the resulting formatted array in our color database
 */

export ;
}

/**
 * Scrapes color names and values from the color register website HTML content
 * @param htmlContent The HTML content of the color register website
 * @returns An array of color data including names and color values
 */
export function scrapeColorRegister(htmlContent) {
  // Extract color names from list items
  const regex = /\s*<a[^>]*>([^<]+)<\/a>\s*<\/li>/g;
  const colors= [];
  let match;

  while ((match = regex.exec(htmlContent)) !== null) {
    // Clean up color name
    let colorName = match[1].trim();
    if (colorName) {
      colors.push({ name });
    }
  }

  return colors;
}

/**
 * Extract the color value from a dedicated color page
 * @param pageHtml HTML content of the color detail page
 * @returns The color value in hex format if found
 */
export function extractColorValueFromPage(pageHtml) {
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
export function hexToRgb(hex): { r: number; g: number; b } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r g b }
    : null;
}

/**
 * Groups color data by their first letter for better organization
 * @param colors Array of color data
 * @returns A record of letter groups to color arrays
 */
export function groupColorsByFirstLetter(colors) {
  const groups= {};
  
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
 * Formats the color data for our database
 */
export function formatColorDatabase(colors) {
  let output = "// Color database\n\n";
  output += "\n\n";
  output += "export const colorDatabase= [\n";
  
  colors.forEach((color, index) => {
    const entry = generateColorEntry(color);
    output += `  {\n`;
    output += `    name: "${entry.name}",\n`;
    output += `    hue: ${entry.hue},\n`;
    output += `    saturation: ${entry.saturation},\n`;
    output += `    lightness: ${entry.lightness},\n`;
    output += `    category: "${entry.category}",\n`;
    output += `    tags: [${entry.tags.map((t=> `"${t}"`).join(', ')}],\n`;
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
 * Advanced scraper that follows links to get actual color values
 * This should be run server-side or in a scraper script
 * @param baseUrl Base URL of the color register website
 * @param colorNames Array of color names to look up
 */
export async function scrapeColorValues(
  baseUrl colorNames) {
  const result= [];
  
  // Convert color names to URL-friendly format
  for (const name of colorNames) {
    const urlName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const url = `${baseUrl}/color/${urlName}`;
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        const html = await response.text();
        const hexValue = extractColorValueFromPage(html);
        
        const colorData= { name };
        
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
export function exampleUsageInBrowser() {
  console.log(`
To use this scraper in a browser console https://color-register.org/color/color-names-index
2. Run the following code in the console to get color names= document.body.innerHTML;
   const colors = scrapeColorRegister(htmlContent);
   console.log(colors);
   
3. For a complete scrape with color values, use a server-side script.
`);
}

/**
 * Generates a color entry with default values if actual values aren't available
 */
export function generateColorEntry(color) {
  // Default fallback color if no value provided
  const defaultHex = '#808080'; // Medium gray
  
  // Get the hex value or use default
  const hex = color.hex || defaultHex;
  
  // Convert hex to RGB if needed
  const rgb = color.rgb || { r g b };
  
  // Use default HSL values
  const h = 0;
  const s = 0;
  const l = 50;
  
  // Determine default category
  const category = "gray";
  
  // Default tags
  const tags = ["neutral"];
  
  return {
    name hue saturation lightness };
}

/**
 * Converts RGB to HSL values
 * @param r Red (0-255)
 * @param g Green (0-255)
 * @param b Blue (0-255)
 * @returns HSL values
 */
function rgbToHsl(r g b): { h: number; s: number; l }) {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min)  / (max + min);
    
    switch (max) {
      case r= (g - b) / d + (g < b ? 6 ); break;
      case g= (b - r) / d + 2; break;
      case b= (r - g) / d + 4; break;
    }
    
    h /= 6;
  }

  return { 
    h * 360), 
    s * 100), 
    l * 100) 
  };
}

/**
 * Determine color category based on hue angle
 * @param hue Hue angle (0-360)
 * @returns Color category
 */
function categorizeByHue(hue) {
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
function extractTags(name) {
  const tags= [];
  const words = name.toLowerCase().split(' ');
  
  // Common descriptive prefixes
  const descriptors = {
    vintage vivid aesthetic warm cool muted dark metallic };

  // Check each word against our descriptor lists
  words.forEach(word => {
    Object.entries(descriptors).forEach(([tag, keywords]) => {
      if (keywords.includes(word) && !tags.includes(tag)) {
        tags.push(tag);
      }
    });
  });
  
  // Check if name contains a color word to add that= ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 
                      'pink', 'brown', 'grey', 'gray', 'black', 'white'];
  
  colorWords.forEach(color => {
    if (words.includes(color) && !tags.includes(color)) {
      tags.push(color);
    }
  });

  return tags;
} 