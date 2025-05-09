import tinycolor from 'tinycolor2';
import convert from 'color-convert';

// Cast tinycolor to any to avoid type errors
const tinycolorLib: any = tinycolor;

// Type definitions
export interface LCH {
  l: number; // Lightness (0-100)
  c: number; // Chroma (0-130+)
  h: number; // Hue (0-360 degrees)
}

export interface PaletteConfig {
  harmonyType: 'monochromatic' | 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'splitComplementary';
  count: number;
  contrastEnhance: boolean;
  toneDistribution: 'even' | 'dark-bias' | 'light-bias';
  saturationPreference: 'balanced' | 'vibrant' | 'muted';
}

/**
 * Convert a hex color to CIE LCh
 */
export function hexToLch(hex: string): LCH {
  // Normalize and validate hex
  hex = hex.replace('#', '').toUpperCase();
  if (!/^[0-9A-F]{6}$/i.test(hex)) {
    // Default to a mid-blue if invalid
    hex = '3366FF';
  }
  
  try {
    // First convert to Lab using color-convert
    const lab = convert.hex.lab(hex);
    // Then convert Lab to LCh
    const lch = convert.lab.lch(lab);
    
    return {
      l: lch[0],
      c: lch[1],
      h: lch[2]
    };
  } catch (error) {
    // Fallback to a safe default if conversion fails
    console.error("Error converting hex to LCh:", error);
    return { l: 60, c: 80, h: 240 }; // Safe vibrant blue
  }
}

/**
 * Convert LCh to hex with improved gamut mapping to avoid muddy colors
 */
export function lchToHex(lch: LCH): string {
  // Normalize LCh values to valid ranges
  const normalizedLch = {
    l: Math.max(0, Math.min(100, lch.l)),
    c: Math.max(0, Math.min(150, lch.c)), // Increased max chroma for vibrance
    h: ((lch.h % 360) + 360) % 360 // Ensure 0-360 range
  };
  
  try {
    // Try direct conversion first
    const lab = convert.lch.lab([normalizedLch.l, normalizedLch.c, normalizedLch.h]);
    const hex = convert.lab.hex(lab);
    
    return `#${hex.toUpperCase()}`;
  } catch (error) {
    // If conversion fails (e.g., out of gamut), use improved clamping
    return improvedGamutMapping(normalizedLch);
  }
}

/**
 * Improved gamut mapping for more vibrant colors - uses binary search to find
 * the maximum possible chroma while maintaining the color's hue and lightness
 */
function improvedGamutMapping(lch: LCH): string {
  // Start with binary search for maximum in-gamut chroma
  let minC = 0;
  let maxC = lch.c;
  let bestChroma = 0;
  let bestHex = "#000000";
  
  // Try up to 12 steps of binary search for precision
  for (let i = 0; i < 12; i++) {
    const midC = (minC + maxC) / 2;
    
    try {
      const lab = convert.lch.lab([lch.l, midC, lch.h]);
      const hex = convert.lab.hex(lab);
      bestHex = `#${hex.toUpperCase()}`;
      bestChroma = midC;
      
      // This chroma worked, so try higher
      minC = midC;
    } catch (error) {
      // Too high, try lower
      maxC = midC;
    }
  }
  
  // If we found a good color, use it
  if (bestChroma > 0) {
    return bestHex;
  }
  
  // If binary search failed completely, try adaptive approach
  // First, try keeping the same hue and lightness but with very low chroma
  try {
    const lab = convert.lch.lab([lch.l, 5, lch.h]);
    const hex = convert.lab.hex(lab);
    return `#${hex.toUpperCase()}`;
  } catch (error) {
    // If that fails, adapt the lightness based on hue to find in-gamut color
    const adjustedL = adaptLightnessForHue(lch.h, lch.l);
    
    try {
      const lab = convert.lch.lab([adjustedL, 25, lch.h]);
      const hex = convert.lab.hex(lab);
      return `#${hex.toUpperCase()}`;
    } catch (error) {
      // Last resort - use HSL color space for predictable results
      return tinycolorLib({
        h: lch.h, 
        s: 0.7, 
        l: lch.l / 100
      }).toHexString().toUpperCase();
    }
  }
}

/**
 * Adapt lightness based on hue to handle gamut boundaries better
 * Different hues have different maximum chroma at different lightness levels
 */
