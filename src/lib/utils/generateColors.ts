import { ColorEntry } from './colorDatabase';
import { STATIC_COLOR_DATA } from './colorDataStatic';
import { COMPLETE_COLOR_DATA } from './completeColorData';
import { ACCURATE_COLOR_DATA } from './fixedAccurateColorData';

export interface Color {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  name?: string;
}

// Add HARMONY_RULES constant for different color harmony patterns
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

// Add role-based color constraints after the HARMONY_RULES constant
interface ColorRoleConstraint {
  minLightness: number;
  maxLightness: number;
  minSaturation?: number;
  maxSaturation?: number;
}

const ROLE_CONSTRAINTS: Record<string, ColorRoleConstraint> = {
  dominant: { minLightness: 20, maxLightness: 40, maxSaturation: 70 },
  accent: { minLightness: 50, maxLightness: 70, minSaturation: 80 },
  neutral: { minLightness: 60, maxLightness: 80, maxSaturation: 30 },
  highlight: { minLightness: 80, maxLightness: 95, minSaturation: 50 },
  transition: { minLightness: 40, maxLightness: 60, minSaturation: 60 }
};

// Define minimum contrast ratio for adjacent colors
const MIN_CONTRAST_RATIO = 4.0; // Improved from 3.0 to better meet accessibility standards

// Improve the minimum spacing value for better distribution
const MIN_HUE_SPACING = 72; // Ensure colors are at least 72° apart on the hue wheel

// Define temperature ranges for warm, cool, and neutral colors
const TEMPERATURE_RANGES = {
  warm: { minHue: 0, maxHue: 60 },
  cool: { minHue: 180, maxHue: 300 },
  neutral: { minHue: 0, maxHue: 360 }
};

// Define saturation ranges for different color roles
const SATURATION_RANGES = {
  dominant: [40, 60],   // Base/dominant colors - moderate saturation
  accent: [70, 90],     // Accent colors - high saturation
  neutral: [10, 30],    // Neutral colors - low saturation
  highlight: [50, 70],  // Highlight colors - moderate-high saturation
  transition: [30, 50]  // Transition colors - moderate-low saturation
};

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

// Update the enforceHueSpacing function to ensure better distribution
function enforceHueSpacing(hues: number[], minSpacing: number = MIN_HUE_SPACING): number[] {
  if (hues.length <= 1) return hues;
  
  const adjustedHues = [...hues];
  
  // First pass: ensure all colors meet minimum spacing requirements
  for (let i = 0; i < adjustedHues.length; i++) {
    for (let j = i + 1; j < adjustedHues.length; j++) {
      const hueDiff = Math.min(
        Math.abs(adjustedHues[i] - adjustedHues[j]),
        360 - Math.abs(adjustedHues[i] - adjustedHues[j])
      );
      
      if (hueDiff < minSpacing) {
        // If hues are too close, adjust the later hue
        const clockwise = (adjustedHues[i] + minSpacing) % 360;
        const counterClockwise = (adjustedHues[i] - minSpacing + 360) % 360;
        
        // Choose the direction that creates the least conflict with other colors
        const clockwiseConflicts = adjustedHues.filter(h => h !== adjustedHues[j]).some(h => 
          Math.min(Math.abs(clockwise - h), 360 - Math.abs(clockwise - h)) < minSpacing
        );
        
        const counterClockwiseConflicts = adjustedHues.filter(h => h !== adjustedHues[j]).some(h => 
          Math.min(Math.abs(counterClockwise - h), 360 - Math.abs(counterClockwise - h)) < minSpacing
        );
        
        if (!clockwiseConflicts) {
          adjustedHues[j] = clockwise;
        } else if (!counterClockwiseConflicts) {
          adjustedHues[j] = counterClockwise;
        } else {
          // If both directions conflict, choose the one with larger spacing
          let maxClockwiseSpace = 360;
          let maxCounterClockwiseSpace = 360;
          
          for (let k = 0; k < adjustedHues.length; k++) {
            if (k !== j) {
              const cwDiff = Math.min(
                Math.abs(clockwise - adjustedHues[k]),
                360 - Math.abs(clockwise - adjustedHues[k])
              );
              
              const ccwDiff = Math.min(
                Math.abs(counterClockwise - adjustedHues[k]),
                360 - Math.abs(counterClockwise - adjustedHues[k])
              );
              
              maxClockwiseSpace = Math.min(maxClockwiseSpace, cwDiff);
              maxCounterClockwiseSpace = Math.min(maxCounterClockwiseSpace, ccwDiff);
            }
          }
          
          adjustedHues[j] = maxClockwiseSpace >= maxCounterClockwiseSpace ? clockwise : counterClockwise;
        }
      }
    }
  }
  
  return adjustedHues;
}

