import { ColorEntry } from './colorDatabase';
import { ACCURATE_COLOR_DATA } from './simplifiedColorData';
// Import tinycolor as any type to avoid type errors
import tinycolor from 'tinycolor2';
const tinycolorLib: any = tinycolor;

// Import the new perceptual color generation
import { generateOptimizedPalette } from './perceptualColorGeneration';

// Import the new beautiful palette generator
import { generateBeautifulPalette } from './enhancedPaletteGeneration';

// Define types
export interface Color {
  hex: string;
  rgb: {
    r: number;
    g: number;
    b: number;
    a?: number;
  };
  hsl: {
    h: number;
    s: number;
    l: number;
    a?: number;
  };
  name?: string;
}

export interface PaletteOptions {
  numColors?: number;
  useNamedColors?: boolean;
  namedColorRatio?: number;
  paletteType?: 'monochromatic' | 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'splitComplementary';
  colorData?: any[];
  enforceMinContrast?: boolean;
  temperature?: 'warm' | 'cool' | 'mixed';
}

// Color harmony patterns
const HARMONY_RULES = {
  triadic: {
    angles: [0, 120, 240],
    accents: 2
  },
  analogous: {
    angles: [-30, 0, 30],
    accents: 2
  },
  splitComplementary: {
    angles: [0, 150, 210],
    accents: 2
  },
  tetradic: {
    angles: [0, 90, 180, 270],
    accents: 2
  },
  monochromatic: {
    angles: [0],
    accents: 0
  }
};

// ===========================================
// Core Color Conversion Functions
// ===========================================

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // Remove the hash if it exists
  hex = hex.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Find min and max values
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  // Calculate lightness
  let l = (max + min) / 2;
  
  // Calculate saturation
  let s = 0;
  if (max !== min) {
    s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
  }
  
  // Calculate hue
  let h = 0;
  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / (max - min) + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / (max - min) + 2;
        break;
      case b:
        h = (r - g) / (max - min) + 4;
        break;
    }
    h /= 6;
  }
  
  // Convert to degrees and percentages
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function hslToHex(h: number, s: number, l: number): string {
  const rgb = hslToRgb(h, s, l);
  return `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`.toUpperCase();
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100;
  l /= 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }
  
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

