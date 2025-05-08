/**
 * Color utility functions for generating color harmonies based on coolors.co rules
 */

import tinycolor from 'tinycolor2';

// Cast tinycolor to any to avoid type errors
const tinycolorLib: any = tinycolor;

// Types for our color formats
export interface HSLColor {
  h: number; // Hue (0-360)
  s: number; // Saturation (0-100)
  l: number; // Lightness (0-100)
}

export interface RGBColor {
  r: number; // Red (0-255)
  g: number; // Green (0-255)
  b: number; // Blue (0-255)
}

// Color harmony types supported by coolors.co
export type ColorHarmonyType = 
  | 'analogous'
  | 'complementary' 
  | 'split-complementary'
  | 'triadic'
  | 'tetradic'
  | 'square'
  | 'monochromatic';

// Color conversion functions
export function hexToRgb(hex: string): RGBColor {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return { r, g, b };
}

export function rgbToHex(rgb: RGBColor): string {
  return '#' + 
    rgb.r.toString(16).padStart(2, '0') + 
    rgb.g.toString(16).padStart(2, '0') + 
    rgb.b.toString(16).padStart(2, '0');
}

export function hexToHsl(hex: string): HSLColor {
  const rgb = hexToRgb(hex);
  return rgbToHsl(rgb);
}

export function hslToHex(hsl: HSLColor): string {
  const rgb = hslToRgb(hsl);
  return rgbToHex(rgb);
}

