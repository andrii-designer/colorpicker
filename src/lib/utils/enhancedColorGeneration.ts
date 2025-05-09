import tinycolor from 'tinycolor2';

// Cast tinycolor to any to avoid type errors
const tinycolorLib = tinycolor as any;

// Types for the algorithm
export interface EnhancedColorOptions {
  baseColor?: string;           // Starting color (hex format)
  harmonyType?: HarmonyType;    // Type of color harmony
  count?: number;               // Number of colors in palette
  temperature?: 'warm' | 'cool' | 'mixed'; // Overall temperature bias
  saturationRange?: [number, number]; // Min/max saturation values
  lightnessRange?: [number, number];  // Min/max lightness values
  contrastEnhance?: boolean;    // Enhance contrast between colors
  randomize?: number;           // 0-1 randomization factor
}

export type HarmonyType = 
  | 'analogous'           // Colors adjacent on the color wheel
  | 'monochromatic'       // Different tints/shades of same color
  | 'triad'               // Three colors evenly spaced on color wheel
  | 'complementary'       // Colors opposite on the color wheel
  | 'splitComplementary'  // Base + two colors adjacent to complement
  | 'tetrad'              // Four colors evenly spaced on color wheel
  | 'square'              // Four colors evenly spaced 90° apart
  | 'doubleComplementary' // Two pairs of complementary colors
  | 'fiveTone'            // Five colors spaced around the wheel
  | 'natural'             // Natural color palette with earthy tones
  | 'vibrant'             // High-contrast vibrant palette
  | 'muted'               // Low-saturation, cohesive palette
  | 'pastel'              // Soft, high-value pastel colors
  | 'jewel';              // Rich, deeply saturated colors

/**
 * Generates an enhanced color palette with improved aesthetics
 * @param options Configuration options for the palette
 * @returns Array of hex color codes
 */
export function generateEnhancedPalette(options: EnhancedColorOptions = {}): string[] {
  // Default options
  const {
    baseColor = generateRandomColor(),
    harmonyType = 'analogous',
    count = 5,
    temperature = 'mixed',
    saturationRange = [30, 85],
    lightnessRange = [25, 75],
    contrastEnhance = true,
    randomize = 0.3
  } = options;

  // Convert base color to HSL for easier manipulation
  const baseColorObj = tinycolorLib(baseColor);
  const baseHsl = baseColorObj.toHsl();
  
  // Apply temperature bias if not 'mixed'
  if (temperature === 'warm') {
    // Shift toward warm hues (reds, oranges, yellows) if not already there
    if (baseHsl.h > 180 && baseHsl.h < 270) {
      baseHsl.h = (baseHsl.h + 180) % 360; // Shift to opposite side
    }
  } else if (temperature === 'cool') {
    // Shift toward cool hues (blues, greens, purples) if not already there
    if (baseHsl.h < 180 && baseHsl.h > 30) {
      baseHsl.h = (baseHsl.h + 180) % 360; // Shift to opposite side
    }
  }

  // Generate colors based on harmony type
  let palette = generateHarmonyColors(
    baseHsl, 
    harmonyType, 
    count, 
    randomize
  );
  
  // Adjust saturation and lightness for better aesthetics
  palette = adjustSaturationLightness(
    palette, 
    saturationRange, 
    lightnessRange,
    harmonyType
  );
  
  // Enhance contrast if requested
  if (contrastEnhance) {
    palette = enhanceContrast(palette);
  }
  
  return palette;
}

/**
 * Generates a random pleasing color
 */
function generateRandomColor(): string {
  // Generate a random hue (0-359)
  const hue = Math.floor(Math.random() * 360);
  
  // Use medium-high saturation and lightness for a pleasing base color
  const saturation = 60 + Math.floor(Math.random() * 20);
  const lightness = 50 + Math.floor(Math.random() * 15);
  
  return tinycolorLib({ h: hue, s: saturation, l: lightness }).toHexString();
}

/**
 * Generate harmony colors based on selected harmony type
 */
