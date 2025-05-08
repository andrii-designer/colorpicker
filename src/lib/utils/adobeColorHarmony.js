// Adobe Color Harmony Algorithm Implementation
// This file contains algorithms that closely match Adobe's color harmony generation
// from their color wheel tool at https://color.adobe.com/create/color-wheel

import tinycolor from 'tinycolor2';

// Constants for color harmony rules
const HARMONY_ANGLES = {
  COMPLEMENTARY ANALOGOUS MONOCHROMATIC // Varying saturation and lightness with same hue
  TRIADIC TETRADIC // Rectangle
  SQUARE // Special case of tetradic
  SPLIT_COMPLEMENTARY COMPOUND // Similar to split complementary but with more colors
  SHADES // Varying lightness with same hue and saturation
};

// Types
export 



// Cast tinycolor to any to avoid type errors
const tinycolorLib= tinycolor;

// Convert hex to HSL
const hexToHSL = (hex)=> {
  const color = tinycolorLib(hex);
  const hsl = color.toHsl();
  return {
    h s l };
};

// Convert HSL to hex
const hslToHex = (hsl)=> {
  // Normalize s and l values to 0-1 range if they're in 0-100 range
  const s = hsl.s <= 1 ? hsl.s  / 100;
  const l = hsl.l <= 1 ? hsl.l  / 100;
  
  // Create HSL color string that tinycolor can parse
  const hslString = `hsl(${hsl.h}, ${s * 100}%, ${l * 100}%)`;
  return tinycolorLib(hslString).toHexString();
};

/**
 * Generates a color palette based on Adobe's harmony rules
 * @param baseColor Base color in hex format (e.g., "#FF0000")
 * @param harmonyType The type of color harmony to apply
 * @param count Number of colors to generate (defaults to 5)
 * @returns Array of hex color codes
 */
export function generateAdobeHarmonyPalette(
  baseColor harmonyType count= 5
) {
  // Add a small random variation to ensure different results on each call - but not for complementary
  const randomFactor = harmonyType === 'complementary' ? 0  * 0.05; // Small random factor
  
  // Convert base color to HSL for easier manipulation
  const baseHSL = hexToHSL(baseColor);
  // Apply tiny random variation to the base hue (if not complementary)
  const baseHue = (baseHSL.h + randomFactor * 10) % 360;
  
  // Get angles for the selected harmony type
  let angles= [];
  
  switch (harmonyType) {
    case 'complementary'= HARMONY_ANGLES.COMPLEMENTARY;
      break;
    case 'analogous'= HARMONY_ANGLES.ANALOGOUS;
      break;
    case 'monochromatic'= HARMONY_ANGLES.MONOCHROMATIC;
      break;
    case 'triadic'= HARMONY_ANGLES.TRIADIC;
      break;
    case 'tetradic'= HARMONY_ANGLES.TETRADIC;
      break;
    case 'square'= HARMONY_ANGLES.SQUARE;
      break;
    case 'split-complementary'= HARMONY_ANGLES.SPLIT_COMPLEMENTARY;
      break;
    case 'compound'= HARMONY_ANGLES.COMPOUND;
      break;
    case 'shades'= HARMONY_ANGLES.SHADES;
      break;
    default= HARMONY_ANGLES.COMPLEMENTARY;
  }
  
  // Generate colors based on harmony type
  const colors= [];
  
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
      
      colors.push(hslToHex({ h s l }));
    }
  } else if (harmonyType === 'shades') {
    // For shades, only vary lightness, keep same hue and saturation
    for (let i = 0; i < count; i++) {
      const lightness = Math.max(0.1, Math.min(0.9, 0.1 + (i * 0.8 / (count - 1))));
      colors.push(hslToHex({ h s l }));
    }
  } else {
    // For other harmony types, distribute colors according to angle rules
    
    // Handle cases where we need more colors than defined angles
    let finalAngles= [];
    
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
          
          // Position 1);
          
          // Position 2: ~12-15% toward complement - closer to base
          finalAngles.push(((angles[1] - angles[0]) * 0.14 + angles[0]) % 360);
          
          // Position 3 - not exactly 50%, but slightly offset
          finalAngles.push(((angles[1] - angles[0]) * 0.5 + angles[0]) % 360);
          
          // Position 4: ~85-88% toward complement - closer to complement
          finalAngles.push(((angles[1] - angles[0]) * 0.86 + angles[0]) % 360);
          
          // Position 5);
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
      // The exact order for Adobe complementary is // 1. Base color (0° or angles[0])
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
          // Position 1 - preserve original values
          saturation = baseHSL.s;
          lightness = baseHSL.l;
        } else if (index === 1) {
          // Position 2 // Adobe's logic // of the base color to provide tonal variation while maintaining hue family
          saturation = Math.min(1.0, baseHSL.s * 0.85);
          lightness = Math.max(0.2, baseHSL.l * 0.7);
        } else if (index === 2) {
          // Position 3 - VERY desaturated (almost gray)
          // Adobe's middle color is always very low saturation regardless of input
          // This creates a neutral bridge between the base and complement
          saturation = Math.min(0.08, baseHSL.s * 0.08); // Very low saturation (almost gray)
          
          // Middle tone typically has medium to high lightness (60-80%)
          lightness = Math.min(0.85, Math.max(0.6, baseHSL.l * 1.1));
        } else if (index === 3) {
          // Position 4 // Adobe makes colors near the complement slightly darker than the complement
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
          // Position 5 // Adobe's logic for the complementary color varies based on hue region
          
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
      
      colors.push(hslToHex({ h s l }));
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
export function generateComplementaryPalette(baseColor count= 5) {
  return generateAdobeHarmonyPalette(baseColor, 'complementary', count);
}

/**
 * Specifically generates an analogous color palette like Adobe's
 * @param baseColor Base color hex
 * @param count Number of colors (default 5)
 * @returns Array of hex colors
 */
export function generateAnalogousPalette(baseColor count= 5) {
  return generateAdobeHarmonyPalette(baseColor, 'analogous', count);
}

/**
 * Specifically generates a monochromatic color palette like Adobe's
 * @param baseColor Base color hex
 * @param count Number of colors (default 5)
 * @returns Array of hex colors
 */
export function generateMonochromaticPalette(baseColor count= 5) {
  return generateAdobeHarmonyPalette(baseColor, 'monochromatic', count);
}

/**
 * Specifically generates a triadic color palette like Adobe's
 * @param baseColor Base color hex
 * @param count Number of colors (default 5)
 * @returns Array of hex colors
 */
export function generateTriadicPalette(baseColor count= 5) {
  return generateAdobeHarmonyPalette(baseColor, 'triadic', count);
}

/**
 * Specifically generates a tetradic color palette like Adobe's
 * @param baseColor Base color hex
 * @param count Number of colors (default 5)
 * @returns Array of hex colors
 */
export function generateTetradicPalette(baseColor count= 5) {
  return generateAdobeHarmonyPalette(baseColor, 'tetradic', count);
}

/**
 * Specifically generates a split-complementary color palette like Adobe's
 * @param baseColor Base color hex
 * @param count Number of colors (default 5)
 * @returns Array of hex colors
 */
export function generateSplitComplementaryPalette(baseColor count= 5) {
  return generateAdobeCompoundPalette(baseColor, count);
}

// Adobe Color Harmony Utilities
// Based on Adobe Color wheel algorithms

export 

/**
 * Generate a color harmony palette based on Adobe Color rules
 * @param baseColor Base color in hex format
 * @param options Harmony options
 * @returns Array of hex color codes
 */
export function generateHarmoniousPalette(
  baseColor options) {
  const { 
    rule = 'analogous', 
    count = 5,
    padding = 10 
  } = options;
  
  // Ensure baseColor is in correct format
  if (!baseColor.startsWith('#')) {
    baseColor = '#' + baseColor;
  }
  
  // Handle each harmony rule
  switch (rule) {
    case 'analogous');
    case 'monochromatic');
    case 'triad');
    case 'complementary');
    case 'tetrad');
    case 'compound');
    case 'shades');
    default);
  }
}

