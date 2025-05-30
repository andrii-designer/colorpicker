import tinycolor from 'tinycolor2';
import convert from 'color-convert';

// Cast tinycolor to any to avoid type errors
const tinycolorLib: any = tinycolor;

// Core types
export interface LCH {
  l: number; // Lightness (0-100)
  c: number; // Chroma (0-130)
  h: number; // Hue (0-360 degrees)
}

export interface PaletteConfig {
  harmonyType: string;
  count: number;
  toneProfile?: 'light' | 'balanced' | 'dark';
  saturationStyle?: 'muted' | 'balanced' | 'vibrant';
}

export interface Color {
  hex: string;
  rgb: {
    r: number;
    g: number;
    b: number;
  };
  hsl: {
    h: number;
    s: number;
    l: number;
  };
  name?: string;
}

// Harmony templates - these determine the hue relationships
const HARMONY_TEMPLATES = {
  monochromatic: [0, 0, 0, 0, 0],
  analogous: [0, 24, -24, 48, -48],
  complementary: [0, 180, 30, 160, 200],
  triadic: [0, 120, 240, 90, 210],
  tetradic: [0, 90, 180, 270, 135],
  splitComplementary: [0, 150, 210, 30, 180],
  pentadic: [0, 72, 144, 216, 288],
};

// Tone structures - these determine the lightness and chroma relationships
const TONE_STRUCTURES = {
  // Classic structure has 1 light, 1 dark, 3 mid-tones
  classic: [
    { l: [88, 96], c: [5, 15] },   // very light (highlight)
    { l: [10, 20], c: [10, 30] },  // very dark (shadow)
    { l: [42, 58], c: [40, 80] },  // mid-tone 1 (vibrant)
    { l: [55, 75], c: [25, 50] },  // mid-tone 2 (lighter)
    { l: [25, 40], c: [30, 65] }   // mid-tone 3 (darker)
  ],
  // Pastel structure has higher lightness, lower chroma
  pastel: [
    { l: [90, 98], c: [5, 15] },   // very light
    { l: [70, 85], c: [15, 35] },  // light
    { l: [60, 75], c: [20, 40] },  // medium-light
    { l: [55, 70], c: [25, 45] },  // medium
    { l: [45, 60], c: [25, 45] }   // medium-dark
  ],
  // Bold structure has more contrast, higher chroma
  bold: [
    { l: [80, 92], c: [10, 25] },  // light
    { l: [5, 15], c: [15, 45] },   // very dark
    { l: [38, 52], c: [60, 110] }, // vibrant mid-tone
    { l: [20, 35], c: [45, 90] },  // dark accent
    { l: [55, 70], c: [50, 90] }   // light accent
  ]
};

// Saturation modifiers - these affect the overall chroma of the palette
const SATURATION_MODIFIERS = {
  muted: 0.65,
  balanced: 1.0,
  vibrant: 1.4
};

/**
 * Convert hex color to LCh color space
 */
function hexToLch(hex: string): LCH {
  // Normalize hex
  hex = hex.replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    hex = '3366FF'; // Default to blue if invalid
  }
  
  try {
    // Convert to Lab first, then to LCh
    const lab = convert.hex.lab(hex);
    const lch = convert.lab.lch(lab);
    
    // Return structured LCh object
    return {
      l: lch[0],
      c: lch[1],
      h: lch[2]
    };
  } catch (error) {
    // Fallback to safe values if conversion fails
    return { l: 60, c: 60, h: 240 };
  }
}

/**
 * Convert LCh color to hex
 * Includes gamut mapping to ensure colors are displayable
 */
