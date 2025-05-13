import tinycolor from 'tinycolor2';
import convert from 'color-convert';
import { getRandomResponse } from './colorResponseVariations';

// Cast tinycolor to any to avoid type errors
const tinycolorLib: any = tinycolor;

// Types for color analysis
export interface ColorAnalysis {
  score: number;
  advice: string;
  message: string;
}

/**
 * Generate a harmonious palette based on a base color
 * @param baseColor - Base color in hex format
 * @param option - Harmony type ('analogous', 'monochromatic', etc.)
 * @param count - Number of colors to generate
 * @returns Array of hex color codes
 */
export function generateHarmoniousPalette(
  baseColor: string,
  option: string = 'analogous',
  count: number = 5
): string[] {
  const tc = tinycolorLib(baseColor);
  
  // Define harmony types
  const harmonies: Record<string, () => string[]> = {
    analogous: () => {
      const results = [baseColor];
      const hsl = tc.toHsl();
      const step = 30; // Degrees to step on color wheel
      
      for (let i = 1; i <= Math.floor(count / 2); i++) {
        // Add colors on both sides of the base color
        const leftHue = (hsl.h - step * i + 360) % 360;
        const leftColor = tinycolorLib({h: leftHue, s: hsl.s, l: hsl.l}).toHexString();
        
        const rightHue = (hsl.h + step * i) % 360;
        const rightColor = tinycolorLib({h: rightHue, s: hsl.s, l: hsl.l}).toHexString();
        
        // Add to the result array (left on the left, right on the right)
        if (results.length < count) results.unshift(leftColor);
        if (results.length < count) results.push(rightColor);
      }
      
      return results;
    },
    
    monochromatic: () => {
      const results = [baseColor];
      
      // Add lighter shades
      for (let i = 1; i <= Math.floor(count / 2); i++) {
        const lighter = tinycolorLib(baseColor).lighten(i * 10).toHexString();
        results.push(lighter);
      }
      
      // Add darker shades
      for (let i = 1; i <= Math.ceil(count / 2) - 1; i++) {
        const darker = tinycolorLib(baseColor).darken(i * 10).toHexString();
        results.unshift(darker);
      }
      
      return results.slice(0, count);
    },
    
    triad: () => {
      const hsl = tc.toHsl();
      const colors = [baseColor];
      
      // Add colors 120° apart on the color wheel
      if (count >= 2) {
        const secondHue = (hsl.h + 120) % 360;
        colors.push(tinycolorLib({h: secondHue, s: hsl.s, l: hsl.l}).toHexString());
      }
      
      if (count >= 3) {
        const thirdHue = (hsl.h + 240) % 360;
        colors.push(tinycolorLib({h: thirdHue, s: hsl.s, l: hsl.l}).toHexString());
      }
      
      // Add variations if we need more than 3 colors
      if (count > 3) {
        for (let i = 0; i < count - 3; i++) {
          const sourceColor = colors[i % 3];
          const variant = tinycolorLib(sourceColor).lighten(10).toHexString();
          colors.push(variant);
        }
      }
      
      return colors;
    },
    
    complementary: () => {
      const hsl = tc.toHsl();
      const colors = [baseColor];
      
      // Add complementary color (opposite on color wheel)
      if (count >= 2) {
        const complementHue = (hsl.h + 180) % 360;
        colors.push(tinycolorLib({h: complementHue, s: hsl.s, l: hsl.l}).toHexString());
      }
      
      // Add variations if needed
      if (count > 2) {
        for (let i = 0; i < count - 2; i++) {
          const index = i % 2; // Alternate between base and complement
          const sourceColor = colors[index];
          
          // Make variations by adjusting lightness
          const variant = tinycolorLib(sourceColor)
            .lighten(10 * ((i / 2) + 1))
            .toHexString();
            
          colors.push(variant);
        }
      }
      
      return colors;
    },
    
    splitComplementary: () => {
      const hsl = tc.toHsl();
      const colors = [baseColor];
      
      // Add two colors 150° and 210° from the base
      if (count >= 2) {
        const firstSplitHue = (hsl.h + 150) % 360;
        colors.push(tinycolorLib({h: firstSplitHue, s: hsl.s, l: hsl.l}).toHexString());
      }
      
      if (count >= 3) {
        const secondSplitHue = (hsl.h + 210) % 360;
        colors.push(tinycolorLib({h: secondSplitHue, s: hsl.s, l: hsl.l}).toHexString());
      }
      
      // Add variations if needed
      if (count > 3) {
        for (let i = 0; i < count - 3; i++) {
          const index = i % 3;
          const sourceColor = colors[index];
          const variant = tinycolorLib(sourceColor).lighten(10).toHexString();
          colors.push(variant);
        }
      }
      
      return colors;
    },
    
    tetrad: () => {
      const hsl = tc.toHsl();
      const colors = [baseColor];
      
      // Add colors 90°, 180°, and 270° from base
      if (count >= 2) {
        const secondHue = (hsl.h + 90) % 360;
        colors.push(tinycolorLib({h: secondHue, s: hsl.s, l: hsl.l}).toHexString());
      }
      
      if (count >= 3) {
        const thirdHue = (hsl.h + 180) % 360;
        colors.push(tinycolorLib({h: thirdHue, s: hsl.s, l: hsl.l}).toHexString());
      }
      
      if (count >= 4) {
        const fourthHue = (hsl.h + 270) % 360;
        colors.push(tinycolorLib({h: fourthHue, s: hsl.s, l: hsl.l}).toHexString());
      }
      
      // Add variations if needed
      if (count > 4) {
        for (let i = 0; i < count - 4; i++) {
          const index = i % 4;
          const sourceColor = colors[index];
          const variant = tinycolorLib(sourceColor).lighten(10).toHexString();
          colors.push(variant);
        }
      }
      
      return colors;
    }
  };
  
  // Default to analogous if requested type not found
  const harmonyFunc = harmonies[option] || harmonies.analogous;
  return harmonyFunc().slice(0, count);
}