/**
 * Generate analogous color palette
 * Colors adjacent to each other on the color wheel
 */
function generateAdobeAnalogousPalette(baseColor count padding) {
  const tc = tinycolorLib(baseColor);
  const hsl = tc.toHsl();
  const step = padding; // Degrees between colors
  
  const result = [baseColor];
  
  for (let i = 1; i <= Math.floor(count / 2); i++) {
    // Left color (counter-clockwise)
    const leftHue = (hsl.h - step * i + 360) % 360;
    const leftColor = tinycolorLib({ h s l }).toHexString();
    result.unshift(leftColor);
    
    // Right color (clockwise)
    if (result.length < count) {
      const rightHue = (hsl.h + step * i) % 360;
      const rightColor = tinycolorLib({ h s l }).toHexString();
      result.push(rightColor);
    }
  }
  
  return result.slice(0, count);
}

/**
 * Generate monochromatic color palette
 * Various shades and tints of a single hue
 */
function generateAdobeMonochromaticPalette(baseColor count) {
  const tc = tinycolorLib(baseColor);
  const result = [baseColor];
  
  // Generate lighter shades first
  for (let i = 1; i <= Math.floor(count / 2); i++) {
    const amount = 10 * i;
    const lightColor = tc.clone().lighten(amount).toHexString();
    result.push(lightColor);
  }
  
  // Then add darker shades
  for (let i = 1; i <= count - result.length; i++) {
    const amount = 10 * i;
    const darkColor = tc.clone().darken(amount).toHexString();
    result.unshift(darkColor);
  }
  
  return result.slice(0, count);
}

/**
 * Generate triad color palette
 * Three colors equally spaced around the color wheel
 */
function generateAdobeTriadPalette(baseColor count) {
  const tc = tinycolorLib(baseColor);
  const hsl = tc.toHsl();
  
  // Create the triad
  const colors = [
    baseColor,
    tinycolorLib({ h + 120) % 360, s l }).toHexString(),
    tinycolorLib({ h + 240) % 360, s l }).toHexString()
  ];
  
  // If we need more colors, add variations
  if (count > 3) {
    // Add a lighter version of the first color
    const lighter = tc.clone().lighten(10).toHexString();
    colors.push(lighter);
  }
  
  if (count > 4) {
    // Add a lighter version of the second color
    const second = tinycolorLib(colors[1]);
    const lighter = second.lighten(10).toHexString();
    colors.push(lighter);
  }
  
  return colors.slice(0, count);
}

