import type { ColorEntry } from './colorDatabase';

// This interface matches the structure of the scraped color data
interface ScrapedColorData {
  name: string;
  hex?: string;
  rgb?: { r: number; g: number; b: number };
  hue?: number;
  saturation?: number;
  lightness?: number;
  category?: string;
  tags?: string[];
}

// Default color values to use when a color doesn't have complete data
const DEFAULT_COLOR = {
  hue: 0,
  saturation: 0,
  lightness: 50,
  rgb: { r: 128, g: 128, b: 128 },
  hex: '#808080',
  category: 'gray',
  tags: ['default']
};

/**
 * Import color data from the JSON file (produced by scrapeAllColors.js)
 * 
 * Note: In a production environment, you would likely want to:
 * 1. Pre-process this data during build
 * 2. Split it into smaller chunks
 * 3. Load it dynamically or on-demand
 * 
 * This direct import works for demonstration but may cause performance issues with 6000+ colors
 */
export async function importColorData(): Promise<ColorEntry[]> {
  try {
    // Dynamic import of the JSON file
    const colorData = await import('./colorData.json').then(module => module.default);
    
    // Convert the imported data to our ColorEntry format
    return (colorData as ScrapedColorData[]).map(color => ({
      name: color.name,
      hue: color.hue ?? DEFAULT_COLOR.hue,
      saturation: color.saturation ?? DEFAULT_COLOR.saturation,
      lightness: color.lightness ?? DEFAULT_COLOR.lightness,
      category: (color.category as any) ?? DEFAULT_COLOR.category,
      tags: color.tags ?? DEFAULT_COLOR.tags,
      hex: color.hex ?? DEFAULT_COLOR.hex,
      rgb: color.rgb ?? DEFAULT_COLOR.rgb
    }));
    
  } catch (error) {
    console.error('Failed to import color data:', error);
    // Return an empty array or fallback to the sample color database
    return [];
  }
}

/**
 * Import color data and filter it by category
 */
export async function getColorsByCategory(category: string): Promise<ColorEntry[]> {
  const colors = await importColorData();
  return colors.filter(color => color.category === category);
}

/**
 * Import color data and filter it by tag
 */
export async function getColorsByTag(tag: string): Promise<ColorEntry[]> {
  const colors = await importColorData();
  return colors.filter(color => color.tags.includes(tag));
}

/**
 * Import color data and find a specific color by name
 */
export async function getColorByName(name: string): Promise<ColorEntry | undefined> {
  const colors = await importColorData();
  return colors.find(color => color.name.toLowerCase() === name.toLowerCase());
}

/**
 * Import color data and find similar colors based on HSL values
 */
export async function findSimilarColors(color: ColorEntry, maxDistance: number = 30): Promise<ColorEntry[]> {
  const colors = await importColorData();
  
  return colors.filter(c => {
    const hueDiff = Math.min(
      Math.abs(c.hue - color.hue),
      Math.abs(c.hue - color.hue + 360),
      Math.abs(c.hue - color.hue - 360)
    );
    const satDiff = Math.abs(c.saturation - color.saturation);
    const lightDiff = Math.abs(c.lightness - color.lightness);
    
    return hueDiff <= maxDistance && satDiff <= 20 && lightDiff <= 20;
  });
} 