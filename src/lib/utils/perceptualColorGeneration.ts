import tinycolor from 'tinycolor2';
import convert from 'color-convert';
import { 
  LCH,
  PaletteConfig,
  hexToLch, 
  lchToHex, 
  calculateHarmonyScore, 
  calculateContrastScore, 
  calculateToneDistributionScore,
  calculateSaturationScore,
  calculateDeltaE
} from './perceptualColorSpace';

// Cast tinycolor to any to avoid type errors
const tinycolorLib: any = tinycolor;

// Interface for the optimized color palette object
export interface OptimizedPalette {
  colors: string[];
  score: number;
  harmonyScore: number;
  contrastScore: number;
  toneScore: number;
  saturationScore?: number;
}

// Predefined color templates for common harmony types
const HARMONY_TEMPLATES = {
  monochromatic: {
    chromaMultipliers: [1.0, 0.8, 0.6, 0.7, 0.9],
    lightnessOffsets: [0, 25, -25, 40, -40],
    hueOffsets: [0, 0, 0, 0, 0]
  },
  complementary: {
    hueOffsets: [0, 180, 0, 180, 0],
    chromaMultipliers: [1.0, 1.1, 0.9, 0.8, 1.2],
    lightnessOffsets: [0, 0, 15, -15, -25]
  },
  analogous: {
    hueOffsets: [0, 30, -30, 45, -45],
    chromaMultipliers: [1.0, 0.9, 0.9, 0.8, 0.8],
    lightnessOffsets: [0, 10, -10, 25, -25]
  },
  triadic: {
    hueOffsets: [0, 120, 240, 120, 240],
    chromaMultipliers: [1.0, 1.1, 1.0, 0.9, 0.9],
    lightnessOffsets: [0, 0, 0, 15, -15]
  },
  tetradic: {
    hueOffsets: [0, 90, 180, 270, 0],
    chromaMultipliers: [1.0, 0.9, 1.0, 0.9, 1.1],
    lightnessOffsets: [0, 0, 0, 0, 20]
  },
  splitComplementary: {
    hueOffsets: [0, 150, 210, 150, 210],
    chromaMultipliers: [1.0, 0.9, 0.9, 1.1, 1.1],
    lightnessOffsets: [0, 0, 0, 20, -20]
  }
};

/**
 * Generate a perceptually optimized color palette
 * 
 * @param baseColor The starting color in hex format (#RRGGBB)
 * @param config Configuration options for the palette
 * @returns An optimized palette with scores
 */
export function generatePerceptualPalette(
  baseColor: string, 
  config: PaletteConfig
): OptimizedPalette {
  // Set default config values if not provided
  const {
    harmonyType = 'analogous',
    count = 5,
    contrastEnhance = true,
    toneDistribution = 'even',
    saturationPreference = 'balanced'
  } = config;
  
  // Convert base color to LCh
  const baseLch = hexToLch(baseColor);
  
  // Enhance base color for better starting point
  const enhancedBaseLch = enhanceBaseColor(baseLch, saturationPreference);
  
  // Create initial palette with template-based approach
  const initialPalette = generateTemplateBasedPalette(
    enhancedBaseLch, 
    harmonyType, 
    count, 
    saturationPreference
  );
  
  // Run optimization algorithm to find the best palette
  const optimizedPalette = optimizePalette(
    initialPalette, 
    harmonyType, 
    contrastEnhance,
    toneDistribution,
    saturationPreference
  );
  
  // Calculate final scores
  const harmonyScore = calculateHarmonyScore(optimizedPalette, harmonyType);
  const contrastScore = calculateContrastScore(optimizedPalette);
  const toneScore = calculateToneDistributionScore(optimizedPalette, toneDistribution);
  const saturationScore = calculateSaturationScore(optimizedPalette, saturationPreference);
  
  // Overall score (weighted average - lower is better for harmony/tone, higher for contrast)
  const overallScore = (
    (harmonyScore * 0.35) + 
    (10 / Math.max(contrastScore, 1) * 0.35) + 
    (toneScore * 0.15) +
    (saturationScore * 0.15)
  );
  
  // Convert to hex colors
  const hexColors = optimizedPalette.map(lch => lchToHex(lch));
  
  return {
    colors: hexColors,
    score: 10 - Math.min(10, overallScore),  // Convert to 0-10 score where higher is better
    harmonyScore: harmonyScore,
    contrastScore: contrastScore,
    toneScore: toneScore,
    saturationScore: saturationScore
  };
}

/**
 * Enhance the base color to make it more vibrant for better palette generation
 */