// Add a function to distribute lightness values for better hierarchy
function distributeLightness(count: number): number[] {
  // Create a balanced distribution from dark to light
  const minLightness = 15;
  const maxLightness = 85;
  const range = maxLightness - minLightness;
  
  // Ensure we have a good mix of dark, medium, and light colors
  const lightness: number[] = [];
  
  if (count <= 3) {
    // For small palettes, ensure clear contrast with dark, medium, light
    lightness.push(minLightness + range * 0.1);  // Dark
    if (count >= 2) lightness.push(minLightness + range * 0.5);  // Medium
    if (count >= 3) lightness.push(minLightness + range * 0.9);  // Light
  } else {
    // For larger palettes, create a more gradual distribution
    // but ensure we still have anchor points at dark, medium, and light
    
    // Always include darkest, medium, and lightest values
    lightness.push(minLightness + range * 0.1);  // Dark anchor
    lightness.push(minLightness + range * 0.5);  // Medium anchor
    lightness.push(minLightness + range * 0.9);  // Light anchor
    
    // Fill in remaining values with balanced spacing
    const remainingValues = count - 3;
    if (remainingValues > 0) {
      const step = range / (remainingValues + 1);
      
      for (let i = 1; i <= remainingValues; i++) {
        // Avoid exact duplicates of our anchors
        const val = minLightness + (step * i);
        if (Math.abs(val - lightness[0]) > 5 && 
            Math.abs(val - lightness[1]) > 5 && 
            Math.abs(val - lightness[2]) > 5) {
          lightness.push(val);
        } else {
          // If too close to an anchor, offset slightly
          lightness.push(val + 7);
        }
      }
    }
    
    // Sort from darkest to lightest
    lightness.sort((a, b) => a - b);
  }
  
  return lightness;
}

// Add a function to create a balanced saturation distribution
function distributeSaturation(count: number, baseS: number): number[] {
  const saturation: number[] = [];
  
  // Ensure we have a mix of low, medium, and high saturation values
  // with at least one muted and one vibrant color
  
  // Define bounds
  const minSaturation = Math.max(20, baseS - 40);
  const maxSaturation = Math.min(100, baseS + 30);
  
  if (count <= 3) {
    // For small palettes, have clear saturation roles
    saturation.push(Math.min(30, minSaturation));  // Low (muted)
    if (count >= 2) saturation.push(baseS);        // Medium (base)
    if (count >= 3) saturation.push(maxSaturation); // High (vibrant)
  } else {
    // For accent color (usually one)
    saturation.push(maxSaturation);
    
    // For neutral/muted color (usually one)
    saturation.push(minSaturation);
    
    // For dominant/base color
    saturation.push(Math.min(70, Math.max(40, baseS)));
    
    // Fill in remaining colors with alternating saturation values
    for (let i = 3; i < count; i++) {
      // Alternate between more saturated and more muted
      if (i % 2 === 0) {
        saturation.push(Math.min(90, baseS + 15 + (i % 3) * 5));
      } else {
        saturation.push(Math.max(30, baseS - 10 - (i % 3) * 5));
      }
    }
  }
  
  return saturation;
}

// Add a function to scale saturation based on color role
function scaleSaturation(hsl: { h: number; s: number; l: number }, role: string): { h: number; s: number; l: number } {
  const range = SATURATION_RANGES[role as keyof typeof SATURATION_RANGES] || [30, 70];
  const [min, max] = range;
  
  // Use a more balanced approach for saturation
  // Take into account the existing saturation but bias toward the role-appropriate range
  const targetSaturation = min + (max - min) * (Math.random() * 0.6 + 0.2); // Avoid extremes
  
  // Blend existing saturation with target 
  const newSaturation = Math.round((hsl.s * 0.3) + (targetSaturation * 0.7));
  
  return {
    ...hsl,
    s: Math.max(min, Math.min(max, newSaturation))
  };
}

