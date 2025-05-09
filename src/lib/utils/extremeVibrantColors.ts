import tinycolor from 'tinycolor2';
import chroma from 'chroma-js';

/**
 * ULTRA VIBRANT COLOR GENERATOR
 * 
 * This is a completely revamped approach using modern color theory,
 * perceptual color spaces, and advanced algorithms to create
 * truly vibrant, harmonious, and beautiful palettes.
 */

// Define types for consistency
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

// Harmony angle configurations
const HARMONY_ANGLES = {
  monochromatic: [0],
  analogous: [-30, 0, 30, 60],
  complementary: [0, 180],
  triadic: [0, 120, 240],
  tetradic: [0, 90, 180, 270],
  splitComplementary: [0, 150, 210],
  square: [0, 90, 180, 270],
  doubleComplementary: [0, 30, 180, 210],
  natural: [60, 120, 180, 240, 300],
  vibrant: [0, 60, 120, 240, 300],
  pastel: [30, 90, 150, 210, 270, 330],
  jewel: [0, 72, 144, 216, 288]
};

// Colors with guaranteed vibrancy with their LCh values
const VIBRANT_LCH_COLORS = [
  { l: 55, c: 90, h: 0 },   // vibrant red
  { l: 65, c: 90, h: 30 },  // vibrant orange
  { l: 85, c: 90, h: 80 },  // vibrant yellow
  { l: 70, c: 80, h: 120 }, // vibrant green
  { l: 70, c: 65, h: 180 }, // vibrant cyan
  { l: 50, c: 75, h: 250 }, // vibrant blue
  { l: 60, c: 80, h: 300 }, // vibrant magenta
  { l: 50, c: 90, h: 330 }  // vibrant purple
];

// Base color palettes for different styles
const PALETTE_BASES = {
  // Bright primary colors
  vibrant: [
    "#FF1744", // vibrant red
    "#FF9100", // vibrant orange
    "#FFEA00", // vibrant yellow
    "#00E676", // vibrant green
    "#00B0FF", // vibrant blue
    "#D500F9"  // vibrant purple
  ],
  
  // Pastel palette with high lightness and medium chroma
  pastel: [
    "#FFAABB", // pastel pink
    "#FFD699", // pastel orange
    "#FFFFAA", // pastel yellow
    "#AAFFAA", // pastel green
    "#AAEEFF", // pastel blue
    "#DDAAFF"  // pastel purple
  ],
  
  // Jewel tones - saturated mid-tones
  jewel: [
    "#D81B60", // ruby
    "#F57C00", // amber
    "#FFC107", // gold
    "#00796B", // emerald
    "#1976D2", // sapphire
    "#7B1FA2"  // amethyst
  ]
};

/**
 * Convert RGB to LCh (perceptual color space)
 * LCh is more perceptually uniform than HSL
 */
function rgbToLch(r: number, g: number, b: number) {
  return chroma(r, g, b).lch();
}

/**
 * Convert LCh to RGB
 */
function lchToRgb(l: number, c: number, h: number) {
  try {
    return chroma.lch(l, c, h).rgb();
  } catch (e) {
    // If out of gamut, reduce chroma until we get a valid RGB color
    let newC = c;
    while (newC > 0) {
      try {
        newC -= 5;
        const color = chroma.lch(l, newC, h);
        return color.rgb();
      } catch (e) {
        // Keep reducing chroma
        if (newC <= 0) {
          // Fallback to safe color
          return [128, 128, 128];
        }
      }
    }
    return [128, 128, 128]; // Safe fallback
  }
}

/**
 * Convert LCh to hex color
 */
function lchToHex(l: number, c: number, h: number): string {
  const rgb = lchToRgb(l, c, h);
  return chroma(rgb[0], rgb[1], rgb[2]).hex();
}

/**
 * Generate a random vibrant color in LCh space
 */