function enhanceBaseColor(lch: LCH, preference: string): LCH {
  const enhanced = { ...lch };
  
  // Adjust chroma based on preference
  switch (preference) {
    case 'vibrant':
      // Boost chroma significantly for truly vibrant colors
      enhanced.c = Math.min(140, enhanced.c * 1.5);
      break;
    case 'muted':
      // Lower chroma for more muted colors, but keep enough to avoid muddiness
      enhanced.c = Math.max(25, enhanced.c * 0.7);
      break;
    case 'balanced':
    default:
      // Increase chroma for better color impact
      enhanced.c = Math.min(120, enhanced.c * 1.2);
      break;
  }
  
  // If the lightness is extreme, move it toward middle range for better chroma potential
  if (enhanced.l < 20) {
    enhanced.l = 20 + (enhanced.l * 0.5);
  } else if (enhanced.l > 90) {
    enhanced.l = 90 - ((100 - enhanced.l) * 0.5);
  }
  
  // Adjust lightness based on hue to maximize chroma potential
  // Different hue regions have different optimal lightness for maximum chroma
  if (enhanced.h >= 0 && enhanced.h <= 30) { // Reds
    // Reds have highest chroma at lower lightness
    enhanced.l = Math.max(enhanced.l, 30);
    enhanced.l = Math.min(enhanced.l, 65);
  } else if (enhanced.h > 30 && enhanced.h <= 90) { // Yellows
    // Yellows need high lightness for good chroma
    enhanced.l = Math.max(enhanced.l, 65);
  } else if (enhanced.h > 90 && enhanced.h <= 150) { // Greens
    // Greens have limited chroma range, moderate lightness is best
    enhanced.l = Math.max(enhanced.l, 35);
    enhanced.l = Math.min(enhanced.l, 75);
  } else if (enhanced.h > 150 && enhanced.h <= 270) { // Blues/Purples
    // Blues work well at moderate to lower lightness
    enhanced.l = Math.min(enhanced.l, 70);
    enhanced.l = Math.max(enhanced.l, 30);
  } else if (enhanced.h > 270 && enhanced.h <= 360) { // Magentas
    // Magentas work well at moderate lightness
    enhanced.l = Math.min(enhanced.l, 75);
    enhanced.l = Math.max(enhanced.l, 30);
  }
  
  return enhanced;
}

/**
 * Generate a palette using predefined templates and adjustments
 * for more aesthetically pleasing starting point
 */
function generateTemplateBasedPalette(
  baseLch: LCH, 
  harmonyType: string,
  count: number,
  saturationPreference: string
): LCH[] {
  // Get template for the harmony type
  const template = HARMONY_TEMPLATES[harmonyType as keyof typeof HARMONY_TEMPLATES] || 
                   HARMONY_TEMPLATES.analogous;
  
  // Create palette array starting with the base color
  const palette: LCH[] = [{ ...baseLch }];
  
  // Use templates for better initial distribution
  for (let i = 1; i < count; i++) {
    // Get template values with defaults for positions beyond template size
    const hueOffset = template.hueOffsets?.[i] ?? (i * 30 % 360);
    const chromaMultiplier = template.chromaMultipliers?.[i] ?? 1.0;
    const lightnessOffset = template.lightnessOffsets?.[i] ?? (i % 2 === 0 ? 15 : -15);
    
    // Calculate new color values
    const newHue = (baseLch.h + hueOffset + 360) % 360;
    
    // Adjust chroma based on preference
    let chromaAdjustment = 1.0;
    switch (saturationPreference) {
      case 'vibrant':
        chromaAdjustment = 1.3;
        break;
      case 'muted':
        chromaAdjustment = 0.7;
        break;
      default:
        chromaAdjustment = 1.0;
    }
    
    const newChroma = Math.max(10, Math.min(120, 
      baseLch.c * chromaMultiplier * chromaAdjustment
    ));
    
    // Ensure lightness remains in valid range and is well-distributed
    const newLightness = Math.max(10, Math.min(95, 
      baseLch.l + lightnessOffset
    ));
    
    // Add new color to palette
    palette.push({
      l: newLightness,
      c: newChroma,
      h: newHue
    });
  }
  
  return palette;
}

/**
 * Optimize a palette using simulated annealing algorithm with improved parameters
 */
