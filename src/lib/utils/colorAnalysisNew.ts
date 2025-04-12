import tinycolor from 'tinycolor2';
import { colorDatabase, colorCollections, findSimilarColors, findComplementaryColors } from './populateColorDatabase';
import type { ColorEntry } from './colorDatabase';

// Define type for TinyColor to fix type errors
type TinyColor = ReturnType<typeof tinycolor> & {
  toRgb(): { r: number; g: number; b: number };
  toHsl(): { h: number; s: number; l: number };
  toHsv(): { h: number; s: number; v: number };
  toHexString(): string;
  getLuminance(): number;
  lighten(amount: number): TinyColor;
  darken(amount: number): TinyColor;
};

// Define the constant for max recent palettes
const MAX_RECENT_PALETTES = 20;
// Enhance recentPalettes to store more palettes and improve diversity
const recentPalettes: string[][] = [];

// Export interface for color analysis results
export interface ColorAnalysis {
  score: number;
  advice: string;
  harmony: string;
}

// Define TypeScript interface for HSL color
export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

// Helper function to convert HSL to RGB
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h / 360 + 1/3);
    g = hue2rgb(p, q, h / 360);
    b = hue2rgb(p, q, h / 360 - 1/3);
  }

  return [r * 255, g * 255, b * 255];
}

// Helper function to ensure hue is in 0-360 range
function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360;
}

// Helper function to adjust hue to nearest "sweet spot"
function adjustToSweetSpot(hue: number): number {
  // Define refined sweet spots based on analysis of top-scoring palettes
  const sweetSpots = [
    [0, 8],       // Pure Red - very precise sweet spot
    [18, 25],     // Warm Red-Orange
    [40, 50],     // True Gold (avoids muddy tones)
    [60, 65],     // Perfect Yellow
    [82, 90],     // Chartreuse/Lime
    [120, 125],   // Pure Green
    [160, 165],   // Perfect Teal
    [200, 205],   // Sky Blue
    [225, 230],   // Royal Blue
    [260, 265],   // Indigo
    [275, 285],   // True Purple
    [290, 295],   // Violet
    [320, 325],   // Pink
    [340, 345]    // Magenta
  ];

  // Find the closest sweet spot
  let normalizedHue = normalizeHue(hue);
  let minDistance = 360;
  let adjustedHue = normalizedHue;

  sweetSpots.forEach(([start, end]) => {
    const mid = (start + end) / 2;
    const distance = Math.abs(normalizedHue - mid);
    if (distance < minDistance) {
      minDistance = distance;
      adjustedHue = mid;
    }
  });

  return adjustedHue;
}

// Helper function to create a color with guaranteed contrast and clean colors
function createHSL(hue: number, saturation: number, lightness: number): string {
  const adjustedHue = adjustToSweetSpot(hue);
  
  // Fine-tune saturation and lightness based on hue to avoid muddy colors
  let optimalSaturation = saturation;
  let optimalLightness = lightness;
  
  // Randomly generate a darker color (20% chance)
  const generateDarker = Math.random() < 0.2;
  
  // Hue-specific adjustments for optimal saturation and lightness
  // These adjustments are based on the "sweet spots" for each hue range
  if (adjustedHue >= 0 && adjustedHue <= 30) {
    // Reds and oranges look best with higher saturation, medium-high lightness
    optimalSaturation = Math.min(95, Math.max(70, saturation));
    optimalLightness = generateDarker 
      ? Math.min(40, Math.max(20, lightness)) 
      : Math.min(65, Math.max(40, lightness));
  } else if (adjustedHue > 30 && adjustedHue <= 60) {
    // Yellows and golds look best with medium-high saturation, higher lightness
    optimalSaturation = Math.min(90, Math.max(65, saturation));
    optimalLightness = generateDarker 
      ? Math.min(50, Math.max(30, lightness)) 
      : Math.min(75, Math.max(55, lightness));
  } else if (adjustedHue > 60 && adjustedHue <= 150) {
    // Greens look best with medium-high saturation, medium lightness
    optimalSaturation = Math.min(85, Math.max(60, saturation));
    optimalLightness = generateDarker 
      ? Math.min(35, Math.max(15, lightness)) 
      : Math.min(70, Math.max(35, lightness));
  } else if (adjustedHue > 150 && adjustedHue <= 240) {
    // Blues look best with medium-high saturation, medium lightness
    optimalSaturation = Math.min(90, Math.max(65, saturation));
    optimalLightness = generateDarker 
      ? Math.min(30, Math.max(15, lightness)) 
      : Math.min(65, Math.max(40, lightness));
  } else if (adjustedHue > 240 && adjustedHue <= 300) {
    // Purples look best with high saturation, medium lightness
    optimalSaturation = Math.min(95, Math.max(70, saturation));
    optimalLightness = generateDarker 
      ? Math.min(30, Math.max(15, lightness)) 
      : Math.min(60, Math.max(35, lightness));
  } else {
    // Pinks and magentas look best with high saturation, medium-high lightness
    optimalSaturation = Math.min(95, Math.max(65, saturation));
    optimalLightness = generateDarker 
      ? Math.min(40, Math.max(20, lightness)) 
      : Math.min(70, Math.max(45, lightness));
  }
  
  // Return HEX instead of HSL
  return hslToHex(adjustedHue, optimalSaturation, optimalLightness);
}

function generateTetradicPalette(baseHue: number): string[] {
  const goldenAngle = 137.5077663;
  const variance = Math.random() * 20 - 10; // Add some randomness to angles
  
  // Add a 40% chance for one dark color
  const darkColorIndex = Math.random() < 0.4 ? Math.floor(Math.random() * 5) : -1;
  
  return [
    createHSL(baseHue, 75 + Math.random() * 20, darkColorIndex === 0 ? 25 + Math.random() * 15 : 45 + Math.random() * 30),
    createHSL(baseHue + goldenAngle + variance, 65 + Math.random() * 30, darkColorIndex === 1 ? 20 + Math.random() * 15 : 35 + Math.random() * 40),
    createHSL(baseHue + goldenAngle * 2 + variance, 70 + Math.random() * 25, darkColorIndex === 2 ? 25 + Math.random() * 15 : 55 + Math.random() * 25),
    createHSL(baseHue + goldenAngle * 3 - variance, 75 + Math.random() * 20, darkColorIndex === 3 ? 20 + Math.random() * 15 : 40 + Math.random() * 35),
    createHSL(baseHue + goldenAngle * 4 + variance, 60 + Math.random() * 35, darkColorIndex === 4 ? 25 + Math.random() * 15 : 50 + Math.random() * 30)
  ];
}

function generateTriadicPalette(baseHue: number): string[] {
  const phi = 1.618033988749895;
  const angle = 360 / phi;
  const variance = Math.random() * 15 - 7.5; // Add some randomness
  return [
    createHSL(baseHue, 70 + Math.random() * 25, 40 + Math.random() * 35),
    createHSL(baseHue + angle + variance, 75 + Math.random() * 20, 50 + Math.random() * 30),
    createHSL(baseHue + angle * 2 - variance, 65 + Math.random() * 30, 45 + Math.random() * 35),
    createHSL(baseHue + angle * 3 + variance, 70 + Math.random() * 25, 35 + Math.random() * 40),
    createHSL(baseHue + angle * 4 - variance, 80 + Math.random() * 15, 55 + Math.random() * 25)
  ];
}

function generateSplitComplementaryPalette(baseHue: number): string[] {
  const variance = Math.random() * 15 - 7.5;
  return [
    createHSL(baseHue, 70 + Math.random() * 25, 45 + Math.random() * 30),
    createHSL(baseHue + 150 + variance, 65 + Math.random() * 30, 35 + Math.random() * 40),
    createHSL(baseHue + 180 - variance, 75 + Math.random() * 20, 50 + Math.random() * 30),
    createHSL(baseHue + 210 + variance, 70 + Math.random() * 25, 40 + Math.random() * 35),
    createHSL(normalizeHue(baseHue + 60 - variance), 80 + Math.random() * 15, 55 + Math.random() * 25)
  ];
}

function generateAnalogousPalette(baseHue: number): string[] {
  const fibonacci = [1, 1, 2, 3, 5];
  const step = 15 + Math.random() * 10; // Variable step size
  const variance = Math.random() * 10 - 5;
  
  return fibonacci.map((fib, index) => {
    const hueStep = (step + variance) * fib;
    const saturation = 65 + Math.random() * 30;
    const lightness = 35 + Math.random() * 40;
    return createHSL(baseHue + hueStep, saturation, lightness);
  });
}

function generateMonochromaticPalette(baseHue: number): string[] {
  // Create 5 distinct colors by varying both saturation and lightness
  // Include both lighter and darker shades
  return [
    createHSL(baseHue, 90, 20),      // Very dark, highly saturated
    createHSL(baseHue, 85, 40),      // Deep, very saturated
    createHSL(baseHue, 75, 50),      // Mid-deep, saturated
    createHSL(baseHue, 80, 60),      // Medium
    createHSL(baseHue, 70, 80)       // Very light
  ];
}

// Enhanced color dictionary with named colors from the color register
const colorDictionary = {
  reds: [
    { name: 'Cornell Red', hue: 0, sat: 85, light: 45 },
    { name: 'Imperial Red', hue: 355, sat: 80, light: 55 },
    { name: 'Burnt Sienna', hue: 14, sat: 65, light: 58 },
    { name: 'Angels Red', hue: 0, sat: 90, light: 50 },
    { name: 'Antique Ruby', hue: 350, sat: 75, light: 40 },
    { name: 'Apricot Red', hue: 10, sat: 80, light: 60 },
    { name: 'Arsenal Red', hue: 0, sat: 95, light: 45 },
    { name: 'Vivid Red', hue: 0, sat: 100, light: 50 }
  ],
  oranges: [
    { name: 'Aesthetic Orange', hue: 30, sat: 85, light: 60 },
    { name: 'Alloy Orange', hue: 25, sat: 90, light: 55 },
    { name: 'Amazon Orange', hue: 28, sat: 95, light: 58 },
    { name: 'Amber Orange', hue: 35, sat: 85, light: 65 },
    { name: 'American Orange', hue: 32, sat: 100, light: 50 },
    { name: 'Apricot Orange', hue: 28, sat: 75, light: 70 }
  ],
  yellows: [
    { name: 'Aesthetic Yellow', hue: 55, sat: 90, light: 70 },
    { name: 'American Yellow', hue: 50, sat: 95, light: 65 },
    { name: 'Bee Yellow', hue: 52, sat: 100, light: 60 },
    { name: 'Vintage Yellow', hue: 48, sat: 80, light: 75 },
    { name: 'Warm Yellow', hue: 45, sat: 85, light: 70 },
    { name: 'Yukon Gold', hue: 42, sat: 90, light: 65 }
  ],
  greens: [
    { name: 'Aesthetic Green', hue: 120, sat: 75, light: 45 },
    { name: 'Algae Green', hue: 135, sat: 65, light: 50 },
    { name: 'American Green', hue: 125, sat: 85, light: 40 },
    { name: 'Antique Green', hue: 130, sat: 60, light: 45 },
    { name: 'Army Green', hue: 115, sat: 55, light: 35 },
    { name: 'Vintage Green', hue: 140, sat: 45, light: 55 }
  ],
  blues: [
    { name: 'Aesthetic Blue', hue: 210, sat: 80, light: 55 },
    { name: 'Air Force Blue', hue: 205, sat: 85, light: 50 },
    { name: 'American Blue', hue: 215, sat: 90, light: 45 },
    { name: 'Antique Blue', hue: 200, sat: 70, light: 60 },
    { name: 'Vista Blue', hue: 195, sat: 75, light: 65 },
    { name: 'YInMn Blue', hue: 220, sat: 95, light: 40 }
  ],
  purples: [
    { name: 'Aesthetic Purple', hue: 270, sat: 75, light: 50 },
    { name: 'American Purple', hue: 280, sat: 80, light: 45 },
    { name: 'Antique Viola', hue: 275, sat: 65, light: 55 },
    { name: 'Viola Purple', hue: 265, sat: 85, light: 40 },
    { name: 'Vintage Purple', hue: 285, sat: 70, light: 45 },
    { name: 'Vivid Purple', hue: 277, sat: 90, light: 50 }
  ],
  pinks: [
    { name: 'Aesthetic Pink', hue: 330, sat: 80, light: 70 },
    { name: 'American Pink', hue: 335, sat: 85, light: 75 },
    { name: 'Antique Pink', hue: 340, sat: 60, light: 80 },
    { name: 'Barbie Pink', hue: 328, sat: 100, light: 65 },
    { name: 'Vintage Pink', hue: 345, sat: 70, light: 85 },
    { name: 'Vivid Pink', hue: 332, sat: 95, light: 70 }
  ],
  browns: [
    { name: 'Aesthetic Brown', hue: 25, sat: 45, light: 35 },
    { name: 'American Brown', hue: 30, sat: 50, light: 30 },
    { name: 'Antique Oak', hue: 35, sat: 40, light: 40 },
    { name: 'Bark', hue: 20, sat: 35, light: 25 },
    { name: 'Warm Brown', hue: 28, sat: 55, light: 35 },
    { name: 'Wood Bark', hue: 22, sat: 45, light: 30 }
  ],
  grays: [
    { name: 'Aesthetic White', hue: 0, sat: 5, light: 95 },
    { name: 'Anti Flash White', hue: 0, sat: 0, light: 98 },
    { name: 'Archive Grey', hue: 200, sat: 10, light: 70 },
    { name: 'Vintage Gray', hue: 210, sat: 15, light: 60 },
    { name: 'Warm Grey', hue: 30, sat: 8, light: 75 },
    { name: 'Zeus', hue: 220, sat: 12, light: 40 }
  ]
};