// Calculate contrast between two colors (WCAG algorithm)
function calculateContrast(rgb1: { r: number, g: number, b: number }, rgb2: { r: number, g: number, b: number }): number {
  // Calculate relative luminance for both colors
  const getLuminance = (rgb: { r: number, g: number, b: number }) => {
    const sRGB = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map(val => {
      return val <= 0.03928
        ? val / 12.92
        : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };
  
  const luminance1 = getLuminance(rgb1);
  const luminance2 = getLuminance(rgb2);
  
  const brightest = Math.max(luminance1, luminance2);
  const darkest = Math.min(luminance1, luminance2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

// ===========================================
// Helper Functions for Color Generation
// ===========================================

// Create a random timestamp-based seed for true randomness
function getRandomSeed(): number {
  return Math.sin(Date.now() * Math.random()) * 10000;
}

// Generate a random color with timestamp-based seed
function generateRandomColor(): string {
  const randomHex = Math.floor(Math.random() * 16777215).toString(16);
  // Ensure 6 digits
  return `#${randomHex.padStart(6, '0')}`;
}

// Function to check if two colors are too similar
function areSimilarColors(color1: Color, color2: Color, threshold: number = 20): boolean {
  const hueDiff = Math.min(
    Math.abs(color1.hsl.h - color2.hsl.h),
    360 - Math.abs(color1.hsl.h - color2.hsl.h)
  );
  
  const satDiff = Math.abs(color1.hsl.s - color2.hsl.s);
  const lightDiff = Math.abs(color1.hsl.l - color2.hsl.l);
  
  return hueDiff < threshold && satDiff < threshold && lightDiff < threshold;
}

// Ensure colors have sufficient contrast
function improveContrast(colors: Color[]): Color[] {
  const MIN_CONTRAST = 3.5;
  const result = [...colors];
  
  for (let i = 0; i < result.length - 1; i++) {
    const contrast = calculateContrast(result[i].rgb, result[i + 1].rgb);
    
    if (contrast < MIN_CONTRAST) {
      // Adjust lightness of the second color to improve contrast
      const newL = result[i].hsl.l > 50 
        ? Math.max(10, result[i + 1].hsl.l - 20) 
        : Math.min(90, result[i + 1].hsl.l + 20);
      
      result[i + 1].hsl.l = newL;
      result[i + 1].rgb = hslToRgb(result[i + 1].hsl.h, result[i + 1].hsl.s, result[i + 1].hsl.l);
      result[i + 1].hex = hslToHex(result[i + 1].hsl.h, result[i + 1].hsl.s, result[i + 1].hsl.l);
    }
  }
  
  return result;
}

// Find nearest named color in the database
function findNearestNamedColor(color: Color, colorData: ColorEntry[]): ColorEntry | undefined {
  let nearestColor: ColorEntry | undefined;
  let smallestDistance = Number.MAX_VALUE;
  
  colorData.forEach(entry => {
    const hueDiff = Math.min(
      Math.abs(color.hsl.h - entry.hue),
      360 - Math.abs(color.hsl.h - entry.hue)
    );
    
    const satDiff = Math.abs(color.hsl.s - entry.saturation);
    const lightDiff = Math.abs(color.hsl.l - entry.lightness);
    
    // Weight hue more heavily
    const distance = (hueDiff * 0.6) + (satDiff * 0.2) + (lightDiff * 0.2);
    
    if (distance < smallestDistance) {
      smallestDistance = distance;
      nearestColor = entry;
    }
  });
  
  // Only return if it's relatively close
  return smallestDistance < 40 ? nearestColor : undefined;
}

// ===========================================
// Main Color Palette Generation
// ===========================================

/**
 * Convert a hex color to a Color object
 */
const hexToColor = (hex: string, name?: string): Color => {
  const tc = tinycolorLib(hex);
  const rgb = tc.toRgb();
  const hsl = tc.toHsl();
  
  return {
    hex: tc.toHexString(),
    rgb: { r: rgb.r, g: rgb.g, b: rgb.b },
    hsl: { h: hsl.h, s: hsl.s * 100, l: hsl.l * 100 },
    name
  };
};

/**
 * Gets a shade of the given color
 * @param color Base color in hex format
 * @param shade Shade value (-10 to 10)
 * @returns Hex color string for the shade
 */
const getShade = (color: string, shade: number): string => {
  // Use TinyColor to get lighter or darker shade
  const tc = tinycolorLib(color);
  if (shade > 0) {
    // TinyColor's lighten method
    return tc.lighten(shade * 10).toString();
  } else {
    // TinyColor's darken method
    return tc.darken(Math.abs(shade) * 10).toString();
  }
};

/**
 * Generate a monochromatic palette from a base color
 */
const generateMonochromaticPalette = (baseColor: string, count = 5): string[] => {
  const result = [baseColor];
  const tc = tinycolorLib(baseColor);
  
  // Generate darker shades
  for (let i = 1; i < Math.ceil(count / 2); i++) {
    const dark = tinycolorLib(baseColor).darken(i * 10);
    result.unshift(dark.toHexString());
  }
  
  // Generate lighter tints
  for (let i = 1; i <= Math.floor(count / 2); i++) {
    const light = tinycolorLib(baseColor).lighten(i * 10);
    result.push(light.toHexString());
  }
  
  // Return the correct number of colors
  return result.slice(0, count);
};

/**
 * Generate a complementary palette
 */
const generateComplementaryPalette = (baseColor: string, count = 5): string[] => {
  const result = [baseColor];
  const tc = tinycolorLib(baseColor);
  const complement = tc.clone().spin(180).toHexString();
  
  result.push(complement);
  
  // Add variations
  if (count > 2) {
    result.push(tinycolorLib(baseColor).lighten(10).toHexString());
  }
  
  if (count > 3) {
    result.push(tinycolorLib(complement).lighten(10).toHexString());
  }
  
  if (count > 4) {
    result.push(tinycolorLib(baseColor).darken(10).toHexString());
  }
  
  return result;
};

/**
 * Generate an analogous palette
 */
const generateAnalogousPalette = (baseColor: string, count = 5): string[] => {
  const result = [baseColor];
  const tc = tinycolorLib(baseColor);
  
  // Generate colors on both sides of the base color on the color wheel
  const step = 30;
  
  for (let i = 1; i <= Math.floor(count / 2); i++) {
    const rightColor = tc.clone().spin(step * i).toHexString();
    result.push(rightColor);
    
    if (result.length < count) {
      const leftColor = tc.clone().spin(-step * i).toHexString();
      result.unshift(leftColor);
    }
  }
  
  // Return the correct number of colors
  return result.slice(0, count);
};

/**
 * Generate a triadic palette
 */
const generateTriadicPalette = (baseColor: string, count = 5): string[] => {
  const tc = tinycolorLib(baseColor);
  
  // Create three colors 120 degrees apart
  const color1 = baseColor;
  const color2 = tc.clone().spin(120).toHexString();
  const color3 = tc.clone().spin(240).toHexString();
  
  const result = [color1, color2, color3];
  
  // Add variations if needed
  if (count > 3) {
    result.push(tinycolorLib(color1).lighten(10).toHexString());
  }
  
  if (count > 4) {
    result.push(tinycolorLib(color2).lighten(10).toHexString());
  }
  
  return result;
};

/**
 * Generate a tetradic palette
 */
const generateTetradicPalette = (baseColor: string, count = 5): string[] => {
  const tc = tinycolorLib(baseColor);
  
  // Create four colors 90 degrees apart
  const color1 = baseColor;
  const color2 = tc.clone().spin(90).toHexString();
  const color3 = tc.clone().spin(180).toHexString();
  const color4 = tc.clone().spin(270).toHexString();
  
  const result = [color1, color2, color3, color4];
  
  // Add variations if needed
  if (count > 4) {
    result.push(tinycolorLib(color1).lighten(10).toHexString());
  }
  
  return result;
};

/**
 * Generate a split complementary palette
 */
const generateSplitComplementaryPalette = (baseColor: string, count = 5): string[] => {
  const tc = tinycolorLib(baseColor);
  
  // Create a base color and two colors adjacent to its complement
  const color1 = baseColor;
  const color2 = tc.clone().spin(150).toHexString();
  const color3 = tc.clone().spin(210).toHexString();
  
  const result = [color1, color2, color3];
  
  // Add variations if needed
  if (count > 3) {
    result.push(tinycolorLib(color1).lighten(10).toHexString());
  }
  
  if (count > 4) {
    result.push(tinycolorLib(color2).lighten(10).toHexString());
  }
  
  return result;
};

/**
 * Apply Adobe-style harmonization to a color palette
 */
const applyAdobeHarmonization = (colors: string[]): string[] => {
  return colors.map(color => {
    const tc = tinycolorLib(color);
    const hsl = tc.toHsl();
    
    // Adjust saturation and lightness for more harmonious colors
    const adjustedS = Math.min(Math.max(hsl.s * 0.9 + 0.1, 0.3), 0.8);
    const adjustedL = Math.min(Math.max(hsl.l * 0.85 + 0.15, 0.3), 0.8);
    
    // Return the adjusted color
    return tinycolorLib({h: hsl.h, s: adjustedS, l: adjustedL}).toHexString();
  });
};

/**
 * Generate a color palette based on the specified options
 */
export function generateColorPalette(
  baseColor: string, 
  options: PaletteOptions
): Color[] {
  // Set defaults
  const paletteType = options.paletteType || 'analogous';
  const numColors = options.numColors || 5;
  
  // Normalize base color
  if (!baseColor.startsWith('#')) {
    baseColor = `#${baseColor}`;
  }
  
  // Force using a valid hex color
  let normalizedColor = baseColor;
  try {
    // Validate color with tinycolor
    const tc = tinycolorLib(baseColor);
    if (!tc.isValid()) {
      normalizedColor = '#3366FF'; // Default blue if invalid
    } else {
      // Boost saturation slightly for better starting point
      normalizedColor = tc.saturate(10).toHexString().toUpperCase();
    }
  } catch (e) {
    normalizedColor = '#3366FF'; // Default fallback
  }
  
  // Determine optimal tone profile based on temperature and palette type
  let toneProfile: 'light' | 'balanced' | 'dark' = 'balanced';
  let saturationStyle: 'muted' | 'balanced' | 'vibrant' = 'balanced';
  
  // Set specific configurations for different harmony types
  if (paletteType === 'monochromatic') {
    // Monochromatic looks best with more contrast in tones and less saturation variance
    toneProfile = Math.random() < 0.7 ? 'balanced' : (Math.random() < 0.5 ? 'light' : 'dark');
    saturationStyle = Math.random() < 0.7 ? 'balanced' : (Math.random() < 0.5 ? 'vibrant' : 'muted');
  } 
  else if (paletteType === 'analogous') {
    // Analogous benefits from balanced tones and good vibrance
    toneProfile = Math.random() < 0.6 ? 'balanced' : (Math.random() < 0.5 ? 'light' : 'dark');
    saturationStyle = Math.random() < 0.6 ? 'balanced' : (Math.random() < 0.7 ? 'vibrant' : 'muted');
  }
  else if (paletteType === 'complementary') {
    // Complementary needs good contrast and often looks better with one vibrant accent
    toneProfile = Math.random() < 0.5 ? 'balanced' : 'dark';
    saturationStyle = Math.random() < 0.7 ? 'vibrant' : 'balanced';
  }
  else if (paletteType === 'triadic' || paletteType === 'tetradic') {
    // These complex harmonies need more cohesion in tone to avoid chaos
    toneProfile = 'balanced';
    saturationStyle = Math.random() < 0.6 ? 'balanced' : (Math.random() < 0.5 ? 'vibrant' : 'muted');
  }
  else if (paletteType === 'splitComplementary') {
    // Split complementary benefits from strong tonal contrast
    toneProfile = Math.random() < 0.6 ? 'dark' : 'balanced';
    saturationStyle = Math.random() < 0.7 ? 'vibrant' : 'balanced';
  }
  
  // Temperature overrides the defaults if specified
  if (options.temperature) {
    if (options.temperature === 'warm') {
      // Warm palettes often look better with darker tones and vibrant colors
      toneProfile = Math.random() < 0.5 ? 'dark' : 'balanced';
      saturationStyle = Math.random() < 0.7 ? 'vibrant' : 'balanced';
    } else if (options.temperature === 'cool') {
      // Cool palettes work well with lighter tones and more balanced saturation
      toneProfile = Math.random() < 0.5 ? 'light' : 'balanced';
      saturationStyle = Math.random() < 0.5 ? 'vibrant' : 'balanced';
    } else {
      // For mixed, fully randomize for more variety
      const toneRand = Math.random();
      toneProfile = toneRand < 0.33 ? 'light' : (toneRand < 0.66 ? 'balanced' : 'dark');
      
      const satRand = Math.random();
      saturationStyle = satRand < 0.33 ? 'muted' : (satRand < 0.75 ? 'balanced' : 'vibrant');
    }
  }
  
  try {
    // Generate beautiful palette using our new algorithm
    return generateBeautifulPalette(normalizedColor, {
      harmonyType: paletteType,
      count: numColors,
      toneProfile: toneProfile,
      saturationStyle: saturationStyle
    });
  } catch (error) {
    console.error("Error generating palette:", error);
    
    // Fallback to a simple generation if something goes wrong
    const tc = tinycolorLib(normalizedColor);
    return Array(numColors).fill(0).map((_, i) => {
      const adjustedColor = paletteType === 'monochromatic' 
        ? tc.clone().lighten(i * 20).saturate(10) 
        : tc.clone().spin(i * 45).saturate(10);
      
      return {
        hex: adjustedColor.toHexString().toUpperCase(),
        rgb: adjustedColor.toRgb(),
        hsl: {
          h: Math.round(adjustedColor.toHsl().h),
          s: Math.round(adjustedColor.toHsl().s * 100),
          l: Math.round(adjustedColor.toHsl().l * 100)
        }
      };
    });
  }
}

/**
 * Generate an extremely vibrant palette - alternative option
 */
export function generateHyperVibrantPalette(
  baseColor: string,
  options: PaletteOptions
): Color[] {
  // Set defaults
  const paletteType = options.paletteType || 'analogous';
  const numColors = options.numColors || 5;
  
  // Normalize base color
  if (!baseColor.startsWith('#')) {
    baseColor = `#${baseColor}`;
  }
  
  try {
    // Generate beautiful palette with forced vibrant saturation
    const palette = generateBeautifulPalette(baseColor, {
      harmonyType: paletteType,
      count: numColors,
      toneProfile: 'balanced',
      saturationStyle: 'vibrant'
    });
    
    // Make it ULTRA vibrant with post-processing
    return palette.map((color, index) => {
      // Keep the lightest and darkest colors more reasonable
      if (color.hsl.l > 85 || color.hsl.l < 15) {
        return color;
      }
      
      const tc = tinycolorLib(color.hex);
      // Boost saturation even more for mid-tones
      const boosted = tc.saturate(40);
      
      // Prevent colors from becoming too dark
      if (boosted.toHsl().l < 0.3) {
        boosted.lighten(15);
      }
      
      // Convert to our format
      return {
        hex: boosted.toHexString().toUpperCase(),
        rgb: boosted.toRgb(),
        hsl: {
          h: Math.round(boosted.toHsl().h),
          s: Math.round(boosted.toHsl().s * 100),
          l: Math.round(boosted.toHsl().l * 100)
        }
      };
    });
  } catch (error) {
    console.error("Error generating hyper vibrant palette:", error);
    return generateColorPalette(baseColor, {
      ...options,
      paletteType: paletteType,
      numColors: numColors
    });
  }
}

// Placeholder for now - will be implemented later
export function regenerateWithLockedColors(
  currentPalette: Color[],
  lockedIndices: number[],
  options = {}
): Color[] {
  return [...currentPalette];
}