function optimizePalette(
  initialPalette: LCH[],
  harmonyType: string,
  contrastEnhance: boolean,
  toneDistribution: string,
  saturationPreference: string
): LCH[] {
  // Clone the initial palette to avoid mutations
  let currentPalette = JSON.parse(JSON.stringify(initialPalette));
  let bestPalette = JSON.parse(JSON.stringify(initialPalette));
  
  // Calculate initial scores
  let currentHarmonyScore = calculateHarmonyScore(currentPalette, harmonyType);
  let currentContrastScore = calculateContrastScore(currentPalette);
  let currentToneScore = calculateToneDistributionScore(currentPalette, toneDistribution);
  let currentSaturationScore = calculateSaturationScore(currentPalette, saturationPreference);
  
  // Overall score calculation with improvements
  let currentScore = calculateOverallScore(
    currentHarmonyScore, 
    currentContrastScore, 
    currentToneScore,
    currentSaturationScore,
    contrastEnhance,
    saturationPreference
  );
  
  let bestScore = currentScore;
  
  // Modified simulated annealing parameters
  const initialTemperature = 150.0;  // Higher initial temperature for more exploration
  const finalTemperature = 0.01;     // Lower final temperature for better convergence
  const coolingRate = 0.92;          // Slower cooling for thorough search
  const iterationsPerTemp = 200;     // More iterations per temperature
  
  // Start the simulated annealing process
  let temperature = initialTemperature;
  
  while (temperature > finalTemperature) {
    for (let iteration = 0; iteration < iterationsPerTemp; iteration++) {
      // Create a neighbor solution by modifying one color slightly
      const neighbor = createNeighborSolution(
        currentPalette, 
        temperature,
        harmonyType,
        saturationPreference
      );
      
      // Calculate scores for the neighbor
      const neighborHarmonyScore = calculateHarmonyScore(neighbor, harmonyType);
      const neighborContrastScore = calculateContrastScore(neighbor);
      const neighborToneScore = calculateToneDistributionScore(neighbor, toneDistribution);
      const neighborSaturationScore = calculateSaturationScore(neighbor, saturationPreference);
      
      // Overall score with improved weighting
      const neighborScore = calculateOverallScore(
        neighborHarmonyScore, 
        neighborContrastScore, 
        neighborToneScore,
        neighborSaturationScore,
        contrastEnhance,
        saturationPreference
      );
      
      // Decide whether to accept the neighbor solution
      const delta = neighborScore - currentScore;
      
      // Accept if better, or with probability based on temperature
      // Using a modified acceptance probability function for better results
      const acceptanceProbability = Math.exp(-Math.abs(delta) / (temperature * 0.08));
      
      if (delta < 0 || Math.random() < acceptanceProbability) {
        // Accept the new solution
        currentPalette = neighbor;
        currentScore = neighborScore;
        currentHarmonyScore = neighborHarmonyScore;
        currentContrastScore = neighborContrastScore;
        currentToneScore = neighborToneScore;
        currentSaturationScore = neighborSaturationScore;
        
        // Update best solution if this is better
        if (currentScore < bestScore) {
          bestPalette = JSON.parse(JSON.stringify(currentPalette));
          bestScore = currentScore;
        }
      }
    }
    
    // Cool the temperature
    temperature *= coolingRate;
  }
  
  // Apply post-processing improvements in a specific order
  
  // 1. Don't modify the base color
  bestPalette[0] = initialPalette[0];
  
  // 2. First enhance saturation to avoid muddy colors
  bestPalette = enhanceSaturation(bestPalette, saturationPreference);
  
  // 3. Apply final adjustments for tone distribution
  bestPalette = adjustToneDistribution(bestPalette, toneDistribution);
  
  // 4. Apply final adjustments for better contrast last
  if (contrastEnhance) {
    bestPalette = enhanceContrastPostProcess(bestPalette);
  }
  
  return bestPalette;
}

/**
 * Calculate overall score with improved weighting that prioritizes vibrance and contrast
 * Lower is better
 */
function calculateOverallScore(
  harmonyScore: number,
  contrastScore: number,
  toneScore: number,
  saturationScore: number,
  contrastEnhance: boolean,
  saturationPreference: string
): number {
  // Dynamic weights with stronger emphasis on saturation and contrast
  let harmonyWeight = 0.25;
  let contrastWeight = contrastEnhance ? 0.35 : 0.3;
  let toneWeight = 0.15;
  let saturationWeight = 0.25; // Increased default weight for saturation
  
  // Adjust weights based on saturation preference
  if (saturationPreference === 'vibrant') {
    saturationWeight = 0.35; // Much higher weight for saturation in vibrant palettes
    harmonyWeight = 0.20;
    toneWeight = 0.10;
  } else if (saturationPreference === 'muted') {
    saturationWeight = 0.30;
    harmonyWeight = 0.25;
    contrastWeight = 0.30;
    toneWeight = 0.15;
  }
  
  // Ensure weights sum to 1.0
  const totalWeight = harmonyWeight + contrastWeight + toneWeight + saturationWeight;
  
  harmonyWeight /= totalWeight;
  contrastWeight /= totalWeight;
  toneWeight /= totalWeight;
  saturationWeight /= totalWeight;
  
  // Invert contrast score since higher is better but we want lower overall score
  const invertedContrastScore = 60 / (contrastScore + 5);
  
  // Apply a stronger non-linear penalty for low saturation (muddy colors)
  const adjustedSaturationScore = 
    saturationPreference === 'vibrant' 
      ? Math.pow(saturationScore, 1.5) // Exponential penalty for vibrant preference
      : saturationScore;
  
  return (
    (harmonyScore * harmonyWeight) + 
    (invertedContrastScore * contrastWeight) + 
    (toneScore * toneWeight) +
    (adjustedSaturationScore * saturationWeight)
  );
}

/**
 * Create a slightly modified version of the current palette with improved modifications
 */
