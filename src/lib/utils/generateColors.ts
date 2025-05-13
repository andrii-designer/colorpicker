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
  // Support up to 10 colors
  const tc = tinycolorLib(baseColor);
  const result: string[] = [];
  
  // If count is small, create a simple progression
  if (count <= 5) {
    // Original behavior
    result.push(baseColor);
    result.push(tc.clone().lighten(20).toHexString());
    result.push(tc.clone().lighten(40).toHexString());
    result.push(tc.clone().darken(20).toHexString());
    result.push(tc.clone().darken(40).toHexString());
    
    // Return only the requested number
    return result.slice(0, count);
  } else {
    // For more colors, create a more diverse progression with varied saturation
    const baseHsl = tc.toHsl();
    
    // Create a full distribution from dark to light with varied saturation
    for (let i = 0; i < count; i++) {
      // Create a more dynamic range of lightness values
      // Map i from 0...count-1 to a lightness value that creates a nice distribution
      // We'll use a cosine wave to create a more interesting distribution than linear
      const position = i / (count - 1); // 0 to 1
      
      // Lightness ranges from 15% to 85% in a non-linear distribution
      const lightness = 15 + 70 * (0.5 - 0.5 * Math.cos(position * Math.PI * 2));
      
      // Vary saturation - generally higher for midtones, lower for very light/dark
      // This follows color theory principles for more natural looking palettes
      const distFromCenter = Math.abs(lightness - 50) / 35; // 0 at middle, 1 at extremes
      const saturationFactor = 1 - 0.3 * distFromCenter; // Reduce saturation at extremes
      
      const hsl = {
        h: baseHsl.h,
        s: Math.min(baseHsl.s * saturationFactor, 1), // Avoid oversaturation
        l: lightness / 100
      };
      
      result.push(tinycolorLib(hsl).toHexString());
  }
  
    // Randomize the order slightly to avoid too predictable pattern
    // but keep the base color as the first one
    const baseColorHex = tc.toHexString();
    const otherColors = result.filter(color => color !== baseColorHex);
    // Use Fisher-Yates shuffle for a slight randomization
    for (let i = otherColors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [otherColors[i], otherColors[j]] = [otherColors[j], otherColors[i]];
    }
    
    // Put base color first, then the others
    return [baseColorHex, ...otherColors].slice(0, count);
  }
};

/**
 * Generate a complementary palette
 */
const generateComplementaryPalette = (baseColor: string, count = 5): string[] => {
  // Support up to 10 colors with gradual transitions between base and complement
  const tc = tinycolorLib(baseColor);
  const result: string[] = [];
  
  // Base color and its complement
  const color1 = baseColor;
  const color2 = tc.clone().spin(180).toHexString();
  
  result.push(color1);
  result.push(color2);
  
  // If more colors are needed, add variations of both colors
  if (count > 2) {
    // For each additional color needed
    const remaining = count - 2;
    
    // Add variations of the base color
    for (let i = 0; i < Math.ceil(remaining / 2); i++) {
      const variation = tinycolorLib(color1).lighten(15 * (i + 1)).toHexString();
      result.push(variation);
  }
  
    // Add variations of the complementary color
    for (let i = 0; i < Math.floor(remaining / 2); i++) {
      const variation = tinycolorLib(color2).darken(15 * (i + 1)).toHexString();
      result.push(variation);
    }
  }
  
  return result;
};

/**
 * Generate an analogous palette
 */
const generateAnalogousPalette = (baseColor: string, count = 5): string[] => {
  // Support up to 10 colors with varying hue steps
  const tc = tinycolorLib(baseColor);
  const baseHsl = tc.toHsl();
  const result: string[] = [];
  
  // Determine the best strategy based on count
  if (count <= 5) {
    // For smaller palettes, traditional analogous with fixed angle steps
    const angleStep = 30;
    const angleRange = angleStep * (count - 1);
    const startAngle = -angleRange / 2;
    
    // Generate colors with graduated hue steps
    for (let i = 0; i < count; i++) {
      const angle = startAngle + (i * angleStep);
      result.push(tc.clone().spin(angle).toHexString());
    }
  } else {
    // For larger palettes, use golden ratio hue stepping for better distribution
    // The golden angle is approximately 137.5 degrees
    const goldenAngle = 137.5;
    
    // Start with the base color
    let hue = baseHsl.h;
    result.push(tc.toHexString());
    
    // For each additional color, step by the golden angle
    for (let i = 1; i < count; i++) {
      // Adjust the step size to get more pleasing variation for larger palettes
      // This creates colors that are related but more distinct
      const step = goldenAngle * (1 + (i * 0.1)); // Slightly increase step size as we go
      
      // Calculate new hue with wrapping around 360
      hue = (hue + step) % 360;
      
      // Vary saturation more dramatically for larger palettes
      const saturation = Math.min(Math.max(baseHsl.s + (Math.random() * 0.2 - 0.1), 0.3), 0.9);
      
      // Vary lightness - darker for some, lighter for others
      let lightness;
      if (i % 3 === 0) {
        // Darker shade
        lightness = Math.max(baseHsl.l - 0.1 - (Math.random() * 0.1), 0.2);
      } else if (i % 3 === 1) {
        // Lighter tint
        lightness = Math.min(baseHsl.l + 0.1 + (Math.random() * 0.1), 0.8);
      } else {
        // Similar lightness with small variation
        lightness = Math.min(Math.max(baseHsl.l + (Math.random() * 0.16 - 0.08), 0.25), 0.75);
  }
  
      // Create the new color
      const newColor = tinycolorLib({h: hue, s: saturation, l: lightness});
      result.push(newColor.toHexString());
    }
  }
  
  return result;
};