function randomVibrantLch() {
  // Start with very high chroma (saturation)
  const l = Math.random() * 35 + 50; // Lightness between 50-85
  const c = Math.random() * 20 + 70; // Chroma between 70-90
  const h = Math.random() * 360;     // Any hue on the color wheel
  
  return { l, c, h };
}

/**
 * Clamp LCh to valid RGB range (handle out-of-gamut colors)
 */
function clampToRgbGamut({ l, c, h }: { l: number, c: number, h: number }) {
  // Try to find the maximum chroma that fits in RGB gamut
  let maxC = c;
  while (maxC > 0) {
    try {
      const color = chroma.lch(l, maxC, h);
      const rgb = color.rgb();
      // Check if the color is valid
      if (!isNaN(rgb[0]) && !isNaN(rgb[1]) && !isNaN(rgb[2])) {
        return { l, c: maxC, h };
      }
    } catch (e) {
      // Not in gamut, reduce chroma
    }
    maxC -= 5;
  }
  
  // If we get here, we need to adjust lightness too
  const newL = l > 50 ? l - 10 : l + 10;
  return { l: newL, c: maxC > 0 ? maxC : 30, h };
}

/**
 * Generate a harmonious color palette based on a given base color or random seed
 */
function generateHarmoniousPalette(
  baseColor: string | undefined,
  type: string,
  count: number,
  options: {
    temperature?: 'warm' | 'cool' | 'mixed';
    highContrast?: boolean;
    usePastels?: boolean;
  } = {}
): string[] {
  // Extract options
  const temperature = options.temperature || 'mixed';
  const highContrast = options.highContrast || false;
  const usePastels = options.usePastels || false;
  
  // Get the harmony angles for the selected type
  const harmonyType = type as keyof typeof HARMONY_ANGLES;
  const angles = HARMONY_ANGLES[harmonyType] || HARMONY_ANGLES.vibrant;
  
  // Start with a seed color (random or from input)
  let seedLch: { l: number; c: number; h: number };
  
  if (baseColor) {
    // Convert the base color to LCh
    const rgb = chroma(baseColor).rgb();
    const [l, c, h] = chroma(rgb[0], rgb[1], rgb[2]).lch();
    seedLch = { l, c, h };
  } else {
    // Create a random vibrant seed color
    seedLch = randomVibrantLch();
    
    // Adjust for temperature preference
    if (temperature === 'warm') {
      // Warm colors: red, orange, yellow (0-90 degrees)
      seedLch.h = Math.random() * 90;
    } else if (temperature === 'cool') {
      // Cool colors: green, blue, purple (180-300 degrees)
      seedLch.h = Math.random() * 120 + 180;
    }
  }
  
  // Adjust the seed color based on style options
  if (usePastels) {
    // Pastels have high lightness and moderate chroma
    seedLch.l = Math.min(seedLch.l + 20, 90);
    seedLch.c = Math.min(seedLch.c * 0.7, 60);
  } else if (highContrast) {
    // High contrast colors have high chroma
    seedLch.c = Math.min(seedLch.c + 20, 100);
    // Adjust lightness for better display
    seedLch.l = Math.max(Math.min(seedLch.l, 75), 45);
  }
  
  // Generate colors
  const colors: string[] = [];
  const baseHue = seedLch.h;
  
  // Handle special case for monochromatic
  if (type === 'monochromatic') {
    // For monochromatic, vary lightness and slightly vary chroma
    const lightnessRange = usePastels ? [60, 95] : highContrast ? [35, 85] : [40, 90];
    const chromaBase = usePastels ? 40 : highContrast ? 85 : 65;
    
    for (let i = 0; i < count; i++) {
      // Calculate lightness - distribute evenly across the range
      const l = lightnessRange[0] + (lightnessRange[1] - lightnessRange[0]) * (i / (count - 1));
      
      // Slightly vary chroma to make it more interesting
      const cVariation = (Math.random() * 0.2 + 0.9) * chromaBase;
      
      // Slightly vary hue by a small amount (±5°)
      const hVariation = baseHue + (Math.random() * 10 - 5);
      
      // Create a color with these properties and add to array
      const lch = clampToRgbGamut({ l, c: cVariation, h: hVariation });
      colors.push(lchToHex(lch.l, lch.c, lch.h));
    }
    
    return colors;
  }
  
  // For other harmony types, create colors based on the harmony angles
  // First, determine how many copies of the angle set we need
  const repetitions = Math.ceil(count / angles.length);
  const allAngles: number[] = [];
  
  for (let i = 0; i < repetitions; i++) {
    allAngles.push(...angles);
  }
  
  // Now create colors based on these angles
  for (let i = 0; i < count; i++) {
    // Get the angle offset for this color
    const angleOffset = allAngles[i % allAngles.length];
    
    // Calculate new hue by adding the offset
    const hue = (baseHue + angleOffset) % 360;
    
    // For variety, slightly adjust lightness and chroma
    let lightness = seedLch.l;
    let chroma = seedLch.c;
    
    // If not the base color, add some variation
    if (angleOffset !== 0) {
      // Vary lightness slightly
      const lightnessVariation = Math.random() * 10 - 5;
      lightness = Math.min(Math.max(lightness + lightnessVariation, 40), 90);
      
      // Vary chroma slightly
      const chromaVariation = Math.random() * 10 - 5;
      chroma = Math.min(Math.max(chroma + chromaVariation, 40), 95);
    }
    
    // Adjust based on style
    if (usePastels) {
      lightness = Math.min(lightness + 15, 90);
      chroma = Math.min(chroma * 0.7, 60);
    } else if (highContrast) {
      chroma = Math.min(chroma + 10, 100);
      // Make sure it's not too dark or light for high contrast
      lightness = Math.max(Math.min(lightness, 80), 45);
    }
    
    // Clamp to valid RGB
    const lch = clampToRgbGamut({ l: lightness, c: chroma, h: hue });
    colors.push(lchToHex(lch.l, lch.c, lch.h));
  }
  
  return colors;
}