function lchToHex(lch: LCH): string {
  try {
    // Normalize values to valid ranges
    const normalizedLch = {
      l: Math.max(0, Math.min(100, lch.l)),
      c: Math.max(0, Math.min(150, lch.c)),
      h: ((lch.h % 360) + 360) % 360
    };
    
    // Try direct conversion
    const lab = convert.lch.lab([normalizedLch.l, normalizedLch.c, normalizedLch.h]);
    const hex = convert.lab.hex(lab);
    
    return `#${hex.toUpperCase()}`;
  } catch (error) {
    // If conversion fails (out of gamut), use binary search to find maximum in-gamut chroma
    return findMaxChroma(lch);
  }
}

/**
 * Find maximum valid chroma for a given lightness and hue
 * Uses binary search to efficiently find the edge of the displayable color gamut
 */
function findMaxChroma(lch: LCH): string {
  let minC = 0;
  let maxC = lch.c;
  let bestChroma = 0;
  let bestHex = "#000000";
  
  // Binary search with 10 iterations for precision
  for (let i = 0; i < 10; i++) {
    const midC = (minC + maxC) / 2;
    
    try {
      const lab = convert.lch.lab([lch.l, midC, lch.h]);
      const hex = convert.lab.hex(lab);
      bestHex = `#${hex.toUpperCase()}`;
      bestChroma = midC;
      
      // This chroma worked, try higher
      minC = midC;
    } catch (error) {
      // Too high, try lower
      maxC = midC;
    }
  }
  
  if (bestChroma > 0) {
    return bestHex;
  }
  
  // If binary search failed completely, adapt lightness based on hue
  const adaptedL = adaptLightnessForHue(lch.h, lch.l);
  
  try {
    const lab = convert.lch.lab([adaptedL, 15, lch.h]);
    const hex = convert.lab.hex(lab);
    return `#${hex.toUpperCase()}`;
  } catch (error) {
    // Last resort fallback
    return tinycolorLib({ h: lch.h, s: 0.5, l: lch.l / 100 }).toHexString().toUpperCase();
  }
}

/**
 * Adapt lightness based on hue to handle gamut boundaries better
 * Different hues have different maximum chroma at different lightness levels
 */
function adaptLightnessForHue(hue: number, lightness: number): number {
  // For yellows (high chroma only at high lightness)
  if (hue >= 50 && hue <= 80) {
    return Math.min(95, Math.max(70, lightness));
  }
  // For blues (high chroma at mid-low lightness)
  else if (hue >= 220 && hue <= 280) {
    return Math.min(60, Math.max(30, lightness));
  }
  // For reds (high chroma at mid-low lightness)
  else if ((hue >= 350 || hue <= 10)) {
    return Math.min(60, Math.max(30, lightness));
  }
  // For greens (limited chroma range)
  else if (hue >= 90 && hue <= 150) {
    return Math.min(80, Math.max(40, lightness));
  }
  
  // Default adaptive range
  return Math.min(80, Math.max(30, lightness));
}

/**
 * Calculate contrast between two LCh colors
 */
function calculateContrast(lch1: LCH, lch2: LCH): number {
  // Calculate weighted Delta E
  const deltaL = Math.abs(lch1.l - lch2.l);
  
  // Calculate hue difference accounting for circular nature
  let deltaH = Math.abs(lch1.h - lch2.h);
  if (deltaH > 180) deltaH = 360 - deltaH;
  
  // Weight hue difference by chroma (low chroma = hue matters less)
  const avgC = (lch1.c + lch2.c) / 2;
  const normalizedH = deltaH * (avgC / 50);
  
  const deltaC = Math.abs(lch1.c - lch2.c);
  
  // Return weighted distance (lightness is most important)
  return Math.sqrt(
    Math.pow(deltaL * 2.0, 2) + 
    Math.pow(deltaC * 1.0, 2) + 
    Math.pow(normalizedH * 0.5, 2)
  );
}

/**
 * Generate a seed palette from a base color
 */