function adaptLightnessForHue(hue: number, lightness: number): number {
  // For blues and purples (high chroma at mid lightness)
  if ((hue >= 240 && hue <= 300)) {
    return Math.min(80, Math.max(30, lightness));
  }
  // For greens (limited chroma at all lightness)
  else if (hue >= 90 && hue <= 160) {
    return Math.min(85, Math.max(40, lightness));
  }
  // For yellows (high chroma only at high lightness)
  else if (hue >= 40 && hue <= 80) {
    return Math.min(95, Math.max(70, lightness));
  }
  // For reds (high chroma at low-mid lightness)
  else if ((hue >= 0 && hue <= 30) || hue >= 330) {
    return Math.min(65, Math.max(25, lightness));
  }
  // For others, moderate adjustment
  return Math.min(85, Math.max(25, lightness));
}

/**
 * Calculate more accurate Delta E (CIEDE2000) between two LCh colors
 * Higher values indicate greater perceptual difference
 */
export function calculateDeltaE(lch1: LCH, lch2: LCH): number {
  // Convert LCh back to Lab for Delta E calculation
  const lab1 = convert.lch.lab([lch1.l, lch1.c, lch1.h]);
  const lab2 = convert.lch.lab([lch2.l, lch2.c, lch2.h]);
  
  // Improved CIEDE2000 approximation
  const L1 = lab1[0];
  const a1 = lab1[1];
  const b1 = lab1[2];
  
  const L2 = lab2[0];
  const a2 = lab2[1];
  const b2 = lab2[2];
  
  // Weighted components with parameters closer to CIEDE2000
  const dL = L1 - L2;
  
  // Calculate chroma
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const dC = C1 - C2;
  
  // Calculate a' and b' components
  const da = a1 - a2;
  const db = b1 - b2;
  
  // Calculate hue difference
  let dH = Math.sqrt(Math.max(0, da*da + db*db - dC*dC));
  
  // Give extra weight to lightness and chroma differences for better contrast perception
  const lightnessFactor = 1.5;
  const chromaFactor = 1.2;
  
  // Calculate an improved deltaE with weighted components
  const deltaE = Math.sqrt(
    Math.pow(dL * lightnessFactor, 2) + 
    Math.pow(dC * chromaFactor, 2) + 
    Math.pow(dH, 2)
  );
  
  return deltaE;
}

/**
 * Calculate harmony score - how well a palette matches desired harmony
 * Lower is better (0 = perfect)
 */
export function calculateHarmonyScore(colors: LCH[], harmonyType: string): number {
  if (colors.length < 2) return 0;
  
  const baseHue = colors[0].h;
  let targetAngles: number[] = [];
  
  // Calculate ideal hue angles based on harmony type
  switch (harmonyType) {
    case 'monochromatic':
      // All colors should have the same hue
      targetAngles = colors.map(() => baseHue);
      break;
      
    case 'complementary':
      // Base color and its complement, others can be variations
      targetAngles = [baseHue];
      for (let i = 1; i < colors.length; i++) {
        targetAngles.push(i % 2 === 0 ? baseHue : (baseHue + 180) % 360);
      }
      break;
      
    case 'analogous':
      // Colors adjacent on wheel with golden ratio distribution
      const analogousRange = 60; // total range in degrees
      for (let i = 0; i < colors.length; i++) {
        const normalizedPos = i / (colors.length - 1 || 1); // 0 to 1
        const offset = (normalizedPos - 0.5) * analogousRange;
        targetAngles.push((baseHue + offset + 360) % 360);
      }
      break;
      
    case 'triadic':
      // Three colors evenly spaced at 120° intervals
      targetAngles = colors.map((_, i) => {
        return (baseHue + (i % 3) * 120) % 360;
      });
      break;
      
    case 'tetradic':
      // Four colors evenly spaced at 90° intervals
      targetAngles = colors.map((_, i) => {
        return (baseHue + (i % 4) * 90) % 360;
      });
      break;
      
    case 'splitComplementary':
      // Base color plus two colors 150° and 210° from base
      targetAngles = [baseHue];
      for (let i = 1; i < colors.length; i++) {
        const offset = i % 3 === 1 ? 150 : (i % 3 === 2 ? 210 : 0);
        targetAngles.push((baseHue + offset) % 360);
      }
      break;
      
    default:
      // Default to even spacing
      const step = 360 / colors.length;
      targetAngles = colors.map((_, i) => (baseHue + i * step) % 360);
  }
  
  // Calculate the sum of squared deviations from target angles
  let score = 0;
  for (let i = 0; i < colors.length; i++) {
    const hue = colors[i].h;
    const target = targetAngles[i % targetAngles.length]; // Use modulo to handle more colors than targets
    
    // Account for the circular nature of hues
    const diff = Math.min(
      Math.abs(hue - target),
      360 - Math.abs(hue - target)
    );
    
    // Square the difference and give more weight to the base color relationships
    const weight = i < 2 ? 1.5 : 1.0; // More weight on base color and first relationship
    score += Math.pow(diff, 2) * weight;
  }
  
  return Math.sqrt(score / colors.length);
}

