import { ColorEntry } from './colorDatabase';
import { ACCURATE_COLOR_DATA } from './simplifiedColorData';
// Import tinycolor as any type to avoid type errors
import tinycolor from 'tinycolor2';
const tinycolorLib: any = tinycolor;

export interface Color {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  name?: string;
}

// Configuration interface for palette generation
export interface PaletteOptions {
  paletteType: 'monochromatic' | 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'splitComplementary';
  useAdobeAlgorithm?: boolean;
  count?: number;
  seed?: number;
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
function generateRandomColor(): Color {
  const seed = getRandomSeed();
  const h = Math.floor(seed * 360) % 360;
  const s = 70 + Math.floor(seed * 20) % 30; // 70-100%
  const l = 40 + Math.floor(seed * 20) % 40; // 40-80%
  
  return {
    hsl: { h, s, l },
    hex: hslToHex(h, s, l),
    rgb: hslToRgb(h, s, l)
  };
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
  const {
    paletteType,
    useAdobeAlgorithm = true,
    count = 5
  } = options;

  // Convert base color
  const base = tinycolorLib(baseColor);
  const baseHsl = base.toHsl();
  
  // Create result array with base color
  const result: Color[] = [{
    hex: base.toHexString(),
    rgb: base.toRgb(),
    hsl: {
      h: baseHsl.h,
      s: baseHsl.s * 100,
      l: baseHsl.l * 100
    },
    name: 'Base'
  }];

  // Generate additional colors
  for (let i = 1; i < count; i++) {
    // Default to base color properties
    let h = baseHsl.h;
    let s = baseHsl.s;
    let l = baseHsl.l;
    
    // Adjust based on palette type
    switch (paletteType) {
      case 'monochromatic':
        // Only adjust lightness
        l = baseHsl.l + (i % 2 === 0 ? 0.2 : -0.2) * Math.min(0.4, Math.ceil(i / 2) * 0.1);
        l = Math.max(0.1, Math.min(0.9, l));
        break;
        
      case 'complementary':
        // Use opposite hue for some colors
        if (i % 2 === 1) {
          h = (baseHsl.h + 180) % 360;
        }
        break;
        
      case 'analogous':
        // Neighboring hues
        h = (baseHsl.h + (i % 2 === 0 ? 1 : -1) * (i * 15)) % 360;
        if (h < 0) h += 360;
        break;
        
      case 'triadic':
        // Three colors 120° apart
        h = (baseHsl.h + (i % 3) * 120) % 360;
        break;
        
      case 'tetradic':
        // Four colors 90° apart
        h = (baseHsl.h + (i % 4) * 90) % 360;
        break;
        
      case 'splitComplementary':
        // Base + two colors near complement
        if (i === 1) {
          h = (baseHsl.h + 150) % 360;
        } else if (i === 2) {
          h = (baseHsl.h + 210) % 360;
        } else {
          h = (baseHsl.h + (i % 3) * 120) % 360;
        }
        break;
    }
    
    // Create new color
    const newColor = tinycolorLib({h, s, l});
    
    // Apply harmonization if requested
    let finalColor = newColor;
    if (useAdobeAlgorithm) {
      const adjustedHsl = newColor.toHsl();
      const harmonizedColor = tinycolorLib({
        h: adjustedHsl.h,
        s: Math.min(Math.max(adjustedHsl.s * 0.9 + 0.1, 0.3), 0.8),
        l: Math.min(Math.max(adjustedHsl.l * 0.85 + 0.15, 0.3), 0.8)
      });
      finalColor = harmonizedColor;
    }
    
    // Get final color properties
    const finalHsl = finalColor.toHsl();
    
    // Generate name
    let name = '';
    if (paletteType === 'monochromatic') {
      name = i % 2 === 0 ? `Tint ${Math.ceil(i / 2)}` : `Shade ${Math.ceil(i / 2)}`;
    } else {
      name = `Color ${i + 1}`;
    }
    
    // Add to result
    result.push({
      hex: finalColor.toHexString(),
      rgb: finalColor.toRgb(),
      hsl: {
        h: finalHsl.h,
        s: finalHsl.s * 100,
        l: finalHsl.l * 100
      },
      name
    });
  }
  
  return result;
}

// Placeholder for now - will be implemented later
export function regenerateWithLockedColors(
  currentPalette: Color[],
  lockedIndices: number[],
  options = {}
): Color[] {
  return [...currentPalette];
}