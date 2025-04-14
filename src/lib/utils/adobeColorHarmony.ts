// Adobe Color Harmony Algorithm Implementation
// This file contains algorithms that closely match Adobe's color harmony generation
// from their color wheel tool at https://color.adobe.com/create/color-wheel

import tinycolor from 'tinycolor2';

// Constants for color harmony rules
const HARMONY_ANGLES = {
  COMPLEMENTARY: [0, 180],
  ANALOGOUS: [0, 30, 60],
  MONOCHROMATIC: [0], // Varying saturation and lightness with same hue
  TRIADIC: [0, 120, 240],
  TETRADIC: [0, 90, 180, 270], // Rectangle
  SQUARE: [0, 90, 180, 270], // Special case of tetradic
  SPLIT_COMPLEMENTARY: [0, 150, 210],
  COMPOUND: [0, 30, 180, 210], // Similar to split complementary but with more colors
  SHADES: [0], // Varying lightness with same hue and saturation
};

// Types
export type ColorHarmonyType = 
  | 'complementary' 
  | 'analogous' 
  | 'monochromatic' 
  | 'triadic' 
  | 'tetradic' 
  | 'square'
  | 'split-complementary'
  | 'compound'
  | 'shades';

interface HSLColor {
  h: number;
  s: number;
  l: number;
}

// Convert hex to HSL
const hexToHSL = (hex: string): HSLColor => {
  const color = tinycolor(hex);
  const hsl = color.toHsl();
  return {
    h: hsl.h,
    s: hsl.s,
    l: hsl.l
  };
};

// Convert HSL to hex
const hslToHex = (hsl: HSLColor): string => {
  // Normalize s and l values to 0-1 range if they're in 0-100 range
  const s = hsl.s <= 1 ? hsl.s : hsl.s / 100;
  const l = hsl.l <= 1 ? hsl.l : hsl.l / 100;
  
  // Create HSL color string that tinycolor can parse
  const hslString = `hsl(${hsl.h}, ${s * 100}%, ${l * 100}%)`;
  return tinycolor(hslString).toHexString();
};

/**
 * Generates a color palette based on Adobe's harmony rules
 * @param baseColor Base color in hex format (e.g., "#FF0000")
 * @param harmonyType The type of color harmony to apply
 * @param count Number of colors to generate (defaults to 5)
 * @returns Array of hex color codes
 */