// Add a function to adjust color temperature
function adjustTemperature(
  colors: Color[],
  temperature: 'warm' | 'cool' | 'neutral' | 'mixed' = 'mixed'
): Color[] {
  if (temperature === 'mixed') return colors;
  
  const range = TEMPERATURE_RANGES[temperature];
  
  return colors.map((color, index) => {
    // Skip adjustment for specific roles
    if (color.name || index === 0) return color; // Don't adjust named colors or base color
    
    const hue = color.hsl.h;
    
    // Check if the hue needs adjustment
    if (temperature === 'neutral') {
      // For neutral, we don't adjust hue but might desaturate a bit
      const newSaturation = Math.max(20, color.hsl.s - 15);
      const newHsl = { ...color.hsl, s: newSaturation };
      const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
      const newHex = hslToHex(newHsl.h, newHsl.s, newHsl.l);
      
      return { ...color, hsl: newHsl, rgb: newRgb, hex: newHex };
    }
    
    // For warm/cool, adjust hue to be within range
    // But only if it's far outside the range
    if (temperature === 'warm' && (hue > 90 && hue < 270)) {
      // Far from warm range, shift toward warm
      const targetHue = Math.random() < 0.5 ? 
        Math.max(range.minHue, Math.min(range.minHue + 30, hue - 180)) :
        Math.max(range.maxHue - 30, Math.min(range.maxHue, hue - 180));
      
      const newHsl = { ...color.hsl, h: targetHue };
      const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
      const newHex = hslToHex(newHsl.h, newHsl.s, newHsl.l);
      
      return { ...color, hsl: newHsl, rgb: newRgb, hex: newHex };
    }
    
    if (temperature === 'cool' && (hue < 150 || hue > 330)) {
      // Far from cool range, shift toward cool
      const targetHue = hue < 150 ?
        Math.max(range.minHue, Math.min(range.maxHue, hue + 180)) :
        Math.max(range.minHue, Math.min(range.maxHue, hue - 180));
      
      const newHsl = { ...color.hsl, h: targetHue };
      const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
      const newHex = hslToHex(newHsl.h, newHsl.s, newHsl.l);
      
      return { ...color, hsl: newHsl, rgb: newRgb, hex: newHex };
    }
    
    return color;
  });
}

// Update the validateAndImproveContrast function to be more aggressive with contrast optimization
function validateAndImproveContrast(colors: Color[]): Color[] {
  if (colors.length <= 1) return colors;
  
  const improvedColors = [...colors];
  
  // First, calculate perceptual luminance for all colors
  const luminances = improvedColors.map(color => {
    const r = color.rgb.r / 255;
    const g = color.rgb.g / 255;
    const b = color.rgb.b / 255;
    
    // Use perceived luminance formula
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  });
  
  // Check and improve contrast between adjacent colors
  for (let i = 0; i < improvedColors.length - 1; i++) {
    const color1 = improvedColors[i];
    const color2 = improvedColors[i + 1];
    
    let contrast = calculateContrast(color1.rgb, color2.rgb);
    let attempts = 0;
    
    // Try to improve contrast if below minimum - with more attempts
    while (contrast < MIN_CONTRAST_RATIO && attempts < 12) {
      attempts++;
      
      // Calculate luminance difference to determine which direction to adjust
      const lum1 = luminances[i];
      const lum2 = luminances[i + 1];
      const lumDiff = Math.abs(lum1 - lum2);
      
      // If luminance difference is very small, make more aggressive adjustments
      const adjustmentAmount = lumDiff < 0.2 ? 12 : 8;
      
      // Determine which color to adjust based on existing brightness and position
      // Generally prefer to adjust:
      // 1. The color with less extreme lightness
      // 2. The color that's not named (if one is named)
      // 3. Secondary colors over primary or base colors
      
      let adjustIndex: number;
      let adjustLighter: boolean;
      
      if (color1.name && !color2.name) {
        // If color1 is named but color2 isn't, adjust color2
        adjustIndex = i + 1;
        adjustLighter = lum2 < 0.5; // Make color2 lighter if it's dark, darker if it's light
      } else if (!color1.name && color2.name) {
        // If color2 is named but color1 isn't, adjust color1
        adjustIndex = i;
        adjustLighter = lum1 < 0.5; // Make color1 lighter if it's dark, darker if it's light
      } else {
        // If both are named or neither is named, choose based on luminance
        // Determine which color is in the middle range and adjust that one
        const lum1Distance = Math.abs(lum1 - 0.5);
        const lum2Distance = Math.abs(lum2 - 0.5);
        
        if (lum1Distance <= lum2Distance) {
          // Adjust color1 if it's closer to middle luminance
          adjustIndex = i;
          adjustLighter = lum1 < lum2; // Move away from color2
        } else {
          // Adjust color2 if it's closer to middle luminance
          adjustIndex = i + 1;
          adjustLighter = lum2 < lum1; // Move away from color1
        }
      }
      
      const colorToAdjust = improvedColors[adjustIndex];
      
      // Calculate new lightness - make larger adjustments when needed
      // For very low contrast, make more extreme adjustments
      const newL = adjustLighter 
        ? Math.min(colorToAdjust.hsl.l + adjustmentAmount, 92) // Make lighter
        : Math.max(colorToAdjust.hsl.l - adjustmentAmount, 15); // Make darker
      
      // Update the adjusted color
      const newHsl = { ...colorToAdjust.hsl, l: newL };
      const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
      const newHex = hslToHex(newHsl.h, newHsl.s, newHsl.l);
      
      // Update the color
      improvedColors[adjustIndex] = { ...improvedColors[adjustIndex], hsl: newHsl, rgb: newRgb, hex: newHex };
      
      // Update the luminance
      luminances[adjustIndex] = 0.2126 * (newRgb.r / 255) + 0.7152 * (newRgb.g / 255) + 0.0722 * (newRgb.b / 255);
      
      // Recalculate contrast
      contrast = calculateContrast(
        improvedColors[i].rgb,
        improvedColors[i + 1].rgb
      );
    }
  }
  
  return improvedColors;
}