function generateHarmonyColors(
  baseHsl: { h: number, s: number, l: number },
  harmonyType: HarmonyType,
  count: number,
  randomize: number
): string[] {
  const colors: string[] = [];
  const randomFactor = randomize * 10; // Convert 0-1 scale to degrees
  
  // Base color is always included
  colors.push(tinycolorLib(baseHsl).toHexString());
  
  switch (harmonyType) {
    case 'analogous':
      // Colors adjacent on the color wheel (typically 30° apart)
      const step = 30;
      
      for (let i = 1; i <= Math.floor(count / 2); i++) {
        // Add random factor to each angle for more variation
        const leftVariation = (Math.random() * randomFactor) - (randomFactor / 2);
        const rightVariation = (Math.random() * randomFactor) - (randomFactor / 2);
        
        // Left color (counter-clockwise)
        const leftHue = (baseHsl.h - (step * i) + leftVariation + 360) % 360;
        const leftColor = tinycolorLib({ h: leftHue, s: baseHsl.s, l: baseHsl.l }).toHexString();
        
        // Right color (clockwise)
        const rightHue = (baseHsl.h + (step * i) + rightVariation) % 360;
        const rightColor = tinycolorLib({ h: rightHue, s: baseHsl.s, l: baseHsl.l }).toHexString();
        
        // Add to the result array
        if (colors.length < count) colors.unshift(leftColor);
        if (colors.length < count) colors.push(rightColor);
      }
      break;
      
    case 'monochromatic':
      // Same hue with different saturation and lightness
      for (let i = 1; i < count; i++) {
        // Create a distribution of lighter and darker variants
        let newS = baseHsl.s;
        let newL = baseHsl.l;
        
        if (i % 2 === 0) {
          // Lighter variant
          newL = Math.min(baseHsl.l + 15 + (i * 5) + (Math.random() * randomFactor), 95);
          newS = Math.max(baseHsl.s - 10 - (i * 3) - (Math.random() * randomFactor), 10);
        } else {
          // Darker variant
          newL = Math.max(baseHsl.l - 15 - (i * 5) - (Math.random() * randomFactor), 15);
          newS = Math.min(baseHsl.s + 5 + (Math.random() * randomFactor), 95);
        }
        
        const newColor = tinycolorLib({ h: baseHsl.h, s: newS, l: newL }).toHexString();
        colors.push(newColor);
      }
      break;
      
    case 'triad':
      // Three colors evenly spaced around the color wheel (120° apart)
      if (count >= 2) {
        const secondHue = (baseHsl.h + 120 + (Math.random() * randomFactor) - (randomFactor / 2)) % 360;
        const secondColor = tinycolorLib({ h: secondHue, s: baseHsl.s, l: baseHsl.l }).toHexString();
        colors.push(secondColor);
      }
      
      if (count >= 3) {
        const thirdHue = (baseHsl.h + 240 + (Math.random() * randomFactor) - (randomFactor / 2)) % 360;
        const thirdColor = tinycolorLib({ h: thirdHue, s: baseHsl.s, l: baseHsl.l }).toHexString();
        colors.push(thirdColor);
      }
      
      // For more colors, add variations of the triad
      if (count > 3) {
        for (let i = 0; i < count - 3; i++) {
          const baseIndex = i % 3;
          const baseTriadColor = colors[baseIndex];
          
          // Create lighter or darker variants
          const variant = tinycolorLib(baseTriadColor)
            .lighten(10 + (Math.random() * randomFactor))
            .toHexString();
            
          colors.push(variant);
        }
      }
      break;
      
    case 'complementary':
      // Base color and its opposite on the color wheel (180° apart)
      if (count >= 2) {
        const compHue = (baseHsl.h + 180 + (Math.random() * randomFactor) - (randomFactor / 2)) % 360;
        const compColor = tinycolorLib({ h: compHue, s: baseHsl.s, l: baseHsl.l }).toHexString();
        colors.push(compColor);
      }
      
      // For more colors, add variations of the two complementary colors
      if (count > 2) {
        // Create a more interesting distribution by adding colors between the two
        const steps = count - 2;
        
        for (let i = 0; i < steps; i++) {
          // Alternating variations of the base and complement
          const sourceIndex = i % 2;
          const sourceColor = colors[sourceIndex];
          const sourceHsl = tinycolorLib(sourceColor).toHsl();
          
          // For odd indices, modify saturation; for even, modify lightness
          if (i % 2 === 0) {
            sourceHsl.s = Math.max(30, Math.min(95, sourceHsl.s + (15 * (i+1)) + (Math.random() * randomFactor)));
            sourceHsl.l = Math.max(25, Math.min(75, sourceHsl.l - (5 * (i+1)) - (Math.random() * randomFactor)));
          } else {
            sourceHsl.l = Math.max(30, Math.min(85, sourceHsl.l + (10 * (i+1)) + (Math.random() * randomFactor)));
          }
          
          const variantColor = tinycolorLib(sourceHsl).toHexString();
          colors.push(variantColor);
        }
      }
      break;
      
    case 'splitComplementary':
      // Base color plus two colors on either side of its complement
      if (count >= 2) {
        const comp1Hue = (baseHsl.h + 150 + (Math.random() * randomFactor) - (randomFactor / 2)) % 360;
        const comp1Color = tinycolorLib({ h: comp1Hue, s: baseHsl.s, l: baseHsl.l }).toHexString();
        colors.push(comp1Color);
      }
      
      if (count >= 3) {
        const comp2Hue = (baseHsl.h + 210 + (Math.random() * randomFactor) - (randomFactor / 2)) % 360;
        const comp2Color = tinycolorLib({ h: comp2Hue, s: baseHsl.s, l: baseHsl.l }).toHexString();
        colors.push(comp2Color);
      }
      
      // For more colors, add variations
      if (count > 3) {
        for (let i = 0; i < count - 3; i++) {
          const sourceIndex = i % 3;
          const sourceColor = colors[sourceIndex];
          
          // Alternate between lighter and darker variants
          const variant = i % 2 === 0
            ? tinycolorLib(sourceColor).lighten(15 + (Math.random() * randomFactor)).toHexString()
            : tinycolorLib(sourceColor).darken(15 + (Math.random() * randomFactor)).toHexString();
            
          colors.push(variant);
        }
      }
      break;
      
    case 'tetrad':
      // Four colors evenly spaced around the color wheel (90° apart)
      for (let i = 1; i < Math.min(4, count); i++) {
        const hue = (baseHsl.h + (i * 90) + (Math.random() * randomFactor) - (randomFactor / 2)) % 360;
        const color = tinycolorLib({ h: hue, s: baseHsl.s, l: baseHsl.l }).toHexString();
        colors.push(color);
      }
      
      // For more colors, add variations
      if (count > 4) {
        for (let i = 0; i < count - 4; i++) {
          const sourceIndex = i % 4;
          const sourceColor = colors[sourceIndex];
          
          // Create variant based on position in the additional colors
          const variant = tinycolorLib(sourceColor)
            .lighten(10 + (i * 5) + (Math.random() * randomFactor))
            .toHexString();
            
          colors.push(variant);
        }
      }
      break;
      
    case 'square':
      // Similar to tetrad but ensures 90° spacing
      for (let i = 1; i < Math.min(4, count); i++) {
        const hue = (baseHsl.h + (i * 90)) % 360;
        const color = tinycolorLib({ h: hue, s: baseHsl.s, l: baseHsl.l }).toHexString();
        colors.push(color);
      }
      
      // For more colors, add variations
      if (count > 4) {
        for (let i = 0; i < count - 4; i++) {
          const sourceIndex = i % 4;
          const sourceColor = colors[sourceIndex];
          
          // Create lighter variants
          const variant = tinycolorLib(sourceColor)
            .lighten(15 + (Math.random() * randomFactor))
            .toHexString();
            
          colors.push(variant);
        }
      }
      break;
      
    case 'doubleComplementary':
      // Two pairs of complementary colors
      if (count >= 2) {
        // First complement
        const comp1Hue = (baseHsl.h + 180) % 360;
        const comp1Color = tinycolorLib({ h: comp1Hue, s: baseHsl.s, l: baseHsl.l }).toHexString();
        colors.push(comp1Color);
      }
      
      if (count >= 3) {
        // Second base (30-60° from first base)
        const offset = 30 + (Math.random() * 30);
        const base2Hue = (baseHsl.h + offset) % 360;
        const base2Color = tinycolorLib({ h: base2Hue, s: baseHsl.s, l: baseHsl.l }).toHexString();
        colors.push(base2Color);
      }
      
      if (count >= 4) {
        // Second complement
        const lastHue = tinycolorLib(colors[2]).toHsl().h;
        const comp2Hue = (lastHue + 180) % 360;
        const comp2Color = tinycolorLib({ h: comp2Hue, s: baseHsl.s, l: baseHsl.l }).toHexString();
        colors.push(comp2Color);
      }
      
      // For more colors, add variations
      if (count > 4) {
        for (let i = 0; i < count - 4; i++) {
          const sourceIndex = i % 4;
          const sourceColor = colors[sourceIndex];
          
          // Create variants with alternating lightness
          const variant = i % 2 === 0
            ? tinycolorLib(sourceColor).lighten(15 + (Math.random() * randomFactor)).toHexString()
            : tinycolorLib(sourceColor).darken(10 + (Math.random() * randomFactor)).toHexString();
            
          colors.push(variant);
        }
      }
      break;
      
    case 'natural':
      // Generate a natural/earthy palette
      const naturalHues = [
        30 + (Math.random() * 30),   // Browns/oranges
        60 + (Math.random() * 20),   // Yellow-greens
        120 + (Math.random() * 40),  // Greens
        200 + (Math.random() * 40),  // Blues
        15 + (Math.random() * 15)    // Red-browns
      ];
      
      // Natural palettes often have lower saturation
      const naturalSaturation = Math.min(baseHsl.s, 70);
      
      for (let i = 1; i < Math.min(count, naturalHues.length + 1); i++) {
        const hue = naturalHues[i - 1];
        // Vary saturation and lightness for natural look
        const sat = Math.max(30, Math.min(70, naturalSaturation + (Math.random() * 20) - 10));
        const light = Math.max(25, Math.min(75, baseHsl.l + (Math.random() * 20) - 10));
        
        const color = tinycolorLib({ h: hue, s: sat, l: light }).toHexString();
        colors.push(color);
      }
      
      // For more colors, add variations
      if (count > naturalHues.length + 1) {
        for (let i = 0; i < count - (naturalHues.length + 1); i++) {
          const sourceIndex = i % colors.length;
          const sourceColor = colors[sourceIndex];
          
          // Create subtle variants for natural look
          const variant = tinycolorLib(sourceColor)
            .lighten(5 + (Math.random() * 10))
            .desaturate(5 + (Math.random() * 10))
            .toHexString();
            
          colors.push(variant);
        }
      }
      break;
      
    case 'vibrant':
      // Generate a vibrant, high-contrast palette
      // Use high saturation and good contrast between colors
      const vibrantAngles = [60, 120, 180, 240, 300]; // Well-spaced hues
      
      for (let i = 1; i < Math.min(count, vibrantAngles.length + 1); i++) {
        const hue = (baseHsl.h + vibrantAngles[i - 1]) % 360;
        // High saturation, varied lightness
        const sat = Math.min(Math.max(baseHsl.s, 75), 95);
        const light = 40 + (i * 10) % 30; // Varied lightness for contrast
        
        const color = tinycolorLib({ h: hue, s: sat, l: light }).toHexString();
        colors.push(color);
      }
      
      // For more colors, add variations
      if (count > vibrantAngles.length + 1) {
        for (let i = 0; i < count - (vibrantAngles.length + 1); i++) {
          const sourceIndex = (i + 1) % colors.length; // Skip base color for variations
          const sourceColor = colors[sourceIndex];
          
          // Just slight variations to maintain vibrancy
          const variant = tinycolorLib(sourceColor)
            .spin(15 + (Math.random() * randomFactor))
            .toHexString();
            
          colors.push(variant);
        }
      }
      break;
      
    case 'pastel':
      // Generate a soft pastel palette
      // Pastels have high lightness and low-medium saturation
      const pastelAngles = [40, 80, 120, 180, 240, 280, 320];
      
      for (let i = 1; i < Math.min(count, pastelAngles.length + 1); i++) {
        const hue = (baseHsl.h + pastelAngles[i - 1] + (Math.random() * randomFactor)) % 360;
        // Pastel character: high lightness, medium-low saturation
        const sat = Math.min(Math.max(25, baseHsl.s - 20), 60);
        const light = Math.min(Math.max(75, baseHsl.l + 10), 90);
        
        const color = tinycolorLib({ h: hue, s: sat, l: light }).toHexString();
        colors.push(color);
      }
      
      // For more colors, add variations
      if (count > pastelAngles.length + 1) {
        for (let i = 0; i < count - (pastelAngles.length + 1); i++) {
          const hue = (baseHsl.h + (i * 30) + (Math.random() * 30)) % 360;
          const color = tinycolorLib({ h: hue, s: 35, l: 85 }).toHexString();
          colors.push(color);
        }
      }
      break;
      
    default:
      // Default to analogous if a type is not recognized
      return generateHarmonyColors(baseHsl, 'analogous', count, randomize);
  }
  
  // Ensure we have exactly the requested number of colors
  return colors.slice(0, count);
}