/**
 * Generate specific colors for each palette type to ensure quality
 * Used for style presets
 */
function generatePresetPalette(type: string, count: number, options: any = {}): string[] {
  // If a specific preset is requested, use that
  if (type in PALETTE_BASES) {
    const baseColors = PALETTE_BASES[type as keyof typeof PALETTE_BASES];
    
    // If we have enough colors in the preset, use them
    if (baseColors.length >= count) {
      return baseColors.slice(0, count);
    }
    
    // If we need more colors, use the base colors and add variations
    const result = [...baseColors];
    const baseCount = baseColors.length;
    
    for (let i = baseCount; i < count; i++) {
      // Use color from the palette with slight variation
      const baseColor = baseColors[i % baseCount];
      const color = chroma(baseColor);
      const [h, s, l] = color.hsl();
      
      // Slight variation
      const hueShift = Math.random() * 20 - 10;
      const newHue = (h + hueShift + 360) % 360;
      const newSat = Math.min(Math.max(s * (1 + (Math.random() * 0.2 - 0.1)), 0.4), 1);
      const newLight = Math.min(Math.max(l * (1 + (Math.random() * 0.2 - 0.1)), 0.3), 0.85);
      
      const newColor = chroma.hsl(newHue, newSat, newLight).hex();
      result.push(newColor);
    }
    
    return result;
  }
  
  // If no specific preset matches, fall back to general harmony-based generation
  return generateHarmoniousPalette(undefined, type, count, options);
}

/**
 * Generate a rich object representation of the color with name
 */