function createNeighborSolution(
  palette: LCH[],
  temperature: number,
  harmonyType: string,
  saturationPreference: string
): LCH[] {
  // Clone the palette
  const neighbor = JSON.parse(JSON.stringify(palette));
  
  // Random position to modify (but never the first/base color)
  const posToModify = 1 + Math.floor(Math.random() * (palette.length - 1));
  
  // Smart property selection with improved probabilities for vibrant colors
  let propertyProbabilities = { hue: 0.25, chroma: 0.45, lightness: 0.30 };
  
  // Adjust probabilities based on harmony type
  if (harmonyType === 'monochromatic') {
    propertyProbabilities = { hue: 0.05, chroma: 0.5, lightness: 0.45 };
  } else if (harmonyType === 'analogous') {
    propertyProbabilities = { hue: 0.35, chroma: 0.4, lightness: 0.25 };
  }
  
  // Adjust probabilities based on saturation preference
  if (saturationPreference === 'vibrant') {
    propertyProbabilities.chroma = 0.5;
    propertyProbabilities.hue = 0.25;
    propertyProbabilities.lightness = 0.25;
  } else if (saturationPreference === 'muted') {
    propertyProbabilities.chroma = 0.5;
    propertyProbabilities.hue = 0.15;
    propertyProbabilities.lightness = 0.35;
  }
  
  // Randomly select a property based on probabilities
  const rand = Math.random();
  let propertyToModify: 'hue' | 'chroma' | 'lightness';
  
  if (rand < propertyProbabilities.hue) {
    propertyToModify = 'hue';
  } else if (rand < propertyProbabilities.hue + propertyProbabilities.chroma) {
    propertyToModify = 'chroma';
  } else {
    propertyToModify = 'lightness';
  }
  
  // Scale adjustments based on temperature (larger changes at higher temp)
  const tempScale = temperature / 100;
  
  if (propertyToModify === 'hue' && harmonyType !== 'monochromatic') {
    // Adjust hue with more nuanced scaling based on harmony type
    let hueAdjustmentRange = tempScale * 20; // Default
    
    if (harmonyType === 'complementary' || harmonyType === 'splitComplementary') {
      hueAdjustmentRange = tempScale * 10; // More precise for complementary
    } else if (harmonyType === 'analogous') {
      hueAdjustmentRange = tempScale * 25; // Wider for analogous
    }
    
    const hueChange = (Math.random() * 2 - 1) * hueAdjustmentRange;
    neighbor[posToModify].h = ((neighbor[posToModify].h + hueChange) % 360 + 360) % 360;
  } 
  else if (propertyToModify === 'chroma') {
    // Adjust chroma with strong bias toward higher values to avoid muddy colors
    let chromaAdjustmentRangePositive = tempScale * 30;  // Much higher for better exploration
    let chromaAdjustmentRangeNegative = tempScale * 15;
    
    // Bias for saturation preference
    if (saturationPreference === 'vibrant') {
      // For vibrant, heavily bias toward increases
      chromaAdjustmentRangePositive = tempScale * 40;
      chromaAdjustmentRangeNegative = tempScale * 5;
    } else if (saturationPreference === 'muted') {
      // For muted, moderate bias toward decreases
      chromaAdjustmentRangePositive = tempScale * 15;
      chromaAdjustmentRangeNegative = tempScale * 20;
    }
    
    // Generate a change value with appropriate bias
    let chromaChange;
    
    // For colors with low chroma, strongly bias toward increase
    if (neighbor[posToModify].c < 50) {
      // Strong bias toward increase for low-chroma colors
      const randBias = Math.random() * 0.8 + 0.2; // 0.2 to 1.0
      chromaChange = randBias * chromaAdjustmentRangePositive;
    } 
    // For high-chroma colors in muted palettes, bias toward decrease
    else if (saturationPreference === 'muted' && neighbor[posToModify].c > 60) {
      const randBias = -(Math.random() * 0.8 + 0.2);  // -0.2 to -1.0
      chromaChange = randBias * chromaAdjustmentRangeNegative;
    }
    // Otherwise, bias toward increase for vibrant palettes
    else if (saturationPreference === 'vibrant') {
      const randBias = Math.random() * 1.4 - 0.4; // -0.4 to 1.0 (70% chance of increase)
      chromaChange = randBias * 
        (randBias > 0 ? chromaAdjustmentRangePositive : chromaAdjustmentRangeNegative);
    }
    // Otherwise, normal distribution around 0
    else {
      chromaChange = (Math.random() * 2 - 1) * 
        (Math.random() < 0.5 ? chromaAdjustmentRangePositive : chromaAdjustmentRangeNegative);
    }
    
    // Apply change with appropriate limits based on preference
    const minChroma = saturationPreference === 'muted' ? 15 : 40;  // Higher minimum to avoid muddy colors
    const maxChroma = saturationPreference === 'vibrant' ? 150 : 110;
    
    neighbor[posToModify].c = Math.max(minChroma, Math.min(maxChroma, 
      neighbor[posToModify].c + chromaChange
    ));
  } 
  else {
    // Adjust lightness with awareness of tone distribution and hue
    const lightnessAdjustmentRange = tempScale * 20;
    const lightnessChange = (Math.random() * 2 - 1) * lightnessAdjustmentRange;
    
    // Apply change with limits that depend on position and hue
    const hue = neighbor[posToModify].h;
    
    // Adjust lightness ranges based on hue to maximize chroma potential
    let minLightness = 5;
    let maxLightness = 95;
    
    // Yellows need higher lightness
    if (hue > 40 && hue < 80) {
      minLightness = 60;
    }
    // Reds work better at lower to mid lightness
    else if ((hue >= 355 || hue <= 10)) {
      maxLightness = 70;
    }
    
    // Apply position-based constraints too
    const position = posToModify / (palette.length - 1);
    minLightness = Math.max(minLightness, 5 + position * 15);
    maxLightness = Math.min(maxLightness, 100 - (1 - position) * 15);
    
    neighbor[posToModify].l = Math.max(minLightness, Math.min(maxLightness, 
      neighbor[posToModify].l + lightnessChange
    ));
  }
  
  return neighbor;
}