/**
 * Adjust saturation and lightness for better aesthetics
 */
function adjustSaturationLightness(
  colors: string[],
  saturationRange: [number, number],
  lightnessRange: [number, number],
  harmonyType: HarmonyType
): string[] {
  const adjustedColors: string[] = [];
  const [minS, maxS] = saturationRange;
  const [minL, maxL] = lightnessRange;
  
  // For certain harmony types, make specific adjustments
  let satAdjust = 0;
  let lightAdjust = 0;
  
  switch (harmonyType) {
    case 'monochromatic':
      // Ensure good spread of lightness
      const lightStep = (lightnessRange[1] - lightnessRange[0]) / Math.max(1, colors.length - 1);
      for (let i = 0; i < colors.length; i++) {
        const color = tinycolorLib(colors[i]);
        const hsl = color.toHsl();
        
        // Distribute lightness evenly
        hsl.l = Math.max(minL, Math.min(maxL, minL + (i * lightStep)));
        
        // For monochromatic, vary saturation opposite to lightness
        hsl.s = Math.max(minS, Math.min(maxS, maxS - (i * 10)));
        
        adjustedColors.push(tinycolorLib(hsl).toHexString());
      }
      return adjustedColors;
      
    case 'complementary':
      // Ensure complementary pairs have good contrast
      satAdjust = 10;
      lightAdjust = -10;
      break;
      
    case 'vibrant':
      // Maximize saturation for vibrant palettes
      satAdjust = 15;
      break;
      
    case 'muted':
      // Reduce saturation for muted palettes
      satAdjust = -20;
      break;
      
    case 'pastel':
      // High lightness, lower saturation for pastels
      satAdjust = -15;
      lightAdjust = 20;
      break;
      
    case 'jewel':
      // High saturation, lower lightness for jewel tones
      satAdjust = 10;
      lightAdjust = -10;
      break;
  }
  
  // Apply the adjustments to each color
  for (let i = 0; i < colors.length; i++) {
    const color = tinycolorLib(colors[i]);
    const hsl = color.toHsl();
    
    // Apply harmony-specific adjustments
    hsl.s = Math.max(minS, Math.min(maxS, hsl.s + satAdjust));
    hsl.l = Math.max(minL, Math.min(maxL, hsl.l + lightAdjust));
    
    adjustedColors.push(tinycolorLib(hsl).toHexString());
  }
  
  return adjustedColors;
}