// Analyze the contrast between adjacent colors
function analyzeContrast(colors: any[]): number {
  if (colors.length < 2) return 0;
  
  let totalContrast = 0;
  
  for (let i = 0; i < colors.length - 1; i++) {
    const color1 = colors[i];
    const color2 = colors[i + 1];
    
    // Calculate contrast between adjacent colors
    const contrast = tinycolorLib.readability(color1, color2);
    
    // Normalize to a 0-1 score, where contrast of 1.5 is minimum (0) and 10 is max (1)
    const normalizedContrast = Math.min(Math.max((contrast - 1.5) / 8.5, 0), 1);
    
    totalContrast += normalizedContrast;
  }
  
  return totalContrast / (colors.length - 1);
}

// Analyze the harmony of colors
function analyzeHarmony(colors: any[]): number {
  // Simple harmony analysis for deployment
  const hslColors = colors.map(color => color.toHsl());
  
  // Calculate hue range
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
  
  // Score based on hue range (perfect triadic at 120, analogous at <60)
  let harmonyScore;
  
  if (hueRange < 30) {
    // Monochromatic or analogous with very close colors
    harmonyScore = 0.9;
  } else if (hueRange < 60) {
    // Analogous palette - high harmony
    harmonyScore = 0.85;
  } else if (Math.abs(hueRange - 120) < 20) {
    // Close to triadic - good harmony
    harmonyScore = 0.8;
  } else if (Math.abs(hueRange - 180) < 20) {
    // Close to complementary - good but can be harsh
    harmonyScore = 0.7;
  } else {
    // Other cases - proportionally reduce score
    harmonyScore = 0.6;
  }
  
  return harmonyScore;
}

