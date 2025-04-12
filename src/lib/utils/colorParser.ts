import tinycolor from 'tinycolor2';
import type { ColorEntry, ColorCategory } from './colorDatabase';

// Helper function to extract common color words for categorization
function extractColorWords(name: string): string[] {
  return name.toLowerCase().split(' ').filter(word => 
    ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 
     'brown', 'grey', 'gray', 'black', 'white', 'gold', 'silver'].includes(word)
  );
}

// Helper function to extract common descriptive words for tags
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

  return tags;
}

// Function to generate an initial HSL value for a color name
function generateInitialHSL(name: string): { h: number; s: number; l: number } {
  const colorWords = extractColorWords(name);
  if (colorWords.length === 0) {
    // If no color word is found, generate a random color
    return {
      h: Math.random() * 360,
      s: 70 + Math.random() * 20,
      l: 45 + Math.random() * 20
    };
  }

  // Base HSL values for common colors
  const baseColors: Record<string, { h: number; s: number; l: number }> = {
    red: { h: 0, s: 85, l: 50 },
    orange: { h: 30, s: 85, l: 50 },
    yellow: { h: 60, s: 85, l: 50 },
    green: { h: 120, s: 75, l: 45 },
    blue: { h: 210, s: 85, l: 50 },
    purple: { h: 270, s: 75, l: 50 },
    pink: { h: 330, s: 80, l: 65 },
    brown: { h: 30, s: 50, l: 35 },
    grey: { h: 0, s: 0, l: 50 },
    gray: { h: 0, s: 0, l: 50 },
    black: { h: 0, s: 0, l: 15 },
    white: { h: 0, s: 0, l: 95 },
    gold: { h: 45, s: 80, l: 50 },
    silver: { h: 0, s: 0, l: 75 }
  };

  const baseColor = baseColors[colorWords[0]];
  
  // Add some variation to make each color unique
  return {
    h: (baseColor.h + (Math.random() * 20 - 10)) % 360,
    s: Math.min(100, Math.max(0, baseColor.s + (Math.random() * 20 - 10))),
    l: Math.min(100, Math.max(0, baseColor.l + (Math.random() * 20 - 10)))
  };
}

// Function to determine color category
function determineCategory(name: string, hue: number): ColorCategory {
  const colorWords = extractColorWords(name);
  if (colorWords.length > 0) {
    const mainColor = colorWords[0];
    switch (mainColor) {
      case 'red': return 'red';
      case 'orange': return 'orange';
      case 'yellow': return 'yellow';
      case 'green': return 'green';
      case 'blue': return 'blue';
      case 'purple': return 'purple';
      case 'pink': return 'pink';
      case 'brown': return 'brown';
      case 'grey':
      case 'gray': return 'gray';
      case 'black': return 'black';
      case 'white': return 'white';
      case 'gold':
      case 'silver': return 'metallic';
    }
  }

  // Fallback to hue-based categorization
  if (name.toLowerCase().includes('metallic')) return 'metallic';
  return categorizeByHue(hue);
}

function categorizeByHue(hue: number): ColorCategory {
  if (hue <= 15 || hue >= 345) return 'red';
  if (hue < 45) return 'orange';
  if (hue < 70) return 'yellow';
  if (hue < 150) return 'green';
  if (hue < 240) return 'blue';
  if (hue < 320) return 'purple';
  return 'pink';
}

export function parseColorName(name: string): ColorEntry {
  const hsl = generateInitialHSL(name);
  const category = determineCategory(name, hsl.h);
  const tags = extractTags(name);

  return {
    name,
    hue: hsl.h,
    saturation: hsl.s,
    lightness: hsl.l,
    category,
    tags
  };
}

// Function to parse a list of color names and generate the database
export function generateColorDatabase(colorNames: string[]): ColorEntry[] {
  return colorNames.map(name => parseColorName(name));
} 