/**
 * Enhance contrast between adjacent colors
 */
function enhanceContrast(colors: string[]): string[] {
  if (colors.length <= 1) return colors;
  
  const enhancedColors: string[] = [colors[0]]; // Keep the first color
  
  for (let i = 1; i < colors.length; i++) {
    const prevColor = tinycolorLib(enhancedColors[i - 1]);
    let currentColor = tinycolorLib(colors[i]);
    
    // Check contrast with previous color
    const contrast = tinycolorLib.readability(prevColor, currentColor);
    
    // If contrast is too low, adjust the current color
    if (contrast < 2.5) {
      const prevHsl = prevColor.toHsl();
      const currentHsl = currentColor.toHsl();
      
      // Adjust lightness in the opposite direction
      if (prevHsl.l > 50) {
        // Previous color is light, make this one darker
        currentHsl.l = Math.max(20, currentHsl.l - 20);
      } else {
        // Previous color is dark, make this one lighter
        currentHsl.l = Math.min(85, currentHsl.l + 20);
      }
      
      // If hues are too close, shift this one slightly
      const hueDiff = Math.abs(prevHsl.h - currentHsl.h);
      if (hueDiff < 15 || hueDiff > 345) {
        currentHsl.h = (currentHsl.h + 15) % 360;
      }
      
      currentColor = tinycolorLib(currentHsl);
    }
    
    enhancedColors.push(currentColor.toHexString());
  }
  
  return enhancedColors;
} 