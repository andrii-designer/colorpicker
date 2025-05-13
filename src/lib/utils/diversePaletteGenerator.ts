import tinycolor from 'tinycolor2';

// Types
export interface DiversePaletteOptions {
  baseColor?: string;           // Optional starting color
  count: number;                // Number of colors (1-10)
  strategy?: 'wheel' | 'golden' | 'composite'; // Distribution strategy
  saturationRange?: [number, number]; // Min/max saturation values (0-100)
  lightnessRange?: [number, number];  // Min/max lightness values (0-100)
  sortBy?: 'hue' | 'lightness' | 'none'; // How to sort the final palette
}

/**
 * Generate a diverse color palette with colors that are visually distinct
 * Specifically optimized for larger palettes (6-10 colors)
 */
export function generateDiversePalette(options: DiversePaletteOptions): string[] {
  // Default options
  const {
    baseColor = generateRandomBaseColor(),
    count = 5,
    strategy = 'wheel',
    saturationRange = [35, 85],
    lightnessRange = [25, 75],
    sortBy = 'hue'
  } = options;

  // Use different strategies based on count
  if (count <= 1) {
    return [baseColor];
  } else if (count <= 5) {
    // For smaller palettes, use the wheel strategy with wider spacing
    return generateWheelPalette({
      baseColor,
      count,
      saturationRange,
      lightnessRange,
      sortBy
    });
  } else {
    // For larger palettes (6-10), use the strategy specified or composite
    switch (strategy) {
      case 'golden':
        return generateGoldenRatioPalette({
          baseColor,
          count,
          saturationRange,
          lightnessRange,
          sortBy
        });
      case 'wheel':
        return generateWheelPalette({
          baseColor,
          count,
          saturationRange,
          lightnessRange,
          sortBy
        });
      case 'composite':
      default:
        return generateCompositePalette({
          baseColor,
          count,
          saturationRange,
          lightnessRange,
          sortBy
        });
    }
  }
}

/**
 * Generate a random pleasing base color
 */
function generateRandomBaseColor(): string {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70 + Math.floor(Math.random() * 20); // 70-90
  const lightness = 45 + Math.floor(Math.random() * 15); // 45-60
  
  return tinycolor(`hsl(${hue}, ${saturation}%, ${lightness}%)`).toHexString();
}

/**
 * Calculate visual distance between two colors
 * This helps ensure colors are perceptually distinct
 */
function calculateColorDistance(color1: string, color2: string): number {
  const c1 = tinycolor(color1);
  const c2 = tinycolor(color2);
  
  // Get RGB values
  const c1rgb = c1.toRgb();
  const c2rgb = c2.toRgb();
  
  // Calculate weighted Euclidean distance in RGB space
  // With extra weight on green channel (human eyes are more sensitive to green)
  return Math.sqrt(
    Math.pow(c1rgb.r - c2rgb.r, 2) * 0.3 +
    Math.pow(c1rgb.g - c2rgb.g, 2) * 0.59 +
    Math.pow(c1rgb.b - c2rgb.b, 2) * 0.11
  );
}

/**
 * Check if a color is too similar to any in an existing palette
 */
function isTooSimilar(newColor: string, palette: string[], threshold = 40): boolean {
  for (const color of palette) {
    const distance = calculateColorDistance(newColor, color);
    if (distance < threshold) {
      return true;
    }
  }
  return false;
}

/**
 * Evenly distribute colors around the color wheel
 * Good for medium-sized palettes (3-7 colors)
 */
function generateWheelPalette(options: DiversePaletteOptions): string[] {
  const {
    baseColor,
    count,
    saturationRange = [35, 85],
    lightnessRange = [25, 75],
    sortBy = 'hue'
  } = options;
  
  // Ensure baseColor is a string before passing to tinycolor
  const safeBaseColor = baseColor || generateRandomBaseColor();
  // Convert base color to HSL
  const baseHsl = tinycolor(safeBaseColor).toHsl();
  const startingHue = baseHsl.h;
  
  const palette: string[] = [];
  const hueStep = 360 / count;
  
  // For larger palettes, use strategic saturation and lightness variations
  // to create more visual distinction
  const isLargePalette = count > 5;
  
  // Generate the palette
  for (let i = 0; i < count; i++) {
    // Calculate the hue based on position
    const hue = (startingHue + i * hueStep) % 360;
    
    // Strategic saturation and lightness based on position
    let saturation, lightness;
    
    if (isLargePalette) {
      // For larger palettes, alternate between high/low saturation and lightness
      // to maximize distinction between adjacent colors
      const satMid = (saturationRange[0] + saturationRange[1]) / 2;
      const lightMid = (lightnessRange[0] + lightnessRange[1]) / 2;
      
      const satRange = saturationRange[1] - saturationRange[0];
      const lightRange = lightnessRange[1] - lightnessRange[0];
      
      // Create patterns based on position
      const satPattern = (i % 3 === 0) ? 0.8 : (i % 3 === 1) ? 0.5 : 1.0;
      const lightPattern = (i % 2 === 0) ? 0.7 : 0.3;
      
      saturation = saturationRange[0] + satPattern * satRange;
      lightness = lightnessRange[0] + lightPattern * lightRange;
      
      // Adjust for color appearance
      if (hue >= 50 && hue <= 70) { // Yellows need to be darker to be visible
        lightness = Math.min(lightness, 60);
      } else if (hue >= 200 && hue <= 280) { // Blues look better slightly lighter
        lightness = Math.max(lightness, 40);
      }
    } else {
      // Simpler approach for smaller palettes
      saturation = saturationRange[0] + Math.random() * (saturationRange[1] - saturationRange[0]);
      lightness = lightnessRange[0] + Math.random() * (lightnessRange[1] - lightnessRange[0]);
    }
    
    // Create the color
    const color = tinycolor(`hsl(${hue}, ${saturation}%, ${lightness}%)`).toHexString();
    palette.push(color);
  }
  
  // Sort if needed
  return sortPalette(palette, sortBy);
}