// Helper function to get a random color from a category
function getRandomColorFromCategory(category: keyof typeof colorDictionary): { hue: number; sat: number; light: number; name: string } {
  const colors = colorDictionary[category];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Helper function to create a color with slight variation
function createVariation(color: { hue: number; sat: number; light: number }, hueVar = 5, satVar = 10, lightVar = 10): string {
  const hue = normalizeHue(color.hue + (Math.random() * 2 - 1) * hueVar);
  const sat = Math.max(0, Math.min(100, color.sat + (Math.random() * 2 - 1) * satVar));
  const light = Math.max(0, Math.min(100, color.light + (Math.random() * 2 - 1) * lightVar));
  
  // Return HEX instead of HSL
  return hslToHex(hue, sat, light);
}

// Updated createBalancedPalette function
function createBalancedPalette(): string[] {
  const schemeTypes = ['warm', 'cool', 'neutral', 'vibrant', 'pastel', 'earth'] as const;
  const schemeType = schemeTypes[Math.floor(Math.random() * schemeTypes.length)];
  
  let selectedColors: Array<{ name: string; hue: number; sat: number; light: number }> = [];
  
  switch(schemeType) {
    case 'warm':
      selectedColors = [
        getRandomColorFromCategory('reds'),
        getRandomColorFromCategory('oranges'),
        getRandomColorFromCategory('browns'),
        getRandomColorFromCategory('yellows'),
        getRandomColorFromCategory('pinks')
      ];
      break;
    
    case 'cool':
      selectedColors = [
        getRandomColorFromCategory('blues'),
        getRandomColorFromCategory('purples'),
        getRandomColorFromCategory('grays'),
        getRandomColorFromCategory('greens'),
        getRandomColorFromCategory('blues')
      ];
      break;
    
    case 'neutral':
      selectedColors = [
        getRandomColorFromCategory('grays'),
        getRandomColorFromCategory('browns'),
        getRandomColorFromCategory('grays'),
        getRandomColorFromCategory(Math.random() > 0.5 ? 'pinks' : 'blues'),
        getRandomColorFromCategory('browns')
      ];
      break;
    
    case 'vibrant':
      selectedColors = [
        getRandomColorFromCategory('reds'),
        getRandomColorFromCategory('yellows'),
        getRandomColorFromCategory('blues'),
        getRandomColorFromCategory('purples'),
        getRandomColorFromCategory('greens')
      ];
      break;
    
    case 'pastel':
      // Adjust lightness for pastel effect
      selectedColors = [
        {...getRandomColorFromCategory('pinks'), light: Math.min(85, getRandomColorFromCategory('pinks').light + 15)},
        {...getRandomColorFromCategory('blues'), light: Math.min(85, getRandomColorFromCategory('blues').light + 15)},
        {...getRandomColorFromCategory('grays'), light: Math.min(90, getRandomColorFromCategory('grays').light + 10)},
        {...getRandomColorFromCategory('greens'), light: Math.min(85, getRandomColorFromCategory('greens').light + 15)},
        {...getRandomColorFromCategory('yellows'), light: Math.min(85, getRandomColorFromCategory('yellows').light + 15)}
      ];
      break;
    
    case 'earth':
      selectedColors = [
        getRandomColorFromCategory('browns'),
        getRandomColorFromCategory('grays'),
        getRandomColorFromCategory('browns'),
        getRandomColorFromCategory('greens'),
        getRandomColorFromCategory('browns')
      ];
      break;
  }

  // Convert to HSL strings and add slight variations
  return selectedColors.map(color => 
    createVariation(color, 5, 10, 10)
  ).sort(() => Math.random() - 0.5);
}

// Export hslToHex function for use in other areas of the code
export function hslToHex(h: number, s: number, l: number): string {
  // Convert HSL to RGB
  const hsl = {
    h: h,
    s: s * 100,
    l: l * 100
  };
  
  // Standard conversion
  let r, g, b;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, h / 360 + 1/3);
    g = hueToRgb(p, q, h / 360);
    b = hueToRgb(p, q, h / 360 - 1/3);
  }
  
  // Convert to hex
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// Helper function for hslToHex
function hueToRgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1/6) return p + (q - p) * 6 * t;
  if (t < 1/2) return q;
  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
}

// Improve the firebrick detection function to be more aggressive
function isFirebrickLike(hex: string): boolean {
  // Convert hex to RGB
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  
  // More aggressive firebrick detection
  // Check all red-brown ranges that appear as "firebrick" or similar
  return (
    // Firebrick: rgb(178, 34, 34) or #B22222 and similar
    ((r > 120 && r < 200) && (g > 10 && g < 80) && (b > 10 && b < 80)) ||
    // Maroon and dark red variants
    ((r > 120 && r < 180) && (g < 60) && (b < 60)) ||
    // Brick reds
    ((r > 140 && r < 190) && (g > 20 && g < 70) && (b > 20 && b < 70)) ||
    // Check the hex code directly for known firebrick variants
    hex.toUpperCase().includes("8E0B0B") ||
    hex.toUpperCase().includes("A50D0D") || 
    hex.toUpperCase().includes("B22222") || 
    hex.toUpperCase().includes("A52A2A") // Brown
  );
}

// Add a new function to ensure palette coherence
function ensurePaletteCoherence(palette: string[]): string[] {
  if (palette.length <= 2) return palette;
  
  const improvedPalette = [...palette];
  const tc = improvedPalette.map(color => tinycolor(color));
  
  // Check if the palette has good hue distribution
  const hues = tc.map(color => color.toHsl().h);
  const saturations = tc.map(color => color.toHsl().s);
  const lightnesses = tc.map(color => color.toHsl().l);
  
  // Fix any problematic colors
  for (let i = 0; i < improvedPalette.length; i++) {
    // Skip the main accent colors (first 1-2 colors)
    if (i <= 1) continue;
    
    // Check if this color is too similar to any previous color
    for (let j = 0; j < i; j++) {
      const hueDiff = Math.min(Math.abs(hues[i] - hues[j]), 360 - Math.abs(hues[i] - hues[j]));
      const satDiff = Math.abs(saturations[i] - saturations[j]);
      const lightDiff = Math.abs(lightnesses[i] - lightnesses[j]);
      
      // If the colors are too similar (in all 3 dimensions), adjust this color
      if (hueDiff < 15 && satDiff < 0.15 && lightDiff < 0.15) {
        // Shift the hue more dramatically
        const newHue = (hues[i] + 40 + Math.floor(Math.random() * 40)) % 360;
        // Adjust saturation and lightness to be more different
        const newSat = Math.max(0.2, Math.min(0.9, saturations[i] + (Math.random() * 0.4 - 0.2)));
        const newLight = Math.max(0.25, Math.min(0.85, lightnesses[i] + (Math.random() * 0.4 - 0.2)));
        
        // Replace with a more distinct color
        improvedPalette[i] = hslToHexClean(newHue, newSat, newLight);
        
        // Update our tracking arrays
        const newColor = tinycolor(improvedPalette[i]);
        hues[i] = newColor.toHsl().h;
        saturations[i] = newColor.toHsl().s;
        lightnesses[i] = newColor.toHsl().l;
      }
    }
    
    // Also check if it's a firebrick-like color
    if (isFirebrickLike(improvedPalette[i])) {
      // Replace with a new color that's not a firebrick
      // Pick from different color families to ensure variety
      const colorFamilies = [
        { h: 220, s: 0.7, l: 0.6 }, // Blue
        { h: 160, s: 0.65, l: 0.55 }, // Teal
        { h: 280, s: 0.6, l: 0.65 }, // Purple
        { h: 70, s: 0.55, l: 0.7 },  // Lime
        { h: 190, s: 0.7, l: 0.6 },  // Sky blue
        { h: 45, s: 0.75, l: 0.65 }  // Gold
      ];
      
      // Pick a color family different from others already in palette
      let bestFamily = colorFamilies[0];
      let maxDifference = 0;
      
      for (const family of colorFamilies) {
        let minHueDiff = 360;
        for (let j = 0; j < i; j++) {
          const hueDiff = Math.min(Math.abs(family.h - hues[j]), 360 - Math.abs(family.h - hues[j]));
          minHueDiff = Math.min(minHueDiff, hueDiff);
        }
        
        if (minHueDiff > maxDifference) {
          maxDifference = minHueDiff;
          bestFamily = family;
        }
      }
      
      // Add some randomness to the selected color family
      const newHue = (bestFamily.h + Math.floor(Math.random() * 20) - 10 + 360) % 360;
      const newSat = Math.max(0.3, Math.min(0.9, bestFamily.s + (Math.random() * 0.2 - 0.1)));
      const newLight = Math.max(0.3, Math.min(0.8, bestFamily.l + (Math.random() * 0.2 - 0.1)));
      
      improvedPalette[i] = hslToHexClean(newHue, newSat, newLight);
      
      // Update tracking arrays
      const newColor = tinycolor(improvedPalette[i]);
      hues[i] = newColor.toHsl().h;
      saturations[i] = newColor.toHsl().s;
      lightnesses[i] = newColor.toHsl().l;
    }
  }
  
  return improvedPalette;
}

// Helper function to sort palette from darkest to lightest
function sortPaletteByLightness(palette: string[]): string[] {
  return [...palette].sort((a, b) => {
    // Convert to HSL and use the lightness value instead of getLuminance
    const hslA = tinycolor(a).toHsl();
    const hslB = tinycolor(b).toHsl();
    return hslA.l - hslB.l;
  });
}

