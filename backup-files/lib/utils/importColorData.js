

// This interface matches the structure of the scraped color data
;
  hue?: number;
  saturation?: number;
  lightness?: number;
  category?: string;
  tags?: string[];
}

// Default color values to use when a color doesn't have complete data
const DEFAULT_COLOR = {
  hue saturation lightness rgb: { r g b },
  hex: '#808080',
  category tags
};

/**
 * Import color data from the JSON file (produced by scrapeAllColors.js)
 * 
 * Note to * 1. Pre-process this data during build
 * 2. Split it into smaller chunks
 * 3. Load it dynamically or on-demand
 * 
 * This direct import works for demonstration but may cause performance issues with 6000+ colors
 */
export async function importColorData() {
  try {
    // Dynamic import of the JSON file
    const colorData = await import('./colorData.json').then(module => module.default);
    
    // Convert the imported data to our ColorEntry format
    return (colorData=> ({
      name hue ?? DEFAULT_COLOR.hue,
      saturation ?? DEFAULT_COLOR.saturation,
      lightness ?? DEFAULT_COLOR.lightness,
      category ?? DEFAULT_COLOR.category,
      tags ?? DEFAULT_COLOR.tags,
      hex ?? DEFAULT_COLOR.hex,
      rgb ?? DEFAULT_COLOR.rgb
    }));
    
  } catch (error) {
    console.error('Failed to import color data);
    // Return an empty array or fallback to the sample color database
    return [];
  }
}

/**
 * Import color data and filter it by category
 */
export async function getColorsByCategory(category) {
  const colors = await importColorData();
  return colors.filter(color => color.category === category);
}

/**
 * Import color data and filter it by tag
 */
export async function getColorsByTag(tag) {
  const colors = await importColorData();
  return colors.filter(color => color.tags.includes(tag));
}

/**
 * Import color data and find a specific color by name
 */
export async function getColorByName(name) {
  const colors = await importColorData();
  return colors.find(color => color.name.toLowerCase() === name.toLowerCase());
}

/**
 * Import color data and find similar colors based on HSL values
 */
export async function findSimilarColors(color maxDistance= 30) {
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