/**
 * Enhance saturation to avoid muddy colors
 */
function enhanceSaturation(palette: LCH[], preference: string): LCH[] {
  const enhanced = JSON.parse(JSON.stringify(palette));
  
  // Determine target chroma ranges based on preference with higher minimums
  let minTargetChroma: number;
  let maxTargetChroma: number;
  
  switch (preference) {
    case 'vibrant':
      minTargetChroma = 70;  // Much higher minimum for vibrant palettes
      maxTargetChroma = 150; // Much higher maximum
      break;
    case 'muted':
      minTargetChroma = 25;  // Higher minimum even for muted (to avoid true muddiness)
      maxTargetChroma = 60;
      break;
    case 'balanced':
    default:
      minTargetChroma = 45;  // Higher minimum for balanced palettes
      maxTargetChroma = 110;
      break;
  }
  
  // For monochromatic palettes, ensure more variation in chroma
  const isMonochromatic = palette.every(color => 
    Math.abs(color.h - palette[0].h) < 15 || 
    Math.abs(color.h - palette[0].h) > 345
  );
  
  if (isMonochromatic) {
    for (let i = 1; i < enhanced.length; i++) {
      // Create a chroma gradient for monochromatic palettes
      const position = i / (enhanced.length - 1);
      const targetChroma = minTargetChroma + (maxTargetChroma - minTargetChroma) * (1 - position);
      
      // Don't force decrease if already above minimum
      if (enhanced[i].c < targetChroma) {
        enhanced[i].c = targetChroma;
      }
    }
  } else {
    // Process each color except the first/base color
    for (let i = 1; i < enhanced.length; i++) {
      const color = enhanced[i];
      
      // If chroma is below minimum, boost it aggressively
      if (color.c < minTargetChroma) {
        const boost = (minTargetChroma - color.c) * 1.2; // Stronger boost factor
        color.c = Math.min(maxTargetChroma, color.c + boost);
      }
      // If chroma is too high, reduce it slightly, but less aggressively
      else if (color.c > maxTargetChroma) {
        const reduction = color.c - maxTargetChroma;
        color.c = Math.max(minTargetChroma, color.c - reduction * 0.4); // More gentle reduction
      }
      
      // Adjust chroma based on lightness - very dark or light colors need more chroma to pop
      if (color.l < 30 || color.l > 85) {
        color.c = Math.min(maxTargetChroma, color.c * 1.2);
      }
    }
  }
  
  return enhanced;
}

/**
 * Apply post-processing to enhance contrast between colors
 */