// Function to apply harmony rules to generate balanced hues
function applyHarmonyRule(baseHue: number, ruleName: keyof typeof HARMONY_RULES, numColors: number): number[] {
  const rule = HARMONY_RULES[ruleName];
  const hues: number[] = [];
  
  // Generate hues based on the harmony rule
  for (let i = 0; i < numColors; i++) {
    // For fewer colors than angles, pick a subset
    // For more colors than angles, repeat the pattern
    const angleIndex = i % rule.angles.length;
    const angle = rule.angles[angleIndex];
    hues.push((baseHue + angle + 360) % 360);
  }
  
  return hues;
}

// Update generateColorsByType to incorporate saturation scaling and role assignment
function generateColorsByType(
  baseHSL: { h: number; s: number; l: number },
  numColors: number,
  paletteType: 'monochromatic' | 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'splitComplementary'
): Color[] {
  const colors: Color[] = [];
  
  // Generate hues based on the harmony type
  let hues: number[] = [];
  
  switch (paletteType) {
    case 'monochromatic':
      // Same hue, varying saturation and lightness
      hues = Array(numColors).fill(baseHSL.h);
      break;
    case 'complementary':
      // Base hue and its opposite (180 degrees apart)
      hues = [baseHSL.h];
      
      // Fill in intermediate hues if more than 2 colors
      if (numColors > 2) {
        const complement = (baseHSL.h + 180) % 360;
        hues.push(complement);
        
        // Fill in "bridge" colors
        for (let i = 2; i < numColors; i++) {
          // Alternate between base side and complement side
          const isBaseSide = i % 2 === 0;
          const anchorHue = isBaseSide ? baseHSL.h : complement;
          const distance = 30 * Math.ceil(i / 2);
          hues.push((anchorHue + (isBaseSide ? distance : -distance) + 360) % 360);
        }
      } else {
        hues.push((baseHSL.h + 180) % 360);
      }
      break;
    case 'analogous':
      // Use applyHarmonyRule for analogous colors
      hues = applyHarmonyRule(baseHSL.h, 'analogous', numColors);
      
      // Extend the range for more colors
      if (numColors > 3) {
        const angleStep = 30;
        for (let i = 3; i < numColors; i++) {
          // Alternate which side we add colors to
          const side = i % 2 === 0 ? 1 : -1;
          const distance = angleStep * Math.ceil((i - 2) / 2);
          hues.push((baseHSL.h + (side * distance) + 360) % 360);
        }
      }
      break;
    case 'triadic':
      // Use applyHarmonyRule for triadic colors
      hues = applyHarmonyRule(baseHSL.h, 'triadic', numColors);
      
      // Add intermediate hues if needed
      if (numColors > 3) {
        // For each additional color, insert between existing hues
        for (let i = 3; i < numColors; i++) {
          const index = (i - 3) % 3; // Which pair to insert between
          const h1 = hues[index];
          const h2 = hues[(index + 1) % 3];
          
          // Find the midpoint, considering the circular nature of hue
          let diff = h2 - h1;
          if (diff < 0) diff += 360;
          if (diff > 180) diff = diff - 360;
          
          const midpoint = (h1 + diff/2 + 360) % 360;
          hues.push(midpoint);
        }
      }
      break;
    case 'tetradic':
      // Use applyHarmonyRule for tetradic colors
      hues = applyHarmonyRule(baseHSL.h, 'tetradic', numColors);
      break;
    case 'splitComplementary':
      // Use applyHarmonyRule for split complementary colors
      hues = applyHarmonyRule(baseHSL.h, 'splitComplementary', numColors);
      
      // Add more colors if needed by interpolating
      if (numColors > 3) {
        for (let i = 3; i < numColors; i++) {
          // Choose which pair to interpolate between
          const pairIndex = (i - 3) % 2;
          const h1 = hues[pairIndex];
          const h2 = hues[pairIndex + 1];
          
          // Calculate the midpoint
          let diff = h2 - h1;
          if (diff < 0) diff += 360;
          if (diff > 180) diff = diff - 360;
          
          const midpoint = (h1 + diff/2 + 360) % 360;
          hues.push(midpoint);
        }
      }
      break;
  }
  
  // Enforce better hue spacing with our improved algorithm
  const spacedHues = enforceHueSpacing(hues, paletteType === 'monochromatic' ? 0 : MIN_HUE_SPACING);
  
  // Create role-based lightness and saturation distributions
  const lightnessValues = distributeLightness(numColors);
  const saturationValues = distributeSaturation(numColors, baseHSL.s);
  
  // Shuffle the lightness array to avoid predictable patterns
  // but ensure the darkest color is applied to the dominant hue (first hue)
  const shuffledLightness = [...lightnessValues];
  for (let i = 1; i < shuffledLightness.length; i++) {
    const j = 1 + Math.floor(Math.random() * (shuffledLightness.length - 1));
    [shuffledLightness[i], shuffledLightness[j]] = [shuffledLightness[j], shuffledLightness[i]];
  }
  
  // Always make sure we have at least one neutral/desaturated color for balance
  // Choose one of the mid-tone colors to make neutral
  const neutralIndex = numColors >= 4 ? 
    1 + Math.floor(Math.random() * (numColors - 2)) : // Random middle color for larger palettes
    (numColors >= 3 ? 1 : 0); // First non-dominant color for small palettes
  
  // Create a balanced palette with distinct roles
  for (let i = 0; i < numColors; i++) {
    // Assign roles based on position
    let role: string;
    
    if (i === 0) {
      role = 'dominant';
    } else if (i === numColors - 1) {
      role = 'accent';
    } else if (i === neutralIndex) {
      role = 'neutral';
    } else if (i === numColors - 2 && numColors > 3) {
      role = 'highlight';
    } else {
      role = 'transition';
    }
    
    // Apply role constraints to saturation and lightness
    const constraints = ROLE_CONSTRAINTS[role];
    
    let lightness, saturation;
    
    if (paletteType === 'monochromatic') {
      // For monochromatic, we need more variation in lightness
      lightness = Math.min(constraints.maxLightness, 
                  Math.max(constraints.minLightness, shuffledLightness[i]));
      
      // And less variation in saturation - use role-based saturation scaling
      const scaledHSL = scaleSaturation(
        { h: spacedHues[i], s: baseHSL.s, l: lightness }, 
        role
      );
      saturation = scaledHSL.s;
    } else {
      // For other palette types, use role-based constraints more strictly
      lightness = Math.min(constraints.maxLightness, 
                  Math.max(constraints.minLightness, shuffledLightness[i]));
      
      // Apply dynamic saturation scaling
      const scaledHSL = scaleSaturation(
        { h: spacedHues[i], s: saturationValues[i], l: lightness }, 
        role
      );
      saturation = scaledHSL.s;
    }
    
    colors.push({
      hex: hslToHex(spacedHues[i], saturation, lightness),
      rgb: hslToRgb(spacedHues[i], saturation, lightness),
      hsl: { h: spacedHues[i], s: saturation, l: lightness }
    });
  }
  
  // Apply final contrast improvements
  return validateAndImproveContrast(colors);
}