/**
 * Use golden ratio to create a harmonious palette
 * Excellent for larger palettes (8-10 colors)
 */
function generateGoldenRatioPalette(options: DiversePaletteOptions): string[] {
  const {
    baseColor,
    count,
    saturationRange = [35, 85],
    lightnessRange = [25, 75],
    sortBy = 'hue'
  } = options;
  
  // Golden ratio constant (~1.618)
  const goldenRatioConjugate = 0.618033988749895;
  
  // Ensure baseColor is a string before passing to tinycolor
  const safeBaseColor = baseColor || generateRandomBaseColor();
  // Convert base color to HSL
  const baseHsl = tinycolor(safeBaseColor).toHsl();
  let currentHue = baseHsl.h / 360; // Normalize to 0-1
  
  const palette: string[] = [safeBaseColor]; // Start with base color
  
  // Generate the rest of the colors
  for (let i = 1; i < count; i++) {
    // Use golden ratio to determine the next hue
    currentHue = (currentHue + goldenRatioConjugate) % 1;
    const hue = currentHue * 360;
    
    // Use strategic saturation and lightness values with some randomness
    // to ensure diversity while maintaining harmony
    let saturation, lightness;
    
    // For large palettes, use a more strategic approach
    if (count > 6) {
      // For larger palettes, use a patterned approach to saturation/lightness
      // This creates more visual distinction between colors
      const satPosition = (i % 3) / 2; // 0, 0.5, or 1
      const lightPosition = (i % 4) / 3; // 0, 0.33, 0.66, or 1
      
      saturation = saturationRange[0] + (saturationRange[1] - saturationRange[0]) * satPosition;
      lightness = lightnessRange[0] + (lightnessRange[1] - lightnessRange[0]) * lightPosition;
      
      // Additional randomness but keep it constrained for harmony
      saturation += (Math.random() * 10) - 5; // +/- 5%
      lightness += (Math.random() * 10) - 5; // +/- 5%
      
      // Clamp values
      saturation = Math.max(saturationRange[0], Math.min(saturationRange[1], saturation));
      lightness = Math.max(lightnessRange[0], Math.min(lightnessRange[1], lightness));
    } else {
      // Simpler approach for smaller palettes
      saturation = saturationRange[0] + Math.random() * (saturationRange[1] - saturationRange[0]);
      lightness = lightnessRange[0] + Math.random() * (lightnessRange[1] - lightnessRange[0]);
    }
    
    // Create the color
    const color = tinycolor(`hsl(${hue}, ${saturation}%, ${lightness}%)`).toHexString();
    
    // Ensure we're not adding a too-similar color
    // Important for large palettes to maintain diversity
    if (!isTooSimilar(color, palette, 30)) {
      palette.push(color);
    } else {
      // If too similar, try again with slight adjustments
      let attempts = 0;
      let adjustedColor = color;
      
      while (isTooSimilar(adjustedColor, palette, 30) && attempts < 5) {
        // Adjust the hue slightly and try again
        const adjustedHue = (hue + (Math.random() * 20) - 10 + 360) % 360;
        saturation = saturationRange[0] + Math.random() * (saturationRange[1] - saturationRange[0]);
        lightness = lightnessRange[0] + Math.random() * (lightnessRange[1] - lightnessRange[0]);
        
        adjustedColor = tinycolor(`hsl(${adjustedHue}, ${saturation}%, ${lightness}%)`).toHexString();
        
        attempts++;
      }
      
      palette.push(adjustedColor);
    }
  }
  
  // Sort if needed
  return sortPalette(palette, sortBy);
}

/**
 * Create a palette using a composite approach
 * Combines multiple color theory approaches for maximum diversity
 * Ideal for larger palettes (6-10 colors)
 */