function generateSeedPalette(baseLch: LCH, config: PaletteConfig): LCH[] {
  const { 
    harmonyType = 'analogous', 
    count = 5,
    toneProfile = 'balanced',
    saturationStyle = 'balanced'
  } = config;
  
  // Get harmony template
  const harmonyTemplate = HARMONY_TEMPLATES[harmonyType as keyof typeof HARMONY_TEMPLATES] || 
                          HARMONY_TEMPLATES.analogous;
  
  // Choose tone structure based on tone profile
  let toneStructure;
  if (toneProfile === 'light') {
    toneStructure = TONE_STRUCTURES.pastel;
  } else if (toneProfile === 'dark') {
    toneStructure = TONE_STRUCTURES.bold;
  } else {
    toneStructure = TONE_STRUCTURES.classic;
  }
  
  // Get saturation modifier
  const saturationMod = SATURATION_MODIFIERS[saturationStyle as keyof typeof SATURATION_MODIFIERS] || 
                        SATURATION_MODIFIERS.balanced;
  
  // Create the palette
  const palette: LCH[] = [];
  
  // NEW: Add multiple pattern options for more variety in tone ordering
  // Previously we always used [0, 1, 2, 3, 4] (light first, dark second)
  const patternOptions = [
    [0, 1, 2, 3, 4], // Classic: light → dark → midtones (original pattern)
    [1, 0, 2, 3, 4], // Dark first: dark → light → midtones
    [2, 0, 1, 3, 4], // Midtone first: midtone → light → dark → other midtones
    [2, 3, 0, 1, 4], // Midtones first: midtones → light → dark → accent
    [1, 2, 3, 4, 0], // Light last: dark → midtones → light
    [0, 2, 3, 4, 1]  // Dark last: light → midtones → dark
  ];
  
  // Choose a random pattern based on a weighted distribution
  const patternWeights = [0.25, 0.25, 0.15, 0.15, 0.1, 0.1]; // Weights add up to 1.0
  const randomValue = Math.random();
  let cumulativeWeight = 0;
  let patternIndex = 0;
  
  for (let i = 0; i < patternWeights.length; i++) {
    cumulativeWeight += patternWeights[i];
    if (randomValue < cumulativeWeight) {
      patternIndex = i;
      break;
    }
  }
  
  // Use the selected pattern for tone ordering
  const toneOrderIndices = patternOptions[patternIndex];
  
  // For count values different than 5, adjust accordingly
  const actualCount = Math.min(count, harmonyTemplate.length);
  
  // NEW: Occasionally reverse the hue distribution for more variety (25% chance)
  const shouldReverseHues = Math.random() < 0.25;
  
  // Loop through and create colors based on templates
  for (let i = 0; i < actualCount; i++) {
    // Get hue from harmony template with possible reversal
    const templateIndex = shouldReverseHues ? actualCount - 1 - i : i;
    const hueOffset = harmonyTemplate[templateIndex % harmonyTemplate.length];
    const newHue = ((baseLch.h + hueOffset) % 360 + 360) % 360;
    
    // Get tone bucket from structure using professional ordering
    const toneIndex = toneOrderIndices[i % toneOrderIndices.length];
    const toneBucket = toneStructure[toneIndex];
    
    // Determine lightness and chroma
    // Add less randomization for more predictable, curated results
    const lRange = toneBucket.l[1] - toneBucket.l[0];
    const cRange = toneBucket.c[1] - toneBucket.c[0];
    
    // NEW: Increase randomization range for more variety
    // Original was (0.4 + Math.random() * 0.2) which is 0.4-0.6 range
    // New is 0.3-0.7 range for more variety while still avoiding extremes
    const randomFactor = 0.3 + Math.random() * 0.4;
    
    // Apply the wider randomization range
    const newL = toneBucket.l[0] + lRange * randomFactor;
    const newC = (toneBucket.c[0] + cRange * randomFactor) * saturationMod;
    
    // Add color to palette
    palette.push({
      l: newL,
      c: newC,
      h: newHue
    });
  }
  
  return palette;
}

/**
 * Optimize a palette for better aesthetics
 */