// New comprehensive palette rating system that produces scores from 0-10
export function ratePaletteQuality(colors: string[]): { score: number; details: Record<string, number> } {
  // Skip rating if not enough colors
  if (!colors || colors.length < 2) {
    return { score: 0, details: {} };
  }

  // Convert all colors to LCh for analysis
  const colorObjects = colors.map(color => {
    const tc = tinycolor(color);
    const rgb = tc.toRgb();
    const hsl = tc.toHsl();
    
    // Convert to Lab
    const lab = convert.rgb.lab([rgb.r, rgb.g, rgb.b]);
    // Convert to LCh
    const lch = convert.lab.lch(lab);
    
    return {
      hex: color,
      rgb: { r: rgb.r, g: rgb.g, b: rgb.b },
      hsl: { h: hsl.h, s: hsl.s * 100, l: hsl.l * 100 },
      lab: { l: lab[0], a: lab[1], b: lab[2] },
      lch: { l: lch[0], c: lch[1], h: lch[2] }
    };
  });

  // 1. Harmony Score - How well the hues follow harmonic patterns
  const harmonyScore = calculateHarmonyScore(colorObjects);
  
  // 2. Contrast Score - How well the colors contrast with each other
  const contrastScore = calculateContrastScore(colorObjects);
  
  // 3. Tone Balance Score - How well distributed the lightness values are
  const toneScore = calculateToneBalanceScore(colorObjects);
  
  // 4. Chroma/Saturation Score - How appropriate the saturation values are
  const chromaScore = calculateChromaScore(colorObjects);
  
  // 5. Gamut Score - Penalize out-of-gamut colors that had to be adjusted
  const gamutScore = calculateGamutScore(colorObjects);

  // Apply weights to each score component
  const weights = {
    harmony: 0.25,  // Harmony is critical for palette coherence
    contrast: 0.25, // Contrast is essential for usability
    tone: 0.20,     // Tone balance creates visual hierarchy
    chroma: 0.20,   // Appropriate saturation feels harmonious
    gamut: 0.10     // Small penalty for out-of-gamut colors
  };

  // Calculate the weighted score (0-1 scale)
  const weightedScore = 
    weights.harmony * harmonyScore +
    weights.contrast * contrastScore +
    weights.tone * toneScore + 
    weights.chroma * chromaScore +
    weights.gamut * gamutScore;
  
  // Convert to 0-10 scale with one decimal place precision
  const finalScore = Math.round(weightedScore * 100) / 10;
  
  // Return the final score and component details for transparency
  return {
    score: finalScore,
    details: {
      harmony: Math.round(harmonyScore * 100) / 100,
      contrast: Math.round(contrastScore * 100) / 100,
      tone: Math.round(toneScore * 100) / 100,
      chroma: Math.round(chromaScore * 100) / 100,
      gamut: Math.round(gamutScore * 100) / 100,
      raw: Math.round(weightedScore * 100) / 100
    }
  };
}

// Detect color harmony type from a set of colors
function detectHarmonyType(colors: any[]): string {
  const hues = colors.map(color => color.lch.h);
  
  // Calculate hue differences
  const hueDiffs: number[] = [];
  for (let i = 1; i < hues.length; i++) {
    // Smallest angle between hues (accounting for circular nature)
    let diff = Math.abs(hues[i] - hues[0]);
    if (diff > 180) diff = 360 - diff;
    hueDiffs.push(diff);
  }
  
  // Check for monochromatic (all hues within 15 degrees)
  if (hueDiffs.every(diff => diff < 15)) {
    return 'monochromatic';
  }
  
  // Check for complementary (at least one color ~180 degrees from base)
  if (hueDiffs.some(diff => Math.abs(diff - 180) < 20)) {
    return 'complementary';
  }
  
  // Check for analogous (all colors within 60 degrees)
  if (hueDiffs.every(diff => diff < 60)) {
    return 'analogous';
  }
  
  // Check for triadic (two colors roughly 120 degrees apart)
  if (hueDiffs.filter(diff => Math.abs(diff - 120) < 20).length >= 2) {
    return 'triadic';
  }
  
  // Check for tetradic/square (colors at 90, 180, 270 degrees)
  const tetradDiffs = [90, 180, 270];
  if (tetradDiffs.every(target => 
    hueDiffs.some(diff => Math.abs(diff - target) < 25))) {
    return 'tetradic';
  }
  
  // Check for split complementary (colors at ~150 and ~210 degrees)
  if (hueDiffs.some(diff => Math.abs(diff - 150) < 20) && 
      hueDiffs.some(diff => Math.abs(diff - 210) < 20)) {
    return 'splitComplementary';
  }
  
  // Default to undefined harmony
  return 'undefined';
}