/**
 * Generate a triadic palette
 */
const generateTriadicPalette = (baseColor: string, count = 5): string[] => {
  // Support up to 10 colors with variations
  const tc = tinycolorLib(baseColor);
  
  // Create three colors 120 degrees apart
  const color1 = baseColor;
  const color2 = tc.clone().spin(120).toHexString();
  const color3 = tc.clone().spin(240).toHexString();
  
  const result = [color1, color2, color3];
  
  // If more colors needed, add variations of the triadic colors
  if (count > 3) {
    // Add variations between the triadic colors
    const remaining = count - 3;
    
    // For the first set of variations
    const variations1 = Math.ceil(remaining / 3);
    for (let i = 0; i < variations1; i++) {
      const mix = i % 2 === 0 ? 
        tinycolorLib(color1).lighten(10 + i * 5).toHexString() : 
        tinycolorLib(color1).darken(10 + i * 5).toHexString();
      result.push(mix);
  }
  
    // For the second set of variations
    const variations2 = Math.floor(remaining / 3);
    for (let i = 0; i < variations2; i++) {
      const mix = i % 2 === 0 ? 
        tinycolorLib(color2).lighten(10 + i * 5).toHexString() : 
        tinycolorLib(color2).darken(10 + i * 5).toHexString();
      result.push(mix);
    }
    
    // For the third set of variations
    const variations3 = remaining - variations1 - variations2;
    for (let i = 0; i < variations3; i++) {
      const mix = i % 2 === 0 ? 
        tinycolorLib(color3).lighten(10 + i * 5).toHexString() : 
        tinycolorLib(color3).darken(10 + i * 5).toHexString();
      result.push(mix);
    }
  }
  
  return result;
};

/**
 * Generate a tetradic palette
 */
const generateTetradicPalette = (baseColor: string, count = 5): string[] => {
  // Support up to 10 colors with variations
  const tc = tinycolorLib(baseColor);
  
  // Create four colors 90 degrees apart
  const color1 = baseColor;
  const color2 = tc.clone().spin(90).toHexString();
  const color3 = tc.clone().spin(180).toHexString();
  const color4 = tc.clone().spin(270).toHexString();
  
  const result = [color1, color2, color3, color4];
  
  // Add variations if needed
  if (count > 4) {
    // For each additional color needed
    const remaining = count - 4;
    
    // For the first set of variations
    const variations1 = Math.ceil(remaining / 4);
    for (let i = 0; i < variations1; i++) {
      const variation = tinycolorLib(color1).lighten(12 + i * 8).toHexString();
      result.push(variation);
    }
    
    // For the second set of variations
    const variations2 = Math.floor((remaining - variations1) / 3);
    for (let i = 0; i < variations2; i++) {
      const variation = tinycolorLib(color2).lighten(12 + i * 8).toHexString();
      result.push(variation);
    }
    
    // For the third set of variations
    const variations3 = Math.floor((remaining - variations1 - variations2) / 2);
    for (let i = 0; i < variations3; i++) {
      const variation = tinycolorLib(color3).darken(12 + i * 8).toHexString();
      result.push(variation);
    }
    
    // For the fourth set of variations
    const variations4 = remaining - variations1 - variations2 - variations3;
    for (let i = 0; i < variations4; i++) {
      const variation = tinycolorLib(color4).darken(12 + i * 8).toHexString();
      result.push(variation);
    }
  }
  
  return result;
};

/**
 * Generate a split complementary palette
 */
