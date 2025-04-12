import tinycolor from 'tinycolor2';

export interface ColorEntry {
  name: string;
  hue: number;
  saturation: number;
  lightness: number;
  category: ColorCategory;
  tags: string[];
  hex?: string;
  rgb?: { r: number; g: number; b: number };
}

export type ColorCategory = 
  | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' 
  | 'pink' | 'brown' | 'gray' | 'black' | 'white' | 'metallic';

// Helper function to convert any color format to HSL values
function extractHSL(color: string): { h: number; s: number; l: number } {
  const tc = tinycolor(color);
  return tc.toHsl();
}

// Color families for better organization and theme generation
export const colorFamilies = {
  warm: ['red', 'orange', 'yellow', 'pink', 'brown'],
  cool: ['blue', 'green', 'purple'],
  neutral: ['gray', 'brown', 'black', 'white'],
  earth: ['brown', 'green', 'orange'],
  jewel: ['purple', 'blue', 'red'],
  pastel: ['pink', 'yellow', 'blue', 'green', 'purple'],
  metallic: ['metallic'],
} as const;

// Tags for semantic searching and filtering
export const colorTags = [
  'vintage', 'vivid', 'aesthetic', 'antique', 'warm', 'cool',
  'american', 'natural', 'modern', 'classic', 'bright', 'dark',
  'light', 'muted', 'vibrant', 'deep', 'soft', 'rich'
] as const;

// Initialize database with some example entries
// We'll expand this with ALL colors from the register
export const colorDatabase: ColorEntry[] = [
  {
    name: "Aesthetic Red",
    hue: 0,
    saturation: 85,
    lightness: 50,
    category: "red",
    tags: ["aesthetic", "vibrant", "modern"],
    hex: "#D92121",
    rgb: { r: 217, g: 33, b: 33 }
  },
  {
    name: "Vintage Blue",
    hue: 210,
    saturation: 65,
    lightness: 55,
    category: "blue",
    tags: ["vintage", "muted", "classic"],
    hex: "#4682B4",
    rgb: { r: 70, g: 130, b: 180 }
  }
  // ... more colors will be added
];

// Utility functions for working with the color database

export function findColorsByCategory(category: ColorCategory): ColorEntry[] {
  return colorDatabase.filter(color => color.category === category);
}

export function findColorsByTag(tag: string): ColorEntry[] {
  return colorDatabase.filter(color => color.tags.includes(tag));
}

export function findColorsByName(name: string): ColorEntry | undefined {
  return colorDatabase.find(color => 
    color.name.toLowerCase() === name.toLowerCase()
  );
}

export function getRandomColorFromCategory(category: ColorCategory): ColorEntry {
  const colors = findColorsByCategory(category);
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getRandomColorWithTag(tag: string): ColorEntry {
  const colors = findColorsByTag(tag);
  return colors[Math.floor(Math.random() * colors.length)];
}

export function generateThematicPalette(theme: keyof typeof colorFamilies, size: number = 5): ColorEntry[] {
  const categories = colorFamilies[theme];
  const palette: ColorEntry[] = [];
  
  while (palette.length < size) {
    const category = categories[Math.floor(Math.random() * categories.length)] as ColorCategory;
    const color = getRandomColorFromCategory(category);
    
    // Avoid duplicate colors
    if (!palette.find(c => c.name === color.name)) {
      palette.push(color);
    }
  }
  
  return palette;
}

export function createHSLString(color: ColorEntry): string {
  return `hsl(${color.hue}, ${color.saturation}%, ${color.lightness}%)`;
}

// Create a hex color string from a ColorEntry
export function createHexString(color: ColorEntry): string {
  if (color.hex) {
    return color.hex;
  }
  
  // Use HSL string directly with tinycolor
  const hslString = `hsl(${color.hue}, ${color.saturation}%, ${color.lightness}%)`;
  return tinycolor(hslString).toString();
}

// Create an RGB color string from a ColorEntry
export function createRGBString(color: ColorEntry): string {
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
export function categorizeColor(hue: number): ColorCategory {
  if (hue <= 15 || hue >= 345) return 'red';
  if (hue < 45) return 'orange';
  if (hue < 70) return 'yellow';
  if (hue < 150) return 'green';
  if (hue < 240) return 'blue';
  if (hue < 320) return 'purple';
  return 'pink';
} 