function enhanceContrastPostProcess(palette: LCH[]): LCH[] {
  const enhanced = JSON.parse(JSON.stringify(palette));
  
  // Skip if palette is too small
  if (palette.length < 3) return enhanced;
  
  // Implement our own version of calculateDeltaE instead of importing it
  function localCalculateDeltaE(lch1: LCH, lch2: LCH): number {
    // Simple Delta E implementation for contrast calculation
    const dL = lch1.l - lch2.l;
    const dC = lch1.c - lch2.c;
    
    // Calculate hue difference accounting for circularity
    let dH = Math.abs(lch1.h - lch2.h);
    if (dH > 180) dH = 360 - dH;
    
    // Weight factors to prioritize lightness differences
    return Math.sqrt(
      Math.pow(dL * 1.5, 2) + 
      Math.pow(dC * 1.2, 2) + 
      Math.pow(dH * 0.8, 2)
    );
  }
  
  // 1. Check and fix contrast between all pairs using improved contrast model
  const MIN_CONTRAST = 18; // Higher minimum delta E for more distinct colors
  
  // Multiple iterations to improve contrast
  for (let iteration = 0; iteration < 4; iteration++) {
    let improvements = 0;
    
    // Check each pair
    for (let i = 0; i < enhanced.length - 1; i++) {
      for (let j = i + 1; j < enhanced.length; j++) {
        const contrast = localCalculateDeltaE(enhanced[i], enhanced[j]);
        
        // If contrast is too low, try to improve with more aggressive changes
        if (contrast < MIN_CONTRAST) {
          improvements++;
          
          // Strategy 1: Adjust lightness in opposite directions
          const lightnessAvg = (enhanced[i].l + enhanced[j].l) / 2;
          
          if (lightnessAvg > 50) {
            // Darker overall, make one lighter and one darker
            enhanced[i].l = Math.max(15, enhanced[i].l - 10);
            enhanced[j].l = Math.min(90, enhanced[j].l + 10);
          } else {
            // Lighter overall, make one darker and one lighter
            enhanced[i].l = Math.min(90, enhanced[i].l + 10);
            enhanced[j].l = Math.max(15, enhanced[j].l - 10);
          }
          
          // Strategy 2: Adjust chroma in opposite directions
          enhanced[i].c = Math.min(150, enhanced[i].c * 1.2);
          enhanced[j].c = Math.max(20, enhanced[j].c * 0.85);
          
          // Strategy 3: If colors have similar hues, push them apart
          const hueDiff = Math.min(
            Math.abs(enhanced[i].h - enhanced[j].h),
            360 - Math.abs(enhanced[i].h - enhanced[j].h)
          );
          
          if (hueDiff < 20) {
            // Push hues apart, but keep them in their general region
            const pushAmount = 10;
            enhanced[i].h = (enhanced[i].h - pushAmount + 360) % 360;
            enhanced[j].h = (enhanced[j].h + pushAmount) % 360;
          }
        }
      }
    }
    
    // Stop if no more improvements needed
    if (improvements === 0) break;
  }
  
  // 2. Ensure lightness values are well-distributed (except the base color)
  const sortable = enhanced.slice(1);
  
  // Sort by lightness
  sortable.sort((a, b) => a.l - b.l);
  
  // Ensure minimum lightness separation between adjacent colors
  const MIN_LIGHTNESS_DIFF = 12;
  
  for (let i = 1; i < sortable.length; i++) {
    const prevL = sortable[i-1].l;
    const currL = sortable[i].l;
    
    if (currL - prevL < MIN_LIGHTNESS_DIFF) {
      // Move current color up to ensure minimum difference
      sortable[i].l = prevL + MIN_LIGHTNESS_DIFF;
      
      // Cap at maximum lightness
      sortable[i].l = Math.min(95, sortable[i].l);
    }
  }
  
  // If any adjustments exceeded bounds, re-distribute
  if (sortable[sortable.length - 1].l > 95) {
    // Recalculate even distribution within bounds
    const minL = Math.max(10, sortable[0].l);
    const maxL = 95;
    const range = maxL - minL;
    
    for (let i = 0; i < sortable.length; i++) {
      // Distribute evenly within available range
      sortable[i].l = minL + (range * i / (sortable.length - 1 || 1));
    }
  }
  
  // Put the modified colors back in the palette
  for (let i = 0; i < sortable.length; i++) {
    enhanced[i + 1] = sortable[i];
  }
  
  // 3. Final pass to push chroma up for any colors that are still low
  for (let i = 1; i < enhanced.length; i++) {
    if (enhanced[i].c < 40) {
      enhanced[i].c = Math.min(100, enhanced[i].c * 1.5);
    }
  }
  
  return enhanced;
}

/**
 * Adjust tone distribution based on preference with improved curve functions
 */
function adjustToneDistribution(palette: LCH[], preference: string): LCH[] {
  if (palette.length < 3) return palette;
  
  const adjusted = JSON.parse(JSON.stringify(palette));
  
  // Don't change the base color
  const sortable = adjusted.slice(1);
  
  // Sort by lightness
  sortable.sort((a, b) => a.l - b.l);
  
  // Adjust lightness based on preference with more natural distribution
  for (let i = 0; i < sortable.length; i++) {
    const ratio = i / (sortable.length - 1 || 1);
    
    let targetL;
    if (preference === 'even') {
      // Even distribution with slight S-curve for more natural feel
      targetL = 15 + 70 * Math.pow(Math.sin(ratio * Math.PI - Math.PI/2) * 0.5 + 0.5, 0.8);
    } 
    else if (preference === 'dark-bias') {
      // More dark colors, fewer light ones with exponential curve
      targetL = 10 + 85 * Math.pow(ratio, 1.8);
    } 
    else if (preference === 'light-bias') {
      // More light colors, fewer dark ones with log curve
      targetL = 20 + 75 * Math.pow(ratio, 0.5);
    }
    else {
      // Default to even distribution
      targetL = 15 + ratio * 70;
    }
    
    // Blend current lightness with target (65% target, 35% current)
    // This preserves some of the original character while ensuring good distribution
    sortable[i].l = sortable[i].l * 0.35 + targetL * 0.65;
  }
  
  // Put the modified colors back in the palette
  for (let i = 0; i < sortable.length; i++) {
    adjusted[i + 1] = sortable[i];
  }
  
  return adjusted;
}

/**
 * Utility function to adapt the new perceptual palette generation
 * to match the existing function signature for generateColorPalette
 */
