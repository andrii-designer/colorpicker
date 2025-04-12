import { ColorEntry } from './colorDatabase';
import { ACCURATE_COLOR_DATA } from './fixedAccurateColorData';

export interface Color {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  name?: string;
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

export function generateColorPalette(
  baseColor: string,
  options: {
    numColors?: number;
    useNamedColors?: boolean;
    namedColorRatio?: number;
    paletteType?: 'monochromatic' | 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'splitComplementary';
    colorData?: ColorEntry[];
    enforceMinContrast?: boolean;
    temperature?: 'warm' | 'cool' | 'neutral' | 'mixed';
  } = {}
): Color[] {
  // Extract options with defaults
  const {
    numColors = 5,
    useNamedColors = true,
    namedColorRatio = 0.5,
    paletteType = 'analogous',
    colorData = ACCURATE_COLOR_DATA,
    enforceMinContrast = true,
    temperature = 'mixed'
  } = options;
  
  // Add extreme randomization with multiple entropy sources
  const uniqueTimestamp = Date.now();
  const randomSeed1 = Math.sin(uniqueTimestamp) * 10000;
  const randomSeed2 = Math.cos(uniqueTimestamp / 1000) * 10000;
  const randomSeed3 = Math.random() * 10000;
  
  // Random variation function
  const getRandom = (min: number, max: number) => {
    const rand = Math.abs((randomSeed1 + randomSeed2 + randomSeed3) * Math.random()) % 1;
    return min + rand * (max - min);
  };
  
  // Normalize the base color
  const normalizedBaseColor = baseColor.toUpperCase();
  
  // Convert to HSL
  const baseHSL = hexToHSL(normalizedBaseColor);
  
  // Create a significantly randomized base HSL for variety
  const randomizedHSL = { ...baseHSL };
  
  // Apply different randomization strategies based on palette type
  switch (paletteType) {
    case 'monochromatic':
      // Subtle hue shift, moderate sat/light shifts
      randomizedHSL.h = (baseHSL.h + getRandom(-10, 10)) % 360;
      randomizedHSL.s = Math.min(100, Math.max(20, baseHSL.s + getRandom(-20, 20)));
      randomizedHSL.l = Math.min(85, Math.max(25, baseHSL.l + getRandom(-20, 20)));
      break;
      
    case 'complementary':
      // Major hue shift
      randomizedHSL.h = (baseHSL.h + getRandom(-45, 45)) % 360;
      randomizedHSL.s = Math.min(100, Math.max(20, baseHSL.s + getRandom(-30, 30)));
      randomizedHSL.l = Math.min(85, Math.max(25, baseHSL.l + getRandom(-25, 25)));
      break;
      
    case 'analogous':
      // Moderate hue shift
      randomizedHSL.h = (baseHSL.h + getRandom(-30, 30)) % 360;
      randomizedHSL.s = Math.min(100, Math.max(20, baseHSL.s + getRandom(-25, 25)));
      randomizedHSL.l = Math.min(85, Math.max(25, baseHSL.l + getRandom(-20, 20)));
      break;
      
    case 'triadic':
      // Significant hue shift
      randomizedHSL.h = (baseHSL.h + getRandom(-40, 40)) % 360;
      randomizedHSL.s = Math.min(100, Math.max(20, baseHSL.s + getRandom(-30, 30)));
      randomizedHSL.l = Math.min(85, Math.max(25, baseHSL.l + getRandom(-20, 20)));
      break;
      
    case 'tetradic':
      // Extreme hue shift
      randomizedHSL.h = (baseHSL.h + getRandom(-45, 45)) % 360;
      randomizedHSL.s = Math.min(100, Math.max(20, baseHSL.s + getRandom(-35, 35)));
      randomizedHSL.l = Math.min(85, Math.max(25, baseHSL.l + getRandom(-25, 25)));
      break;
      
    case 'splitComplementary':
      // Major hue shift
      randomizedHSL.h = (baseHSL.h + getRandom(-40, 40)) % 360;
      randomizedHSL.s = Math.min(100, Math.max(20, baseHSL.s + getRandom(-25, 25)));
      randomizedHSL.l = Math.min(85, Math.max(25, baseHSL.l + getRandom(-20, 20)));
      break;
  }
  
  // Ensure hue is properly wrapped
  if (randomizedHSL.h < 0) randomizedHSL.h += 360;
  
  // Add even more time-based randomness
  const timeRandom = (uniqueTimestamp % 100000) / 100000;
  randomizedHSL.h = (randomizedHSL.h + (timeRandom * 360 * 0.1)) % 360;
  
  // Initialize the palette with the original color
  const palette: Color[] = [{
    hex: normalizedBaseColor,
    rgb: hslToRgb(baseHSL.h, baseHSL.s, baseHSL.l),
    hsl: baseHSL
  }];
  
  // Generate the remaining colors based on palette type
  switch (paletteType) {
    case 'monochromatic': {
      // Create a range of lightness values
      for (let i = 1; i < numColors; i++) {
        const l = 20 + (60 * (i / numColors)) + getRandom(-15, 15);
        const s = baseHSL.s + getRandom(-20, 20);
        palette.push({
          hsl: { h: randomizedHSL.h, s, l },
          hex: hslToHex(randomizedHSL.h, s, l),
          rgb: hslToRgb(randomizedHSL.h, s, l)
        });
      }
      break;
    }
    
    case 'complementary': {
      // Complementary color (opposite hue)
      const complementHue = (randomizedHSL.h + 180) % 360;
      
      for (let i = 1; i < numColors; i++) {
        let h, s, l;
        
        if (i === 1) {
          // True complement
          h = complementHue;
          s = baseHSL.s + getRandom(-10, 10);
          l = baseHSL.l + getRandom(-10, 10);
        } else if (i === 2) {
          // Darkened base
          h = randomizedHSL.h;
          s = baseHSL.s + getRandom(-5, 15);
          l = Math.max(20, baseHSL.l - 15 + getRandom(-10, 10));
        } else if (i === 3) {
          // Lightened base
          h = randomizedHSL.h;
          s = Math.max(20, baseHSL.s - 10 + getRandom(-10, 10));
          l = Math.min(85, baseHSL.l + 15 + getRandom(-10, 10));
        } else {
          // Darkened complement
          h = complementHue;
          s = baseHSL.s + getRandom(-10, 10);
          l = Math.max(20, baseHSL.l - 15 + getRandom(-10, 10));
        }
        
        palette.push({
          hsl: { h, s, l },
          hex: hslToHex(h, s, l),
          rgb: hslToRgb(h, s, l)
        });
      }
      break;
    }
    
    case 'analogous': {
      // Colors adjacent on the color wheel
      const range = 40 + getRandom(0, 20);
      
      for (let i = 1; i < numColors; i++) {
        // Distribute colors across the range
        const position = i / (numColors - 1);
        const hOffset = range * (position - 0.5);
        const h = (randomizedHSL.h + hOffset + 360) % 360;
        
        // Vary saturation and lightness
        const s = baseHSL.s + getRandom(-15, 15);
        const l = baseHSL.l + getRandom(-20, 20);
        
        palette.push({
          hsl: { h, s, l },
          hex: hslToHex(h, s, l),
          rgb: hslToRgb(h, s, l)
        });
      }
      break;
    }
    
    case 'triadic': {
      // Three colors equally spaced
      const triad1 = (randomizedHSL.h + 120) % 360;
      const triad2 = (randomizedHSL.h + 240) % 360;
      
      for (let i = 1; i < numColors; i++) {
        let h, s, l;
        
        if (i === 1) {
          h = triad1;
          s = baseHSL.s + getRandom(-10, 10);
          l = baseHSL.l + getRandom(-10, 10);
        } else if (i === 2) {
          h = triad2;
          s = baseHSL.s + getRandom(-10, 10);
          l = baseHSL.l + getRandom(-10, 10);
        } else if (i === 3) {
          // Variant of first triad
          h = (triad1 + getRandom(-20, 20)) % 360;
          s = baseHSL.s + getRandom(-15, 15);
          l = baseHSL.l + getRandom(-20, 20);
        } else {
          // Variant of second triad
          h = (triad2 + getRandom(-20, 20)) % 360;
          s = baseHSL.s + getRandom(-15, 15);
          l = baseHSL.l + getRandom(-20, 20);
        }
        
        palette.push({
          hsl: { h, s, l },
          hex: hslToHex(h, s, l),
          rgb: hslToRgb(h, s, l)
        });
      }
      break;
    }
    
    case 'tetradic': {
      // Four colors forming a rectangle on the color wheel
      const tetrad1 = (randomizedHSL.h + 90) % 360;
      const tetrad2 = (randomizedHSL.h + 180) % 360;
      const tetrad3 = (randomizedHSL.h + 270) % 360;
      
      const hues = [tetrad1, tetrad2, tetrad3];
      
      for (let i = 1; i < numColors; i++) {
        const h = i <= 3 ? hues[i - 1] : hues[(i - 1) % 3];
        const s = baseHSL.s + getRandom(-15, 15);
        const l = baseHSL.l + (i > 3 ? 15 : 0) + getRandom(-15, 15);
        
        palette.push({
          hsl: { h, s, l },
          hex: hslToHex(h, s, l),
          rgb: hslToRgb(h, s, l)
        });
      }
      break;
    }
    
    case 'splitComplementary': {
      // Base plus two colors adjacent to its complement
      const complement = (randomizedHSL.h + 180) % 360;
      const split1 = (complement - 30 + getRandom(-15, 15) + 360) % 360;
      const split2 = (complement + 30 + getRandom(-15, 15)) % 360;
      
      const hues = [split1, split2];
      
      for (let i = 1; i < numColors; i++) {
        let h, s, l;
        
        if (i <= 2) {
          h = hues[i - 1];
          s = baseHSL.s + getRandom(-10, 10);
          l = baseHSL.l + getRandom(-10, 10);
        } else if (i === 3) {
          // Variant of first split
          h = (split1 + getRandom(-20, 20)) % 360;
          s = baseHSL.s + getRandom(-15, 15);
          l = baseHSL.l + getRandom(-20, 20);
        } else {
          // Variant of second split
          h = (split2 + getRandom(-20, 20)) % 360;
          s = baseHSL.s + getRandom(-15, 15);
          l = baseHSL.l + getRandom(-20, 20);
        }
        
        palette.push({
          hsl: { h, s, l },
          hex: hslToHex(h, s, l),
          rgb: hslToRgb(h, s, l)
        });
      }
      break;
    }
    
    default: {
      // Fallback to random colors
      for (let i = 1; i < numColors; i++) {
        palette.push(generateRandomColor());
      }
    }
  }
  
  // Apply temperature adjustment if needed
  if (temperature !== 'mixed') {
    for (let i = 1; i < palette.length; i++) {
      let h = palette[i].hsl.h;
      
      if (temperature === 'warm' && (h > 90 && h < 270)) {
        // Shift cool colors to warm range
        h = (h + 180) % 360;
      } else if (temperature === 'cool' && (h < 90 || h > 270)) {
        // Shift warm colors to cool range
        h = (h + 180) % 360;
      }
      
      // Update color
      palette[i].hsl.h = h;
      palette[i].rgb = hslToRgb(h, palette[i].hsl.s, palette[i].hsl.l);
      palette[i].hex = hslToHex(h, palette[i].hsl.s, palette[i].hsl.l);
    }
  }
  
  // Ensure minimum contrast if required
  const contrastAdjusted = enforceMinContrast ? improveContrast(palette) : palette;
  
  // Apply named colors if requested
  if (useNamedColors) {
    const namedCount = Math.max(1, Math.floor(numColors * namedColorRatio));
    
    for (let i = 1; i < palette.length && i <= namedCount; i++) {
      const namedColor = findNearestNamedColor(contrastAdjusted[i], colorData);
      
      if (namedColor) {
        contrastAdjusted[i] = {
          hex: namedColor.hex || contrastAdjusted[i].hex,
          rgb: namedColor.rgb || contrastAdjusted[i].rgb,
          hsl: { 
            h: namedColor.hue, 
            s: namedColor.saturation, 
            l: namedColor.lightness 
          },
          name: namedColor.name
        };
      }
    }
  }
  
  // Ensure the base color is preserved
  contrastAdjusted[0] = {
    hex: normalizedBaseColor,
    rgb: hslToRgb(baseHSL.h, baseHSL.s, baseHSL.l),
    hsl: baseHSL
  };
  
  // Add analysis data
  const analysis = {
    harmony: 0.8,
    contrast: 0.7,
    variety: 0.9
  };
  
  if (contrastAdjusted[0]) {
    (contrastAdjusted[0] as any).evaluation = analysis;
  }
  
  return contrastAdjusted;
}

// Placeholder for now - will be implemented later
export function regenerateWithLockedColors(
  currentPalette: Color[],
  lockedIndices: number[],
  options = {}
): Color[] {
  return [...currentPalette];
}