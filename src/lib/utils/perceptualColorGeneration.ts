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
import { generateBeautifulPalette } from './enhancedPaletteGeneration';

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
    chromaMultipliers: [1.0, 0.9, 0.75, 0.6, 0.85],
    lightnessOffsets: [0, 25, -25, 40, -35],
    hueOffsets: [0, 0, 0, 0, 0]
  },
  complementary: {
    hueOffsets: [0, 180, 30, 150, 210],
    chromaMultipliers: [1.0, 1.1, 0.8, 0.9, 0.95],
    lightnessOffsets: [0, 0, 20, -20, -30]
  },
  analogous: {
    hueOffsets: [0, 30, -30, 60, -60],
    chromaMultipliers: [1.0, 0.9, 0.9, 0.8, 0.8],
    lightnessOffsets: [0, 15, -15, 30, -30]
  },
  triadic: {
    hueOffsets: [0, 120, 240, 60, 180],
    chromaMultipliers: [1.0, 1.1, 1.0, 0.85, 0.95],
    lightnessOffsets: [0, 0, 0, 20, -20]
  },
  tetradic: {
    hueOffsets: [0, 90, 180, 270, 45],
    chromaMultipliers: [1.0, 0.9, 1.05, 0.85, 0.95],
    lightnessOffsets: [0, 0, 0, -25, 25]
  },
  splitComplementary: {
    hueOffsets: [0, 150, 210, 30, 180],
    chromaMultipliers: [1.0, 0.9, 0.9, 1.1, 0.85],
    lightnessOffsets: [0, 0, 0, 20, -25]
  },
  pentadic: {
    hueOffsets: [0, 72, 144, 216, 288],
    chromaMultipliers: [1.0, 0.9, 0.85, 0.95, 0.9],
    lightnessOffsets: [0, 10, -10, 25, -25]
  }
};

// Tone structure templates - classic design patterns
const TONE_STRUCTURES = {
  classic: [
    { lMin: 75, lMax: 95, cMin: 5, cMax: 20 },   // very light
    { lMin: 10, lMax: 25, cMin: 10, cMax: 40 },  // very dark
    { lMin: 40, lMax: 65, cMin: 30, cMax: 70 },  // mid-tone 1
    { lMin: 50, lMax: 70, cMin: 25, cMax: 65 },  // mid-tone 2
    { lMin: 30, lMax: 50, cMin: 35, cMax: 75 }   // mid-tone 3
  ],
  balanced: [
    { lMin: 80, lMax: 95, cMin: 5, cMax: 15 },   // highlight
    { lMin: 55, lMax: 75, cMin: 20, cMax: 50 },  // light
    { lMin: 35, lMax: 55, cMin: 30, cMax: 70 },  // medium
    { lMin: 15, lMax: 35, cMin: 20, cMax: 60 },  // dark
    { lMin: 5, lMax: 20, cMin: 10, cMax: 40 }    // shadow
  ],
  vibrant: [
    { lMin: 75, lMax: 90, cMin: 15, cMax: 35 },  // light vibrant
    { lMin: 15, lMax: 30, cMin: 20, cMax: 55 },  // dark vibrant
    { lMin: 45, lMax: 65, cMin: 50, cMax: 100 }, // medium vibrant 1
    { lMin: 55, lMax: 75, cMin: 45, cMax: 85 },  // medium vibrant 2
    { lMin: 35, lMax: 55, cMin: 55, cMax: 110 }  // medium vibrant 3
  ]
};