function hexToColorObject(hex: string, name?: string): Color {
  const color = chroma(hex);
  const [r, g, b] = color.rgb();
  const [h, s, l] = color.hsl();
  
  // Generate name based on color properties if not provided
  if (!name) {
    const namedColor = getClosestNamedColor(hex);
    const brightness = l < 0.3 ? 'Dark' : l > 0.7 ? 'Light' : '';
    name = brightness ? `${brightness} ${namedColor}` : namedColor;
  }
  
  return {
    hex: hex.toUpperCase(),
    rgb: { r: Math.round(r), g: Math.round(g), b: Math.round(b) },
    hsl: { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) },
    name
  };
}

/**
 * Find the closest named color to a hex value
 */
function getClosestNamedColor(hex: string): string {
  const [h, s, l] = chroma(hex).hsl();
  const hue = h < 0 ? 0 : h; // Handle NaN or negative hue
  
  // Color names with corresponding hue ranges
  const colorNames: {[key: string]: [number, number]} = {
    'Red': [355, 10],
    'Orange': [11, 40],
    'Yellow': [41, 65],
    'Lime': [66, 100],
    'Green': [101, 140],
    'Teal': [141, 175],
    'Cyan': [176, 195],
    'Blue': [196, 240],
    'Purple': [241, 280],
    'Magenta': [281, 330],
    'Pink': [331, 354]
  };
  
  // Find matching color name based on hue
  for (const [name, [min, max]] of Object.entries(colorNames)) {
    if (min <= max) {
      // Normal range
      if (hue >= min && hue <= max) return name;
    } else {
      // Range wraps around the color wheel (e.g., red)
      if (hue >= min || hue <= max) return name;
    }
  }
  
  // Default fallback
  return 'Color';
}

/**
 * Generate an ultra vibrant color palette
 * @param baseColor The starting color in hex format (or random if not provided)
 * @param options Options for palette generation
 */
export function generateExtremeVibrantPalette(
  baseColor?: string,
  options: {
    paletteType?: 'monochromatic' | 'complementary' | 'analogous' | 'triadic' 
      | 'tetradic' | 'splitComplementary' | 'square' | 'doubleComplementary'
      | 'natural' | 'vibrant' | 'pastel' | 'jewel';
    numColors?: number;
    highContrast?: boolean;
    usePastels?: boolean;
    temperature?: 'warm' | 'cool' | 'mixed';
    forceVibrant?: boolean;
  } = {}
): Color[] {
  // Set defaults
  const paletteType = options.paletteType || 'vibrant';
  const numColors = options.numColors || 5;
  const highContrast = options.highContrast || false;
  const usePastels = options.usePastels || false;
  const temperature = options.temperature || 'mixed';
  
  // Default no longer forces pre-made palettes
  const forceVibrant = options.forceVibrant || false;
  
  let hexColors: string[];
  
  if (forceVibrant && paletteType in PALETTE_BASES) {
    // Use preset palettes for specific styles when requested
    hexColors = generatePresetPalette(paletteType, numColors, options);
  } else {
    // Generate a harmonious palette based on perceptual color space
    hexColors = generateHarmoniousPalette(
      baseColor, 
      paletteType, 
      numColors, 
      { highContrast, usePastels, temperature }
    );
  }
  
  // Map the hex colors to Color objects with names
  return hexColors.map((hex, index) => {
    let name: string;
    
    if (index === 0) {
      name = 'Base';
    } else if (paletteType === 'monochromatic') {
      name = index < Math.ceil(numColors / 2) 
        ? `Shade ${Math.ceil(numColors / 2) - index}` 
        : `Tint ${index - Math.floor(numColors / 2)}`;
    } else if (paletteType === 'complementary' && index === 1) {
      name = 'Complement';
    } else if (paletteType === 'analogous') {
      name = index <= Math.floor(numColors / 2) 
        ? `Left ${Math.floor(numColors / 2) - index + 1}` 
        : `Right ${index - Math.floor(numColors / 2)}`;
    } else {
      name = `Color ${index + 1}`;
    }
    
    return hexToColorObject(hex, name);
  });
} 