function optimizePalette(seedPalette: LCH[], config: PaletteConfig): LCH[] {
  const result = [...seedPalette];
  
  // 1. Ensure adequate contrast between colors
  const MIN_CONTRAST = 15;
  
  // Compare each pair of colors
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const contrast = calculateContrast(result[i], result[j]);
      
      // If contrast is too low, make adjustments
      if (contrast < MIN_CONTRAST) {
        // Try adjusting lightness first (most effective)
        if (Math.abs(result[i].l - result[j].l) < 20) {
          // Push lightness values apart
          if (result[i].l < result[j].l) {
            result[i].l = Math.max(10, result[i].l - 10);
            result[j].l = Math.min(95, result[j].l + 10);
          } else {
            result[j].l = Math.max(10, result[j].l - 10);
            result[i].l = Math.min(95, result[i].l + 10);
          }
        }
        
        // If still not enough, adjust chroma
        if (calculateContrast(result[i], result[j]) < MIN_CONTRAST) {
          // Increase chroma difference
          if (result[i].c < result[j].c) {
            result[i].c = Math.max(10, result[i].c * 0.8);
            result[j].c = Math.min(120, result[j].c * 1.2);
          } else {
            result[j].c = Math.max(10, result[j].c * 0.8);
            result[i].c = Math.min(120, result[i].c * 1.2);
          }
        }
      }
    }
  }
  
  // 2. Ensure proper tone distribution
  result.sort((a, b) => a.l - b.l);
  
  // Ensure at least one dark color
  if (result[0].l > 30) {
    result[0].l = 15 + Math.random() * 10;
  }
  
  // Ensure at least one light color
  if (result[result.length - 1].l < 70) {
    result[result.length - 1].l = 80 + Math.random() * 15;
  }
  
  // 3. Apply final saturation curve based on lightness
  // Follows the natural pattern of higher saturation in midtones
  for (let i = 0; i < result.length; i++) {
    const l = result[i].l;
    
    // Apply a parabolic saturation curve peaking at 50% lightness
    const saturationFactor = 1 - Math.pow((l - 50) / 50, 2) * 0.5;
    
    // Apply the factor but maintain existing differences
    result[i].c = Math.max(5, Math.min(130, result[i].c * saturationFactor * 1.2));
  }
  
  return result;
}

/**
 * Main function to generate a beautiful color palette
 */
export function generateBeautifulPalette(baseColor: string, config: PaletteConfig): Color[] {
  // 1. Convert to LCh color space
  const baseLch = hexToLch(baseColor);
  
  // 2. Enhance the base color for a better starting point
  const enhancedBase = enhanceBaseColor(baseLch, config);
  
  // 3. Generate a seed palette based on templates
  const seedPalette = generateSeedPalette(enhancedBase, config);
  
  // 4. Optimize the palette for aesthetics and contrast
  const optimizedPalette = optimizePalette(seedPalette, config);
  
  // 5. Add finishing touches - sometimes introduce an accent color
  const finalPalette = addFinishingTouches(optimizedPalette, config);
  
  // NEW: Decide whether to retain the lightness sorting (which creates the dark-to-light pattern)
  // or use a different arrangement for more variety
  const arrangementPatterns = [
    'lightness-sort',  // Default: Sort by lightness (65% chance)
    'original-order',  // Keep colors in original harmony order (20% chance)
    'random-shuffle',  // Random shuffle (15% chance)
  ];
  
  // Choose pattern with weighted probabilities
  const patternChoice = Math.random();
  let chosenPattern = 'lightness-sort';
  
  if (patternChoice < 0.65) {
    chosenPattern = 'lightness-sort';
  } else if (patternChoice < 0.85) {
    chosenPattern = 'original-order';
  } else {
    chosenPattern = 'random-shuffle';
  }
  
  // Apply the chosen pattern
  let arrangedPalette = [...finalPalette];
  
  if (chosenPattern === 'lightness-sort') {
    // Sort by lightness (default behavior)
    arrangedPalette.sort((a, b) => a.l - b.l);
  } else if (chosenPattern === 'random-shuffle') {
    // Random shuffle
    for (let i = arrangedPalette.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arrangedPalette[i], arrangedPalette[j]] = [arrangedPalette[j], arrangedPalette[i]];
    }
  }
  // For 'original-order', we just keep the array as is
  
  // 6. Convert back to hex colors and create the color objects
  return arrangedPalette.map(lch => {
    const hex = lchToHex(lch);
    const tc = tinycolorLib(hex);
    const rgb = tc.toRgb();
    const hsl = tc.toHsl();
    
    return {
      hex: hex,
      rgb: {
        r: rgb.r,
        g: rgb.g,
        b: rgb.b
      },
      hsl: {
        h: Math.round(hsl.h),
        s: Math.round(hsl.s * 100),
        l: Math.round(hsl.l * 100)
      }
    };
  });
}

