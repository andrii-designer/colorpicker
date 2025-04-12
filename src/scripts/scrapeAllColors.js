/**
 * Script to scrape all 6,000+ colors from the color-register.org website
 * 
 * Usage:
 * 1. Run this script with Node.js:
 *    node src/scripts/scrapeAllColors.js
 * 
 * 2. The script will:
 *    - Fetch all color names from the index page
 *    - For each color, fetch its hex value from the individual color page
 *    - Save the results to src/lib/utils/colorData.json
 * 
 * 3. After the script completes, update your populateColorDatabase.ts to import from colorData.json
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const COLOR_INDEX_URL = 'https://color-register.org/color/color-names-index';
const OUTPUT_FILE = path.resolve(__dirname, '../../src/lib/utils/colorData.json');
const STATIC_FILE = path.resolve(__dirname, '../../src/lib/utils/colorDataStatic.ts');
const CONCURRENT_REQUESTS = 3; // Reduced from 5 to 3 to be more gentle
const REQUEST_DELAY = 500; // Increased from 200ms to 500ms

// Utility: HTTP GET request with Promise - with improved redirect handling
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const handleResponse = (res) => {
      // Handle redirects (status code 301, 302, 303, 307, 308)
      if (res.statusCode >= 300 && res.statusCode < 400) {
        if (!res.headers.location) {
          reject(new Error(`Redirect without location header (${res.statusCode})`));
          return;
        }
        
        // Construct absolute URL if the location is relative
        const redirectUrl = new URL(res.headers.location, url).toString();
        console.log(`Following redirect: ${url} -> ${redirectUrl}`);
        
        // Follow the redirect with a new request
        https.get(redirectUrl, handleResponse).on('error', (err) => {
          reject(err);
        });
        return;
      }
      
      // Handle successful response
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve(data);
        });
      } else {
        reject(new Error(`Request failed with status code ${res.statusCode}`));
      }
    };

    https.get(url, handleResponse).on('error', (err) => {
      reject(err);
    });
  });
}

// Scrape all color names from the index page
async function scrapeColorNames() {
  console.log('Scraping color names from index page...');
  const html = await httpGet(COLOR_INDEX_URL);
  
  // Extract color names
  const regex = /<li>\s*<a[^>]*>([^<]+)<\/a>\s*<\/li>/g;
  const colors = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    const colorName = match[1].trim();
    if (colorName) {
      colors.push(colorName);
    }
  }

  console.log(`Found ${colors.length} color names`);
  return colors;
}

// Extract the color value from a color page
function extractColorValueFromPage(html) {
  const hexRegex = /<div[^>]*class="color-sample"[^>]*style="background-color:\s*([#][0-9a-fA-F]{6})[^"]*"[^>]*>/i;
  const match = hexRegex.exec(html);
  
  if (match && match[1]) {
    return match[1].toUpperCase();
  }
  
  return null;
}

// Convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Convert RGB to HSL
function rgbToHsl(r, g, b) {
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

// Categorize color based on hue
function categorizeByHue(hue) {
  if (hue <= 15 || hue >= 345) return 'red';
  if (hue < 45) return 'orange';
  if (hue < 70) return 'yellow';
  if (hue < 150) return 'green';
  if (hue < 240) return 'blue';
  if (hue < 320) return 'purple';
  return 'pink';
}

// Extract tags from color name for better organization
function extractTags(name) {
  const tags = [];
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

// Process a batch of colors with controlled concurrency
async function processBatch(colorNames, startIndex, endIndex) {
  const batch = colorNames.slice(startIndex, endIndex);
  const results = [];
  
  for (const name of batch) {
    try {
      // Convert color name to URL format with improved handling for special characters
      const urlName = name.toLowerCase()
        .replace(/\s+/g, '-')                // Replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, '')          // Remove non-alphanumeric characters
        .replace(/-+/g, '-')                 // Replace multiple hyphens with a single one
        .replace(/^-|-$/g, '');              // Remove hyphens at the start/end
      
      // Skip if the URL would be empty after sanitization
      if (!urlName) {
        console.log(`Skipping "${name}" - cannot create valid URL`);
        results.push({ name, notes: "Skipped due to URL encoding issues" });
        continue;
      }
      
      const url = `https://color-register.org/color/${urlName}`;
      
      console.log(`Fetching color: ${name} (${url})`);
      let attempts = 0;
      let html = null;
      
      // Retry logic
      while (attempts < 3 && html === null) {
        try {
          attempts++;
          html = await httpGet(url);
        } catch (retryError) {
          console.error(`Attempt ${attempts} failed for ${name}: ${retryError.message}`);
          if (attempts < 3) {
            // Exponential backoff
            const delay = Math.pow(2, attempts) * REQUEST_DELAY;
            console.log(`Retrying after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      if (!html) {
        throw new Error(`Failed to fetch after ${attempts} attempts`);
      }
      
      const hexValue = extractColorValueFromPage(html);
      
      const colorData = { name };
      
      if (hexValue) {
        colorData.hex = hexValue;
        const rgb = hexToRgb(hexValue);
        
        if (rgb) {
          colorData.rgb = rgb;
          
          // Calculate HSL values
          const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
          colorData.hue = hsl.h;
          colorData.saturation = hsl.s;
          colorData.lightness = hsl.l;
          
          // Determine category and tags
          colorData.category = categorizeByHue(hsl.h);
          colorData.tags = extractTags(name);
        }
      }
      
      results.push(colorData);
      
      // Delay to be respectful
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
    } catch (error) {
      console.error(`Error processing color ${name}:`, error);
      // Still add the color name even if we couldn't get the value
      results.push({ 
        name, 
        notes: `Error: ${error.message}`
      });
    }
  }
  
  return results;
}

// Main function to scrape all colors
async function scrapeAllColors() {
  try {
    console.log("Starting color scraping process...");
    
    // Check if an existing output file exists and load its contents
    let existingColors = [];
    let processedNames = new Set();
    
    if (fs.existsSync(OUTPUT_FILE)) {
      try {
        const existingData = fs.readFileSync(OUTPUT_FILE, 'utf8');
        existingColors = JSON.parse(existingData);
        existingColors.forEach(color => processedNames.add(color.name));
        console.log(`Loaded ${existingColors.length} colors from existing file`);
      } catch (loadError) {
        console.error('Error loading existing color data:', loadError);
        // Continue with empty array if we can't load the file
        existingColors = [];
      }
    }
    
    // Get all color names
    const colorNames = await scrapeColorNames();
    
    // Filter out already processed colors
    const pendingColors = colorNames.filter(name => !processedNames.has(name));
    console.log(`Found ${colorNames.length} total colors, ${pendingColors.length} left to process`);
    
    if (pendingColors.length === 0) {
      console.log("All colors already processed! Generating static file...");
      generateStaticDataFile(existingColors);
      return;
    }
    
    // Process remaining colors in batches with controlled concurrency
    const allColors = [...existingColors];
    const totalColors = pendingColors.length;
    const totalBatches = Math.ceil(totalColors / CONCURRENT_REQUESTS);
    
    for (let i = 0; i < totalColors; i += CONCURRENT_REQUESTS) {
      const batchNumber = Math.ceil((i + 1) / CONCURRENT_REQUESTS);
      console.log(`Processing batch ${batchNumber} of ${totalBatches} (${allColors.length}/${colorNames.length} colors complete)`);
      
      const batchResults = await processBatch(
        pendingColors, 
        i, 
        Math.min(i + CONCURRENT_REQUESTS, totalColors)
      );
      
      allColors.push(...batchResults);
      
      // Save intermediate results more frequently
      if (allColors.length % 10 === 0 || i + CONCURRENT_REQUESTS >= totalColors) {
        const outputData = JSON.stringify(allColors, null, 2);
        fs.writeFileSync(OUTPUT_FILE, outputData);
        console.log(`Saved ${allColors.length} colors to ${OUTPUT_FILE}`);
      }
    }
    
    console.log(`Scraping complete! Saved ${allColors.length} colors to ${OUTPUT_FILE}`);
    
    // Generate a static TypeScript file for production deployment
    generateStaticDataFile(allColors);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Generate a static TypeScript file with the color data for production deployment
function generateStaticDataFile(colors) {
  try {
    console.log(`Generating static TypeScript file for production...`);
    
    // Create a TypeScript file with the color data as a constant
    const staticFileContent = `// Auto-generated from colorData.json - DO NOT EDIT MANUALLY
import type { ColorEntry } from './colorDatabase';

/**
 * This file contains all ${colors.length} colors from the Official Register of Color Names.
 * It was generated automatically by the scrapeAllColors.js script.
 * 
 * Last updated: ${new Date().toISOString()}
 */

export const STATIC_COLOR_DATA: ColorEntry[] = ${JSON.stringify(colors, null, 2)};

export default STATIC_COLOR_DATA;
`;
    
    fs.writeFileSync(STATIC_FILE, staticFileContent);
    console.log(`Successfully generated static data file at ${STATIC_FILE}`);
    console.log(`\nDEPLOYMENT INSTRUCTIONS:`);
    console.log(`1. The colorDataStatic.ts file has been created with all ${colors.length} colors`);
    console.log(`2. Build your application with \`npm run build\` to include all colors in the bundle`);
    console.log(`3. Deploy your application as usual - all colors will be available without runtime loading`);
    
  } catch (error) {
    console.error('Error generating static data file:', error);
  }
}

// Run the script
scrapeAllColors(); 