export function generateOptimizedPalette(
  baseColor: string,
  options: {
    paletteType: 'monochromatic' | 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'splitComplementary';
    count?: number;
    useAdobeAlgorithm?: boolean;
  }
): { hex: string; rgb: any; hsl: any; name?: string }[] {
  try {
    // Force vibrant color boosting - this is a direct fix for the muddy colors problem
    // First convert the base color to a more vibrant version
    const enhancedBaseColor = boostColorVibrance(baseColor);
    
    // Ensure baseColor has a valid format
    if (!enhancedBaseColor.startsWith('#')) {
      baseColor = `#${enhancedBaseColor}`;
    }

    if (!/^#[0-9A-F]{6}$/i.test(enhancedBaseColor)) {
      console.warn(`Invalid hex color: ${enhancedBaseColor}, defaulting to #3366FF`);
      baseColor = '#3366FF';
    } else {
      baseColor = enhancedBaseColor;
    }
    
    // Customize settings based on harmony type for optimal results
    let saturationPreference: 'balanced' | 'vibrant' | 'muted';
    let toneDistribution: 'even' | 'dark-bias' | 'light-bias';
    
    // ALWAYS use vibrant for ANY harmony type to avoid muddy colors
    saturationPreference = 'vibrant';
    
    // Updated optimal settings for each harmony type based on aesthetics research
    switch (options.paletteType) {
      case 'monochromatic':
        toneDistribution = 'even';
        break;
        
      case 'complementary':
        toneDistribution = 'dark-bias';
        break;
        
      case 'analogous':
        toneDistribution = 'even';
        break;
        
      case 'triadic':
        toneDistribution = 'dark-bias';
        break;
        
      case 'tetradic':
        toneDistribution = 'light-bias';
        break;
        
      case 'splitComplementary':
        toneDistribution = 'even';
        break;
        
      default:
        toneDistribution = 'even';
    }
    
    // Convert old options format to new config format
    const config: PaletteConfig = {
      harmonyType: options.paletteType,
      count: options.count || 5,
      contrastEnhance: true,
      toneDistribution: toneDistribution,
      saturationPreference: saturationPreference
    };
    
    // Generate multiple palettes and pick the best one for even better results
    const NUM_ATTEMPTS = 5;  // Increased from 3 to 5 for better exploration
    let bestPalette: OptimizedPalette | null = null;
    
    for (let i = 0; i < NUM_ATTEMPTS; i++) {
      const generatedPalette = generatePerceptualPalette(baseColor, config);
      
      // Modify how we select the best palette - prioritize non-muddy ones
      // Check if this palette has better score or significantly better saturationScore
      if (!bestPalette || 
          generatedPalette.score > bestPalette.score || 
          (generatedPalette.saturationScore < bestPalette.saturationScore * 0.8)) {
        bestPalette = generatedPalette;
      }
    }
    
    if (!bestPalette) {
      throw new Error("Failed to generate palette");
    }
    
    // Final post-processing to ensure vibrant colors
    const enhancedColors = bestPalette.colors.map(color => forceVibrantColor(color));
    bestPalette.colors = enhancedColors;
    
    // Convert to the expected return format
    return bestPalette.colors.map((hexColor, index) => {
      const tc = tinycolorLib(hexColor);
      const rgb = tc.toRgb();
      const hsl = tc.toHsl();
      
      // Create more descriptive names based on the harmony type
      let name: string;
      if (index === 0) {
        name = 'Base';
      } else {
        if (options.paletteType === 'monochromatic') {
          name = index < Math.ceil(options.count! / 2) 
            ? `Shade ${Math.ceil(options.count! / 2) - index}` 
            : `Tint ${index - Math.floor(options.count! / 2)}`;
        } else if (options.paletteType === 'complementary' && index === 1) {
          name = 'Complement';
        } else if (options.paletteType === 'analogous') {
          name = index <= Math.floor(options.count! / 2) 
            ? `Left ${Math.floor(options.count! / 2) - index + 1}` 
            : `Right ${index - Math.floor(options.count! / 2)}`;
        } else {
          name = `Color ${index + 1}`;
        }
      }
      
      return {
        hex: hexColor,
        rgb: rgb,
        hsl: {
          h: hsl.h,
          s: hsl.s * 100,
          l: hsl.l * 100
        },
        name
      };
    });
  } catch (error) {
    console.error("Error in generateOptimizedPalette:", error);
    
    // Create a completely revised fallback with guaranteed vibrant colors
    const fallbackColors = [];
    const baseColorObj = tinycolorLib(baseColor);
    
    // Add base color
    fallbackColors.push({
      hex: baseColorObj.toHexString().toUpperCase(),
      rgb: baseColorObj.toRgb(),
      hsl: {
        h: baseColorObj.toHsl().h,
        s: baseColorObj.toHsl().s * 100,
        l: baseColorObj.toHsl().l * 100
      },
      name: 'Base'
    });
    
    // Add additional colors with better variations
    const count = options.count || 5;
    
    // NEW APPROACH: Use color palettes with guaranteed high saturation
    switch (options.paletteType) {
      case 'monochromatic':
        // Generate vibrant shades and tints
        const baseHue = baseColorObj.toHsl().h;
        
        for (let i = 1; i < count; i++) {
          // Generate lightness and saturation so we get a mix of vibrant shades/tints
          const position = i / (count - 1);
          const lightness = (position > 0.5) 
            ? 25 + 55 * (position - 0.5) * 2 // Higher lightness for tints
            : 65 - 35 * position * 2;        // Lower lightness for shades
          
          // Higher saturation for all colors
          const saturation = Math.min(95, baseColorObj.toHsl().s * 100 + 20);
          
          const newColor = tinycolorLib({
            h: baseHue,
            s: saturation / 100,
            l: lightness / 100
          });
          
          fallbackColors.push({
            hex: newColor.toHexString().toUpperCase(),
            rgb: newColor.toRgb(),
            hsl: {
              h: newColor.toHsl().h,
              s: newColor.toHsl().s * 100,
              l: newColor.toHsl().l * 100
            },
            name: `Color ${i + 1}`
          });
        }
        break;
        
      case 'complementary':
        // Base color plus complementary with vibrant variants
        const complement = baseColorObj.clone().spin(180).saturate(20);
        
        fallbackColors.push({
          hex: complement.toHexString().toUpperCase(),
          rgb: complement.toRgb(),
          hsl: {
            h: complement.toHsl().h,
            s: complement.toHsl().s * 100,
            l: complement.toHsl().l * 100
          },
          name: 'Complement'
        });
        
        // Add variations with guaranteed vibrance
        if (count > 2) {
          // Create a lighter variant of base
          const lighter = baseColorObj.clone().lighten(20).saturate(10);
          fallbackColors.push({
            hex: lighter.toHexString().toUpperCase(),
            rgb: lighter.toRgb(),
            hsl: {
              h: lighter.toHsl().h,
              s: lighter.toHsl().s * 100,
              l: lighter.toHsl().l * 100
            },
            name: 'Color 3'
          });
        }
        
        if (count > 3) {
          // Create a lighter variant of complement
          const lighterComplement = complement.clone().lighten(20).saturate(10);
          fallbackColors.push({
            hex: lighterComplement.toHexString().toUpperCase(),
            rgb: lighterComplement.toRgb(),
            hsl: {
              h: lighterComplement.toHsl().h,
              s: lighterComplement.toHsl().s * 100,
              l: lighterComplement.toHsl().l * 100
            },
            name: 'Color 4'
          });
        }
        
        if (count > 4) {
          // Create a darker variant of base with higher saturation
          const darker = baseColorObj.clone().darken(20).saturate(15);
          fallbackColors.push({
            hex: darker.toHexString().toUpperCase(),
            rgb: darker.toRgb(),
            hsl: {
              h: darker.toHsl().h,
              s: darker.toHsl().s * 100,
              l: darker.toHsl().l * 100
            },
            name: 'Color 5'
          });
        }
        break;
        
      default:
        // For other harmony types, use appropriate angles with high saturation
        let angle: number;
        let secondaryAngle: number | null = null;
        
        if (options.paletteType === 'analogous') {
          angle = 30;
        } else if (options.paletteType === 'triadic') {
          angle = 120;
        } else if (options.paletteType === 'tetradic') {
          angle = 90;
          secondaryAngle = 180;
        } else if (options.paletteType === 'splitComplementary') {
          angle = 150;
          secondaryAngle = 210;
        } else {
          angle = 60; // Default
        }
        
        // Create colors with high saturation
        for (let i = 1; i < count; i++) {
          // Determine the angle to use based on position
          let angleToUse: number;
          
          if (secondaryAngle !== null) {
            // For tetradic and splitComplementary, alternate angles
            if (i % 3 === 1) angleToUse = angle;
            else if (i % 3 === 2) angleToUse = secondaryAngle;
            else angleToUse = 0;
          } else {
            // For others, alternate positive and negative angles
            angleToUse = (i % 2 === 1) ? angle : -angle;
            
            // For larger palettes, scale the angles
            angleToUse *= Math.ceil(i / 2);
          }
          
          // Create a new color with spin + guaranteed vibrance
          const newColor = baseColorObj.clone()
            .spin(angleToUse)
            .saturate(15); // Increase saturation for vibrance
          
          // Adjust lightness for better separation
          if (i % 3 === 0) newColor.lighten(20);
          else if (i % 3 === 1) newColor.darken(10);
          
          fallbackColors.push({
            hex: newColor.toHexString().toUpperCase(),
            rgb: newColor.toRgb(),
            hsl: {
              h: newColor.toHsl().h,
              s: newColor.toHsl().s * 100,
              l: newColor.toHsl().l * 100
            },
            name: `Color ${i + 1}`
          });
        }
    }
    
    return fallbackColors;
  }
}