/**
 * Enhance base color for better palette generation
 */
function enhanceBaseColor(lch: LCH, config: PaletteConfig): LCH {
  const { saturationStyle = 'balanced' } = config;
  const enhanced = { ...lch };
  
  // Adjust chroma based on style
  if (saturationStyle === 'vibrant') {
    enhanced.c = Math.min(100, enhanced.c * 1.3);
  } else if (saturationStyle === 'muted') {
    enhanced.c = Math.max(20, Math.min(60, enhanced.c * 0.7));
  } else {
    enhanced.c = Math.max(30, Math.min(80, enhanced.c));
  }
  
  // Adjust lightness for optimal chroma
  if (enhanced.l < 25) {
    enhanced.l = 30 + Math.random() * 10;
  } else if (enhanced.l > 85) {
    enhanced.l = 70 + Math.random() * 10;
  }
  
  // Optimize for specific hue regions
  if (enhanced.h >= 50 && enhanced.h <= 70) { // Yellows
    enhanced.l = Math.max(65, enhanced.l);
  } else if (enhanced.h >= 200 && enhanced.h <= 280) { // Blues
    enhanced.l = Math.min(65, Math.max(35, enhanced.l));
  }
  
  return enhanced;
}

/**
 * Add finishing touches to make palettes more interesting and cohesive
 */