export function rgbToHsl(rgb: RGBColor): HSLColor {
  // Convert RGB to [0, 1] range
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  // Calculate hue
  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
  }
  
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  
  // Calculate lightness
  const l = (max + min) / 2;
  
  // Calculate saturation
  let s = 0;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
  }
  
  // Convert to percentages
  return {
    h,
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export function hslToRgb(hsl: HSLColor): RGBColor {
  // Convert to [0, 1] range
  const h = hsl.h;
  const s = hsl.s / 100;
  const l = hsl.l / 100;
  
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
  } else {
    r = c; g = 0; b = x;
  }
  
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

/**
 * Generate a color harmony palette based on coolors.co rules
 * @param baseColor Base color in hex format
 * @param harmonyType Type of color harmony to generate
 * @param count Number of colors to include in the palette (default 5)
 * @returns Array of hex color codes
 */
export function generateColorHarmony(
  baseColor: string,
  harmonyType: ColorHarmonyType,
  count: number = 5
): string[] {
  // Ensure baseColor is in correct format
  baseColor = baseColor.toUpperCase();
  if (!baseColor.startsWith('#')) {
    baseColor = '#' + baseColor;
  }
  
  // Convert to HSL for easier manipulation
  const baseHsl = hexToHsl(baseColor);
  
  // Array to store the color palette
  const palette: string[] = [];
  
  // Add base color as first color
  palette.push(baseColor);
  
  // Generate colors based on harmony type according to coolors.co rules
  switch (harmonyType) {
    case 'analogous':
      // "Analogous color schemes are made by picking three colors that are next to each other on the color wheel."
      generateAnalogousPalette(baseHsl, palette, count);
      break;
      
    case 'complementary':
      // "Complementary color schemes are made by picking two opposite colors on the color wheel."
      generateComplementaryPalette(baseHsl, palette, count);
      break;
      
    case 'split-complementary':
      // "Split complementary schemes are like complementary but they uses two adjacent colors of the complement."
      generateSplitComplementaryPalette(baseHsl, palette, count);
      break;
      
    case 'triadic':
      // "Triadic color schemes are created by picking three colors equally spaced on the color wheel."
      generateTriadicPalette(baseHsl, palette, count);
      break;
      
    case 'tetradic':
      // "Tetradic color schemes are made form two couples of complementary colors in a rectangular shape on the color wheel."
      generateTetradicPalette(baseHsl, palette, count);
      break;
      
    case 'square':
      // "Square color schemes are like tetradic arranged in a square instead of rectangle."
      generateSquarePalette(baseHsl, palette, count);
      break;
      
    case 'monochromatic':
      // Monochromatic uses the same hue with different saturation and lightness values
      generateMonochromaticPalette(baseHsl, palette, count);
      break;
  }
  
  // Ensure we have exactly the requested number of colors
  while (palette.length < count) {
    // If we don't have enough colors, add variations based on the last color
    const lastHsl = hexToHsl(palette[palette.length - 1]);
    
    // Slightly modify the last color
    lastHsl.s = Math.max(20, Math.min(100, lastHsl.s + (Math.random() > 0.5 ? 10 : -10)));
    lastHsl.l = Math.max(20, Math.min(80, lastHsl.l + (Math.random() > 0.5 ? 10 : -10)));
    
    palette.push(hslToHex(lastHsl));
  }
  
  // If we have too many colors, trim the palette
  return palette.slice(0, count);
}

/**
 * Generate analogous color palette
 * Colors adjacent to each other on the color wheel
 */
function generateAnalogousPalette(baseHsl: HSLColor, palette: string[], count: number): void {
  // Typically 30° apart, but we can adjust for a more pleasing result
  const angleStep = 30;
  
  // Add colors on either side of the base color
  for (let i = 1; i <= Math.floor(count / 2); i++) {
    // Left color (counter-clockwise)
    const leftHue = (baseHsl.h - angleStep * i + 360) % 360;
    const leftHsl = { ...baseHsl, h: leftHue };
    palette.push(hslToHex(leftHsl));
    
    // Right color (clockwise)
    if (palette.length < count) {
      const rightHue = (baseHsl.h + angleStep * i) % 360;
      const rightHsl = { ...baseHsl, h: rightHue };
      palette.push(hslToHex(rightHsl));
    }
  }
}

/**
 * Generate complementary color palette
 * Colors opposite each other on the color wheel
 */
function generateComplementaryPalette(baseHsl: HSLColor, palette: string[], count: number): void {
  // Calculate the complementary color (opposite on the wheel)
  const complementHue = (baseHsl.h + 180) % 360;
  const complementHsl = { ...baseHsl, h: complementHue };
  
  // For 5 colors, generate a balanced palette between base and complement
  if (count >= 3) {
    // Add a lighter version of base color
    const lighterBase = { 
      ...baseHsl, 
      s: Math.min(100, baseHsl.s + 5),
      l: Math.min(85, baseHsl.l + 15) 
    };
    palette.push(hslToHex(lighterBase));
    
    // For 4+ colors, add a neutral tone in the middle
    if (count >= 4) {
      // Muted/desaturated middle color as seen on coolors.co
      const middleColor = {
        h: (baseHsl.h + complementHue) / 2,
        s: 15, // Very desaturated (almost gray)
        l: 75  // Light gray
      };
      palette.push(hslToHex(middleColor));
    }
    
    // Add a darker variant of complement
    if (count >= 5) {
      const lighterComplement = { 
        ...complementHsl, 
        s: Math.min(100, complementHsl.s + 5),
        l: Math.min(85, complementHsl.l + 15)
      };
      palette.push(hslToHex(lighterComplement));
    }
  }
  
  // Always add the true complement as last color
  palette.push(hslToHex(complementHsl));
}

/**
 * Generate split-complementary color palette
 * Base color plus two colors adjacent to its complement
 */
function generateSplitComplementaryPalette(baseHsl: HSLColor, palette: string[], count: number): void {
  // Calculate the complementary color
  const complementHue = (baseHsl.h + 180) % 360;
  
  // Calculate the two colors adjacent to the complement (typically 30° apart)
  const splitAngle = 30;
  const split1Hue = (complementHue - splitAngle + 360) % 360;
  const split2Hue = (complementHue + splitAngle) % 360;
  
  // Add the split complementary colors
  const split1Hsl = { ...baseHsl, h: split1Hue };
  const split2Hsl = { ...baseHsl, h: split2Hue };
  
  if (count >= 3) {
    // For a balanced 5-color palette
    if (count >= 5) {
      // Add a variant of the base color
      const variantBaseHsl = {
        ...baseHsl,
        s: Math.min(100, baseHsl.s + 5),
        l: Math.min(85, baseHsl.l + 10)
      };
      palette.push(hslToHex(variantBaseHsl));
    }
    
    // Add first split complementary
    palette.push(hslToHex(split1Hsl));
    
    // Add second split complementary
    palette.push(hslToHex(split2Hsl));
  }
}

/**
 * Generate triadic color palette
 * Three colors equally spaced on the color wheel
 */
function generateTriadicPalette(baseHsl: HSLColor, palette: string[], count: number): void {
  // Calculate the two colors that form a triadic with the base (120° apart)
  const triad1Hue = (baseHsl.h + 120) % 360;
  const triad2Hue = (baseHsl.h + 240) % 360;
  
  const triad1Hsl = { ...baseHsl, h: triad1Hue };
  const triad2Hsl = { ...baseHsl, h: triad2Hue };
  
  // Add the triadic colors
  palette.push(hslToHex(triad1Hsl));
  palette.push(hslToHex(triad2Hsl));
  
  // For a 5-color palette, add variants
  if (count > 3) {
    // Add a variant of the first triadic color
    const triad1Variant = {
      ...triad1Hsl,
      s: Math.min(100, triad1Hsl.s - 10),
      l: Math.min(90, triad1Hsl.l + 15)
    };
    palette.push(hslToHex(triad1Variant));
    
    // Add a variant of the second triadic color
    if (count > 4) {
      const triad2Variant = {
        ...triad2Hsl,
        s: Math.min(100, triad2Hsl.s - 10),
        l: Math.min(90, triad2Hsl.l + 15)
      };
      palette.push(hslToHex(triad2Variant));
    }
  }
}

/**
 * Generate tetradic color palette
 * Four colors arranged in a rectangle on the color wheel
 */
function generateTetradicPalette(baseHsl: HSLColor, palette: string[], count: number): void {
  // Calculate the three colors that form a tetradic with the base
  // In a tetradic, colors are arranged in a rectangle on the color wheel
  const tetra1Hue = (baseHsl.h + 90) % 360;
  const tetra2Hue = (baseHsl.h + 180) % 360;
  const tetra3Hue = (baseHsl.h + 270) % 360;
  
  const tetra1Hsl = { ...baseHsl, h: tetra1Hue };
  const tetra2Hsl = { ...baseHsl, h: tetra2Hue };
  const tetra3Hsl = { ...baseHsl, h: tetra3Hue };
  
  // Add the tetradic colors
  palette.push(hslToHex(tetra1Hsl));
  palette.push(hslToHex(tetra2Hsl));
  palette.push(hslToHex(tetra3Hsl));
  
  // For a 5-color palette, add a variant
  if (count > 4) {
    const variant = {
      ...tetra1Hsl,
      s: Math.min(100, tetra1Hsl.s - 15),
      l: Math.min(90, tetra1Hsl.l + 20)
    };
    palette.push(hslToHex(variant));
  }
}

/**
 * Generate square color palette
 * Four colors equally spaced on the color wheel
 */
function generateSquarePalette(baseHsl: HSLColor, palette: string[], count: number): void {
  // Calculate the three colors that form a square with the base (90° apart)
  const square1Hue = (baseHsl.h + 90) % 360;
  const square2Hue = (baseHsl.h + 180) % 360;
  const square3Hue = (baseHsl.h + 270) % 360;
  
  const square1Hsl = { ...baseHsl, h: square1Hue };
  const square2Hsl = { ...baseHsl, h: square2Hue };
  const square3Hsl = { ...baseHsl, h: square3Hue };
  
  // Add the square colors
  palette.push(hslToHex(square1Hsl));
  palette.push(hslToHex(square2Hsl));
  palette.push(hslToHex(square3Hsl));
  
  // For a 5-color palette, add a variant
  if (count > 4) {
    const variant = {
      ...square1Hsl,
      s: Math.min(100, square1Hsl.s - 15),
      l: Math.min(90, square1Hsl.l + 20)
    };
    palette.push(hslToHex(variant));
  }
}

/**
 * Generate monochromatic color palette
 * Different tints and shades of the same hue
 */
function generateMonochromaticPalette(baseHsl: HSLColor, palette: string[], count: number): void {
  // For monochromatic, we keep the hue constant and vary saturation and lightness
  const lightnessValues = [
    Math.max(10, baseHsl.l - 30),  // Darkest shade
    Math.max(20, baseHsl.l - 15),  // Darker shade
    Math.min(80, baseHsl.l + 15),  // Lighter tint
    Math.min(90, baseHsl.l + 30)   // Lightest tint
  ];
  
  // Add the monochromatic variations
  for (let i = 0; i < Math.min(count - 1, lightnessValues.length); i++) {
    const monoHsl = {
      h: baseHsl.h,
      s: baseHsl.s,
      l: lightnessValues[i]
    };
    palette.push(hslToHex(monoHsl));
  }
}

// Color utility functions

// Checks if color is light or dark
export function isLightColor(hexColor: string): boolean {
  const tc = tinycolorLib(hexColor);
  // Use tinycolor's own calculation
  return tc.getLuminance() > 0.5;
}

// Gets contrasting text color (black or white) based on background color
export function getContrastText(hexColor: string): string {
  return isLightColor(hexColor) ? '#000000' : '#FFFFFF';
}

// Calculates contrast ratio between two colors
export function getContrastRatio(color1: string, color2: string): number {
  return tinycolorLib.readability(color1, color2);
}

// Determine if a color meets WCAG AA standards for text
export function meetsWCAGAA(backgroundColor: string, textColor: string): boolean {
  const ratio = getContrastRatio(backgroundColor, textColor);
  return ratio >= 4.5;
}

// Determine if a color meets WCAG AAA standards for text
export function meetsWCAGAAA(backgroundColor: string, textColor: string): boolean {
  const ratio = getContrastRatio(backgroundColor, textColor);
  return ratio >= 7;
}

// Returns a lighter version of a color
export function lighten(hexColor: string, amount: number = 10): string {
  const tc = tinycolorLib(hexColor);
  return tc.lighten(amount).toString();
}

// Returns a darker version of a color
export function darken(hexColor: string, amount: number = 10): string {
  const tc = tinycolorLib(hexColor);
  return tc.darken(amount).toString();
}

// Returns a desaturated version of a color
export function desaturate(hexColor: string, amount: number = 10): string {
  const tc = tinycolorLib(hexColor);
  return tc.desaturate(amount).toString();
}

// Returns a saturated version of a color
export function saturate(hexColor: string, amount: number = 10): string {
  const tc = tinycolorLib(hexColor);
  return tc.saturate(amount).toString();
}

// RgbToHex overload for separate R, G, B values
export function rgbComponentsToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Creates CSS RGB string
export function rgbString(r: number, g: number, b: number): string {
  return `rgb(${r}, ${g}, ${b})`;
}

// Creates CSS RGBA string
export function rgbaString(r: number, g: number, b: number, a: number): string {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