// Function to generate pure, vibrant orange colors
function generateVibrantOrange(): string {
  // Create a pure, bright orange in RGB space for maximum vibrancy
  // This works better than HSL for oranges specifically
  const r = 255; // Full red component
  const g = 125 + Math.floor(Math.random() * 45); // 125-170 for orange (not too yellow)
  const b = 0 + Math.floor(Math.random() * 51); // 0-50 for depth without muddiness
  
  // Convert to hex with maximum vibrancy
  const toHex = (c: number): string => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Add a new function that uses the golden ratio for even spacing on the color wheel
function goldenRatioPalette(baseHue: number, count: number = 5): string[] {
  const palette: string[] = [];
  const goldenRatioConjugate = 0.618033988749895; // 1/φ
  
  let h = baseHue / 360; // Normalize to 0-1
  const s = 0.65 + Math.random() * 0.25; // 65-90%
  const l = 0.55 + Math.random() * 0.25; // 55-80%
  
  for (let i = 0; i < count; i++) {
    // Use golden ratio to space colors evenly
    h = (h + goldenRatioConjugate) % 1;
    
    // Adjust saturation and lightness slightly for variety
    const adjustedS = Math.max(0.5, Math.min(0.95, s + (Math.random() * 0.2 - 0.1)));
    const adjustedL = Math.max(0.45, Math.min(0.9, l + (Math.random() * 0.2 - 0.1)));
    
    // Convert to HSL space for color creation
    palette.push(hslToHexClean(h * 360, adjustedS, adjustedL));
  }
  
  // Sort by lightness for better visual arrangement
  return sortPaletteByLightness(palette);
}

// Add a new dark theme palette pattern inspired by the example
function generateDarkThemePalette(baseHue?: number): string[] {
  const palette: string[] = [];
  const usedColors = new Set<string>();
  
  // If baseHue is provided, use it for a simplified dark theme with true black
  if (baseHue !== undefined) {
    // True black / near-black
    palette.push("#000000"); // Pure black
    
    // Very dark charcoal (almost black but with slight hue)
    palette.push(hslToHexClean(baseHue, 0.15, 0.08));
    
    // Dark gray with slight hue influence
    palette.push(hslToHexClean(baseHue, 0.2, 0.15));
    
    // Accent color - more saturated
    palette.push(hslToHexClean((baseHue + 180) % 360, 0.85, 0.6));
    
    // Second accent - related to first accent
    palette.push(hslToHexClean((baseHue + 150) % 360, 0.7, 0.5));
    
    return palette;
  }
  
  // Original implementation for when no baseHue is provided
  // Choose a pattern type for the dark theme
  const patternType = Math.floor(Math.random() * 6); // Increased from 4 to 6 patterns
  
  switch(patternType) {
    // Pattern 1: True black + navy + vibrant accent + light neutral (like the example)
    case 0: {
      // Start with pure black
      const black = "#000000";
      palette.push(black);
      usedColors.add(black);
      
      // Add deep navy blue (like #14213D from example)
      const navyHue = 220 + Math.floor(Math.random() * 20); // 220-240 range
      const navy = hslToHexClean(
        navyHue,
        0.7 + Math.random() * 0.2, // 70-90% saturation
        0.15 + Math.random() * 0.1  // 15-25% lightness - very dark
      );
      
      if (!usedColors.has(navy)) {
        palette.push(navy);
        usedColors.add(navy);
      }
      
      // Add vibrant accent color (like orange #FCA311 from example)
      let accentHue: number;
      // 70% chance of using orange (most effective for dark themes)
      if (Math.random() < 0.7) {
        accentHue = 30 + Math.floor(Math.random() * 15); // 30-45, orange range
      } else {
        // Otherwise use another vibrant hue
        const vibrantHues = [
          0, // Red
          45, // Yellow-orange
          60, // Yellow
          190, // Cyan
          270, // Purple
          330  // Pink
        ];
        accentHue = vibrantHues[Math.floor(Math.random() * vibrantHues.length)];
      }
      
      // Generate a highly vibrant accent color - for orange use the special function
      const accent = accentHue >= 20 && accentHue <= 40 ? 
        generateVibrantOrange() : 
        hslToHexClean(
          accentHue,
          0.85 + Math.random() * 0.15, // 85-100% saturation
          0.55 + Math.random() * 0.1  // 55-65% lightness - vibrant but not too light
        );
      
      if (!usedColors.has(accent)) {
        palette.push(accent);
        usedColors.add(accent);
      }
      
      // Add platinum/light gray (like #E5E5E5 from example)
      const platinum = hslToHexClean(
        0, // Hue doesn't matter for very desaturated colors
        0, // No saturation
        0.9 + Math.random() * 0.05 // 90-95% lightness
      );
      
      if (!usedColors.has(platinum)) {
        palette.push(platinum);
        usedColors.add(platinum);
      }
      
      // Add pure white for contrast
      const white = "#FFFFFF";
      if (!usedColors.has(white)) {
        palette.push(white);
        usedColors.add(white);
      }
      
      break;
    }
    
    // Pattern 2: Dark gray + charcoal + vibrant accent + pastel accent
    case 1: {
      // Dark gray base
      const darkGray = hslToHexClean(
        0, // Hue doesn't matter for very desaturated colors
        0, // No saturation
        0.15 + Math.random() * 0.1 // 15-25% lightness
      );
      
      palette.push(darkGray);
      usedColors.add(darkGray);
      
      // Charcoal/deep color with hint of color
      const deepHue = Math.floor(Math.random() * 360);
      const charcoal = hslToHexClean(
        deepHue,
        0.15 + Math.random() * 0.1, // 15-25% saturation
        0.2 + Math.random() * 0.1 // 20-30% lightness
      );
      
      if (!usedColors.has(charcoal)) {
        palette.push(charcoal);
        usedColors.add(charcoal);
      }
      
      // Primary accent - vibrant color
      let accentHue: number;
      const accentOptions = [0, 30, 60, 180, 210, 270, 330]; // Red, orange, yellow, cyan, azure, purple, pink
      accentHue = accentOptions[Math.floor(Math.random() * accentOptions.length)];
      
      const vibrantAccent = hslToHexClean(
        accentHue,
        0.85 + Math.random() * 0.15, // 85-100% saturation
        0.55 + Math.random() * 0.1 // 55-65% lightness
      );
      
      if (!usedColors.has(vibrantAccent)) {
        palette.push(vibrantAccent);
        usedColors.add(vibrantAccent);
      }
      
      // Secondary accent - pastel or light color
      const secondaryHue = (accentHue + 90 + Math.floor(Math.random() * 180)) % 360; // Different hue family
      const lightAccent = hslToHexClean(
        secondaryHue,
        0.4 + Math.random() * 0.3, // 40-70% saturation
        0.75 + Math.random() * 0.15 // 75-90% lightness
      );
      
      if (!usedColors.has(lightAccent)) {
        palette.push(lightAccent);
        usedColors.add(lightAccent);
      }
      
      // Light gray/off-white for text
      const lightGray = hslToHexClean(
        0,
        0,
        0.9 + Math.random() * 0.1 // 90-100% lightness
      );
      
      if (!usedColors.has(lightGray)) {
        palette.push(lightGray);
        usedColors.add(lightGray);
      }
      
      break;
    }
    
    // Pattern 3: Black + deep color + multiple accent colors
    case 2: {
      // True black
      const black = "#000000";
      palette.push(black);
      usedColors.add(black);
      
      // Deep saturated color (dark blue, deep purple, etc.)
      const deepHue = 210 + Math.floor(Math.random() * 90); // 210-300 range (blue to purple)
      const deepColor = hslToHexClean(
        deepHue,
        0.75 + Math.random() * 0.25, // 75-100% saturation
        0.15 + Math.random() * 0.1 // 15-25% lightness
      );
      
      if (!usedColors.has(deepColor)) {
        palette.push(deepColor);
        usedColors.add(deepColor);
      }
      
      // Bright vibrant accent 
      const accentHue = (deepHue + 180) % 360; // Complementary color
      const vibrantAccent = hslToHexClean(
        accentHue,
        0.85 + Math.random() * 0.15, // 85-100% saturation
        0.55 + Math.random() * 0.15 // 55-70% lightness
      );
      
      if (!usedColors.has(vibrantAccent)) {
        palette.push(vibrantAccent);
        usedColors.add(vibrantAccent);
      }
      
      // Light neutral color
      const lightNeutral = hslToHexClean(
        0,
        0,
        0.9 + Math.random() * 0.1 // 90-100% lightness
      );
      
      if (!usedColors.has(lightNeutral)) {
        palette.push(lightNeutral);
        usedColors.add(lightNeutral);
      }
      
      // Pure white
      const white = "#FFFFFF";
      if (!usedColors.has(white)) {
        palette.push(white);
        usedColors.add(white);
      }
      
      break;
    }
    
    // Pattern 4: Monochromatic dark theme with single bright accent
    case 3: {
      // Very dark base color
      const baseHue = Math.floor(Math.random() * 360);
      
      const darkestColor = hslToHexClean(
        baseHue,
        0.75 + Math.random() * 0.25, // 75-100% saturation
        0.07 + Math.random() * 0.08 // 7-15% lightness - very dark
      );
      
      palette.push(darkestColor);
      usedColors.add(darkestColor);
      
      // Dark variant
      const darkColor = hslToHexClean(
        baseHue,
        0.7 + Math.random() * 0.2, // 70-90% saturation
        0.15 + Math.random() * 0.1 // 15-25% lightness
      );
      
      if (!usedColors.has(darkColor)) {
        palette.push(darkColor);
        usedColors.add(darkColor);
      }
      
      // Medium-dark variant (for subtle contrast)
      const mediumColor = hslToHexClean(
        baseHue,
        0.6 + Math.random() * 0.2, // 60-80% saturation
        0.25 + Math.random() * 0.1 // 25-35% lightness
      );
      
      if (!usedColors.has(mediumColor)) {
        palette.push(mediumColor);
        usedColors.add(mediumColor);
      }
      
      // Vibrant accent (complementary color or within same hue family)
      const accentHue = Math.random() < 0.7 ? 
        (baseHue + 180) % 360 : // Complementary (70% chance)
        (baseHue + 15 + Math.floor(Math.random() * 30)) % 360; // Related hue (30% chance)
      
      const accent = hslToHexClean(
        accentHue,
        0.9 + Math.random() * 0.1, // 90-100% saturation - very vibrant
        0.6 + Math.random() * 0.15 // 60-75% lightness
      );
      
      if (!usedColors.has(accent)) {
        palette.push(accent);
        usedColors.add(accent);
      }
      
      // Light color for text/highlights
      const lightColor = hslToHexClean(
        baseHue,
        0.1 + Math.random() * 0.1, // 10-20% saturation
        0.9 + Math.random() * 0.1 // 90-100% lightness
      );
      
      if (!usedColors.has(lightColor)) {
        palette.push(lightColor);
        usedColors.add(lightColor);
      }
      
      break;
    }
    
    // NEW PATTERN 5: Earth tones with flame accent (based on first shared example: floral white, timberwolf, black olive, eerie black, flame)
    case 4: {
      // Floral white (off-white with warm undertone)
      const floralWhite = "#FFFCF2";
      palette.push(floralWhite);
      usedColors.add(floralWhite);
      
      // Timberwolf (light gray with warm undertone)
      const timberwolf = "#CCC5B9";
      palette.push(timberwolf);
      usedColors.add(timberwolf);
      
      // Black olive (dark greenish-gray)
      const blackOlive = "#403D39";
      palette.push(blackOlive);
      usedColors.add(blackOlive);
      
      // Eerie black (almost black)
      const eerieBlack = "#252422";
      palette.push(eerieBlack);
      usedColors.add(eerieBlack);
      
      // Flame (vibrant orange-red)
      const flame = "#EB5E28";
      palette.push(flame);
      usedColors.add(flame);
      
      break;
    }
    
    // NEW PATTERN 6: Flag-inspired (based on second shared example: navy, slate blue, white, red)
    case 5: {
      // Oxford blue (dark navy)
      const oxfordBlue = "#14213D";
      palette.push(oxfordBlue);
      usedColors.add(oxfordBlue);
      
      // Slate blue (medium blue-gray)
      const slateBlue = "#5C6784";
      palette.push(slateBlue);
      usedColors.add(slateBlue);
      
      // Off-white / platinum
      const platinum = "#E5E5E5";
      palette.push(platinum);
      usedColors.add(platinum);
      
      // Light coral red
      const lightCoral = "#E84855";
      palette.push(lightCoral);
      usedColors.add(lightCoral);
      
      // Deep red
      const deepRed = "#B11C2B";
      palette.push(deepRed);
      usedColors.add(deepRed);
      
      break;
    }
  }
  
  // Return palette (should already be 5 colors)
  return palette;
}

// Define a new set of highly vibrant palettes with proven high scores
const highScoringPalettes = [
  // Sunset Vibrancy - warm colors with strong contrast
  [
    { h: 20, s: 90, l: 30 },  // Deep burnt orange
    { h: 35, s: 95, l: 55 },  // Vibrant amber
    { h: 45, s: 100, l: 70 }, // Bright golden yellow
    { h: 10, s: 85, l: 45 },  // Rich terracotta
    { h: 55, s: 40, l: 92 }   // Pale cream
  ],
  // Ocean Brilliance - blue-teal range with high saturation
  [
    { h: 220, s: 85, l: 25 }, // Deep royal blue
    { h: 200, s: 90, l: 45 }, // Vibrant teal
    { h: 180, s: 75, l: 60 }, // Bright turquoise
    { h: 190, s: 65, l: 80 }, // Light aqua
    { h: 210, s: 40, l: 92 }  // Pale sky blue
  ],
  // Tropical Paradise - vibrant complementary colors
  [
    { h: 150, s: 80, l: 25 }, // Deep jungle green
    { h: 120, s: 90, l: 45 }, // Vibrant leaf green
    { h: 350, s: 85, l: 60 }, // Rich coral
    { h: 30, s: 95, l: 70 },  // Bright mango
    { h: 65, s: 50, l: 92 }   // Pale lime
  ],
  // Berry Blast - purple and pink with high saturation
  [
    { h: 280, s: 85, l: 30 }, // Deep purple
    { h: 310, s: 90, l: 50 }, // Vibrant magenta
    { h: 330, s: 85, l: 65 }, // Rich pink
    { h: 350, s: 75, l: 75 }, // Light rose
    { h: 290, s: 40, l: 90 }  // Pale lavender
  ],
  // Citrus Splash - fresh and zesty colors
  [
    { h: 150, s: 80, l: 25 }, // Deep green
    { h: 75, s: 90, l: 45 },  // Vibrant lime
    { h: 45, s: 95, l: 60 },  // Bright yellow
    { h: 30, s: 90, l: 55 },  // Rich orange
    { h: 15, s: 85, l: 45 }   // Deep tangerine
  ],
  // Fire & Ice - dramatic complementary palette
  [
    { h: 210, s: 90, l: 30 }, // Deep blue
    { h: 200, s: 85, l: 45 }, // Vibrant ice blue
    { h: 180, s: 50, l: 85 }, // Pale cyan
    { h: 20, s: 95, l: 55 },  // Rich orange
    { h: 5, s: 90, l: 45 }    // Deep red-orange
  ]
];

// Restore experimental palettes
const experimentalPalettes = [
  // Triadic experimental
  [
    { h: 0, s: 80, l: 20 },    // Dark red
    { h: 120, s: 65, l: 40 },  // Forest green
    { h: 240, s: 70, l: 60 },  // Medium blue
    { h: 30, s: 60, l: 80 },   // Light orange
    { h: 270, s: 30, l: 90 }   // Pale violet
  ],
  // Split complementary
  [
    { h: 200, s: 80, l: 20 },  // Dark blue-green
    { h: 350, s: 70, l: 45 },  // Crimson
    { h: 25, s: 75, l: 65 },   // Orange
    { h: 170, s: 50, l: 80 },  // Light teal
    { h: 290, s: 30, l: 92 }   // Pale purple
  ],
  // Monochromatic with colorful dark end
  [
    { h: 280, s: 70, l: 20 },  // Deep violet
    { h: 280, s: 60, l: 40 },  // Rich purple
    { h: 280, s: 50, l: 60 },  // Medium purple
    { h: 280, s: 40, l: 80 },  // Light purple
    { h: 280, s: 20, l: 95 }   // Very pale purple
  ],
  // Red-Orange focus
  [
    { h: 0, s: 85, l: 22 },    // Deep red
    { h: 10, s: 80, l: 40 },   // Crimson
    { h: 20, s: 90, l: 60 },   // Vibrant orange
    { h: 30, s: 85, l: 75 },   // Light orange
    { h: 40, s: 40, l: 92 }    // Cream with orange undertone
  ]
];

// Restore trending palettes
const trendingPalettes = [
  // Classic palettes with varied dark colors instead of pure black
  [
    { h: 215, s: 30, l: 20 }, // Dark navy blue
    { h: 210, s: 75, l: 35 }, // Deep blue
    { h: 50, s: 80, l: 60 },  // Rich yellow
    { h: 35, s: 90, l: 75 },  // Soft orange
    { h: 10, s: 25, l: 90 }   // Light warm cream
  ],
  // Modern cool palette with variety at both ends
  [
    { h: 270, s: 50, l: 25 }, // Deep purple
    { h: 240, s: 60, l: 45 }, // Royal blue
    { h: 210, s: 65, l: 60 }, // Sky blue
    { h: 180, s: 40, l: 75 }, // Light teal
    { h: 160, s: 20, l: 92 }  // Pale mint
  ],
  // Warm earth tones instead of standard black/white
  [
    { h: 25, s: 70, l: 20 },  // Dark chocolate
    { h: 30, s: 60, l: 45 },  // Burnt sienna
    { h: 40, s: 70, l: 60 },  // Golden brown
    { h: 45, s: 80, l: 75 },  // Warm yellow
    { h: 50, s: 30, l: 92 }   // Cream
  ]
];

// Export the clean hex converter for vibrant colors
export function hslToHexClean(h: number, s: number, l: number): string {
  // Round hue to whole number for cleaner colors
  h = Math.round(h);
  
  // Special handling for orange spectrum to ensure they're vibrant and clean
  if (h >= 20 && h <= 40) {
    // For orange hues, increase saturation and adjust lightness for vibrancy
    s = Math.max(s, 0.85); // Ensure high saturation, minimum 85%
    
    // Adjust lightness for vibrant oranges - not too light, not too dark
    l = Math.min(Math.max(l, 0.55), 0.65);
    
    // Fine-tune hue to avoid muddy red-oranges and yellowish oranges
    if (h < 25) h = 25; // Avoid red-orange
    if (h > 35) h = 35; // Avoid yellow-orange
    
    // For truly vibrant oranges, create pure RGB values directly
    const r = 255;
    const g = Math.round(140 + (h - 25) * 8); // Ranges from ~140-180 as hue increases
    const b = Math.max(0, Math.min(60, Math.round((h - 25) * 3))); // Small blue component for brighter oranges
    
    // Convert to hex
    const toHex = (c: number) => {
      const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  
  // Normal processing for other colors
  return hslToHex(h, s, l);
}

// Optimize memory system to reduce performance impact
// Use an array but with a simpler structure to track recently used colors
let recentColorsList: string[] = [];
const MAX_MEMORY_SIZE = 10; // Reduced from 20 to 10 to improve performance
const MAX_PALETTE_SIZE = 5;

// Simplified similarity check for better performance
function isTooSimilarToRecent(hexColor: string): boolean {
  // Only check last 5 colors at most for much better performance
  const colorsToCheck = recentColorsList.slice(-5);
  
  for (const recentColor of colorsToCheck) {
    if (recentColor === hexColor) return true;
    
    // Simplified similarity check using RGB distance
    const color1 = tinycolor(hexColor);
    const color2 = tinycolor(recentColor);
    
    const rgb1 = color1.toRgb();
    const rgb2 = color2.toRgb();
    
    // Calculate RGB distance (simpler than HSL calculation)
    const distance = Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) + 
      Math.pow(rgb1.g - rgb2.g, 2) + 
      Math.pow(rgb1.b - rgb2.b, 2)
    );
    
    // If colors are too similar in RGB space
    if (distance < 50) {
      return true;
    }
  }
  
  return false;
}

// More efficient way to remember a color
function rememberColor(hexColor: string): void {
  // Add to the list, avoiding duplicates
  if (!recentColorsList.includes(hexColor)) {
  recentColorsList.push(hexColor);
  
  // Keep memory size limited
  if (recentColorsList.length > MAX_MEMORY_SIZE) {
      // Remove oldest colors
    recentColorsList = recentColorsList.slice(-MAX_MEMORY_SIZE);
    }
  }
}

// Adjust the contrast analyzer to be more strict
function analyzeContrast(colors: TinyColorType[]): number {
  let totalContrast = 0;
  let pairs = 0;

  // Calculate contrast between adjacent colors
  for (let i = 0; i < colors.length - 1; i++) {
    const contrast = tinycolor.readability(colors[i], colors[i + 1]);
    totalContrast += contrast;
    pairs++;
  }

  // Also check contrast between first and last colors for circular palettes
  if (colors.length > 2) {
    const contrast = tinycolor.readability(colors[0], colors[colors.length - 1]);
    totalContrast += contrast;
    pairs++;
  }

  // Normalize contrast score - adjusted to be more realistic
  // WCAG guidelines suggest minimum contrast of 4.5:1 for normal text
  const averageContrast = totalContrast / pairs;
  
  // Apply a more balanced curve to the scoring
  // This makes medium contrast score more realistically
  return Math.min(Math.pow(averageContrast / 4.0, 0.6), 1);
}

// Improved color conflict detection focused on muddy colors
function hasColorConflict(palette: string[]): boolean {
  // Convert to RGB for faster processing
  const rgbColors = palette.map(color => tinycolor(color).toRgb());
  
  // 1. Check for muddy colors (colors with all RGB components too similar)
  const hasMuddyColor = rgbColors.some(color => {
    const avg = (color.r + color.g + color.b) / 3;
    const rDiff = Math.abs(color.r - avg);
    const gDiff = Math.abs(color.g - avg);
    const bDiff = Math.abs(color.b - avg);
    
    // More aggressive check for muddy colors - stricter thresholds
    // If all channels are too similar and in the muddy range
    return (rDiff < 30 && gDiff < 30 && bDiff < 30) && 
           avg > 40 && avg < 190;
  });
  
  if (hasMuddyColor) return true;
  
  // Convert to HSL for specific color theory checks
  const hslColors = palette.map(color => tinycolor(color).toHsl());
  
  // 2. Check for problematic color combinations
  
  // 2a. Avoid overly saturated greens and highly saturated oranges/reds together - more aggressive check
  const hasVibrantGreen = hslColors.some(c => 
    c.h >= 90 && c.h <= 150 && c.s > 0.75 && c.l > 0.35 && c.l < 0.65
  );
  
  const hasVibrantRedOrange = hslColors.some(c => 
    ((c.h >= 0 && c.h <= 35) || (c.h >= 325 && c.h <= 360)) && 
    c.s > 0.75 && c.l > 0.45 && c.l < 0.75
  );
  
  if (hasVibrantGreen && hasVibrantRedOrange) {
    return true;
  }
  
  // 2b. NEW: Avoid yellow-green and purple combinations which often clash
  const hasYellowGreen = hslColors.some(c => 
    c.h >= 60 && c.h <= 90 && c.s > 0.6 && c.l > 0.4
  );
  
  const hasPurple = hslColors.some(c => 
    c.h >= 270 && c.h <= 310 && c.s > 0.6 && c.l > 0.4
  );
  
  if (hasYellowGreen && hasPurple) {
    return true;
  }
  
  // 3. Avoid muddy combinations: colors that are too close in hue but very different in saturation/lightness
  for (let i = 0; i < hslColors.length; i++) {
    for (let j = i + 1; j < hslColors.length; j++) {
      const hueDiff = Math.min(
        Math.abs(hslColors[i].h - hslColors[j].h),
        360 - Math.abs(hslColors[i].h - hslColors[j].h)
      );
      
      // 3a. Stricter threshold for colors close in hue but different in saturation/lightness
      if (hueDiff < 20 && 
          (Math.abs(hslColors[i].s - hslColors[j].s) > 0.45 || 
           Math.abs(hslColors[i].l - hslColors[j].l) > 0.45)) {
        return true;
      }
      
      // 3b. NEW: Detect clashing transitional hues (colors that appear muddy together)
      const clashingPairs = [
        // Hue ranges that often create muddy combinations when used together
        [[70, 90], [90, 110]], // Yellow-green and green
        [[160, 180], [190, 210]], // Teal and cyan
        [[30, 50], [280, 300]], // Yellow and purple
        [[10, 30], [210, 230]]  // Orange and blue when both are very saturated
      ];
      
      for (const [range1, range2] of clashingPairs) {
        const color1InRange1 = hslColors[i].h >= range1[0] && hslColors[i].h <= range1[1] && hslColors[i].s > 0.7;
        const color2InRange2 = hslColors[j].h >= range2[0] && hslColors[j].h <= range2[1] && hslColors[j].s > 0.7;
        
        const color1InRange2 = hslColors[i].h >= range2[0] && hslColors[i].h <= range2[1] && hslColors[i].s > 0.7;
        const color2InRange1 = hslColors[j].h >= range1[0] && hslColors[j].h <= range1[1] && hslColors[j].s > 0.7;
        
        if ((color1InRange1 && color2InRange2) || (color1InRange2 && color2InRange1)) {
          // These specific hue combinations tend to clash when both are highly saturated
          return true;
        }
      }
    }
  }
  
  // 4. NEW: Check for excessive brightness contrast that can strain the eyes
  const lightnesses = hslColors.map(c => c.l);
  const maxLightness = Math.max(...lightnesses);
  const minLightness = Math.min(...lightnesses);
  
  // If palette has both very dark and very light colors AND has highly saturated colors
  // This combination can be jarring
  if (maxLightness > 0.85 && minLightness < 0.15) {
    // Check if there are highly saturated colors
    const hasHighSaturation = hslColors.some(c => c.s > 0.85);
    if (hasHighSaturation) {
      // Count how many colors are in the extreme ranges
      const extremeColors = hslColors.filter(c => c.l > 0.85 || c.l < 0.15).length;
      // If we have multiple extreme colors plus high saturation, likely to be jarring
      if (extremeColors >= 2) {
        return true;
      }
    }
  }
  
  // 5. NEW: Check for brown-like colors that aren't true browns (appear muddy)
  const hasMuddyBrown = rgbColors.some(color => {
    // Check for colors that have red > green > blue but aren't proper browns
    return color.r > color.g && color.g > color.b && 
           // Red not dominant enough to be a proper brown
           color.r < 150 && 
           // Green too close to red
           (color.r - color.g < 40) &&
           // Values in the "muddy" range
           color.r > 60 && color.r < 150 &&
           color.g > 40 && color.g < 130;
  });
  
  if (hasMuddyBrown) return true;
  
  return false;
}

// Add this new function to detect duplicates in a palette
function hasDuplicateColors(palette: string[]): boolean {
  // Create a Set from the palette to remove duplicates, then compare lengths
  const uniqueColors = new Set(palette.map(color => color.toUpperCase()));
  return uniqueColors.size < palette.length;
}

// Modify the existing generateHarmoniousPalette function
export function generateHarmoniousPalette(): string[] {
  // Try up to 3 times to generate a palette without conflicts or duplicates
  for (let attempt = 0; attempt < 3; attempt++) {
    // Increase chance of truly random palette generation to 25% (from 15%)
    if (Math.random() < 0.25) {
      // Randomize base hue more thoroughly with time component
      const timeComponent = Date.now() % 360;
      const baseHue = (Math.floor(Math.random() * 360) + timeComponent) % 360;
      const randomPattern = generateTrulyRandomPalette(baseHue);
      
      if (!hasColorConflict(randomPattern) && !hasDuplicateColors(randomPattern) && !isTooSimilarToRecentPalettes(randomPattern)) {
        // Add to recent palettes to avoid repetition
        recentPalettes.push([...randomPattern]);
        if (recentPalettes.length > MAX_RECENT_PALETTES) recentPalettes.shift();
        return randomPattern;
      }
      continue;
    }
    
    // Introduce perceptually uniform palette generation (15% chance)
    if (Math.random() < 0.15) {
      const baseHue = Math.floor(Math.random() * 360);
      const palette = generatePerceptuallyUniformPalette(baseHue);
      
      if (!hasColorConflict(palette) && !hasDuplicateColors(palette)) {
        // Add to recent palettes to avoid repetition
        recentPalettes.push([...palette]);
        if (recentPalettes.length > MAX_RECENT_PALETTES) recentPalettes.shift();
        return palette;
      }
      continue;
    }
    
    // Simplified golden ratio palette generation (15% chance)
    if (Math.random() < 0.15) {
      const baseHue = Math.floor(Math.random() * 360);
      // Use tighter angle for more harmonious colors
      const goldenRatioPalette = createTightGoldenRatioPalette(baseHue);
      
      if (!hasColorConflict(goldenRatioPalette) && !hasDuplicateColors(goldenRatioPalette)) {
        // Add to recent palettes to avoid repetition
        recentPalettes.push([...goldenRatioPalette]);
        if (recentPalettes.length > MAX_RECENT_PALETTES) recentPalettes.shift();
        return goldenRatioPalette;
      }
      continue;
    }
    
    // Pattern-based generation (balanced probability - 45% from 55%)
    if (Math.random() < 0.45) {
      // Use a randomized base hue - ensure true randomness
      const baseHue = (Math.floor(Math.random() * 360) + (attempt * 73)) % 360; // Add non-linear variation
      
      // Balanced selection of patterns including all types
      const patternTypes = [
        "monochromatic",
      "analogous",
        "monochromatic-accent",
        "analogous-tight",
        "complementary",
      "triadic",
      "tetradic",
        "split-complementary"
      ];
      
      // More balanced weights with additional randomization
      const baseWeights = [3, 3, 3, 2, 2, 1, 1, 2];
      
      // Add some true randomness to the weights to avoid repetitive patterns
      const patternWeights = baseWeights.map(w => w + Math.random());
      
      const totalWeight = patternWeights.reduce((a, b) => a + b, 0);
    let randomValue = Math.random() * totalWeight;
    let selectedPatternIndex = 0;
    
    // Weighted random selection
    for (let i = 0; i < patternWeights.length; i++) {
      randomValue -= patternWeights[i];
      if (randomValue <= 0) {
        selectedPatternIndex = i;
        break;
      }
    }
    
      const selectedPattern = patternTypes[selectedPatternIndex];
      
      // Base color parameters with increased randomness
      const baseSaturation = 0.6 + (Math.random() * 0.35); // More range
      const baseLightness = 0.45 + (Math.random() * 0.35); // More range
      
      // Improved random noise function
    const noise = (range: number) => (Math.random() - 0.5) * range;
    
      // Improved color creation with better guardrails against muddy colors
    const createColor = (h: number, s: number, l: number): string => {
        // Add more randomness to the hue
        const hueOffset = Math.random() < 0.3 ? (Math.random() * 10 - 5) : 0;
        // Normalize values
        const normalizedHue = (h + hueOffset + 360) % 360;
        
        // Improved constraints to avoid muddy colors
        // Higher minimum saturation
        const normalizedSat = Math.max(0.4, Math.min(0.9, s));
        
        // Avoid middle lightness range which often creates muddy colors
        let normalizedLight = Math.min(0.9, Math.max(0.15, l));
        
        // Push lightness away from the muddy middle range (0.4-0.6)
        if (normalizedLight > 0.4 && normalizedLight < 0.6) {
          // Push toward either lighter or darker
          normalizedLight += (normalizedLight < 0.5) ? -0.1 : 0.1;
        }
        
        // Special handling for greens to avoid muddy greens
        let finalSat = normalizedSat;
        if (normalizedHue >= 90 && normalizedHue <= 150) {
          // Special handling for greens - either more vibrant or more pastel
          finalSat = (Math.random() < 0.5) ? 
            Math.min(0.9, normalizedSat * 1.15) : // More vibrant
            Math.max(0.3, normalizedSat * 0.7);   // More pastel
        }
        
        // Special handling for yellows which need higher lightness to appear properly
        let finalLight = normalizedLight;
        if (normalizedHue >= 50 && normalizedHue <= 70) {
          // Make yellows lighter to be perceptually correct
          finalLight = Math.min(0.9, normalizedLight * 1.15);
        }
        
        // Add slight variations for natural feel (reduced noise)
        const finalHue = normalizedHue + noise(3); // Reduced from 5 to 3
      
      return hslToHexClean(finalHue, finalSat, finalLight);
    };
    
      // Generate palette based on pattern
      let palette: string[] = [];
    
    switch (selectedPattern) {
        case "monochromatic": {
          // Generate 5 colors with the same hue but varied saturation and lightness
          // Improved distribution based on human perception
          palette.push(createColor(baseHue, 0.9, 0.3));   // Dark
          palette.push(createColor(baseHue, 0.8, 0.45));  // Medium-dark
          palette.push(createColor(baseHue, 0.7, 0.6));   // Medium
          palette.push(createColor(baseHue, 0.6, 0.75));  // Medium-light
          palette.push(createColor(baseHue, 0.5, 0.9));   // Light
          break;
        }
        
        case "monochromatic-accent": {
          // 4 colors monochromatic with 1 accent color (resembles popular design systems)
          palette.push(createColor(baseHue, 0.9, 0.25));  // Very dark (primary)
          palette.push(createColor(baseHue, 0.8, 0.4));   // Dark
          palette.push(createColor(baseHue, 0.7, 0.55));  // Medium
          palette.push(createColor(baseHue, 0.6, 0.8));   // Light
          
          // Add an accent color (complementary or near-complementary)
          const accentHue = (baseHue + 150 + Math.floor(Math.random() * 60)) % 360;
          palette.push(createColor(accentHue, 0.85, 0.55)); // Accent
        break;
      }
      
      case "analogous": {
          // Generate 5 colors with adjacent hues (30° steps max)
          const hueRange = 25 + Math.floor(Math.random() * 10); // 25-35° total range
          const middleIndex = 2;
        
        for (let i = 0; i < 5; i++) {
            // Calculate how far from center color (narrower range)
            const distanceFromMiddle = i - middleIndex;
            // Distribute hues within range (closer to base hue)
            const hue = baseHue + distanceFromMiddle * (hueRange / 4);
            
            // Slightly vary saturation and lightness for visual interest
            const sat = baseSaturation + (distanceFromMiddle * 0.05);
            const light = baseLightness + (distanceFromMiddle * -0.05);
            
            palette.push(createColor(hue, sat, light));
        }
        break;
      }
      
        case "analogous-tight": {
          // Generate 5 colors with very adjacent hues (15° steps max)
          // Research shows narrower hue ranges create more harmonious palettes
          const hueStep = 3 + Math.floor(Math.random() * 4); // 3-7° per step (max 28° total)
          
          for (let i = 0; i < 5; i++) {
            const hue = baseHue + (i - 2) * hueStep;
            // Create more lightness variation to compensate for tight hue range
            const light = baseLightness + (i - 2) * 0.12;
            palette.push(createColor(hue, baseSaturation, light));
        }
        break;
      }
      
        case "complementary": {
          // Improved complementary palette with better balance
          // Based on popular palettes from coolors.co that use complementary colors
          
          // Apply 60/30/10 rule for better balance (60% main color, 30% complement, 10% neutral)
          // Main color and variations (60% of palette)
          palette.push(createColor(baseHue, baseSaturation, baseLightness - 0.15)); // Darker base
          palette.push(createColor(baseHue, baseSaturation, baseLightness + 0.15)); // Lighter base
          palette.push(createColor(baseHue, baseSaturation - 0.15, baseLightness)); // Desaturated base
          
          // Complementary color (30% of palette)
          const complement = (baseHue + 180) % 360;
          palette.push(createColor(complement, baseSaturation, baseLightness - 0.1)); // Complementary
          
          // Add a neutral to balance the strong color contrast (10%)
          const neutralHue = baseHue;
          palette.push(createColor(neutralHue, 0.2, 0.85)); // Light neutral
        break;
      }
      
        case "triadic": {
          // Improved triadic palette with better balance
          // Use 3 colors 120° apart with balanced presence
          
          // Apply 60/30/10 rule (60% main color, 30% secondary triadic colors, 10% neutral)
          // Primary color (60% of palette)
          palette.push(createColor(baseHue, baseSaturation, baseLightness - 0.1)); // Darker
          palette.push(createColor(baseHue, baseSaturation - 0.1, baseLightness + 0.15)); // Lighter
          
          // Second triadic color (15% of palette)
          const secondTriadicHue = (baseHue + 120) % 360;
          palette.push(createColor(secondTriadicHue, baseSaturation - 0.05, baseLightness));
          
          // Third triadic color (15% of palette)
          const thirdTriadicHue = (baseHue + 240) % 360;
          palette.push(createColor(thirdTriadicHue, baseSaturation - 0.1, baseLightness));
          
          // Add a neutral to balance the strong hue differences (10%)
          palette.push(createColor(baseHue, 0.15, 0.9)); // Very light neutral
        break;
      }
      
        case "tetradic": {
          // Rectangle/tetradic palette (4 colors at corners of a rectangle in color wheel)
          // Based on successful examples from design resources
          
          // Use all 4 corners of the rectangle with balanced lightness/saturation
          const hueStep = 90; // Rectangle has 90° steps
          
          // Ensure good distribution and prevent muddy combinations
          palette.push(createColor(baseHue, baseSaturation, baseLightness));
          palette.push(createColor((baseHue + hueStep) % 360, baseSaturation - 0.1, baseLightness + 0.1));
          palette.push(createColor((baseHue + hueStep*2) % 360, baseSaturation, baseLightness - 0.1));
          palette.push(createColor((baseHue + hueStep*3) % 360, baseSaturation - 0.1, baseLightness));
          
          // Add a neutral to tie it together
          palette.push(createColor(baseHue, 0.1, 0.95)); // Almost white with hint of base hue
        break;
      }
      
      case "split-complementary": {
          // Base color + 2 colors adjacent to its complement
          // This gives harmony but with more visual interest than pure complementary
          
          // Base color and variations (40% of palette)
          palette.push(createColor(baseHue, baseSaturation, baseLightness - 0.1)); // Main color darker
          palette.push(createColor(baseHue, baseSaturation - 0.1, baseLightness + 0.15)); // Main color lighter
          
          // Split complementary colors (40% of palette)
          const complement = (baseHue + 180) % 360;
          palette.push(createColor(complement - 30, baseSaturation, baseLightness));
          palette.push(createColor(complement + 30, baseSaturation - 0.05, baseLightness - 0.05));
          
          // Fifth color is a neutral shade from the base hue family
          palette.push(createColor(baseHue, 0.25, 0.9)); // Light neutral
        break;
        }
      }
      
      // Apply perceptual uniformity adjustments
      const adjustedPalette = palette.map(color => adjustForPerceptualUniformity(color));
      
      // Check for duplicates - critical fix
      if (hasDuplicateColors(adjustedPalette)) {
        continue; // Skip this palette and try again
      }
      
      // Check for conflicts
      if (!hasColorConflict(adjustedPalette)) {
        // Check for repetition with recent palettes
        const isTooSimilarToRecent = recentPalettes.some(recentPalette => {
          // Count how many colors match between palettes
          let matchCount = 0;
          for (const color of adjustedPalette) {
            if (recentPalette.some(rc => isSimilarColor(rc, color))) {
              matchCount++;
            }
          }
          // If more than 3 colors match, consider it too similar
          return matchCount >= 3;
        });
        
        if (!isTooSimilarToRecent) {
          // 50% chance to sort by lightness
          const finalPalette = Math.random() < 0.5 ? 
            sortPaletteByLightness(adjustedPalette) : 
            adjustedPalette;
          
          // Add to recent palettes to avoid repetition
          recentPalettes.push([...finalPalette]);
          if (recentPalettes.length > MAX_RECENT_PALETTES) recentPalettes.shift();
          
          return finalPalette;
        }
      }
      
      continue;
    }
    
    // Curated palettes - reduced chance (10% from previous version)
    if (Math.random() < 0.10) {
      // Include more diverse examples with different harmony types
      const curatedPalettes: Array<HSLColor[]> = [
        // Sunset Vibrancy - warm colors with strong contrast
        [
          { h: 20, s: 0.90, l: 0.30 },  // Deep burnt orange
          { h: 35, s: 0.95, l: 0.55 },  // Vibrant amber
          { h: 45, s: 1.00, l: 0.70 },  // Bright golden yellow
          { h: 10, s: 0.85, l: 0.45 },  // Rich terracotta
          { h: 55, s: 0.40, l: 0.92 }   // Pale cream
        ],
        // Ocean Brilliance - blue-teal range with high saturation
        [
          { h: 220, s: 0.85, l: 0.25 }, // Deep royal blue
          { h: 200, s: 0.90, l: 0.45 }, // Vibrant teal
          { h: 180, s: 0.75, l: 0.60 }, // Bright turquoise
          { h: 190, s: 0.65, l: 0.80 }, // Light aqua
          { h: 210, s: 0.40, l: 0.92 }  // Pale sky blue
        ],
        // Tropical Paradise - vibrant complementary colors
        [
          { h: 150, s: 0.80, l: 0.25 }, // Deep jungle green
          { h: 120, s: 0.90, l: 0.45 }, // Vibrant leaf green
          { h: 350, s: 0.85, l: 0.60 }, // Rich coral
          { h: 30, s: 0.95, l: 0.70 },  // Bright mango
          { h: 65, s: 0.50, l: 0.92 }   // Pale lime
        ]
      ];
      
      // Select a random palette with preference for variety
      const palettesNotRecentlyUsed = curatedPalettes.filter((_, index) => {
        // Check if this palette type was recently used
        return !recentPalettes.some(recentPalette => 
          // Simple signature comparison for palette similarity
          arePaletteSignaturesSimilar(
            getPaletteSignature(curatedPalettes[index]),
            getPaletteSignature(recentPalette.map(hex => {
              const tc = tinycolor(hex);
              const hsl = tc.toHsl();
              return { h: hsl.h, s: hsl.s, l: hsl.l };
            }))
          )
        );
      });
      
      // If we have palettes not recently used, prefer those
      const selectedTemplate = palettesNotRecentlyUsed.length > 0 ?
        palettesNotRecentlyUsed[Math.floor(Math.random() * palettesNotRecentlyUsed.length)] :
        curatedPalettes[Math.floor(Math.random() * curatedPalettes.length)];
      
      // Add more significant variation to make each palette unique
      const palette = selectedTemplate.map(color => {
        // Add larger random variations to make truly unique palettes
        const hueNoise = (Math.random() - 0.5) * 15; // Increased from 5 to 15
        const satNoise = (Math.random() - 0.5) * 0.15; // Increased from 0.05 to 0.15
        const lightNoise = (Math.random() - 0.5) * 0.15; // Increased from 0.05 to 0.15
        
        return hslToHexClean(
          (color.h + hueNoise + 360) % 360,
          Math.max(0.4, Math.min(0.9, color.s + satNoise)),
          Math.max(0.25, Math.min(0.9, color.l + lightNoise))
        );
      });
      
      // Apply perceptual uniformity adjustments
      const adjustedPalette = palette.map(color => adjustForPerceptualUniformity(color));
      
      // Check for duplicates - critical fix
      if (hasDuplicateColors(adjustedPalette)) {
        continue; // Skip this palette and try again
      }
      
      // Should be good quality but check anyway
      if (!hasColorConflict(adjustedPalette)) {
        // Check for repetition with recent palettes
        const isTooSimilarToRecent = recentPalettes.some(recentPalette => {
          // Count how many colors match between palettes
          let matchCount = 0;
          for (const color of adjustedPalette) {
            if (recentPalette.some(rc => isSimilarColor(rc, color))) {
              matchCount++;
            }
          }
          // If more than 3 colors match, consider it too similar
          return matchCount >= 3;
        });
        
        if (!isTooSimilarToRecent) {
          // Add to recent palettes to avoid repetition
          recentPalettes.push([...adjustedPalette]);
          if (recentPalettes.length > MAX_RECENT_PALETTES) recentPalettes.shift();
          
          return adjustedPalette;
        }
      }
    }
  }
  
  // Create a completely novel fallback palette by using prime number spacing and time seeding
  // This is a last resort when all other generation methods fail
  const safeHue = ((Math.floor(Math.random() * 360) + Date.now()) % 360);
  const primes = [2, 3, 5, 7, 11];
  
  const fallbackPalette = primes.map((prime, index) => {
    const hue = (safeHue + (prime * 31)) % 360;
    const saturation = 0.55 + (index * 0.07);
    const lightness = 0.3 + (index * 0.12);
    return hslToHexClean(hue, saturation, lightness);
  });
  
  // Add to recent palettes
  recentPalettes.push([...fallbackPalette]);
  if (recentPalettes.length > MAX_RECENT_PALETTES) recentPalettes.shift();
  
  return fallbackPalette;
}

// New function to generate truly random color palette
function generateTrulyRandomPalette(baseHue: number): string[] {
  const palette: string[] = [];
  const uniqueHues = new Set<number>();
  
  // Add baseHue first
  uniqueHues.add(baseHue);
  
  // Create 5 colors with completely different hues - use prime number spacing for true variety
  while (uniqueHues.size < 5) {
    // Use prime multipliers and modulo to create non-repeating sequences
    // Adding a time-based component to increase entropy
    const hue = (baseHue + (uniqueHues.size * 73 + 29 + (Date.now() % 17))) % 360;
    
    // Ensure hues are sufficiently different (at least 30 degrees apart)
    let isDistinct = true;
    for (const existingHue of Array.from(uniqueHues)) {
      const diff = Math.min(
        Math.abs(hue - existingHue),
        360 - Math.abs(hue - existingHue)
      );
      if (diff < 30) {
        isDistinct = false;
        break;
      }
    }
    
    if (isDistinct) {
      uniqueHues.add(hue);
    }
  }
  
  // Apply different randomization strategies (more variance)
  const randomStrategy = Math.floor(Math.random() * 4);
  
  // Convert the unique hues to colors with varied saturation and lightness
  const huesArray = Array.from(uniqueHues);
  
  // Add some positional randomization to the hue order
  if (Math.random() < 0.5) {
    huesArray.sort(() => Math.random() - 0.5);
  }
  
  switch (randomStrategy) {
    // Strategy 0: Wide spread with varied saturation and lightness
    case 0:
      for (let i = 0; i < huesArray.length; i++) {
        const hue = huesArray[i];
        // More extreme range for true differentiation
        const saturation = 0.5 + (Math.random() * 0.45);
        const lightness = 0.25 + (Math.random() * 0.6);
        palette.push(hslToHexClean(hue, saturation, lightness));
      }
      break;
      
    // Strategy 1: Balanced spread with coordinated lightness
    case 1:
      for (let i = 0; i < huesArray.length; i++) {
        const hue = huesArray[i];
        // Coordinated but random saturation
        const saturation = 0.55 + (Math.random() * 0.3);
        // Evenly distribute lightness
        const lightness = 0.3 + (i * 0.15);
        palette.push(hslToHexClean(hue, saturation, lightness));
      }
      break;
      
    // Strategy 2: Seasonal palette - based on color psychology
    case 2:
      const seasonType = Math.floor(Math.random() * 4);
      
      // Apply seasonal color theory
      switch (seasonType) {
        // Spring: Bright, clear colors with medium-high saturation
        case 0:
          for (let i = 0; i < huesArray.length; i++) {
            const hue = huesArray[i];
            const saturation = 0.65 + (Math.random() * 0.2);
            const lightness = 0.60 + (Math.random() * 0.25);
            palette.push(hslToHexClean(hue, saturation, lightness));
          }
          break;
          
        // Summer: Soft, muted colors with medium saturation
        case 1:
          for (let i = 0; i < huesArray.length; i++) {
            const hue = huesArray[i];
            const saturation = 0.4 + (Math.random() * 0.3);
            const lightness = 0.55 + (Math.random() * 0.3);
            palette.push(hslToHexClean(hue, saturation, lightness));
          }
          break;
          
        // Fall/Autumn: Warm, earthy colors with medium-low saturation
        case 2:
          for (let i = 0; i < huesArray.length; i++) {
            const hue = huesArray[i];
            // Bias towards warm hues (reds, oranges, yellows)
            const adjustedHue = (hue + 30) % 360;
            const saturation = 0.45 + (Math.random() * 0.3);
            const lightness = 0.4 + (Math.random() * 0.35);
            palette.push(hslToHexClean(adjustedHue, saturation, lightness));
          }
          break;
          
        // Winter: Bold, clear colors with high contrast
        case 3:
          for (let i = 0; i < huesArray.length; i++) {
            const hue = huesArray[i];
            const saturation = 0.7 + (Math.random() * 0.25);
            // More contrast - some dark, some light
            const lightness = (i % 2 === 0) ? 
              0.25 + (Math.random() * 0.2) : 
              0.65 + (Math.random() * 0.25);
            palette.push(hslToHexClean(hue, saturation, lightness));
          }
        break;
      }
      break;
      
    // Strategy 3: Color psychology based (emotional palette)
    case 3:
      const emotion = Math.floor(Math.random() * 5);
      
      switch (emotion) {
        // Calm/Serene: Soft blues, greens with lower saturation
        case 0:
          for (let i = 0; i < huesArray.length; i++) {
            // Shift hues towards blue-green spectrum
            const hue = ((huesArray[i] + 180) % 360 + 180) % 360;
            const saturation = 0.3 + (Math.random() * 0.3);
            const lightness = 0.5 + (Math.random() * 0.35);
            palette.push(hslToHexClean(hue, saturation, lightness));
          }
          break;
          
        // Energetic: Vibrant with high saturation
        case 1:
          for (let i = 0; i < huesArray.length; i++) {
            const hue = huesArray[i];
            const saturation = 0.75 + (Math.random() * 0.2);
            const lightness = 0.5 + (Math.random() * 0.25);
            palette.push(hslToHexClean(hue, saturation, lightness));
          }
          break;
          
        // Professional/Elegant: Muted with some darker tones
        case 2:
          for (let i = 0; i < huesArray.length; i++) {
            const hue = huesArray[i];
            const saturation = 0.3 + (Math.random() * 0.3);
            const lightness = 0.3 + (Math.random() * 0.4);
            palette.push(hslToHexClean(hue, saturation, lightness));
          }
          break;
          
        // Natural/Organic: Earth tones, desaturated
        case 3:
          for (let i = 0; i < huesArray.length; i++) {
            // Shift towards earthy hues
            let hue = huesArray[i];
            // 50% chance to shift to earth tone range
    if (Math.random() < 0.5) {
              // Earth tone ranges: yellows, oranges, browns, some greens
              const earthRanges = [[20, 50], [70, 110], [25, 40]];
              const range = earthRanges[Math.floor(Math.random() * earthRanges.length)];
              hue = range[0] + Math.random() * (range[1] - range[0]);
            }
            const saturation = 0.35 + (Math.random() * 0.3);
            const lightness = 0.3 + (Math.random() * 0.5);
            palette.push(hslToHexClean(hue, saturation, lightness));
          }
          break;
          
        // Bold/Creative: High contrast, vibrant
        case 4:
          for (let i = 0; i < huesArray.length; i++) {
            const hue = huesArray[i];
            const saturation = 0.7 + (Math.random() * 0.3);
            // Alternate between light and dark
            const lightnessBase = (i % 2 === 0) ? 0.25 : 0.6;
            const lightness = lightnessBase + (Math.random() * 0.2);
            palette.push(hslToHexClean(hue, saturation, lightness));
          }
          break;
      }
      break;
      
    default:
      // Fallback - standard distribution
      for (let i = 0; i < huesArray.length; i++) {
        const hue = huesArray[i];
        const saturation = 0.5 + (Math.random() * 0.4);
        const lightness = 0.3 + (i * 0.12);
        palette.push(hslToHexClean(hue, saturation, lightness));
      }
  }
  
  // Apply perceptual balance - ensure no single color dominates too much
  return balancePerceptualWeight(palette);
}

// New function to balance perceptual weight of colors
function balancePerceptualWeight(palette: string[]): string[] {
  // Convert to LAB color space for perceptual uniformity
  const labColors = palette.map(color => {
    const tc = tinycolor(color);
    const rgb = tc.toRgb();
    
    // Simple approximation of perceptual lightness (weighted RGB)
    const perceivedLightness = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
    
    return {
      color,
      perceivedLightness
    };
  });
  
  // Check if we have a good distribution of perceived lightness
  const lightnessValues = labColors.map(c => c.perceivedLightness);
  const minLightness = Math.min(...lightnessValues);
  const maxLightness = Math.max(...lightnessValues);
  const range = maxLightness - minLightness;
  
  // If range is too small, adjust to improve contrast
  if (range < 80 && palette.length > 2) {
    // Find the darkest and lightest colors
    const darkestIndex = lightnessValues.indexOf(minLightness);
    const lightestIndex = lightnessValues.indexOf(maxLightness);
    
    // Adjust the darkest color to be darker if needed
    if (minLightness > 50) {
      const darkColor = tinycolor(palette[darkestIndex]);
      const hsl = darkColor.toHsl();
      // Make it darker with correct typing for tinycolor
      palette[darkestIndex] = tinycolor({ 
        h: hsl.h, 
        s: hsl.s, 
        l: Math.max(0.15, hsl.l - 0.2) 
      } as any).toHexString(); // Use 'as any' to fix the type error
    }
    
    // Adjust the lightest color to be lighter if needed
    if (maxLightness < 200) {
      const lightColor = tinycolor(palette[lightestIndex]);
      const hsl = lightColor.toHsl();
      // Make it lighter with correct typing for tinycolor
      palette[lightestIndex] = tinycolor({ 
        h: hsl.h, 
        s: hsl.s, 
        l: Math.min(0.95, hsl.l + 0.15) 
      } as any).toHexString(); // Use 'as any' to fix the type error
    }
  }
  
  return palette;
}

// Helper function to check if two colors are visually similar
function isSimilarColor(color1: string, color2: string): boolean {
  const tc1 = tinycolor(color1);
  const tc2 = tinycolor(color2);
  
  const rgb1 = tc1.toRgb();
  const rgb2 = tc2.toRgb();
  
  // Calculate color distance using simple euclidean distance in RGB space
  const distance = Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
  
  // Colors are similar if distance is small
  return distance < 50; // Threshold determined empirically
}

// Get a signature for a palette to detect similarity
function getPaletteSignature(palette: Array<{h: number, s: number, l: number}>): string {
  // Sort by hue to make comparison independent of order
  const sortedHues = [...palette].sort((a, b) => a.h - b.h).map(c => Math.round(c.h));
  return sortedHues.join(',');
}

// Check if two palette signatures are similar
function arePaletteSignaturesSimilar(sig1: string, sig2: string): boolean {
  const hues1 = sig1.split(',').map(Number);
  const hues2 = sig2.split(',').map(Number);
  
  // Count how many hues are similar between palettes
  let similarCount = 0;
  for (const h1 of hues1) {
    for (const h2 of hues2) {
      const hueDiff = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2));
      if (hueDiff < 20) {
        similarCount++;
        break;
      }
    }
  }
  
  // If more than half the hues match, consider them similar
  return similarCount >= 3;
}