// Calculate how well hues conform to harmonic relationships
function calculateHarmonyScore(colors: any[]): number {
  // Detect the likely harmony type
  const harmonyType = detectHarmonyType(colors);
  
  // Get the base hue (first color)
  const baseHue = colors[0].lch.h;
  
  // Define expected hue offsets for each harmony type
  const harmonyTemplates: Record<string, number[]> = {
    monochromatic: [0, 0, 0, 0, 0],
    analogous: [0, 30, -30, 60, -60],
    complementary: [0, 180, 30, 150, 210],
    triadic: [0, 120, 240, 60, 180],
    tetradic: [0, 90, 180, 270, 45],
    splitComplementary: [0, 150, 210, 30, 180],
    undefined: [0, 72, 144, 216, 288] // Fallback to pentadic
  };
  
  // Get the expected offsets for the detected harmony
  const expectedOffsets = harmonyTemplates[harmonyType] || harmonyTemplates.undefined;
  
  // Calculate hue deviations from expected pattern
  let totalDeviation = 0;
  const maxPossibleDeviation = 180; // Maximum angular distance possible
  
  // Sort colors by hue for better matching to template
  const sortedColors = [...colors].sort((a, b) => a.lch.h - b.lch.h);
  
  // For each color, find the best matching template angle
  for (const color of sortedColors) {
    let minDeviation = 180;
    
    for (const offset of expectedOffsets) {
      // Calculate expected hue
      const expectedHue = (baseHue + offset) % 360;
      
      // Find smallest angular distance
      let deviation = Math.abs(color.lch.h - expectedHue);
      if (deviation > 180) deviation = 360 - deviation;
      
      // Keep the smallest deviation
      minDeviation = Math.min(minDeviation, deviation);
    }
    
    totalDeviation += minDeviation;
  }
  
  // Normalize the average deviation (lower is better)
  const normalizedDeviation = totalDeviation / (colors.length * maxPossibleDeviation);
  
  // Convert to score where 1 is perfect
  let harmonyScore = 1 - normalizedDeviation;
  
  // Bonus for recognized harmonies
  if (harmonyType !== 'undefined') {
    harmonyScore = Math.min(1, harmonyScore * 1.2); // 20% bonus for clear harmony
  }
  
  return harmonyScore;
}

// Calculate contrast score based on CIE Lab delta E
function calculateContrastScore(colors: any[]): number {
  const MIN_DESIRED_CONTRAST = 25; // Minimum desired delta E for good contrast
  const OPTIMAL_CONTRAST = 45;     // Optimal delta E for perfect contrast
  
  // Calculate all pairwise contrasts
  const contrasts: number[] = [];
  
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const color1 = colors[i];
      const color2 = colors[j];
      
      // Calculate delta E (color difference)
      const deltaE = Math.sqrt(
        Math.pow(color1.lab.l - color2.lab.l, 2) +
        Math.pow(color1.lab.a - color2.lab.a, 2) +
        Math.pow(color1.lab.b - color2.lab.b, 2)
      );
      
      contrasts.push(deltaE);
    }
  }
  
  if (contrasts.length === 0) return 0;
  
  // Find the minimum contrast
  const minContrast = Math.min(...contrasts);
  
  // Find average contrast
  const avgContrast = contrasts.reduce((sum, c) => sum + c, 0) / contrasts.length;
  
  // Score based on minimum contrast (primary factor)
  let minContrastScore = Math.min(1, minContrast / MIN_DESIRED_CONTRAST);
  
  // Score based on average contrast (secondary factor)
  let avgContrastScore = 0;
  if (avgContrast < OPTIMAL_CONTRAST) {
    // Below optimal: scale linearly
    avgContrastScore = avgContrast / OPTIMAL_CONTRAST;
  } else if (avgContrast <= OPTIMAL_CONTRAST * 1.5) {
    // Slightly above optimal: perfect score
    avgContrastScore = 1;
  } else {
    // Too high contrast: penalize slightly
    avgContrastScore = 1 - Math.min(1, (avgContrast - OPTIMAL_CONTRAST * 1.5) / (OPTIMAL_CONTRAST * 0.5));
  }
  
  // Combine scores (minimum contrast is more important)
  return 0.7 * minContrastScore + 0.3 * avgContrastScore;
}

// Calculate how well-distributed the lightness values are
function calculateToneBalanceScore(colors: any[]): number {
  // Sort colors by lightness
  const lightnesses = colors.map(c => c.lch.l).sort((a, b) => a - b);
  
  // Define ideal lightness distribution (e.g., well-distributed from dark to light)
  // For 5 colors: very dark, dark, mid, light, very light
  let idealDistribution: number[];
  
  if (lightnesses.length === 5) {
    idealDistribution = [10, 30, 50, 70, 90]; // Ideal 5-color distribution
  } else if (lightnesses.length === 4) {
    idealDistribution = [15, 40, 65, 85];     // Ideal 4-color distribution
  } else if (lightnesses.length === 3) {
    idealDistribution = [20, 50, 80];         // Ideal 3-color distribution
  } else if (lightnesses.length > 5) {
    // For larger palettes, create an evenly distributed ideal
    idealDistribution = Array(lightnesses.length).fill(0)
      .map((_, i) => 10 + (80 * i / (lightnesses.length - 1)));
  } else {
    // For unusual sizes, create a simple distribution
    idealDistribution = Array(lightnesses.length).fill(0)
      .map((_, i) => 10 + (80 * i / (lightnesses.length - 1)));
  }
  
  // Calculate the average deviation from ideal
  let totalDeviation = 0;
  for (let i = 0; i < lightnesses.length; i++) {
    totalDeviation += Math.abs(lightnesses[i] - idealDistribution[i]);
  }
  
  const avgDeviation = totalDeviation / lightnesses.length;
  
  // Normalize score (0-1 where 1 is perfect)
  // A deviation of 30 or more points is considered poor (score of 0)
  const score = Math.max(0, 1 - (avgDeviation / 30));
  
  return score;
}