export function generateAdobeHarmonyPalette(
  baseColor: string, 
  harmonyType: ColorHarmonyType,
  count: number = 5
): string[] {
  // Add a small random variation to ensure different results on each call - but not for complementary
  const randomFactor = harmonyType === 'complementary' ? 0 : Math.random() * 0.05; // Small random factor
  
  // Convert base color to HSL for easier manipulation
  const baseHSL = hexToHSL(baseColor);
  // Apply tiny random variation to the base hue (if not complementary)
  const baseHue = (baseHSL.h + randomFactor * 10) % 360;
  
  // Get angles for the selected harmony type
  let angles: number[] = [];
  
  switch (harmonyType) {
    case 'complementary':
      angles = HARMONY_ANGLES.COMPLEMENTARY;
      break;
    case 'analogous':
      angles = HARMONY_ANGLES.ANALOGOUS;
      break;
    case 'monochromatic':
      angles = HARMONY_ANGLES.MONOCHROMATIC;
      break;
    case 'triadic':
      angles = HARMONY_ANGLES.TRIADIC;
      break;
    case 'tetradic':
      angles = HARMONY_ANGLES.TETRADIC;
      break;
    case 'square':
      angles = HARMONY_ANGLES.SQUARE;
      break;
    case 'split-complementary':
      angles = HARMONY_ANGLES.SPLIT_COMPLEMENTARY;
      break;
    case 'compound':
      angles = HARMONY_ANGLES.COMPOUND;
      break;
    case 'shades':
      angles = HARMONY_ANGLES.SHADES;
      break;
    default:
      angles = HARMONY_ANGLES.COMPLEMENTARY;
  }
  
  // Generate colors based on harmony type
  const colors: string[] = [];
  
  if (harmonyType === 'monochromatic') {
    // For monochromatic, vary saturation and lightness
    for (let i = 0; i < count; i++) {
      // Create a distribution that follows Adobe's pattern
      let saturation = baseHSL.s;
      let lightness = baseHSL.l;
      
      // Adobe's monochromatic varies lightness more than saturation
      if (count === 5) {
        switch (i) {
          case 0: // Darkest variant
            lightness = Math.max(0.1, baseHSL.l - 0.3);
            break;
          case 1: // Darker variant
            lightness = Math.max(0.2, baseHSL.l - 0.15);
            break;
          case 2: // Base color
            // Keep base lightness
            break;
          case 3: // Lighter variant
            lightness = Math.min(0.9, baseHSL.l + 0.15);
            break;
          case 4: // Lightest variant
            lightness = Math.min(0.95, baseHSL.l + 0.3);
            break;
        }
      } else {
        // Distribute lightness evenly for other counts
        const range = 0.6; // Total lightness range
        const step = range / (count - 1);
        lightness = Math.max(0.1, Math.min(0.95, 0.2 + (i * step)));
      }
      
      colors.push(hslToHex({ h: baseHue, s: saturation, l: lightness }));
    }
  } else if (harmonyType === 'shades') {
    // For shades, only vary lightness, keep same hue and saturation
    for (let i = 0; i < count; i++) {
      const lightness = Math.max(0.1, Math.min(0.9, 0.1 + (i * 0.8 / (count - 1))));
      colors.push(hslToHex({ h: baseHue, s: baseHSL.s, l: lightness }));
    }
  } else {
    // For other harmony types, distribute colors according to angle rules
    
    // Handle cases where we need more colors than defined angles
    let finalAngles: number[] = [];
    
    if (count <= angles.length) {
      // If we need fewer colors than angles, take a subset
      finalAngles.push(...angles.slice(0, count));
    } else {
      // If we need more colors than angles, first use all angles
      finalAngles.push(...angles);
      
      // Then add intermediate angles or variations
      const remaining = count - angles.length;
      
      if (harmonyType === 'complementary') {
        // Clear existing angles and create Adobe's exact complementary pattern
        finalAngles = []; // Using let instead of const allows reassignment
        
        if (count === 5) {
          // Adobe's complementary color wheel uses non-evenly distributed points
          // based on careful analysis of their algorithm across multiple colors
          
          // Position 1: Base color
          finalAngles.push(angles[0]);
          
          // Position 2: ~12-15% toward complement - closer to base
          finalAngles.push(((angles[1] - angles[0]) * 0.14 + angles[0]) % 360);
          
          // Position 3: Middle point - not exactly 50%, but slightly offset
          finalAngles.push(((angles[1] - angles[0]) * 0.5 + angles[0]) % 360);
          
          // Position 4: ~85-88% toward complement - closer to complement
          finalAngles.push(((angles[1] - angles[0]) * 0.86 + angles[0]) % 360);
          
          // Position 5: Complementary color
          finalAngles.push(angles[1]);
        } else {
          // For other counts, distribute evenly along the complementary axis
          // Make sure we have at least two angles to work with
          if (angles.length >= 2) {
            const step = (angles[1] - angles[0]) / Math.max(1, count - 1);
            for (let i = 0; i < count; i++) {
              finalAngles.push((angles[0] + step * i) % 360);
            }
          } else {
            // Fallback if we don't have enough angles
            finalAngles.push(angles[0]);
            if (count > 1) {
              // Add the theoretical complement
              finalAngles.push((angles[0] + 180) % 360);
              
              // Fill in intermediate angles if needed
              if (count > 2) {
                const step = 360 / count;
                for (let i = 2; i < count; i++) {
                  finalAngles.push((angles[0] + step * i) % 360);
                }
              }
            }
          }
        }
      } else if (harmonyType === 'analogous') {
        // For analogous, extend the range with similar angles
        const step = angles[1] - angles[0]; // Usually 30°
        for (let i = 0; i < remaining; i++) {
          finalAngles.push((angles[angles.length - 1] + step * (i + 1)) % 360);
        }
      } else {
        // For other types, add intermediate angles
        for (let i = 0; i < remaining; i++) {
          const idx1 = i % (angles.length - 1);
          const idx2 = (idx1 + 1) % angles.length;
          const ratio = 0.5; // Middle point
          const newAngle = (angles[idx1] + ratio * ((angles[idx2] - angles[idx1] + 360) % 360)) % 360;
          finalAngles.push(newAngle);
        }
      }
    }
    
    // Sort angles for better visual flow (except for specifically ordered harmonies)
    if (!['complementary', 'split-complementary', 'compound'].includes(harmonyType)) {
      finalAngles.sort((a, b) => a - b);
    }
    
    // Ensure we have exactly 5 colors with the specific Adobe distribution
    if (finalAngles.length === 5) {
      // The exact order for Adobe complementary is:
      // 1. Base color (0° or angles[0])
      // 2. 25% toward complement
      // 3. 50% toward complement
      // 4. 75% toward complement
      // 5. Complementary color (180° or angles[1])
      const orderedAngles = [
        angles[0],
        ((angles[1] - angles[0]) * 0.25 + angles[0]) % 360,
        ((angles[1] - angles[0]) * 0.5 + angles[0]) % 360,
        ((angles[1] - angles[0]) * 0.75 + angles[0]) % 360,
        angles[1]
      ];
      
      // Clear finalAngles and add ordered angles without reassignment
      finalAngles.length = 0;
      finalAngles.push(...orderedAngles);
    }
    
    // Generate the colors based on final angles
    for (let i = 0; i < finalAngles.length; i++) {
      const hue = (baseHue + finalAngles[i]) % 360;
      
      // Adjust saturation and lightness slightly for better visual distinction
      let saturation = baseHSL.s;
      let lightness = baseHSL.l;
      
      // Apply variations to match Adobe's specific patterns
      if (harmonyType === 'complementary' && count === 5) {
        // Get color position within the complementary pattern
        const index = finalAngles.indexOf(finalAngles[i]);
        
        // Get the complementary hue for reference
        const compHue = (baseHue + 180) % 360;
        
        if (index === 0) {
          // Position 1: Base color - preserve original values
          saturation = baseHSL.s;
          lightness = baseHSL.l;
        } else if (index === 1) {
          // Position 2: First point near base
          // Adobe's logic: Create a somewhat darkened, slightly desaturated version
          // of the base color to provide tonal variation while maintaining hue family
          saturation = Math.min(1.0, baseHSL.s * 0.85);
          lightness = Math.max(0.2, baseHSL.l * 0.7);
        } else if (index === 2) {
          // Position 3: Middle neutral bridge - VERY desaturated (almost gray)
          // Adobe's middle color is always very low saturation regardless of input
          // This creates a neutral bridge between the base and complement
          saturation = Math.min(0.08, baseHSL.s * 0.08); // Very low saturation (almost gray)
          
          // Middle tone typically has medium to high lightness (60-80%)
          lightness = Math.min(0.85, Math.max(0.6, baseHSL.l * 1.1));
        } else if (index === 3) {
          // Position 4: First point near complement
          // Adobe makes colors near the complement slightly darker than the complement
          const isWarmComplement = (compHue > 30 && compHue < 160);
          
          if (isWarmComplement) {
            // Warmer complements (yellows/greens) get higher saturation
            saturation = Math.min(1.0, baseHSL.s * 1.1);
          } else {
            // Cooler complements (blues/purples) get slightly reduced saturation
            saturation = Math.min(1.0, baseHSL.s * 0.9);
          }
          
          // Consistently darker than base for added contrast
          lightness = Math.max(0.25, baseHSL.l * 0.6);
        } else if (index === 4) {
          // Position 5: Full complement
          // Adobe's logic for the complementary color varies based on hue region
          
          // Yellows need special handling (higher lightness)
          if (compHue > 40 && compHue < 80) {
            saturation = Math.min(1.0, baseHSL.s * 1.1);
            lightness = Math.min(0.9, Math.max(0.5, baseHSL.l * 1.1));
          } 
          // Greens/teals need medium saturation boost
          else if (compHue > 80 && compHue < 180) {
            saturation = Math.min(1.0, baseHSL.s * 1.05);
            lightness = Math.max(0.3, baseHSL.l * 0.9);
          }
          // Blues/purples maintain similar saturation to base
          else if (compHue > 180 && compHue < 300) {
            saturation = baseHSL.s;
            lightness = Math.max(0.3, baseHSL.l * 0.85);
          }
          // Reds/oranges get higher saturation
          else {
            saturation = Math.min(1.0, baseHSL.s * 1.15);
            lightness = Math.max(0.3, baseHSL.l * 0.95);
          }
        }
      } else if (i !== 0) { // For other harmony types
        // Slight random variation but deterministic based on position
        const adjustmentFactor = (i % 3 - 1) * 0.05;
        saturation = Math.max(0.1, Math.min(1, saturation + adjustmentFactor));
        lightness = Math.max(0.1, Math.min(0.9, lightness - adjustmentFactor));
      }
      
      colors.push(hslToHex({ h: hue, s: saturation, l: lightness }));
    }
  }
  
  return colors;
}