// New function to generate perceptually uniform colors using LCH color space principles
function generatePerceptuallyUniformPalette(baseHue: number): string[] {
  const palette: string[] = [];
  const count = 5;
  
  // Use a perceptually uniform spacing approach
  // Based on research from the CIE L*a*b* color space
  
  // Start with a more saturated and darker base color
  const baseSaturation = 0.7 + Math.random() * 0.2; // 70-90%
  const baseLightness = 0.4 + Math.random() * 0.1; // 40-50%
  
  // Create the base color
  palette.push(hslToHexClean(baseHue, baseSaturation, baseLightness));
  
  // Choose a pattern for perceptual uniformity
  const pattern = Math.floor(Math.random() * 3);
  
  switch (pattern) {
    // Pattern 0: Keep hue constant, vary lightness evenly
    case 0: {
      // Create a distribution of lightness values
      const lightnessStep = (0.9 - 0.25) / (count - 1);
      
      for (let i = 1; i < count; i++) {
        const lightness = 0.25 + (lightnessStep * i);
        
        // Decrease saturation as lightness increases for better perception
        const saturation = Math.max(0.3, baseSaturation - ((lightness - baseLightness) * 0.5));
        
        palette.push(hslToHexClean(baseHue, saturation, lightness));
      }
      
      // Sort palette for better gradient
      return sortPaletteByLightness(palette);
    }
    
    // Pattern 1: Analogous hues with adjusted lightness
    case 1: {
      // Use a smaller color wheel segment (like 60°)
      const hueRange = 60;
      const hueStep = hueRange / (count - 1);
      
      for (let i = 1; i < count; i++) {
        const hue = ((baseHue + (hueStep * i) - (hueRange / 2)) + 360) % 360;
        
        // Adjust lightness based on perceptual brightness of different hues
        let lightness = baseLightness;
        
        // Yellows need to be lighter to be perceptually equal
        if (hue >= 50 && hue <= 70) {
          lightness += 0.15;
        }
        // Blues need to be darker
        else if (hue >= 220 && hue <= 280) {
          lightness -= 0.05;
        }
        
        palette.push(hslToHexClean(hue, baseSaturation, lightness));
      }
      break;
    }
    
    // Pattern 2: Constant hue and saturation, precise lightness steps
    case 2: {
      // Create an array of evenly-spaced lightness values
      const lightnesses = [0.25, 0.4, 0.55, 0.7, 0.85];
      
      // Replace first entry with our base color
      lightnesses[0] = baseLightness;
      
      // Fill in the rest of the palette
      for (let i = 1; i < count; i++) {
        const saturation = Math.max(0.3, baseSaturation - ((lightnesses[i] - baseLightness) * 0.3));
        palette.push(hslToHexClean(baseHue, saturation, lightnesses[i]));
      }
      
      // Sort palette for better gradient
      return sortPaletteByLightness(palette);
    }
  }
  
  // Apply perceptual uniformity adjustments
  const adjustedPalette = palette.map(color => adjustForPerceptualUniformity(color));
  
  return adjustedPalette;
}

