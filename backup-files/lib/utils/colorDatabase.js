import tinycolor from 'tinycolor2';

export ;
}

export 

// Helper function to convert any color format to HSL values
function extractHSL(color): { h: number; s: number; l }) {
  const tc = tinycolor(color);
  return tc.toHsl();
}

// Color families for better organization and theme generation
export const colorFamilies = {
  warm cool neutral earth jewel pastel metallic
};

// Tags for semantic searching and filtering
export const colorTags = [
  'vintage', 'vivid', 'aesthetic', 'antique', 'warm', 'cool',
  'american', 'natural', 'modern', 'classic', 'bright', 'dark',
  'light', 'muted', 'vibrant', 'deep', 'soft', 'rich'
];

// Initialize database with some example entries
// We'll expand this with ALL colors from the register
export const colorDatabase= [
  {
    name hue saturation lightness category tags hex: "#D92121",
    rgb: { r g b }
  },
  {
    name hue saturation lightness category tags hex: "#4682B4",
    rgb: { r g b }
  }
  // ... more colors will be added
];

// Utility functions for working with the color database

export function findColorsByCategory(category) {
  return colorDatabase.filter(color => color.category === category);
}

export function findColorsByTag(tag) {
  return colorDatabase.filter(color => color.tags.includes(tag));
}

export function findColorsByName(name) {
  return colorDatabase.find(color => 
    color.name.toLowerCase() === name.toLowerCase()
  );
}

export function getRandomColorFromCategory(category) {
  const colors = findColorsByCategory(category);
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getRandomColorWithTag(tag) {
  const colors = findColorsByTag(tag);
  return colors[Math.floor(Math.random() * colors.length)];
}

export function generateThematicPalette(theme size= 5) {
  const categories = colorFamilies[theme];
  const palette= [];
  
  while (palette.length < size) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const color = getRandomColorFromCategory(category);
    
    // Avoid duplicate colors
    if (!palette.find(c => c.name === color.name)) {
      palette.push(color);
    }
  }
  
  return palette;
}

export function createHSLString(color) {
  return `hsl(${color.hue}, ${color.saturation}%, ${color.lightness}%)`;
}

// Create a hex color string from a ColorEntry
export function createHexString(color) {
  if (color.hex) {
    return color.hex;
  }
  
  // Use HSL string directly with tinycolor
  const hslString = `hsl(${color.hue}, ${color.saturation}%, ${color.lightness}%)`;
  return tinycolor(hslString).toString();
}

// Create an RGB color string from a ColorEntry
export function createRGBString(color) {
  if (color.rgb) {
    return `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`;
  }
  
  // Convert using the HSL string first
  const hslString = `hsl(${color.hue}, ${color.saturation}%, ${color.lightness}%)`;
  const tc = tinycolor(hslString);
  // @ts-ignore - tinycolor has format specific toString but TypeScript doesn't recognize it
  return tc.toString("rgb");
}

// Helper function to categorize a color based on its hue
export function categorizeColor(hue) {
  if (hue <= 15 || hue >= 345) return 'red';
  if (hue < 45) return 'orange';
  if (hue < 70) return 'yellow';
  if (hue < 150) return 'green';
  if (hue < 240) return 'blue';
  if (hue < 320) return 'purple';
  return 'pink';
} 