/**
 * Force a color to be more vibrant by boosting saturation and adjusting lightness
 */
function forceVibrantColor(hexColor: string): string {
  const color = tinycolorLib(hexColor);
  const hsl = color.toHsl();
  
  // Boost saturation significantly
  hsl.s = Math.min(1.0, hsl.s * 1.4);
  
  // Adjust lightness if needed
  if (hsl.l < 0.2) {
    hsl.l = 0.2 + (hsl.l * 0.5);
  } else if (hsl.l > 0.8) {
    hsl.l = 0.8 - ((1 - hsl.l) * 0.5);
  }
  
  return tinycolorLib(hsl).toHexString().toUpperCase();
}

/**
 * Boost a color's vibrance before using it as a base color
 */
function boostColorVibrance(hexColor: string): string {
  const color = tinycolorLib(hexColor);
  const hsl = color.toHsl();
  
  // Boost saturation for more vibrant starting point
  hsl.s = Math.min(1.0, hsl.s * 1.3 + 0.1);
  
  // Ensure lightness is in a good middle range for vibrant colors
  if (hsl.l < 0.3) {
    hsl.l = 0.3 + (hsl.l * 0.3);
  } else if (hsl.l > 0.8) {
    hsl.l = 0.8 - ((1 - hsl.l) * 0.2);
  }
  
  return tinycolorLib(hsl).toHexString().toUpperCase();
} 