function analyzeHarmony(colors: TinyColorType[]): number {
  let harmonyScore = 0;
  const hslColors = colors.map(color => color.toHsl());
  
  // Get RGB values for neutral detection
  const rgbColors = colors.map(color => {
    // Check if the color has direct RGB access - fallback if not
    if (typeof color.toRgb === 'function') {
      const rgb = color.toRgb();
      return { r: rgb.r, g: rgb.g, b: rgb.b };
    } else {
      // Fallback using RGB from HSL if toRgb isn't available
      const hsl = color.toHsl();
      const [r, g, b] = hslToRgb(hsl.h/360, hsl.s, hsl.l);
      return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
    }
  });

  // Calculate hue range and spread - important for determining harmony
  const hues = hslColors.map(c => c.h);
  const maxHue = Math.max(...hues);
  const minHue = Math.min(...hues);
  
  // Account for wraparound at 360/0
  let hueRange = maxHue - minHue;
  if (hueRange > 180) {
    // Recalculate for wraparound
    const adjustedHues = hues.map(h => h > 180 ? h - 360 : h);
    hueRange = Math.max(...adjustedHues) - Math.min(...adjustedHues);
  }

  // Balanced scoring for different harmony types:
  // 1. Reward narrow hue ranges (monochromatic/analogous) but don't penalize
  //    complementary/triadic patterns that are properly executed
  if (hueRange < 30) {
    harmonyScore += 1.5; // Monochromatic (very harmonious)
  } else if (hueRange < 60) {
    harmonyScore += 1.2; // Analogous (quite harmonious)
  } else if (hueRange < 120) {
    harmonyScore += 1.0; // Moderately harmonious
  } else {
    // For wider ranges, reward intentional color relationships (complementary/triadic)
    // but not just random colors across the wheel
    
    // Check if there's evidence of complementary colors (colors ~180° apart)
    let complementaryScore = 0;
    for (let i = 0; i < hslColors.length; i++) {
      for (let j = i + 1; j < hslColors.length; j++) {
        const hueDiff = Math.min(Math.abs(hslColors[i].h - hslColors[j].h), 360 - Math.abs(hslColors[i].h - hslColors[j].h));
        if (Math.abs(hueDiff - 180) <= 20) complementaryScore += 0.2;
      }
    }
    
    // Check if there's evidence of triadic colors (colors ~120° apart)
    let triadicScore = 0;
    for (let i = 0; i < hslColors.length; i++) {
      for (let j = i + 1; j < hslColors.length; j++) {
        const hueDiff = Math.min(Math.abs(hslColors[i].h - hslColors[j].h), 360 - Math.abs(hslColors[i].h - hslColors[j].h));
        if (Math.abs(hueDiff - 120) <= 20) triadicScore += 0.2;
      }
    }
    
    // Reward intentional color relationships
    harmonyScore += Math.min(1.0, complementaryScore + triadicScore);
  }

  // Check for neutrals (grays, blacks, whites, beiges)
  const hasNeutrals = rgbColors.some(color => {
    const maxDiff = Math.max(
      Math.abs(color.r - color.g),
      Math.abs(color.r - color.b),
      Math.abs(color.g - color.b)
    );
    // Low RGB difference means it's closer to grayscale
    return maxDiff <= 30;
  });

  // Reward for including neutrals (research shows 95% of popular palettes include at least one neutral)
  if (hasNeutrals) {
    harmonyScore += 1.0;
  }

  // Check for monochromatic harmony - now more generous in definition
  // Research shows this is consistently the most harmonious palette type
  const isNearlyMonochromatic = hslColors.every(color => {
    const hueDiffs = hslColors.map(c => 
      Math.min(Math.abs(color.h - c.h), 360 - Math.abs(color.h - c.h))
    );
    return Math.max(...hueDiffs) < 40; // Allow more flexibility (40° vs 30° before)
  });
  
  if (isNearlyMonochromatic) {
    harmonyScore += 1.5; // Significantly increased reward
  }

  // Check for analogous harmony (colors within 30 degrees on the color wheel)
  // This is considered the second most harmonious palette type after monochromatic
  let analogousCount = 0;
  for (let i = 0; i < hslColors.length - 1; i++) {
    const hueDiff = Math.min(Math.abs(hslColors[i].h - hslColors[i + 1].h), 360 - Math.abs(hslColors[i].h - hslColors[i + 1].h));
    if (hueDiff <= 30) analogousCount++;
  }
  
  if (analogousCount >= colors.length - 1) {
    harmonyScore += 1.5; // Nearly all colors are analogous
  } else if (analogousCount >= colors.length / 2) {
    harmonyScore += 1.0; // At least half are analogous
  }

  // Check for complementary harmony (colors opposite on the color wheel)
  // This is more situational but can work well with careful balance
  let complementaryCount = 0;
  for (let i = 0; i < hslColors.length; i++) {
    for (let j = i + 1; j < hslColors.length; j++) {
      const hueDiff = Math.min(Math.abs(hslColors[i].h - hslColors[j].h), 360 - Math.abs(hslColors[i].h - hslColors[j].h));
      if (Math.abs(hueDiff - 180) <= 30) complementaryCount++;
    }
  }
  
  // Only reward complementary if there aren't too many of them
  // Too many complementary pairs can create chaos
  if (complementaryCount > 0 && complementaryCount <= 2) {
    harmonyScore += 1.0; // Some complementary harmony, but not excessive
  } else if (complementaryCount > 2) {
    harmonyScore += 0.5; // Too many might create visual tension
  }

  // Check for balanced saturation and lightness - more important than we initially thought
  const saturations = hslColors.map(color => color.s);
  const lightnesses = hslColors.map(color => color.l);
  
  const avgSaturation = saturations.reduce((a, b) => a + b, 0) / saturations.length;
  
  // Count how many vibrant accent colors we have (high saturation)
  const vibrantAccents = saturations.filter(s => s >= 0.7).length;
  
  // Reward for having 1-2 vibrant accent colors (research-based pattern)
  // Most harmonious palettes use a majority of moderate to low saturation colors
  // with just 1-2 saturated accents
  if (vibrantAccents >= 1 && vibrantAccents <= 2) {
    harmonyScore += 1.0;
  } else if (vibrantAccents > 2 && vibrantAccents <= 3) {
    harmonyScore += 0.6; // More vibrant colors, less harmonious but still usable
  } else if (vibrantAccents > 3) {
    harmonyScore += 0.2; // Too many vibrant colors, potentially jarring
  }
  
  // Check if we have a good distribution from dark to light
  // This is one of the most important factors for usable palettes
  const minLightness = Math.min(...lightnesses);
  const maxLightness = Math.max(...lightnesses);
  const lightnessRange = maxLightness - minLightness;
  
  // Reward good lightness range - a sign of well-balanced, usable palettes
  if (lightnessRange >= 0.5) {
    harmonyScore += 1.2; // Excellent range (dark to light)
  } else if (lightnessRange >= 0.3) {
    harmonyScore += 0.9; // Good range
  } else {
    harmonyScore += 0.4; // Limited range, less contrast
  }
  
  // Calculate color consistency score - some variety is good, but too many different 
  // hue families can be chaotic
  const hueGroups = [0, 0, 0, 0, 0, 0]; // Red, Orange/Yellow, Green, Teal, Blue, Purple/Pink
  
  for (const hsl of hslColors) {
    // Group hues into 6 families
    if ((hsl.h >= 330 || hsl.h < 30) && hsl.s > 0.2) {
      hueGroups[0]++; // Reds
    } else if (hsl.h >= 30 && hsl.h < 90 && hsl.s > 0.2) {
      hueGroups[1]++; // Orange/Yellow
    } else if (hsl.h >= 90 && hsl.h < 150 && hsl.s > 0.2) {
      hueGroups[2]++; // Green
    } else if (hsl.h >= 150 && hsl.h < 210 && hsl.s > 0.2) {
      hueGroups[3]++; // Teal
    } else if (hsl.h >= 210 && hsl.h < 270 && hsl.s > 0.2) {
      hueGroups[4]++; // Blue
    } else if (hsl.h >= 270 && hsl.h < 330 && hsl.s > 0.2) {
      hueGroups[5]++; // Purple/Pink
    }
  }
  
  // Count how many hue families have at least one color
  const activeHueFamilies = hueGroups.filter(count => count > 0).length;
  
  // Balanced reward approach - moderate diversity is fine, extreme diversity gets lower score
  // This allows for complementary/triadic while still penalizing chaotic palettes
  if (activeHueFamilies <= 2) {
    harmonyScore += 1.0; // Very consistent palette (1-2 hue families)
  } else if (activeHueFamilies === 3) {
    harmonyScore += 0.8; // Good diversity (3 hue families) - slightly higher than before
  } else if (activeHueFamilies === 4) {
    harmonyScore += 0.6; // Moderate diversity (can work in triadic/tetradic)
  } else {
    harmonyScore += 0.2; // Very high diversity, likely chaotic
  }
  
  // Normalize the harmony score
  return Math.min(harmonyScore / 5.0, 1.0);
}