// Reference colors from trending palettes - optional inspiration points
const TRENDING_PALETTE_ANCHORS = [
  // Warm trend anchors
  { l: 50, c: 70, h: 30 },   // warm orange
  { l: 45, c: 75, h: 10 },   // coral red
  { l: 60, c: 65, h: 50 },   // yellow-orange
  
  // Cool trend anchors
  { l: 55, c: 55, h: 250 },  // cornflower blue
  { l: 45, c: 60, h: 190 },  // teal
  { l: 60, c: 50, h: 150 },  // mint green
  
  // Neutral trend anchors
  { l: 65, c: 10, h: 30 },   // beige
  { l: 30, c: 15, h: 240 },  // slate
  { l: 85, c: 5, h: 270 }    // light gray-lavender
];

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
  
  // Sometimes choose a complementary harmony for more variety
  let effectiveHarmonyType = harmonyType;
  if (harmonyType === 'analogous' && Math.random() < 0.2) {
    // 20% chance of using split complementary for analogous requests
    effectiveHarmonyType = 'splitComplementary';
  } else if (harmonyType === 'complementary' && Math.random() < 0.2) {
    // 20% chance of using tetradic for complementary requests
    effectiveHarmonyType = 'tetradic';
  }
  
  // Create initial palette with template-based approach
  const initialPalette = generateTemplateBasedPalette(
    enhancedBaseLch, 
    effectiveHarmonyType, 
    count, 
    saturationPreference
  );
  
  // Run optimization algorithm to find the best palette
  const optimizedPalette = optimizePalette(
    initialPalette, 
    effectiveHarmonyType, 
    contrastEnhance,
    toneDistribution,
    saturationPreference
  );
  
  // Calculate final scores
  const harmonyScore = calculateHarmonyScore(optimizedPalette, effectiveHarmonyType);
  const contrastScore = calculateContrastScore(optimizedPalette);
  const toneScore = calculateToneDistributionScore(optimizedPalette, toneDistribution);
  const saturationScore = calculateSaturationScore(optimizedPalette, saturationPreference);
  
  // Overall score (weighted average)
  let harmonyWeight = 0.35;
  let contrastWeight = contrastEnhance ? 0.35 : 0.25;
  let toneWeight = 0.15;
  let saturationWeight = 0.15;
  
  // Adjust weights based on preference
  if (saturationPreference === 'vibrant') {
    saturationWeight = 0.25;
    toneWeight = 0.10;
    harmonyWeight = 0.30;
  } else if (saturationPreference === 'muted') {
    saturationWeight = 0.10;
    toneWeight = 0.25;
    harmonyWeight = 0.30;
  }
  
  // For contrast, higher is better, so invert the contribution
  const overallScore = (
    (harmonyScore * harmonyWeight) + 
    (10 / Math.max(contrastScore, 1) * contrastWeight) + 
    (toneScore * toneWeight) +
    (saturationScore * saturationWeight)
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
      enhanced.c = Math.max(20, Math.min(60, enhanced.c * 0.7));
      break;
    case 'balanced':
    default:
      // Increase chroma for better color impact but keep it in nice range
      enhanced.c = Math.max(30, Math.min(100, enhanced.c * 1.2));
      break;
  }
  
  // If the lightness is extreme, move it toward middle range for better chroma potential
  if (enhanced.l < 20) {
    enhanced.l = Math.min(45, 20 + (enhanced.l * 0.5));
  } else if (enhanced.l > 90) {
    enhanced.l = Math.max(60, 90 - ((100 - enhanced.l) * 0.5));
  }
  
  // Adjust lightness based on hue to maximize chroma potential
  // Different hue regions have different optimal lightness for maximum chroma
  if (enhanced.h >= 0 && enhanced.h <= 30) { // Reds
    // Reds have highest chroma at lower lightness
    enhanced.l = Math.max(enhanced.l, 35);
    enhanced.l = Math.min(enhanced.l, 65);
  } else if (enhanced.h > 30 && enhanced.h <= 90) { // Yellows
    // Yellows need high lightness for good chroma
    enhanced.l = Math.max(enhanced.l, 65);
    enhanced.l = Math.min(enhanced.l, 85);
  } else if (enhanced.h > 90 && enhanced.h <= 150) { // Greens
    // Greens have limited chroma range, moderate lightness is best
    enhanced.l = Math.max(enhanced.l, 40);
    enhanced.l = Math.min(enhanced.l, 75);
  } else if (enhanced.h > 150 && enhanced.h <= 270) { // Blues/Purples
    // Blues work well at moderate to lower lightness
    enhanced.l = Math.min(enhanced.l, 65);
    enhanced.l = Math.max(enhanced.l, 35);
  } else if (enhanced.h > 270 && enhanced.h <= 360) { // Magentas
    // Magentas work well at moderate lightness
    enhanced.l = Math.min(enhanced.l, 70);
    enhanced.l = Math.max(enhanced.l, 35);
  }
  
  // Check for colors that are too gray (low chroma) and boost them slightly
  if (enhanced.c < 20) {
    enhanced.c = Math.max(20, enhanced.c * 1.5);
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
  
  // Choose a tone structure based on saturation preference
  let toneStructure = TONE_STRUCTURES.classic;
  if (saturationPreference === 'vibrant') {
    toneStructure = TONE_STRUCTURES.vibrant;
  } else if (saturationPreference === 'muted') {
    toneStructure = TONE_STRUCTURES.balanced;
  }
  
  // Shuffle tone structure to avoid predictable patterns
  const shuffledToneStructure = [...toneStructure];
  // Fisher-Yates shuffle algorithm
  for (let i = shuffledToneStructure.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledToneStructure[i], shuffledToneStructure[j]] = [shuffledToneStructure[j], shuffledToneStructure[i]];
  }
  
  // Always put a light color first and a dark color second for better contrast
  const lightTone = shuffledToneStructure.find(t => t.lMin > 65) || shuffledToneStructure[0];
  const darkTone = shuffledToneStructure.find(t => t.lMax < 35) || shuffledToneStructure[1];
  
  // Create palette array
  const palette: LCH[] = [];
  
  // First color - base color adjusted to match tone structure
  palette.push({
    l: Math.max(lightTone.lMin, Math.min(lightTone.lMax, baseLch.l)),
    c: Math.max(lightTone.cMin, Math.min(lightTone.cMax, baseLch.c)),
    h: baseLch.h
  });
  
  // Use templates for better initial distribution
  for (let i = 1; i < count; i++) {
    // Get template values with defaults for positions beyond template size
    const hueOffset = template.hueOffsets?.[i] ?? (i * 30 % 360);
    
    // Calculate new hue
    const newHue = (baseLch.h + hueOffset + 360) % 360;
    
    // Get current tone structure for this position
    const toneBucket = i === 1 ? darkTone : shuffledToneStructure[i % shuffledToneStructure.length];
    
    // Choose a lightness from the appropriate tonal bucket, biased toward middle of range
    const bucketLRange = toneBucket.lMax - toneBucket.lMin;
    const centerBias = Math.random() * 0.6 + 0.2; // 0.2-0.8 bias toward center
    const newLightness = toneBucket.lMin + bucketLRange * centerBias;
    
    // Choose a chroma from the appropriate bucket, with some randomness
    const bucketCRange = toneBucket.cMax - toneBucket.cMin;
    const chromaBias = Math.random() * 0.8 + 0.1; // 0.1-0.9 range for variety
    const baseChroma = toneBucket.cMin + bucketCRange * chromaBias;
    
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
    
    // Apply chroma adjustment ensuring it stays in valid range
    const newChroma = Math.max(toneBucket.cMin, Math.min(toneBucket.cMax, 
      baseChroma * chromaAdjustment
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
  // Create a copy to work with
  let currentPalette = JSON.parse(JSON.stringify(initialPalette));
  let bestPalette = JSON.parse(JSON.stringify(currentPalette));
  
  // Initialize scores
  let currentHarmonyScore = calculateHarmonyScore(currentPalette, harmonyType);
  let currentContrastScore = calculateContrastScore(currentPalette);
  let currentToneScore = calculateToneDistributionScore(currentPalette, toneDistribution);
  let currentSaturationScore = calculateSaturationScore(currentPalette, saturationPreference);
  
  // Calculate combined score - lower is better
  let currentScore = calculateOverallScore(
    currentHarmonyScore, 
    currentContrastScore, 
    currentToneScore,
    currentSaturationScore,
    contrastEnhance,
    saturationPreference
  );
  
  let bestScore = currentScore;
  
  // Simulated annealing parameters
  const initialTemperature = 100;
  const coolingRate = 0.95;
  const minTemperature = 0.1;
  const iterationsPerTemperature = 100;
  
  // Main optimization loop
  let temperature = initialTemperature;
  let totalIterations = 0;
  
  while (temperature > minTemperature && totalIterations < 2000) {
    for (let i = 0; i < iterationsPerTemperature; i++) {
      // Create a neighboring solution with temperature-based modifications
      const neighborPalette = createNeighborSolution(
        currentPalette, 
        temperature,
        harmonyType,
        saturationPreference
      );
      
      // Calculate new scores
      const neighborHarmonyScore = calculateHarmonyScore(neighborPalette, harmonyType);
      const neighborContrastScore = calculateContrastScore(neighborPalette);
      const neighborToneScore = calculateToneDistributionScore(neighborPalette, toneDistribution);
      const neighborSaturationScore = calculateSaturationScore(neighborPalette, saturationPreference);
      
      // Calculate combined score
      const neighborScore = calculateOverallScore(
        neighborHarmonyScore, 
        neighborContrastScore, 
        neighborToneScore,
        neighborSaturationScore,
        contrastEnhance,
        saturationPreference
      );
      
      // Determine if we should accept this solution
      const acceptProbability = Math.exp((currentScore - neighborScore) / temperature);
      
      if (neighborScore < currentScore || Math.random() < acceptProbability) {
        // Accept the new solution
        currentPalette = neighborPalette;
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
    
    // Cool down the temperature
    temperature *= coolingRate;
    totalIterations += iterationsPerTemperature;
  }
  
  // Apply additional post-processing steps
  let optimizedPalette = bestPalette;
  
  // Enhance saturation if needed
  if (saturationPreference === 'vibrant') {
    optimizedPalette = enhanceSaturation(optimizedPalette, saturationPreference);
  }
  
  // Enhance contrast if needed
  if (contrastEnhance) {
    optimizedPalette = enhanceContrastPostProcess(optimizedPalette);
  }
  
  // Make final tone adjustments for better distribution
  optimizedPalette = adjustToneDistribution(optimizedPalette, toneDistribution);
  
  // Apply white/black replacement if needed for anchor colors
  optimizedPalette = addNeutralAnchors(optimizedPalette);
  
  return optimizedPalette;
}

/**
 * Calculate a weighted overall score for the palette
 */
function calculateOverallScore(
  harmonyScore: number,
  contrastScore: number,
  toneScore: number,
  saturationScore: number,
  contrastEnhance: boolean,
  saturationPreference: string
): number {
  // Dynamic weights based on preferences
  let harmonyWeight = 0.35;
  let contrastWeight = contrastEnhance ? 0.4 : 0.3;
  let toneWeight = 0.15;
  let saturationWeight = 0.15;
  
  // Adjust weights for vibrant palettes to focus more on saturation
  if (saturationPreference === 'vibrant') {
    harmonyWeight = 0.3;
    saturationWeight = 0.25;
    toneWeight = 0.1;
  }
  
  // Adjust weights for muted palettes to focus more on tone distribution
  if (saturationPreference === 'muted') {
    harmonyWeight = 0.3;
    saturationWeight = 0.1;
    toneWeight = 0.25;
  }
  
  // Note: Lower harmony/tone/saturation scores are better, higher contrast is better
  // For contrast, transform to make it consistent (lower is better)
  const contrastFactor = 10 / Math.max(contrastScore, 1);
  
  // Calculate weighted score (lower is better)
  return (
    (harmonyScore * harmonyWeight) + 
    (contrastFactor * contrastWeight) + 
    (toneScore * toneWeight) +
    (saturationScore * saturationWeight)
  );
}

/**
 * Create a neighboring solution by making small changes to the palette
 */
function createNeighborSolution(
  palette: LCH[],
  temperature: number,
  harmonyType: string,
  saturationPreference: string
): LCH[] {
  // Create a copy to modify
  const neighbor = JSON.parse(JSON.stringify(palette));
  
  // Number of modifications depends on temperature
  const numModifications = Math.max(1, Math.floor(temperature / 25));
  
  // Apply random modifications
  for (let i = 0; i < numModifications; i++) {
    // Choose a random color to modify, but keep first color more stable
    const colorIndex = Math.random() < 0.7 ? 
      Math.floor(Math.random() * (neighbor.length - 1)) + 1 : 
      Math.floor(Math.random() * neighbor.length);
    
    // Choose random attribute to modify: lightness, chroma, or hue
    const attribute = Math.random();
    
    // Get the selected color
    const color = neighbor[colorIndex];
    
    // Normalize temperature to 0-1 scale for delta calculation
    const normalizedTemp = Math.min(1.0, temperature / 100);
    
    // Modify the selected attribute
    if (attribute < 0.4) {
      // Modify lightness - more variance at higher temperatures
      const lightnessRange = 20 * normalizedTemp;
      const lightnessDelta = (Math.random() * 2 - 1) * lightnessRange;
      
      // Get the tone bucket for this position
      let minL = 10;
      let maxL = 95;
      
      // Different constraints for first few colors to ensure good structure
      if (colorIndex === 0) {
        // First color - light anchor
        minL = 65;
        maxL = 95;
      } else if (colorIndex === 1) {
        // Second color - dark anchor
        minL = 10;
        maxL = 35;
      }
      
      // Apply change with bounds
      color.l = Math.max(minL, Math.min(maxL, color.l + lightnessDelta));
      
    } else if (attribute < 0.7) {
      // Modify chroma - more variance at higher temperatures
      const chromaRange = 30 * normalizedTemp;
      const chromaDelta = (Math.random() * 2 - 1) * chromaRange;
      
      // Get min/max chroma based on saturation preference
      let minC = 10;
      let maxC = 80;
      
    if (saturationPreference === 'vibrant') {
        minC = 30;
        maxC = 120;
    } else if (saturationPreference === 'muted') {
        minC = 10;
        maxC = 60;
      }
      
      // Apply change with bounds
      color.c = Math.max(minC, Math.min(maxC, color.c + chromaDelta));
      
    } else {
      // Modify hue - with constraints based on harmony type
      const hueRange = 30 * normalizedTemp;
      let hueDelta = (Math.random() * 2 - 1) * hueRange;
      
      // For monochromatic, keep hues closer together
      if (harmonyType === 'monochromatic') {
        hueDelta *= 0.2; // Much smaller hue changes
      }
      
      // For other harmony types, try to maintain harmony structure somewhat
      if (harmonyType !== 'monochromatic' && colorIndex > 0) {
        // Get the template for this harmony type
        const template = HARMONY_TEMPLATES[harmonyType as keyof typeof HARMONY_TEMPLATES] || 
                        HARMONY_TEMPLATES.analogous;
        
        // Get ideal hue offset for this position (if defined)
        const idealHueOffset = template.hueOffsets?.[colorIndex];
        
        if (idealHueOffset !== undefined) {
          // Calculate the current offset from base hue
          const baseHue = palette[0].h;
          const currentHue = color.h;
          const currentOffset = ((currentHue - baseHue + 360) % 360);
          
          // Calculate how far from ideal offset
          const idealOffset = idealHueOffset;
          const offsetDifference = ((currentOffset - idealOffset + 360) % 360);
          
          // If the offset is far from ideal, bias the delta to move toward ideal
          if (Math.abs(offsetDifference) > 20 && Math.abs(offsetDifference) < 340) {
            const direction = offsetDifference > 180 ? 1 : -1;
            hueDelta = Math.abs(hueDelta) * direction * 0.5 + hueDelta * 0.5;
          }
        }
      }
      
      // Apply change with 0-360 bounds
      color.h = ((color.h + hueDelta) % 360 + 360) % 360;
    }
  }
  
  return neighbor;
}

/**
 * Enhance the saturation (chroma) of colors based on preference
 */
function enhanceSaturation(palette: LCH[], preference: string): LCH[] {
  // Create a copy to modify
  const result = JSON.parse(JSON.stringify(palette));
  
  // Adjust each color's chroma based on preference and its lightness
  for (let i = 0; i < result.length; i++) {
    const color = result[i];
    
    // Skip first two colors if they are intended as light/dark anchors
    if (i <= 1 && ((color.l > 80) || (color.l < 25))) {
      continue;
    }
    
    // Different chroma targets based on lightness and preference
    let targetChroma = 50; // Default mid-value
    let chromaRange = 15;  // Default variation
    
    if (preference === 'vibrant') {
      // Vibrant colors: high chroma especially in mid-tones
      if (color.l >= 65) {
        // Light colors - moderate chroma
        targetChroma = 40;
        chromaRange = 20;
      } else if (color.l <= 35) {
        // Dark colors - moderate to high chroma
        targetChroma = 50;
        chromaRange = 25;
      } else {
        // Mid-tones - high chroma
        targetChroma = 80;
        chromaRange = 30;
      }
    } else if (preference === 'muted') {
      // Muted colors: lower chroma across the board
      if (color.l >= 70) {
        // Light muted - very low chroma
        targetChroma = 15;
        chromaRange = 10;
      } else if (color.l <= 30) {
        // Dark muted - low chroma
        targetChroma = 20;
        chromaRange = 15;
      } else {
        // Mid-tones muted - moderate chroma
        targetChroma = 30;
        chromaRange = 20;
    }
  } else {
      // Balanced colors: moderate chroma that varies with lightness
      if (color.l >= 75) {
        // Light balanced - low chroma
        targetChroma = 20;
        chromaRange = 15;
      } else if (color.l <= 30) {
        // Dark balanced - moderate chroma
        targetChroma = 35;
        chromaRange = 20;
      } else {
        // Mid-tones balanced - moderate to high chroma
        targetChroma = 55;
        chromaRange = 25;
      }
    }
    
    // Add some random variation to avoid mechanical-looking results
    const randomVariation = (Math.random() * 2 - 1) * chromaRange;
    
    // Calculate a new chroma that's a blend between current and target
    const blendFactor = 0.7; // Weight toward target
    const newChroma = (color.c * (1 - blendFactor)) + ((targetChroma + randomVariation) * blendFactor);
    
    // Apply with reasonable bounds
    color.c = Math.max(10, Math.min(130, newChroma));
    
    // Apply beta distribution for more natural chroma clustering
    // For vibrant: peak around 60-80
    // For muted: peak around 20-40
    // For balanced: peak around 40-60
    if (preference === 'vibrant') {
      // Slight bias toward higher values (right-skewed beta)
      color.c = betaDistAdjust(color.c, 10, 130, 3, 2);
    } else if (preference === 'muted') {
      // Slight bias toward lower values (left-skewed beta)
      color.c = betaDistAdjust(color.c, 10, 70, 2, 3);
    } else {
      // Centered beta distribution
      color.c = betaDistAdjust(color.c, 10, 100, 2.5, 2.5);
    }
  }
  
  return result;
}

/**
 * Apply a beta distribution adjustment to a value within a range
 * Helps create more natural clustering of values
 */
function betaDistAdjust(value: number, min: number, max: number, alpha: number, beta: number): number {
  // Normalize to 0-1 range
  const normalized = (value - min) / (max - min);
  
  // Apply an approximation of beta distribution transformation
  // Using a polynomial approximation for simplicity
  let transformed;
  
  if (alpha === beta) {
    // Symmetric distribution, peak at 0.5
    transformed = 0.5 + (normalized - 0.5) * Math.pow(Math.abs(normalized - 0.5), 0.5);
  } else if (alpha > beta) {
    // Right-skewed, peak above 0.5
    const peakPosition = alpha / (alpha + beta);
    transformed = normalized < peakPosition
      ? normalized * (1 + Math.pow(normalized / peakPosition, alpha - 1)) / 2
      : peakPosition + (normalized - peakPosition) * (1 + Math.pow((normalized - peakPosition) / (1 - peakPosition), beta - 1)) / 2;
  } else {
    // Left-skewed, peak below 0.5
    const peakPosition = alpha / (alpha + beta);
    transformed = normalized > peakPosition
      ? peakPosition + (normalized - peakPosition) * (1 + Math.pow((normalized - peakPosition) / (1 - peakPosition), alpha - 1)) / 2
      : normalized * (1 + Math.pow(normalized / peakPosition, beta - 1)) / 2;
  }
  
  // Convert back to original range
  return min + transformed * (max - min);
}

/**
 * Enhance contrast between adjacent colors in the palette
 */
function enhanceContrastPostProcess(palette: LCH[]): LCH[] {
  // Create a copy to modify
  const result = JSON.parse(JSON.stringify(palette));
  
  // Sort by lightness to work with
  result.sort((a, b) => a.l - b.l);
  
  // Calculate local deltaE function for perceptual distance
  function localCalculateDeltaE(lch1: LCH, lch2: LCH): number {
    // Simple approximation using weighted Euclidean distance
    const deltaL = lch1.l - lch2.l;
    
    // Calculate hue difference accounting for circularity
    let deltaH = Math.abs(lch1.h - lch2.h);
    if (deltaH > 180) deltaH = 360 - deltaH;
    
    // Normalize hue difference by considering chroma
    // Low chroma = hue matters less
    const averageC = (lch1.c + lch2.c) / 2;
    const normalizedDeltaH = deltaH * (averageC / 50);
    
    // Calculate chroma difference
    const deltaC = lch1.c - lch2.c;
    
    // Weight lightness more heavily as it's the most perceptually important
    return Math.sqrt(
      Math.pow(deltaL * 2.5, 2) + 
      Math.pow(deltaC * 1.2, 2) + 
      Math.pow(normalizedDeltaH * 0.8, 2)
    );
  }
  
  // First ensure adequate lightness separation
  const MIN_L_DIFF = 12; // Minimum lightness difference between adjacent colors
  
  for (let i = 1; i < result.length; i++) {
    const prevColor = result[i-1];
    const currColor = result[i];
    
    const lDiff = currColor.l - prevColor.l;
    
    if (lDiff < MIN_L_DIFF) {
      // Adjust both colors to maintain average lightness but increase separation
      const avgL = (prevColor.l + currColor.l) / 2;
      const adjustment = (MIN_L_DIFF - lDiff) / 2;
      
      // Adjust previous color darker, unless it's already very dark
      if (prevColor.l > 15) {
        prevColor.l = Math.max(10, prevColor.l - adjustment);
      }
      
      // Adjust current color lighter, unless it's already very light
      if (currColor.l < 90) {
        currColor.l = Math.min(95, currColor.l + adjustment);
      }
    }
  }
  
  // Now check for overall perceptual contrast and adjust as needed
  const MIN_DELTA_E = 20; // Minimum perceptual difference
  
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const color1 = result[i];
      const color2 = result[j];
      
      const deltaE = localCalculateDeltaE(color1, color2);
      
      if (deltaE < MIN_DELTA_E) {
        // Increase contrast if colors are too similar
        
        // First try adjusting lightness (most effective)
        if (Math.abs(color1.l - color2.l) < 30) {
          if (color1.l < color2.l) {
            // Make color1 darker and color2 lighter
            if (color1.l > 20) color1.l = Math.max(10, color1.l - 10);
            if (color2.l < 80) color2.l = Math.min(95, color2.l + 10);
          } else {
            // Make color2 darker and color1 lighter
            if (color2.l > 20) color2.l = Math.max(10, color2.l - 10);
            if (color1.l < 80) color1.l = Math.min(95, color1.l + 10);
          }
        }
        
        // Then try adjusting chroma if needed
        if (localCalculateDeltaE(color1, color2) < MIN_DELTA_E) {
          if (color1.c < color2.c) {
            // Increase chroma difference
            color1.c = Math.max(10, color1.c * 0.85);
            color2.c = Math.min(120, color2.c * 1.15);
          } else {
            // Increase chroma difference
            color2.c = Math.max(10, color2.c * 0.85);
            color1.c = Math.min(120, color1.c * 1.15);
          }
        }
        
        // Finally try adjusting hue if still needed
        if (localCalculateDeltaE(color1, color2) < MIN_DELTA_E) {
          // Calculate current hue difference
          let hueDiff = Math.abs(color1.h - color2.h);
          if (hueDiff > 180) hueDiff = 360 - hueDiff;
          
          if (hueDiff < 60) {
            // Increase hue separation
            const hueAdjustment = Math.min(30, (60 - hueDiff) / 2);
            
            // Move hues apart in opposite directions
            color1.h = ((color1.h - hueAdjustment) % 360 + 360) % 360;
            color2.h = ((color2.h + hueAdjustment) % 360 + 360) % 360;
          }
        }
      }
    }
  }
  
  // Unsort to maintain original order
  // This assumes the caller wants the original ordering preserved
  result.sort((a, b) => palette.findIndex(p => p === a) - palette.findIndex(p => p === b));
  
  return result;
}

/**
 * Adjust the tone distribution to fit the specified preference
 */
function adjustToneDistribution(palette: LCH[], preference: string): LCH[] {
  // Create a copy to modify
  const result = JSON.parse(JSON.stringify(palette));
  
  // Define target ranges for each preference
  let lightTarget = { min: 70, max: 90 };
  let darkTarget = { min: 10, max: 30 };
  let midTarget = { min: 40, max: 60 };
  
  // Adjust targets based on preference
  switch (preference) {
    case 'dark-bias':
      // Shift all targets darker
      lightTarget = { min: 65, max: 85 };
      darkTarget = { min: 5, max: 25 };
      midTarget = { min: 25, max: 50 };
        break;
        
    case 'light-bias':
      // Shift all targets lighter
      lightTarget = { min: 75, max: 95 };
      darkTarget = { min: 15, max: 35 };
      midTarget = { min: 50, max: 75 };
        break;
        
    default: // 'even'
      // Keep balanced targets
        break;
  }
  
  // Sort colors by lightness
  result.sort((a, b) => a.l - b.l);
  
  // Handle based on palette size
  if (result.length >= 5) {
    // For 5+ colors, ensure classic distribution: one very light, one very dark, rest mid-tones
    
    // Adjust darkest color
    result[0].l = Math.max(darkTarget.min, Math.min(darkTarget.max, result[0].l));
    
    // Adjust lightest color
    result[result.length - 1].l = Math.max(lightTarget.min, Math.min(lightTarget.max, result[result.length - 1].l));
    
    // Distribute mid-tones evenly
    const midCount = result.length - 2;
    for (let i = 0; i < midCount; i++) {
      const normalizedPos = i / (midCount - 1 || 1); // 0 to 1
      const targetL = midTarget.min + normalizedPos * (midTarget.max - midTarget.min);
      result[i + 1].l = targetL;
    }
  } else if (result.length === 4) {
    // For 4 colors: one dark, one light, two mid-tones
    result[0].l = Math.max(darkTarget.min, Math.min(darkTarget.max, result[0].l));
    result[3].l = Math.max(lightTarget.min, Math.min(lightTarget.max, result[3].l));
    
    // Two mid-tones, one darker and one lighter
    result[1].l = midTarget.min + (midTarget.max - midTarget.min) * 0.3;
    result[2].l = midTarget.min + (midTarget.max - midTarget.min) * 0.7;
  } else if (result.length === 3) {
    // For 3 colors: one dark, one mid, one light
    result[0].l = Math.max(darkTarget.min, Math.min(darkTarget.max, result[0].l));
    result[1].l = Math.max(midTarget.min, Math.min(midTarget.max, result[1].l));
    result[2].l = Math.max(lightTarget.min, Math.min(lightTarget.max, result[2].l));
  } else if (result.length === 2) {
    // For 2 colors: one dark, one light with good contrast
    result[0].l = Math.max(darkTarget.min, Math.min(darkTarget.max, result[0].l));
    result[1].l = Math.max(lightTarget.min, Math.min(lightTarget.max, result[1].l));
  }
  
  // Unsort to restore original order
  result.sort((a, b) => palette.findIndex(p => p === a) - palette.findIndex(p => p === b));
  
  return result;
}

/**
 * Add neutral anchors to palette for better structure
 * This potentially replaces some colors with neutral anchors if beneficial
 */
function addNeutralAnchors(palette: LCH[]): LCH[] {
  // We only want to do this sometimes as a final touch (30% chance)
  if (Math.random() > 0.3) {
    return palette;
  }
  
  // Create a deep copy of the palette
  const result = JSON.parse(JSON.stringify(palette));
  
  // Analyze the palette
  const lightnessValues = result.map(color => color.l);
  const chromaValues = result.map(color => color.c);
  
  // Check if we need a light anchor (if no color is light enough)
  const hasLightAnchor = lightnessValues.some(l => l > 75);
  
  // Check if we need a dark anchor (if no color is dark enough)
  const hasDarkAnchor = lightnessValues.some(l => l < 25);
  
  // Calculate average chroma to determine if palette is vibrant or muted
  const avgChroma = chromaValues.reduce((sum, c) => sum + c, 0) / chromaValues.length;
  const isVibrant = avgChroma > 60;
  
  // Potentially add a light neutral anchor
  if (!hasLightAnchor) {
    // Find the lightest color
    const lightestIndex = lightnessValues.indexOf(Math.max(...lightnessValues));
    
    // Replace it with a light neutral
    result[lightestIndex] = {
      l: Math.random() * 10 + 85, // 85-95
      c: Math.random() * 10 + 5,  // 5-15
      h: result[lightestIndex].h  // Keep original hue
    };
  }
  
  // Potentially add a dark neutral anchor
  if (!hasDarkAnchor) {
    // Find the darkest color
    const darkestIndex = lightnessValues.indexOf(Math.min(...lightnessValues));
    
    // Replace it with a dark neutral
    result[darkestIndex] = {
      l: Math.random() * 10 + 10, // 10-20
      c: Math.random() * 20 + 10, // 10-30
      h: result[darkestIndex].h   // Keep original hue
    };
  }
  
  // For vibrant palettes, ensure at least one truly vibrant color
  if (isVibrant) {
    // Find a mid-tone color to make vibrant
    const midTones = result.filter((color, index) => 
      color.l > 35 && color.l < 70 && index !== 0 && index !== 1);
    
    if (midTones.length > 0) {
      // Choose a random mid-tone to enhance
      const midToneIndex = result.indexOf(midTones[Math.floor(Math.random() * midTones.length)]);
      
      // Boost its chroma significantly
      result[midToneIndex].c = Math.min(130, result[midToneIndex].c * 1.5);
    }
  }
  
  return result;
}

/**
 * Adapter function to ensure backward compatibility with existing code
 */
export function generateOptimizedPalette(
  baseColor: string,
  options: {
    paletteType?: string;
    count?: number;
    useAdobeAlgorithm?: boolean;
    contrastEnhance?: boolean;
    toneDistribution?: string;
    saturationPreference?: string;
  }
): { hex: string; rgb: any; hsl: any; name?: string }[] {
  // Map old options to new options
  const harmonyType = options.paletteType || 'analogous';
  const count = options.count || 5;
  
  // Map old tone/saturation preferences to new format
  let toneProfile: 'light' | 'balanced' | 'dark' = 'balanced';
  if (options.toneDistribution === 'light-bias') {
    toneProfile = 'light';
  } else if (options.toneDistribution === 'dark-bias') {
    toneProfile = 'dark';
  }
  
  let saturationStyle: 'muted' | 'balanced' | 'vibrant' = 'balanced';
  if (options.saturationPreference === 'vibrant') {
    saturationStyle = 'vibrant';
  } else if (options.saturationPreference === 'muted') {
    saturationStyle = 'muted';
  }
  
  // Generate the palette using the new algorithm
  return generateBeautifulPalette(baseColor, {
    harmonyType: harmonyType,
    count: count,
    toneProfile: toneProfile,
    saturationStyle: saturationStyle
  });
} 