const generateSplitComplementaryPalette = (baseColor: string, count = 5): string[] => {
  // Support up to 10 colors with variations
  const tc = tinycolorLib(baseColor);
  
  // Create a base color and two colors adjacent to its complement
  const color1 = baseColor;
  const color2 = tc.clone().spin(150).toHexString();
  const color3 = tc.clone().spin(210).toHexString();
  
  const result = [color1, color2, color3];
  
  // Add variations if needed
  if (count > 3) {
    // Calculate how many variations to add for each color
    const remaining = count - 3;
    
    // Base color variations
    const baseVariations = Math.ceil(remaining / 3);
    for (let i = 0; i < baseVariations; i++) {
      const variant = i % 2 === 0 ? 
        tinycolorLib(color1).lighten(10 + i * 7).toHexString() : 
        tinycolorLib(color1).darken(10 + i * 7).toHexString();
      result.push(variant);
  }
  
    // First complement variations
    const firstVariations = Math.floor((remaining - baseVariations) / 2);
    for (let i = 0; i < firstVariations; i++) {
      const variant = i % 2 === 0 ? 
        tinycolorLib(color2).lighten(10 + i * 7).toHexString() : 
        tinycolorLib(color2).darken(10 + i * 7).toHexString();
      result.push(variant);
    }
    
    // Second complement variations
    const secondVariations = remaining - baseVariations - firstVariations;
    for (let i = 0; i < secondVariations; i++) {
      const variant = i % 2 === 0 ? 
        tinycolorLib(color3).lighten(10 + i * 7).toHexString() : 
        tinycolorLib(color3).darken(10 + i * 7).toHexString();
      result.push(variant);
    }
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
    // For larger palettes (6+), use our new composite approach if needed
    if (numColors >= 6 && numColors <= 10) {
      // Determine which composite type to use based on current palette type and temperature
      let compositeType = 'composite';
      if (options.temperature === 'warm') {
        compositeType = 'warm';
      } else if (options.temperature === 'cool') {
        compositeType = 'cool';
      } else if (paletteType === 'triadic' || paletteType === 'tetradic' || paletteType === 'splitComplementary') {
        compositeType = 'bold';
      }
      
      // Generate a composite harmony palette
      const hexColors = generateCompositeHarmony(normalizedColor, numColors, compositeType);
      
      // Convert to our format
      return hexColors.map(hex => {
        const tc = tinycolorLib(hex);
        return {
          hex: hex.toUpperCase(),
          rgb: tc.toRgb(),
          hsl: {
            h: Math.round(tc.toHsl().h),
            s: Math.round(tc.toHsl().s * 100),
            l: Math.round(tc.toHsl().l * 100)
          }
        };
      });
    } else {
      // For smaller palettes, use the beautiful palette generation with enhanced diversity
    return generateBeautifulPalette(normalizedColor, {
      harmonyType: paletteType,
      count: numColors,
      toneProfile: toneProfile,
      saturationStyle: saturationStyle
    });
    }
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

/**
 * Generate a palette using a combination of harmony strategies for larger palettes
 * This function creates more diverse palettes for 6+ colors by combining multiple approaches
 */
const generateCompositeHarmony = (baseColor: string, count = 8, harmonyType: string = 'composite'): string[] => {
  const tc = tinycolorLib(baseColor);
  const baseHsl = tc.toHsl();
  
  // Ensure we operate within our limits
  count = Math.min(Math.max(count, 5), 10);
  
  // For larger palettes (6-10), use a completely different approach 
  // that maximizes color diversity across the color wheel
  
  // Create an array to store our final colors
  const resultColors: string[] = [];
  
  // Always start with the base color
  resultColors.push(tc.toHexString());
  
  // For 6+ colors, we need to spread colors across the entire color wheel
  // to avoid the issue of all colors being too similar
  if (count >= 6) {
    // Define fixed positions on the color wheel for maximum diversity
    // Using a modified approach based on color harmonies
    
    // Start with common color harmony angles (in degrees)
    const primaryAngles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    
    // Shuffle array to add randomness while maintaining distribution
    shuffleArray(primaryAngles);
    
    // Get base hue and normalize to 0-360
    let baseHue = baseHsl.h;
    if (baseHue < 0) baseHue += 360;
    
    // Create diverse colors using strategic positions on the color wheel
    for (let i = 1; i < count; i++) {
      // Pick a strategic angle from our shuffled array
      const angle = primaryAngles[i % primaryAngles.length];
      
      // Calculate new hue by adding the angle to the base hue
      const newHue = (baseHue + angle) % 360;
      
      // Create varied saturation
      // More saturated for primary colors, less for secondary
      let saturation;
      if (i <= 3) {
        // Keep first few colors more saturated for visual impact
        saturation = Math.min(baseHsl.s * 1.1, 0.9);
      } else if (i >= count - 2) {
        // Make last colors less saturated for balance
        saturation = Math.max(baseHsl.s * 0.8, 0.3);
      } else {
        // Middle colors get slight variations
        saturation = Math.min(Math.max(baseHsl.s * (0.9 + (Math.random() * 0.3 - 0.15)), 0.3), 0.9);
      }
      
      // Create strategic lightness variations based on hue
      // This ensures proper contrast between colors
      let lightness;
      
      // Decide lightness based on color's position in the wheel relative to base
      const hueDifference = Math.abs(baseHue - newHue);
      
      if (hueDifference < 60) {
        // Similar hues - create contrast with lightness
        lightness = baseHsl.l > 0.5 ? 
          Math.max(baseHsl.l - 0.2 - (Math.random() * 0.1), 0.2) : 
          Math.min(baseHsl.l + 0.2 + (Math.random() * 0.1), 0.8);
      } else if (hueDifference > 150) {
        // Opposite hues - use similar lightness for balance
        lightness = Math.max(Math.min(baseHsl.l + (Math.random() * 0.2 - 0.1), 0.8), 0.2);
      } else {
        // In-between - use larger variations
        // Use position in sequence to create a zigzag pattern of lightness
        const zigzag = (i % 2 === 0) ? 0.15 : -0.15;
        lightness = Math.max(Math.min(baseHsl.l + zigzag + (Math.random() * 0.1 - 0.05), 0.85), 0.15);
      }
      
      // Create the new color
      const newColor = tinycolorLib({
        h: newHue,
        s: saturation,
        l: lightness
      });
      
      // Add to results
      resultColors.push(newColor.toHexString());
    }
    
    // Check for and fix any colors that are still too similar
    return ensurePaletteDistinctiveness(resultColors);
  }
  
  // Fallback for smaller palettes (shouldn't reach here with our implementation)
  // Just in case, return a simple palette
  if (resultColors.length < count) {
    // Fill with default colors based on complement
    const complement = tc.clone().spin(180);
    for (let i = resultColors.length; i < count; i++) {
      resultColors.push(complement.clone().spin(i * 30).toHexString());
    }
  }
  
  return resultColors;
};

/**
 * Helper function to shuffle an array (Fisher-Yates algorithm)
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Ensure colors in a palette are sufficiently distinct from each other
 * This helps prevent the issue of generating multiple similar shades
 */
const ensurePaletteDistinctiveness = (colors: string[]): string[] => {
  if (colors.length <= 5) return colors;
  
  // Convert to HSL for easier comparison and manipulation
  const hslColors = colors.map(c => tinycolorLib(c).toHsl());
  const result = [colors[0]]; // Always keep the first color
  
  // For each color after the first one
  for (let i = 1; i < colors.length; i++) {
    const currentHsl = hslColors[i];
    let needsAdjustment = false;
    
    // Check against all previous colors
    for (let j = 0; j < result.length; j++) {
      const existingHsl = tinycolorLib(result[j]).toHsl();
      
      // Calculate perceptual difference
      const hueDiff = Math.min(
        Math.abs(currentHsl.h - existingHsl.h),
        360 - Math.abs(currentHsl.h - existingHsl.h)
      );
      
      // For colors with similar hue, check saturation and lightness
      if (hueDiff < 20) {
        const satDiff = Math.abs(currentHsl.s - existingHsl.s);
        const lightDiff = Math.abs(currentHsl.l - existingHsl.l);
        
        // If too similar in all aspects, mark for adjustment
        if (satDiff < 0.2 && lightDiff < 0.2) {
          needsAdjustment = true;
          break;
        }
      }
    }
    
    // If too similar to existing colors, make drastic changes
    if (needsAdjustment) {
      // Shift hue significantly (by 60-120 degrees)
      const shiftAmount = 60 + Math.floor(Math.random() * 60);
      currentHsl.h = (currentHsl.h + shiftAmount) % 360;
      
      // Reverse lightness (dark becomes light, light becomes dark)
      currentHsl.l = 1 - currentHsl.l;
      
      // Update the color in the input array
      colors[i] = tinycolorLib(currentHsl).toHexString();
    }
    
    // Add to results
    result.push(colors[i]);
  }
  
  // Final check - sort by hue to create a visually pleasing order
  const finalHslPairs = result.map((color, index) => ({
    color,
    hsl: tinycolorLib(color).toHsl()
  }));
  
  finalHslPairs.sort((a, b) => a.hsl.h - b.hsl.h);
  
  return finalHslPairs.map(pair => pair.color);
};