// New function to create more harmonious golden ratio palettes
function createTightGoldenRatioPalette(baseHue: number, count: number = 5): string[] {
  const palette: string[] = [];
  const goldenRatioConjugate = 0.618033988749895; // 1/φ
  
  // For more harmonious results, we'll compress the hue range
  // by using a smaller step multiplier
  const angleMultiplier = 0.4; // Reduced from 1.0 to 0.4

  let h = baseHue / 360; // Normalize to 0-1
  const s = 0.65 + Math.random() * 0.2; // 65-85% saturation
  const l = 0.55 + Math.random() * 0.2; // 55-75% lightness
  
  for (let i = 0; i < count; i++) {
    // Use golden ratio to space colors evenly but with compressed range
    h = (h + goldenRatioConjugate * angleMultiplier) % 1;
    
    // Adjust saturation and lightness slightly for variety
    const adjustedS = Math.max(0.5, Math.min(0.95, s + (Math.random() * 0.1 - 0.05)));
    const adjustedL = Math.max(0.45, Math.min(0.9, l + (Math.random() * 0.2 - 0.1)));
    
    // Convert to HSL space for color creation
    palette.push(hslToHexClean(h * 360, adjustedS, adjustedL));
  }
  
  // Sort by lightness for better visual arrangement
  return sortPaletteByLightness(palette);
}