// Calculate how appropriate the chroma/saturation values are
function calculateChromaScore(colors: any[]): number {
  // Define ideal chroma ranges for different purposes
  const IDEAL_MIN_CHROMA = 20;  // Too low = muddy/gray
  const IDEAL_MAX_CHROMA = 100; // Too high = oversaturated
  const OPTIMAL_MIN = 30;       // Best minimum chroma
  const OPTIMAL_MAX = 80;       // Best maximum chroma
  
  // Calculate chroma statistics
  const chromas = colors.map(c => c.lch.c);
  const minChroma = Math.min(...chromas);
  const maxChroma = Math.max(...chromas);
  const avgChroma = chromas.reduce((sum, c) => sum + c, 0) / chromas.length;
  
  // Score minimum chroma - penalize if too low (muddy colors)
  let minChromaScore;
  if (minChroma < IDEAL_MIN_CHROMA) {
    minChromaScore = minChroma / IDEAL_MIN_CHROMA;
  } else if (minChroma <= OPTIMAL_MIN) {
    minChromaScore = 1;
  } else {
    // Small penalty for minimum being too high (no subtle colors)
    minChromaScore = 1 - Math.min(0.3, (minChroma - OPTIMAL_MIN) / (OPTIMAL_MAX - OPTIMAL_MIN));
  }
  
  // Score maximum chroma - penalize if too high (garish colors)
  let maxChromaScore;
  if (maxChroma > IDEAL_MAX_CHROMA) {
    maxChromaScore = 1 - Math.min(1, (maxChroma - IDEAL_MAX_CHROMA) / 50);
  } else if (maxChroma >= OPTIMAL_MAX) {
    maxChromaScore = 1;
  } else {
    // Small penalty for maximum being too low (no vibrant colors)
    maxChromaScore = 0.7 + 0.3 * (maxChroma / OPTIMAL_MAX);
  }
  
  // Score variance in chroma - reward some variety
  const chromaVariance = Math.max(...chromas) - Math.min(...chromas);
  let varianceScore;
  
  if (chromaVariance < 20) {
    // Too uniform in saturation
    varianceScore = 0.5 + (chromaVariance / 40);
  } else if (chromaVariance <= 60) {
    // Good range of saturation
    varianceScore = 1;
  } else {
    // Too much variance in saturation
    varianceScore = 1 - Math.min(0.5, (chromaVariance - 60) / 60);
  }
  
  // Combine scores with appropriate weights
  return 0.3 * minChromaScore + 0.4 * maxChromaScore + 0.3 * varianceScore;
}

// Calculate gamut score (penalty for out-of-gamut colors)
function calculateGamutScore(colors: any[]): number {
  // Check if any colors are near the sRGB gamut boundary
  let outOfGamutCount = 0;
  
  for (const color of colors) {
    const { r, g, b } = color.rgb;
    
    // Check if any channel is very close to 0 or 255
    const threshold = 5; // 5/255 as threshold for "close to edge"
    if (r <= threshold || r >= 255 - threshold ||
        g <= threshold || g >= 255 - threshold ||
        b <= threshold || b >= 255 - threshold) {
      outOfGamutCount++;
    }
    
    // Alternative method: check if chroma is unusually high for the lightness
    // Certain lightness levels cannot support high chroma in sRGB
    const { l, c } = color.lch;
    const maxChromaEstimate = getEstimatedMaxChroma(l);
    if (c > maxChromaEstimate * 0.95) {
      outOfGamutCount++;
    }
  }
  
  // Remove duplicates in count (a color might be flagged twice)
  outOfGamutCount = Math.min(outOfGamutCount, colors.length);
  
  // Calculate score (1 = no out-of-gamut colors)
  return 1 - (outOfGamutCount / colors.length) * 0.5; // 50% penalty for all colors out of gamut
}