/**
 * Specifically generates a complementary color palette like Adobe's
 * @param baseColor Base color hex
 * @param count Number of colors (default 5)
 * @returns Array of hex colors
 */
export function generateComplementaryPalette(baseColor: string, count: number = 5): string[] {
  return generateAdobeHarmonyPalette(baseColor, 'complementary', count);
}

/**
 * Specifically generates an analogous color palette like Adobe's
 * @param baseColor Base color hex
 * @param count Number of colors (default 5)
 * @returns Array of hex colors
 */
export function generateAnalogousPalette(baseColor: string, count: number = 5): string[] {
  return generateAdobeHarmonyPalette(baseColor, 'analogous', count);
}

/**
 * Specifically generates a monochromatic color palette like Adobe's
 * @param baseColor Base color hex
 * @param count Number of colors (default 5)
 * @returns Array of hex colors
 */
export function generateMonochromaticPalette(baseColor: string, count: number = 5): string[] {
  return generateAdobeHarmonyPalette(baseColor, 'monochromatic', count);
}

/**
 * Specifically generates a triadic color palette like Adobe's
 * @param baseColor Base color hex
 * @param count Number of colors (default 5)
 * @returns Array of hex colors
 */
export function generateTriadicPalette(baseColor: string, count: number = 5): string[] {
  return generateAdobeHarmonyPalette(baseColor, 'triadic', count);
}

/**
 * Specifically generates a tetradic color palette like Adobe's
 * @param baseColor Base color hex
 * @param count Number of colors (default 5)
 * @returns Array of hex colors
 */
export function generateTetradicPalette(baseColor: string, count: number = 5): string[] {
  return generateAdobeHarmonyPalette(baseColor, 'tetradic', count);
}

/**
 * Specifically generates a split-complementary color palette like Adobe's
 * @param baseColor Base color hex
 * @param count Number of colors (default 5)
 * @returns Array of hex colors
 */
export function generateSplitComplementaryPalette(baseColor: string, count: number = 5): string[] {
  return generateAdobeHarmonyPalette(baseColor, 'split-complementary', count);
} 