// ... existing code ...

// Add the color analysis function that was missing
export function analyzeColorPalette(colors: string[]): ColorAnalysis {
  if (colors.length < 2) {
    return {
      score: 0,
      advice: 'Please provide at least 2 colors for analysis.',
      harmony: 'unknown'
    };
  }

  // Convert colors to tinycolor objects for analysis
  const tinyColors = colors.map(color => tinycolor(color));
  
  // Analyze contrast between adjacent colors
  const contrastScore = analyzeContrast(tinyColors);
  
  // Analyze color harmony with our improved analyzer
  const harmonyScore = analyzeHarmony(tinyColors);
  
  // Calculate final score (weighted average)
  // Increase weight of harmony to 70% (from 60%)
  let finalScore = (harmonyScore * 0.7 + contrastScore * 0.3) * 10;
  
  // More realistic curve with less inflation for bad palettes
  finalScore = Math.min(10, finalScore);
  
  // Round to one decimal
  finalScore = Math.round(finalScore * 10) / 10;
  
  // Determine hue range for more specific advice
  const hues = tinyColors.map(color => color.toHsl().h);
  let maxHueDiff = 0;
  
  for (let i = 0; i < hues.length; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      const hueDiff = Math.min(Math.abs(hues[i] - hues[j]), 360 - Math.abs(hues[i] - hues[j]));
      maxHueDiff = Math.max(maxHueDiff, hueDiff);
    }
  }
  
  // Generate advice based on scores and hue range
  let advice = '';
  let harmonyType = '';
  
  // Determine palette type for more specific advice
  if (maxHueDiff < 30) {
    harmonyType = 'monochromatic';
  } else if (maxHueDiff < 60) {
    harmonyType = 'analogous';
  } else if (Math.abs(maxHueDiff - 180) < 30) {
    harmonyType = 'complementary';
  } else if (Math.abs(maxHueDiff - 120) < 30) {
    harmonyType = 'triadic';
  } else {
    harmonyType = 'mixed';
  }
  
  if (finalScore >= 8.5) {
    advice = 'Excellent color combination! The palette shows strong harmony and good contrast.';
  } else if (finalScore >= 7) {
    advice = 'Good color combination. Consider fine-tuning the contrast or saturation for even better results.';
  } else if (finalScore >= 5) {
    if (harmonyType === 'mixed') {
      advice = 'Decent palette, but would benefit from using fewer different hue families for better harmony.';
    } else {
      advice = 'Decent color combination. Try adjusting the colors to create more visual interest and better harmony.';
    }
  } else {
    if (maxHueDiff > 90) {
      advice = 'Consider using colors that are closer in hue to create a more harmonious palette.';
    } else {
      advice = 'Consider adjusting saturation and lightness levels for better balance and harmony.';
    }
  }

  return {
    score: finalScore,
    advice,
    harmony: harmonyScore >= 0.7 ? 'high' : harmonyScore >= 0.4 ? 'medium' : 'low'
  };
}