function hslToHex(h: number, s: number, l: number): string {
  const rgb = hslToRgb(h, s, l);
  return `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
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
  const {
    numColors = 5,
    useNamedColors = true,
    namedColorRatio = 0.5,
    paletteType = 'analogous',
    colorData = ACCURATE_COLOR_DATA,
    enforceMinContrast = true,
    temperature = 'mixed'
  } = options;

  // Normalize the base color format
  const normalizedBaseColor = baseColor.toUpperCase();
  
  // Try to find exact match for base color first
  const exactMatch = findExactColorMatch(baseColor, colorData);
  
  // Convert base color to HSL
  const baseHSL = hexToHSL(baseColor);
  
  // Create a base color object that will be preserved
  const baseColorObj: Color = {
    hex: normalizedBaseColor,
    rgb: hslToRgb(baseHSL.h, baseHSL.s, baseHSL.l),
    hsl: baseHSL,
    name: exactMatch?.name
  };
  
  // Generate colors algorithmically
  const generatedColors = generateColorsByType(baseHSL, numColors, paletteType);
  
  // Replace the first color with our preserved base color
  generatedColors[0] = baseColorObj;
  
  // Apply temperature adjustment if specified
  const temperatureAdjusted = temperature !== 'mixed' ? 
    adjustTemperature(generatedColors, temperature) : 
    generatedColors;
  
  // Ensure the first color is still our original base color
  temperatureAdjusted[0] = baseColorObj;
  
  // If not using named colors, just return the generated colors with improved contrast
  if (!useNamedColors) {
    const contrastImproved = enforceMinContrast ? validateAndImproveContrast(temperatureAdjusted) : temperatureAdjusted;
    // Ensure base color is preserved
    contrastImproved[0] = baseColorObj;
    return contrastImproved;
  }

  // If we have an exact match, ensure it's used for the base color
  if (exactMatch) {
    temperatureAdjusted[0] = exactMatch;
  }

  // Find similar named colors - use more named colors
  const numNamedColors = Math.max(1, Math.floor(numColors * namedColorRatio));
  
  // Find named colors that complement our base color
  const namedColors = findSimilarNamedColors(baseHSL, numNamedColors, colorData);
  
  // Replace any low-quality generated colors with better named alternatives
  const enhancedGenerated = enhanceGeneratedColors(temperatureAdjusted, colorData);
  
  // Ensure base color is preserved
  enhancedGenerated[0] = exactMatch || baseColorObj;
  
  // Mix generated and named colors
  const mixedColors = mixColors(enhancedGenerated, namedColors);
  
  // Ensure base color is preserved
  mixedColors[0] = exactMatch || baseColorObj;
  
  // As a final step, ensure we have good contrast between adjacent colors
  const finalPalette = enforceMinContrast ? validateAndImproveContrast(mixedColors) : mixedColors;
  
  // One final check to ensure base color is preserved
  finalPalette[0] = exactMatch || baseColorObj;
  
  return finalPalette;
}

// Find exact color matches
function findExactColorMatch(hex: string, colorData: ColorEntry[]): Color | null {
  // Normalize hex format
  const normalizedHex = hex.toLowerCase();
  
  // Try to find exact match
  const exactMatch = colorData.find(color => 
    color.hex && color.hex.toLowerCase() === normalizedHex
  );
  
  if (exactMatch && exactMatch.hex && exactMatch.rgb) {
    return {
      hex: exactMatch.hex,
      rgb: exactMatch.rgb,
      hsl: {
        h: exactMatch.hue,
        s: exactMatch.saturation,
        l: exactMatch.lightness
      },
      name: exactMatch.name
    };
  }
  
  return null;
}

// Function to enhance generated colors with named alternatives
function enhanceGeneratedColors(
  generatedColors: Color[],
  colorData: ColorEntry[]
): Color[] {
  return generatedColors.map(color => {
    // Skip if this color already has a name
    if (color.name) return color;
    
    // Find possible named match for this generated color
    const colorHSL = color.hsl;
    const similarNamedColors = colorData
      .map(namedColor => {
        const hueDiff = Math.min(
          Math.abs(colorHSL.h - namedColor.hue),
          360 - Math.abs(colorHSL.h - namedColor.hue)
        );
        const satDiff = Math.abs(colorHSL.s - namedColor.saturation);
        const lightDiff = Math.abs(colorHSL.l - namedColor.lightness);
        
        // Calculate similarity with improved weighting
        // Hue differences are most noticeable, followed by saturation, then lightness
        const similarity = 100 - (
          (hueDiff / 3.6) * 1.2 +  // Hue has highest weight
          satDiff * 0.7 +          // Saturation has medium weight
          lightDiff * 0.5          // Lightness has lowest weight
        );
        
        return { namedColor, similarity };
      })
      .filter(match => match.similarity >= 85) // Only consider very close matches
      .sort((a, b) => b.similarity - a.similarity);
    
    // If we have a very good match, use the named color
    if (similarNamedColors.length > 0 && similarNamedColors[0].namedColor.hex) {
      const bestMatch = similarNamedColors[0].namedColor;
      return {
        hex: bestMatch.hex as string,
        rgb: bestMatch.rgb || color.rgb,
        hsl: {
          h: bestMatch.hue,
          s: bestMatch.saturation,
          l: bestMatch.lightness
        },
        name: bestMatch.name
      };
    }
    
    // No good match, return original
    return color;
  });
}

function findSimilarNamedColors(
  baseHSL: { h: number; s: number; l: number }, 
  count: number,
  colorData: ColorEntry[] = ACCURATE_COLOR_DATA
): Color[] {
  // Get all colors from our database
  const allColors = colorData;
  
  // Calculate similarity scores with improved weighting
  const colorsWithScores = allColors.map(color => {
    // Calculate hue difference (accounting for circular nature of hue)
    const hueDiff = Math.min(
      Math.abs(baseHSL.h - color.hue),
      360 - Math.abs(baseHSL.h - color.hue)
    );
    
    // Calculate saturation and lightness differences
    const satDiff = Math.abs(baseHSL.s - color.saturation);
    const lightDiff = Math.abs(baseHSL.l - color.lightness);
    
    // Enhanced weighting system
    const hueWeight = 0.5;   // Slightly reduced from 0.6 to give more variety
    const satWeight = 0.3;   // Unchanged
    const lightWeight = 0.2; // Increased from 0.1 for better visual balance
    
    // Calculate similarity score (higher is more similar)
    const similarity = 1 - (
      (hueDiff * hueWeight) / 360 +
      (satDiff * satWeight) / 100 +
      (lightDiff * lightWeight) / 100
    );
    
    return {
      color,
      score: similarity
    };
  });
  
  // Sort by similarity and take top matches
  // Add some randomization for variety by boosting some colors slightly
  const topMatches = colorsWithScores
    .sort((a, b) => {
      // Add slight randomization (±5%) to highly similar colors
      // This ensures we don't always get the same colors
      if (Math.abs(a.score - b.score) < 0.05) {
        return (b.score + Math.random() * 0.05) - (a.score + Math.random() * 0.05);
      }
      return b.score - a.score;
    })
    .slice(0, Math.min(count * 3, allColors.length / 10)) // Get more candidates than needed
    .sort((a, b) => b.score - a.score) // Re-sort without randomization
    .slice(0, count); // Take just what we need
  
  return topMatches.map(({ color }) => {
    if (!color.hex || !color.rgb) {
      throw new Error('Invalid color data');
    }
    return {
      hex: color.hex,
      rgb: color.rgb,
      hsl: {
        h: color.hue,
        s: color.saturation,
        l: color.lightness
      },
      name: color.name,
      similarity: Math.round(topMatches[0].score * 100) // Add similarity score for debugging
    };
  });
}

function mixColors(generatedColors: Color[], namedColors: Color[]): Color[] {
  // Don't process if we don't have both types
  if (namedColors.length === 0) return generatedColors;
  if (generatedColors.length === 0) return namedColors;
  
  const result: Color[] = [];
  const totalDesired = Math.max(generatedColors.length, namedColors.length);
  
  // If we have very few colors (like 3), prioritize named colors more
  const smallPalette = totalDesired <= 3;
  
  // Calculate how many of each type we want in the final palette
  // For small palettes, aim for at least one named color
  // For larger palettes, aim for a more balanced mix
  const targetNamedCount = smallPalette 
    ? Math.max(1, Math.min(namedColors.length, Math.floor(totalDesired * 0.5)))
    : Math.max(1, Math.min(namedColors.length, Math.floor(totalDesired * 0.6)));
  
  const targetGeneratedCount = totalDesired - targetNamedCount;
  
  // Take the most important named colors
  const selectedNamed = namedColors.slice(0, targetNamedCount);
  
  // Take the most important generated colors
  const selectedGenerated = generatedColors.slice(0, targetGeneratedCount);
  
  // For small palettes (3 colors or fewer), place named color in the middle
  if (smallPalette && selectedNamed.length > 0 && selectedGenerated.length > 0) {
    if (selectedGenerated.length === 2) {
      result.push(selectedGenerated[0]);
      result.push(selectedNamed[0]);
      result.push(selectedGenerated[1]);
    } else {
      result.push(selectedNamed[0]);
      result.push(...selectedGenerated);
    }
    return result;
  }
  
  // For larger palettes, distribute named colors evenly
  if (selectedNamed.length > 0 && selectedGenerated.length > 0) {
    const spacing = Math.max(1, Math.floor(totalDesired / selectedNamed.length));
    
    // Insert named colors at regular intervals
    let namedIndex = 0;
    for (let i = 0; i < totalDesired; i++) {
      if (i % spacing === 0 && namedIndex < selectedNamed.length) {
        result.push(selectedNamed[namedIndex]);
        namedIndex++;
      } else if (result.length < totalDesired) {
        const genIndex = result.length - namedIndex;
        if (genIndex < selectedGenerated.length) {
          result.push(selectedGenerated[genIndex]);
        }
      }
    }
    
    // Add any remaining colors
    while (result.length < totalDesired) {
      if (namedIndex < selectedNamed.length) {
        result.push(selectedNamed[namedIndex++]);
      } else {
        const genIndex = result.length - (namedIndex);
        if (genIndex < selectedGenerated.length) {
          result.push(selectedGenerated[genIndex]);
        } else {
          break;
        }
      }
    }
  } else {
    // Just use what we have
    result.push(...selectedNamed);
    result.push(...selectedGenerated);
  }
  
  return result;
}

// Add a function to analyze and tweak final palettes
function analyzePalette(colors: Color[]): { score: number; details: Record<string, number> } {
  if (colors.length < 2) return { score: 0, details: {} };
  
  // Calculate contrast between adjacent colors
  let totalContrast = 0;
  const contrastValues: number[] = [];
  
  for (let i = 0; i < colors.length - 1; i++) {
    const contrast = calculateContrast(colors[i].rgb, colors[i + 1].rgb);
    totalContrast += contrast;
    contrastValues.push(contrast);
  }
  
  const avgContrast = totalContrast / (colors.length - 1);
  const minContrast = Math.min(...contrastValues);
  
  // Calculate hue spread and distribution
  const hues = colors.map(c => c.hsl.h);
  let maxHueDiff = 0;
  
  for (let i = 0; i < hues.length; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      const hueDiff = Math.min(
        Math.abs(hues[i] - hues[j]),
        360 - Math.abs(hues[i] - hues[j])
      );
      maxHueDiff = Math.max(maxHueDiff, hueDiff);
    }
  }
  
  // Calculate average hue difference (useful for non-monochromatic)
  let totalHueDiff = 0;
  let hueCount = 0;
  
  for (let i = 0; i < hues.length; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      const hueDiff = Math.min(
        Math.abs(hues[i] - hues[j]),
        360 - Math.abs(hues[i] - hues[j])
      );
      totalHueDiff += hueDiff;
      hueCount++;
    }
  }
  
  const avgHueDiff = hueCount > 0 ? totalHueDiff / hueCount : 0;
  
  // Calculate saturation balance
  const saturations = colors.map(c => c.hsl.s);
  const avgSaturation = saturations.reduce((sum, s) => sum + s, 0) / saturations.length;
  const satRange = Math.max(...saturations) - Math.min(...saturations);
  
  // Calculate lightness range and distribution
  const lightnesses = colors.map(c => c.hsl.l);
  const lightRange = Math.max(...lightnesses) - Math.min(...lightnesses);
  const avgLightness = lightnesses.reduce((sum, l) => sum + l, 0) / lightnesses.length;
  
  // Score the different aspects
  const contrastScore = Math.min(1, (avgContrast / 5)) * 0.7 + Math.min(1, (minContrast / 3)) * 0.3;
  const hueScore = avgHueDiff / 90; // Normalized to 0-1 range, with 90° difference being ideal
  const saturationScore = Math.min(1, satRange / 60) * 0.5 + (1 - Math.abs(avgSaturation - 50) / 50) * 0.5;
  const lightnessScore = Math.min(1, lightRange / 60);
  
  // Calculate final score (weighted average)
  const totalScore = (
    contrastScore * 0.4 +
    hueScore * 0.3 +
    saturationScore * 0.2 +
    lightnessScore * 0.1
  ) * 10; // Scale to 0-10
  
  return {
    score: Math.round(totalScore * 10) / 10, // Round to 1 decimal place
    details: {
      contrast: Math.round(contrastScore * 10) / 10,
      hue: Math.round(hueScore * 10) / 10,
      saturation: Math.round(saturationScore * 10) / 10,
      lightness: Math.round(lightnessScore * 10) / 10
    }
  };
}

export function regenerateWithLockedColors(
  currentPalette: Color[],
  lockedIndices: number[],
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
  // If no colors are locked, just generate a new palette from the first color
  if (lockedIndices.length === 0 || currentPalette.length === 0) {
    return generateColorPalette(currentPalette[0]?.hex || '#FF0000', options);
  }

  // Always ensure the base color (first color) is locked
  let updatedLockedIndices = [...lockedIndices];
  if (!updatedLockedIndices.includes(0)) {
    updatedLockedIndices.push(0);
  }

  // Find the first locked color to use as our base (should be index 0, the original base color)
  const baseColorIndex = 0;
  const baseColor = currentPalette[baseColorIndex].hex;

  // Generate a new palette based on the base color
  const newPalette = generateColorPalette(baseColor, options);

  // Create the result by preserving locked colors and using new ones for unlocked positions
  const result = [...currentPalette];
  let newColorIndex = 0;

  for (let i = 0; i < result.length; i++) {
    if (!updatedLockedIndices.includes(i)) {
      // This color is not locked, replace it with a new one
      if (newColorIndex < newPalette.length) {
        result[i] = newPalette[newColorIndex];
        newColorIndex++;
      }
    }
  }

  // Apply contrast enhancement if needed while preserving locked colors
  if (options.enforceMinContrast) {
    const improved = validateAndImproveContrast(result);
    
    // Restore locked colors
    for (const index of updatedLockedIndices) {
      if (index < result.length) {
        improved[index] = result[index];
      }
    }
    
    return improved;
  }
  
  return result;
} 