function addFinishingTouches(palette: LCH[], config: PaletteConfig): LCH[] {
  const result = [...palette];
  
  // Sort by lightness for working with the palette
  result.sort((a, b) => a.l - b.l);
  
  // ===== PROFESSIONAL PALETTE ENHANCEMENTS =====
  
  // NEW: Add multiple pattern styles with different probabilities
  const patternStyles = [
    'classic',       // Classic light-to-dark spread (40%)
    'high-contrast', // More extreme light-dark contrast (20%)
    'mid-focused',   // Focus on mid-tones with less extremes (15%)
    'gradient',      // Smooth gradient effect (15%)
    'random'         // Totally randomized lightness (10%)
  ];
  
  // Choose a pattern style randomly with weighted distribution
  const randomStyle = Math.random();
  let chosenStyle = 'classic';
  
  if (randomStyle < 0.4) {
    chosenStyle = 'classic';
  } else if (randomStyle < 0.6) {
    chosenStyle = 'high-contrast';
  } else if (randomStyle < 0.75) {
    chosenStyle = 'mid-focused';
  } else if (randomStyle < 0.9) {
    chosenStyle = 'gradient';
  } else {
    chosenStyle = 'random';
  }
  
  // Define thresholds based on style
  let LIGHT_THRESHOLD = 80;
  let DARK_THRESHOLD = 25;
  let applySorting = true;
  
  // Apply different enhancement strategies based on chosen style
  if (chosenStyle === 'high-contrast') {
    // More extreme light-dark contrast
    LIGHT_THRESHOLD = 85;
    DARK_THRESHOLD = 15;
  } else if (chosenStyle === 'mid-focused') {
    // Focus on mid-tones
    LIGHT_THRESHOLD = 75;
    DARK_THRESHOLD = 35;
  } else if (chosenStyle === 'gradient') {
    // Create a smoother gradient of lightness
    const minLight = 15 + Math.random() * 15; // 15-30
    const maxLight = 75 + Math.random() * 20; // 75-95
    const step = (maxLight - minLight) / (result.length - 1);
    
    for (let i = 0; i < result.length; i++) {
      result[i].l = minLight + (step * i);
    }
    
    // Skip the normal light/dark threshold logic
    applySorting = false;
  } else if (chosenStyle === 'random') {
    // Randomize the lightness values within reasonable bounds
    for (let i = 0; i < result.length; i++) {
      result[i].l = 20 + Math.random() * 70; // 20-90 range
    }
    
    // Don't sort, keep it random
    applySorting = false;
  }
  
  // Apply standard light/dark adjustments for most styles
  if (applySorting) {
    // Ensure we have one truly light color (white/off-white)
    if (result[result.length-1].l < LIGHT_THRESHOLD) {
      result[result.length-1].l = LIGHT_THRESHOLD + Math.random() * 15;
      // Light colors look better with low chroma
      result[result.length-1].c = Math.max(5, result[result.length-1].c * 0.5);
    }
    
    // Ensure we have one truly dark color (near-black)
    if (result[0].l > DARK_THRESHOLD) {
      result[0].l = Math.max(10, DARK_THRESHOLD - Math.random() * 10);
      // Dark colors should have moderate chroma
      result[0].c = Math.min(45, Math.max(15, result[0].c));
    }
  }
  
  // NEW: Randomly choose a pattern for accent colors 
  const accentPatterns = [
    'standard',     // Default behavior (40%)
    'vibrant-mid',  // Make mid-tones more vibrant (20%) 
    'vibrant-dark', // Make dark colors more vibrant (15%)
    'vibrant-all',  // Make all colors more vibrant (10%)
    'muted-all',    // Make all colors more muted (15%)
  ];
  
  const randomAccent = Math.random();
  let chosenAccent = 'standard';
  
  if (randomAccent < 0.4) {
    chosenAccent = 'standard';
  } else if (randomAccent < 0.6) {
    chosenAccent = 'vibrant-mid';
  } else if (randomAccent < 0.75) {
    chosenAccent = 'vibrant-dark';
  } else if (randomAccent < 0.85) {
    chosenAccent = 'vibrant-all';
  } else {
    chosenAccent = 'muted-all';
  }
  
  // Apply the chosen accent pattern
  if (chosenAccent === 'standard') {
    // Standard accent handling - vibrant mid-tone
    if (config.saturationStyle !== 'muted') {
      // Mid-tone color with high chroma serves as anchor
      const midIndex = Math.floor(result.length / 2);
      result[midIndex].l = 45 + Math.random() * 10; // Perfect mid-range
      result[midIndex].c = Math.min(100, result[midIndex].c * 1.4); // More vibrant
    }
  } else if (chosenAccent === 'vibrant-mid') {
    // Make mid-tones more vibrant
    for (let i = 0; i < result.length; i++) {
      if (result[i].l >= 35 && result[i].l <= 65) {
        result[i].c = Math.min(110, result[i].c * 1.6);
      }
    }
  } else if (chosenAccent === 'vibrant-dark') {
    // Make dark colors more vibrant
    for (let i = 0; i < result.length; i++) {
      if (result[i].l < 40) {
        result[i].c = Math.min(100, result[i].c * 1.5);
      }
    }
  } else if (chosenAccent === 'vibrant-all') {
    // Make all colors more vibrant
    for (let i = 0; i < result.length; i++) {
      result[i].c = Math.min(110, result[i].c * 1.3);
    }
  } else if (chosenAccent === 'muted-all') {
    // Make all colors more muted
    for (let i = 0; i < result.length; i++) {
      result[i].c = Math.max(10, result[i].c * 0.7);
    }
  }
  
  // Chance of adding a neutral color (reduced to 50% from 70%)
  const neutralIndex = Math.random() < 0.5 ? 1 : result.length - 2; // Second darkest or second lightest
  if (Math.random() < 0.5) { // 50% chance of adding a neutral
    result[neutralIndex].c = Math.max(5, result[neutralIndex].c * 0.3);
  }
  
  // NEW: Occasionally add a "pop" color with extreme saturation (20% chance)
  if (Math.random() < 0.2 && config.saturationStyle !== 'muted') {
    // Choose a random index except for the lightest and darkest
    const popIndex = 1 + Math.floor(Math.random() * (result.length - 2));
    result[popIndex].c = Math.min(120, result[popIndex].c * 2.0);
  }
  
  // 4. Adjust common hue values to trending hues for more modern look
  const TRENDING_HUES = {
    red: 5,
    orange: 30,
    yellow: 50,
    green: 145,
    teal: 175,
    blue: 210,
    indigo: 240,
    purple: 275,
    pink: 330
  };
  
  // Snap hues to trending values for more professional look (within 15 degrees)
  for (let i = 0; i < result.length; i++) {
    const currentHue = result[i].h;
    
    // Find closest trending hue
    let closestHue = currentHue;
    let minDistance = 30; // Only snap if within 30 degrees
    
    for (const [name, hue] of Object.entries(TRENDING_HUES)) {
      const distance = Math.min(
        Math.abs(currentHue - hue),
        360 - Math.abs(currentHue - hue)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestHue = hue;
      }
    }
    
    // Snap to trending hue with some variation (don't make it exact)
    if (minDistance < 30) {
      // Move 60-80% of the way to the trending hue
      const moveAmount = minDistance * (0.6 + Math.random() * 0.2);
      const direction = ((closestHue - currentHue + 360) % 360) < 180 ? 1 : -1;
      result[i].h = ((currentHue + direction * moveAmount) % 360 + 360) % 360;
    }
  }
  
  // 5. Ensure colors are visually distinguishable (critical for professional palettes)
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      // Calculate weighted delta E (emphasis on hue differences for non-neutrals)
      const hDiff = Math.min(Math.abs(result[i].h - result[j].h), 360 - Math.abs(result[i].h - result[j].h));
      
      // Too similar in hue and lightness? Adjust the most movable color
      if (hDiff < 15 && Math.abs(result[i].l - result[j].l) < 20) {
        // Which color is less important to preserve? (prefer keeping mid-tones unchanged)
        const midtoneIndex = Math.floor(result.length / 2);
        const adjustIndex = Math.abs(i - midtoneIndex) > Math.abs(j - midtoneIndex) ? i : j;
        
        // Move the hue by a noticeable amount in the more open direction
        result[adjustIndex].h = (result[adjustIndex].h + 20 + Math.random() * 10) % 360;
      }
    }
  }
  
  // 6. Final balance - ensure we have a varied saturation distribution
  // Professional palettes rarely have all high or all low saturation
  const chromaValues = result.map(color => color.c);
  const avgChroma = chromaValues.reduce((sum, c) => sum + c, 0) / chromaValues.length;
  
  if (avgChroma > 70 && config.saturationStyle !== 'muted') {
    // Too vibrant overall, reduce saturation of the lightest or darkest color
    if (Math.random() < 0.5) {
      result[0].c *= 0.6; // Darken the darkest
    } else {
      result[result.length-1].c *= 0.6; // Lighten the lightest
    }
  } else if (avgChroma < 30 && config.saturationStyle !== 'vibrant') {
    // Too muted, increase saturation of a mid-tone
    const midIndex = Math.floor(result.length / 2);
    result[midIndex].c = Math.min(90, result[midIndex].c * 1.7);
  }
  
  // Unsort to restore original order before returning
  // This is unnecessary since we sorted by lightness
  // result would stay sorted by lightness which is what we want
  
  return result;
} 