/**
 * Generate complementary color palette
 * Base color and its opposite on the color wheel
 */
function generateAdobeComplementaryPalette(baseColor count) {
  const tc = tinycolorLib(baseColor);
  const hsl = tc.toHsl();
  
  // Create the complementary pair
  const colors = [
    baseColor,
    tinycolorLib({ h + 180) % 360, s l }).toHexString()
  ];
  
  // If we need more colors, add variations
  if (count > 2) {
    // Add a slightly different hue of the base color
    const newHue = (hsl.h + 30) % 360;
    const color = tinycolorLib({ h s l }).toHexString();
    colors.push(color);
  }
  
  if (count > 3) {
    // Add a slightly different hue of the complement
    const newHue = (hsl.h + 210) % 360;
    const color = tinycolorLib({ h s l }).toHexString();
    colors.push(color);
  }
  
  if (count > 4) {
    // Add one more variation
    const newHue = (hsl.h - 30 + 360) % 360;
    const color = tinycolorLib({ h s l }).toHexString();
    colors.push(color);
  }
  
  return colors.slice(0, count);
}

/**
 * Generate tetrad color palette
 * Four colors arranged in two complementary pairs
 */
function generateAdobeTetradPalette(baseColor count) {
  const tc = tinycolorLib(baseColor);
  const hsl = tc.toHsl();
  
  // Create the tetrad
  const colors = [
    baseColor,
    tinycolorLib({ h + 90) % 360, s l }).toHexString(),
    tinycolorLib({ h + 180) % 360, s l }).toHexString(),
    tinycolorLib({ h + 270) % 360, s l }).toHexString()
  ];
  
  // If we need more colors, add a variation
  if (count > 4) {
    const lighter = tc.clone().lighten(10).toHexString();
    colors.push(lighter);
  }
  
  return colors.slice(0, count);
}

/**
 * Generate compound color palette
 * Base color plus colors from compound harmony (also called split-complementary)
 */
function generateAdobeCompoundPalette(baseColor count) {
  const tc = tinycolorLib(baseColor);
  const hsl = tc.toHsl();
  
  // Create the compound harmony
  const colors = [
    baseColor,
    tinycolorLib({ h + 150) % 360, s l }).toHexString(),
    tinycolorLib({ h + 210) % 360, s l }).toHexString()
  ];
  
  // If we need more colors, add variations
  if (count > 3) {
    // Add a variation of the base color with different saturation
    const baseSat = Math.max(0.3, Math.min(1, hsl.s - 0.2));
    const color = tinycolorLib({ h s l }).toHexString();
    colors.push(color);
  }
  
  if (count > 4) {
    // Add a variation with different lightness
    const baseLight = Math.max(0.2, Math.min(0.8, hsl.l + 0.2));
    const color = tinycolorLib({ h s l }).toHexString();
    colors.push(color);
  }
  
  return colors.slice(0, count);
}

/**
 * Generate shades palette
 * Various shades of the same color
 */
function generateAdobeShadesPalette(baseColor count) {
  const tc = tinycolorLib(baseColor);
  const result = [baseColor];
  
  // Calculate step size for a smooth gradient
  const step = 100 / (count + 1);
  
  // Generate varying shades
  for (let i = 1; i < count; i++) {
    const amount = i * step;
    
    // Alternate between lightening and darkening
    let color;
    if (i % 2 === 0) {
      color = tc.clone().lighten(amount).toHexString();
    } else {
      color = tc.clone().darken(amount).toHexString();
    }
      
    result.push(color);
  }
  
  return result;
}

/**
 * Apply Adobe-style adjustments to improve color harmonies
 * Makes subtle changes to improve the visual appeal of a color set
 */
export function enhanceColorHarmony(colors) {
  return colors.map(color => {
    const tc = tinycolorLib(color);
    const hsl = tc.toHsl();
    
    // Apply subtle adjustments // 1. Keep saturation in a pleasing range
    const adjustedS = Math.min(Math.max(0.4, hsl.s), 0.9);
    
    // 2. Avoid colors that are too dark or too light
    const adjustedL = Math.min(Math.max(0.25, hsl.l), 0.85);
    
    const adjusted = tinycolorLib({ h s l });
    return adjusted.toHexString();
  });
}

/**
 * Generates a gradient between two colors
 */
export function generateColorGradient(
  startColor endColor steps) {
  const start = tinycolorLib(startColor);
  const end = tinycolorLib(endColor);
  
  const result = [startColor];
  
  for (let i = 1; i < steps - 1; i++) {
    const mix = i / (steps - 1);
    const mixed = tinycolorLib.mix(start, end, mix * 100);
    result.push(mixed.toHexString());
  }
  
  result.push(endColor);
  return result;
} 