function generateCompositePalette(options: DiversePaletteOptions): string[] {
  const {
    baseColor,
    count,
    saturationRange = [35, 85],
    lightnessRange = [25, 75],
    sortBy = 'hue'
  } = options;
  
  // Ensure baseColor is a string before passing to tinycolor
  const safeBaseColor = baseColor || generateRandomBaseColor();
  // Convert base color to HSL
  const baseHsl = tinycolor(safeBaseColor).toHsl();
  
  // For large palettes, we'll use a combination of strategies:
  // 1. Start with a primary triad (3 colors 120° apart)
  // 2. Add tetradic colors (30° offset from opposites)
  // 3. Fill remaining with golden ratio colors
  
  const palette: string[] = [];
  const usedHues: number[] = [];
  
  // Add the base color
  palette.push(safeBaseColor);
  usedHues.push(baseHsl.h);
  
  // Add triad colors (120° apart)
  if (count > 1) {
    const triad1Hue = (baseHsl.h + 120) % 360;
    const s1 = (saturationRange[0] + saturationRange[1]) / 2;
    const l1 = (lightnessRange[0] + lightnessRange[1]) / 2;
    const triad1 = tinycolor(`hsl(${triad1Hue}, ${s1}%, ${l1}%)`).toHexString();
    
    palette.push(triad1);
    usedHues.push(triad1Hue);
  }
  
  if (count > 2) {
    const triad2Hue = (baseHsl.h + 240) % 360;
    const s2 = Math.min(90, saturationRange[1] * 0.9);
    const l2 = Math.min(80, lightnessRange[0] * 1.2);
    const triad2 = tinycolor(`hsl(${triad2Hue}, ${s2}%, ${l2}%)`).toHexString();
    
    palette.push(triad2);
    usedHues.push(triad2Hue);
  }
  
  // For larger palettes, add split-complementary colors
  if (count > 3) {
    const splitComp1Hue = (baseHsl.h + 150) % 360;
    const s3 = Math.min(90, saturationRange[0] * 1.1);
    const l3 = Math.min(80, lightnessRange[1] * 0.85);
    const splitComp1 = tinycolor(`hsl(${splitComp1Hue}, ${s3}%, ${l3}%)`).toHexString();
    
    palette.push(splitComp1);
    usedHues.push(splitComp1Hue);
  }
  
  if (count > 4) {
    const splitComp2Hue = (baseHsl.h + 210) % 360;
    const s4 = Math.min(90, saturationRange[1] * 0.85);
    const l4 = Math.min(80, lightnessRange[0] * 1.1);
    const splitComp2 = tinycolor(`hsl(${splitComp2Hue}, ${s4}%, ${l4}%)`).toHexString();
    
    palette.push(splitComp2);
    usedHues.push(splitComp2Hue);
  }
  
  // For very large palettes, add more colors with golden ratio spacing
  if (count > 5) {
    // Use golden ratio to fill the rest, but avoid existing hues
    const goldenRatioConjugate = 0.618033988749895;
    let currentHue = baseHsl.h / 360; // Normalize to 0-1
    
    // Generate remaining colors
    while (palette.length < count) {
      // Use golden ratio to determine the next hue
      currentHue = (currentHue + goldenRatioConjugate) % 1;
      const hue = currentHue * 360;
      
      // Check if this hue is too close to existing hues
      const isTooClose = usedHues.some(existingHue => {
        const distance = Math.min(
          Math.abs(hue - existingHue),
          360 - Math.abs(hue - existingHue)
        );
        return distance < 30; // Minimum 30° separation
      });
      
      if (!isTooClose) {
        // Strategic saturation and lightness based on position
        const positionRatio = palette.length / count;
        
        // Create diversity in saturation and lightness
        const saturation = saturationRange[0] + (saturationRange[1] - saturationRange[0]) * 
          (0.5 + Math.sin(positionRatio * Math.PI * 2) * 0.5);
          
        const lightness = lightnessRange[0] + (lightnessRange[1] - lightnessRange[0]) * 
          (0.5 + Math.cos(positionRatio * Math.PI * 2) * 0.5);
        
        // Create the color
        const color = tinycolor(`hsl(${hue}, ${saturation}%, ${lightness}%)`).toHexString();
        
        // Only add if not too similar to existing colors
        if (!isTooSimilar(color, palette, 35)) {
          palette.push(color);
          usedHues.push(hue);
        }
      }
    }
  }
  
  // Ensure we have exactly the right number of colors
  if (palette.length > count) {
    palette.splice(count);
  }
  
  // Sort if needed
  return sortPalette(palette, sortBy);
}

/**
 * Sort a palette by the specified method
 */
function sortPalette(palette: string[], sortBy: 'hue' | 'lightness' | 'none' = 'hue'): string[] {
  if (sortBy === 'none') {
    return palette;
  }
  
  return [...palette].sort((a, b) => {
    const colorA = tinycolor(a);
    const colorB = tinycolor(b);
    
    if (sortBy === 'hue') {
      return colorA.toHsl().h - colorB.toHsl().h;
    } else if (sortBy === 'lightness') {
      return colorA.toHsl().l - colorB.toHsl().l;
    }
    
    return 0;
  });
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
} 