/**
 * Calculate contrast score for a palette
 * Higher is better (indicates good contrast between colors)
 */
export function calculateContrastScore(colors: LCH[]): number {
  if (colors.length < 2) return 0;
  
  let totalContrast = 0;
  let minContrast = Infinity;
  let adjacentContrast = 0;
  
  // Compare each pair of colors
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const contrast = calculateDeltaE(colors[i], colors[j]);
      minContrast = Math.min(minContrast, contrast);
      totalContrast += contrast;
      
      // Check if these are adjacent colors in the palette
      if (Math.abs(i - j) === 1) {
        adjacentContrast += contrast;
      }
    }
  }
  
  // Number of pairs compared
  const numPairs = (colors.length * (colors.length - 1)) / 2;
  const numAdjacent = colors.length - 1;
  
  // Calculate average contrasts
  const avgContrast = totalContrast / numPairs;
  const avgAdjacentContrast = adjacentContrast / numAdjacent;
  
  // Weight different aspects of contrast:
  // - Minimum contrast (avoid any similar colors) - most important
  // - Average contrast (overall diversity)
  // - Adjacent contrast (visual flow in the palette)
  return (minContrast * 0.6) + (avgContrast * 0.25) + (avgAdjacentContrast * 0.15);
}

/**
 * Calculate tone distribution score
 * Lower is better (0 = perfect even distribution)
 */
export function calculateToneDistributionScore(colors: LCH[], preference: string = 'even'): number {
  if (colors.length < 2) return 0;
  
  // Sort by lightness
  const sortedByLightness = [...colors].sort((a, b) => a.l - b.l);
  
  // Calculate target lightness values based on preference
  const targetLightness = sortedByLightness.map((_, i) => {
    const ratio = i / (colors.length - 1 || 1);
    
    if (preference === 'even') {
      // Even distribution from 15 to 90
      return 15 + ratio * 75;
    } else if (preference === 'dark-bias') {
      // More dark colors, fewer light colors (cubic curve)
      return 10 + Math.pow(ratio, 1.5) * 85;
    } else if (preference === 'light-bias') {
      // More light colors, fewer dark ones (square root curve)
      return 20 + Math.pow(ratio, 0.6) * 70;
    }
    return 15 + ratio * 75;
  });
  
  // Score based on deviation from target
  let score = 0;
  for (let i = 0; i < colors.length; i++) {
    const diff = Math.abs(sortedByLightness[i].l - targetLightness[i]);
    score += diff * diff;
  }
  
  return Math.sqrt(score / colors.length);
}

/**
 * Calculate saturation distribution score with improved metrics for vibrance
 * Lower is better (0 = perfect distribution)
 */
export function calculateSaturationScore(colors: LCH[], preference: string = 'balanced'): number {
  if (colors.length < 2) return 0;
  
  // Target chroma ranges based on preference
  let minTarget: number;
  let maxTarget: number;
  let optimalTarget: number;
  
  switch (preference) {
    case 'vibrant':
      minTarget = 60;  // Much higher minimum for vibrance
      maxTarget = 140; // Higher maximum
      optimalTarget = 90; // Optimal value
      break;
    case 'muted':
      minTarget = 15;
      maxTarget = 50;
      optimalTarget = 30;
      break;
    case 'balanced':
    default:
      minTarget = 40;  // Higher minimum to avoid muddy colors
      maxTarget = 100;
      optimalTarget = 70;
      break;
  }
  
  // Calculate score based on deviation from target range
  let score = 0;
  for (const color of colors) {
    if (color.c < minTarget) {
      // Heavily penalize colors below minimum (muddy colors)
      score += Math.pow(minTarget - color.c, 2) * 1.5;
    } else if (color.c > maxTarget) {
      score += Math.pow(color.c - maxTarget, 2);
    } else {
      // Small penalty for being away from the optimal target
      score += Math.pow(color.c - optimalTarget, 2) * 0.1;
    }
  }
  
  return Math.sqrt(score / colors.length);
} 