// Estimate maximum possible chroma at a given lightness in sRGB gamut
function getEstimatedMaxChroma(lightness: number): number {
  // This is an approximation of sRGB gamut boundaries in LCh
  // Based on empirical observations
  if (lightness <= 5 || lightness >= 95) {
    return 20; // Near black or white, very limited chroma
  }
  
  // Peak chroma availability is around lightness 50-65
  if (lightness >= 45 && lightness <= 70) {
    return 140;
  }
  
  // Linear interpolation for other lightness values
  if (lightness < 45) {
    return 20 + (120 * (lightness - 5) / 40);
  } else {
    return 20 + (120 * (95 - lightness) / 25);
  }
}

// Update the analyzeColorPalette function to use our new rating system
export function analyzeColorPalette(colors: string[]): { advice: string; score: number; message: string } {
  if (!colors || colors.length === 0) {
    return {
      advice: "No colors to analyze.",
      score: 0,
      message: "Empty palette"
    };
  }

  // Get the new quality rating
  const { score, details } = ratePaletteQuality(colors);
  
  // Round the score for display
  const roundedScore = Math.round(score * 10) / 10;
  
  // Get component advice for all scores
  let componentAdvice = '';
  
  // For excellent palettes (8.0+), provide more nuanced component advice
  if (score >= 8.0) {
    // Find the weakest component, even if it's still pretty good
    const weakestComponent = getWeakestComponent(details);
    
    // For very high scores, give more gentle advice about possible improvements
    const enhancementAdvice = getEnhancementAdviceForComponent(weakestComponent);
    if (enhancementAdvice) {
      componentAdvice = enhancementAdvice;
    }
  }
  // For good palettes (7.0-7.9), provide more direct component advice
  else if (score >= 7.0) {
    componentAdvice = getAdviceBasedOnWeakestComponent(details);
  }
  // For average palettes (6.0-6.9), provide standard component advice
  else if (score >= 6.0) {
    componentAdvice = getAdviceBasedOnWeakestComponent(details);
  }
  
  // Get a random response based on the score
  const response = getRandomResponse(roundedScore, componentAdvice);
  
  return {
    advice: response.advice,
    score: roundedScore,
    message: response.message
  };
}

// Helper function to determine the weakest component
function getWeakestComponent(details: Record<string, number>): string {
  const components = ['harmony', 'contrast', 'tone', 'chroma', 'gamut'];
  let lowestScore = 1;
  let weakestComponent = '';
  
  // Find the weakest component
  for (const component of components) {
    if (details[component] < lowestScore) {
      lowestScore = details[component];
      weakestComponent = component;
    }
  }
  
  return weakestComponent;
}

// Helper function to provide more nuanced advice for high-scoring palettes
function getEnhancementAdviceForComponent(component: string): string {
  switch (component) {
    case 'harmony':
      return "For even more refinement, you could experiment with slightly adjusting one of the hues to strengthen the color relationships.";
    case 'contrast':
      return "If you want to enhance it further, you could increase the contrast slightly between certain color pairs for more visual impact.";
    case 'tone':
      return "For additional visual interest, you might consider adding a bit more variation in the lightness values.";
    case 'chroma':
      return "To further enhance this palette, you could experiment with subtle adjustments to the saturation of one or two colors.";
    case 'gamut':
      return "For optimal display across all devices, consider small adjustments to any colors that might be near the edge of the color gamut.";
    default:
      return "";
  }
}

// Helper function to provide targeted advice based on the weakest component
function getAdviceBasedOnWeakestComponent(details: Record<string, number>): string {
  const weakestComponent = getWeakestComponent(details);
  
  // Return specific advice based on the weakest component
  switch (weakestComponent) {
    case 'harmony':
      return "Consider adjusting the hues to create a more harmonious relationship between colors.";
    case 'contrast':
      return "You could improve the contrast between some of the colors for better readability.";
    case 'tone':
      return "Try creating more variety in lightness values for better visual hierarchy.";
    case 'chroma':
      return "Consider adjusting the saturation levels for a more balanced feel.";
    case 'gamut':
      return "Some colors may be near the edge of displayable colors - minor adjustments could make them more stable.";
    default:
      return "Consider making small adjustments to further enhance the palette.";
  }
}