// Define type for TinyColor objects
type TinyColorType = ReturnType<typeof tinycolor>;

// Add a function to adjust colors for perceptual uniformity
function adjustForPerceptualUniformity(color: string): string {
  // Convert to HSL for adjustment
  const tc = tinycolor(color);
  const hsl = tc.toHsl();
  
  // Adjust saturation and lightness based on hue to compensate for 
  // perceptual differences in the HSL color space
  
  // Yellows appear less saturated and darker than blues at the same values
  if (hsl.h >= 50 && hsl.h <= 70) {
    // Boost saturation and lightness for yellows
    hsl.s = Math.min(1, hsl.s * 1.1);
    hsl.l = Math.min(1, hsl.l * 1.05);
  }
  
  // Blues can appear darker
  if (hsl.h >= 220 && hsl.h <= 260) {
    hsl.l = Math.min(1, hsl.l * 1.08);
  }
  
  // Greens can appear more saturated
  if (hsl.h >= 90 && hsl.h <= 150) {
    hsl.s = Math.max(0.2, hsl.s * 0.95);
  }
  
  // Convert back to hex using our existing function
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

// Enhanced function to check similarity to recent palettes
function isTooSimilarToRecentPalettes(palette: string[]): boolean {
  if (recentPalettes.length === 0) return false;
  
  // Get palette category
  const category = categorizePalette(palette);
  
  // Count recent palettes in same category
  let sameCategoryCount = 0;
  let matchingPaletteCount = 0;
  
  // Count identical colors
  let recentColorOccurrences: Record<string, number> = {};
  
  // Track categories of recent palettes
  for (const recentPalette of recentPalettes) {
    const recentCategory = categorizePalette(recentPalette);
    
    if (recentCategory === category) {
      sameCategoryCount++;
    }
    
    // Check for color overlap
    let matchCount = 0;
    for (const color of palette) {
      const normalizedColor = color.toUpperCase();
      // Count occurrences of this color
      if (!recentColorOccurrences[normalizedColor]) {
        recentColorOccurrences[normalizedColor] = 0;
      }
      recentColorOccurrences[normalizedColor]++;
      
      // Check if this exact color appears in recent palette
      if (recentPalette.some(rc => rc.toUpperCase() === normalizedColor)) {
        matchCount++;
      }
    }
    
    // If 3+ colors match exactly, it's too similar
    if (matchCount >= 3) {
      matchingPaletteCount++;
    }
  }
  
  // Detect overused colors in recent palettes
  const overusedColors = Object.entries(recentColorOccurrences)
    .filter(([_, count]) => count >= 3)
    .map(([color, _]) => color);
  
  // Count how many overused colors are in this palette
  const overusedColorCount = palette.filter(color => 
    overusedColors.includes(color.toUpperCase())
  ).length;
  
  // Criteria for rejecting a palette:
  // 1. Same category appears in over 40% of recent palettes (prevents category repetition)
  // 2. Very similar palette already exists (prevents near-duplicates)
  // 3. Too many overused colors in one palette (forces color diversity)
  return (
    (sameCategoryCount > MAX_RECENT_PALETTES * 0.4) || 
    (matchingPaletteCount > 0) ||
    (overusedColorCount >= 3)
  );
}

// Add this new function to enhance palette diversity based on color families
function categorizePalette(palette: string[]): string {
  // Convert palette to HSL to detect color family patterns
  const hslValues = palette.map(color => {
    const tc = tinycolor(color);
    return tc.toHsl();
  });
  
  // Count colors in each basic color family
  const families: Record<string, number> = {
    red: 0,
    orange: 0,
    yellow: 0,
    green: 0,
    teal: 0,
    blue: 0,
    purple: 0,
    pink: 0,
    neutral: 0
  };
  
  // Classify each color by hue range
  for (const hsl of hslValues) {
    const { h, s, l } = hsl;
    
    // Low saturation or extreme lightness = neutral
    if (s < 0.15 || l > 0.9 || l < 0.1) {
      families.neutral++;
      continue;
    }
    
    // Classify by hue
    if (h >= 345 || h < 10) families.red++;
    else if (h >= 10 && h < 40) families.orange++;
    else if (h >= 40 && h < 70) families.yellow++;
    else if (h >= 70 && h < 150) families.green++;
    else if (h >= 150 && h < 190) families.teal++;
    else if (h >= 190 && h < 260) families.blue++;
    else if (h >= 260 && h < 300) families.purple++;
    else if (h >= 300 && h < 345) families.pink++;
  }
  
  // Find dominant and secondary color families
  let dominant = "mixed";
  let maxCount = 0;
  
  for (const [family, count] of Object.entries(families)) {
    if (count > maxCount) {
      maxCount = count;
      dominant = family;
    }
  }
  
  // If most colors are in one family, categorize by that family
  if (maxCount >= 3) {
    return dominant;
  }
  
  // Check for common patterns
  const purpleBlue = families.purple + families.blue >= 3;
  const redOrange = families.red + families.orange >= 3;
  const greenYellow = families.green + families.yellow >= 3;
  
  if (purpleBlue) return "purple-blue";
  if (redOrange) return "red-orange";
  if (greenYellow) return "green-yellow";
  
  // Determine if it's a rainbow palette
  const colorCount = Object.values(families).filter(count => count > 0).length;
  if (colorCount >= 4) return "rainbow";
  
  // Monochromatic detection (variations of a single color)
  const hueRange = Math.max(...hslValues.map(h => h.h)) - Math.min(...hslValues.map(h => h.h));
  if (hueRange < 30 || hueRange > 330) return "monochromatic";
  
  return "mixed";
}


// Define color role constraints for professional-grade palettes
interface ColorRoleConstraints {
  minLuminance?: number;
  maxLuminance?: number;
  minChroma?: number;
  maxChroma?: number;
  hueRange?: [number, number];
  baseHueOffset?: number;
}

const COLOR_ROLE_CONSTRAINTS: {[key: string]: ColorRoleConstraints} = {
  dominant: {
    minLuminance: 0.4,
    maxLuminance: 0.7,
    minChroma: 50
  },
  accent: {
    minLuminance: 0.65,
    maxLuminance: 0.9,
    minChroma: 70
  },
  neutral: {
    minLuminance: 0.8,
    maxLuminance: 0.95,
    maxChroma: 15
  },
  dark: {
    minLuminance: 0.05,
    maxLuminance: 0.3,
    maxChroma: 40
  },
  supporting: {
    minLuminance: 0.45,
    maxLuminance: 0.85,
    minChroma: 30,
    maxChroma: 80
  }
};

// Function to generate a professional-grade color palette
function generateProfessionalPalette(baseHue: number): string[] {
  // Define the palette structure with roles
  const paletteStructure = [
    { role: 'dominant', hueOffset: 0 },
    { role: 'supporting', hueOffset: Math.random() < 0.5 ? 30 : -30 },
    { role: Math.random() < 0.7 ? 'accent' : 'supporting', hueOffset: Math.random() < 0.5 ? 150 : 180 },
    { role: Math.random() < 0.3 ? 'dark' : 'supporting', hueOffset: Math.random() < 0.5 ? 60 : -60 },
    { role: Math.random() < 0.3 ? 'neutral' : 'supporting', hueOffset: Math.random() < 0.5 ? 15 : -15 }
  ];

  // Helper function to generate a color based on role constraints
  const generateColorForRole = (role: string, baseHue: number, hueOffset: number): string => {
    const constraints = COLOR_ROLE_CONSTRAINTS[role] || COLOR_ROLE_CONSTRAINTS.supporting;
    const tc = tinycolor({ h: normalizeHue(baseHue + hueOffset), s: 1, l: 0.5 } as any);
    
    // Get the initial color's LCH values (approximated)
    const rgb = tc.toRgb();
    
    // Adjust based on role constraints
    let luminance = constraints.minLuminance !== undefined && constraints.maxLuminance !== undefined
      ? constraints.minLuminance + Math.random() * (constraints.maxLuminance - constraints.minLuminance)
      : 0.5;
      
    let chroma = constraints.minChroma !== undefined && constraints.maxChroma !== undefined
      ? constraints.minChroma + Math.random() * (constraints.maxChroma - constraints.minChroma)
      : 50;
    
    // Apply adjustments to create visually interesting variations
    // 25% chance of slight texture effect
    if (Math.random() < 0.25) {
      luminance += (Math.random() * 0.1 - 0.05); // ±5% luminance variation
      chroma += (Math.random() * 10 - 5); // ±5 chroma variation
    }
    
    // Adjust luminance to avoid muddy mid-tones
    if (luminance > 0.35 && luminance < 0.55) {
      luminance += (luminance < 0.45) ? -0.1 : 0.1;
    }
    
    // Fine-tune based on hue
    const finalHue = normalizeHue(baseHue + hueOffset);
    
    // Special handling for particular hue ranges
    if (finalHue >= 0 && finalHue <= 30) {
      // Reds and oranges
      chroma = Math.min(chroma * 1.1, 100); // Boost chroma
    } else if (finalHue > 60 && finalHue <= 150) {
      // Greens - often need contrast adjustment
      if (luminance > 0.6) luminance = Math.min(luminance * 1.05, 0.95);
      if (luminance < 0.3) luminance = Math.max(luminance * 0.95, 0.05);
    } else if (finalHue > 180 && finalHue <= 270) {
      // Blues and purples
      if (luminance < 0.4) chroma = Math.min(chroma * 1.15, 100); // Deeper blues need more chroma
    }
    
    // Convert back to sRGB
    return hslToHexClean(finalHue, chroma / 100, luminance);
  };

  // Generate the palette
  const palette = paletteStructure.map(({ role, hueOffset }) => {
    return generateColorForRole(role, baseHue, hueOffset);
  });

  // Post-process to optimize contrast
  return optimizePaletteContrast(palette);
}

// Function to optimize contrast between colors in a palette
function optimizePaletteContrast(palette: string[]): string[] {
  const optimized = [...palette];
  
  // Check adjacent colors for sufficient contrast
  for (let i = 0; i < optimized.length - 1; i++) {
    const color1 = tinycolor(optimized[i]) as any;
    const color2 = tinycolor(optimized[i + 1]) as any;
    
    // Calculate contrast ratio
    const contrast = (tinycolor as any).readability(color1, color2);
    
    // If contrast is too low, adjust the lighter color
    if (contrast < 2.5) { // WCAG AA requires 4.5 for text, but we're less strict for design palettes
      const lum1 = color1.getLuminance();
      const lum2 = color2.getLuminance();
      
      if (lum1 > lum2) {
        // Lighten the lighter color
        optimized[i] = color1.lighten(10).toHexString();
      } else {
        // Lighten the lighter color
        optimized[i + 1] = color2.lighten(10).toHexString();
      }
    }
  }
  
  // Add subtle texture/noise to each color (5% chance per color)
  return optimized.map(color => {
    if (Math.random() < 0.05) {
      const tc = tinycolor(color) as any;
      const hsv = tc.toHsv();
      
      hsv.h = (hsv.h + (Math.random() * 4 - 2)) % 360; // ±2 hue
      hsv.s = Math.max(0, Math.min(1, hsv.s + (Math.random() * 0.04 - 0.02))); // ±2% saturation
      hsv.v = Math.max(0, Math.min(1, hsv.v + (Math.random() * 0.04 - 0.02))); // ±2% value
      
      return tinycolor(hsv).toHexString();
    }
    return color;
  });
}

// Modify the existing generateHarmoniousPalette function

