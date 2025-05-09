import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Import specific items
import { 
  generateColorPalette as origGenerateColorPalette, 
  regenerateWithLockedColors as origRegenerateWithLockedColors,
  generateHyperVibrantPalette as origGenerateHyperVibrantPalette,
  Color,
  PaletteOptions as OrigPaletteOptions
} from './utils/generateColors';

// Import the new extreme vibrant color generator
import {
  generateExtremeVibrantPalette,
  Color as ExtremeColor
} from './utils/extremeVibrantColors';

import { analyzeColorPalette } from './utils/colorAnalysisNew';
import { ACCURATE_COLOR_DATA } from './utils/simplifiedColorData';
import { 
  extractEnhancedColorsFromImage,
  extractAggressiveColors 
} from './utils/imageColorExtraction';

// Import utilities as namespaces
import * as colorUtilsModule from './utils/colorUtils';
import * as adobeColorHarmonyModule from './utils/adobeColorHarmony';

// We'll define our own interface instead of extending to avoid conflicts
export interface PaletteOptions {
  // Properties from original PaletteOptions
  paletteType?: 'monochromatic' | 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'splitComplementary';
  useAdobeAlgorithm?: boolean;
  seed?: number;
  
  // Additional properties used in the codebase
  useNamedColors?: boolean;
  namedColorRatio?: number;
  enforceMinContrast?: boolean;
  colorData?: any;
  temperature?: 'warm' | 'cool' | 'mixed' | 'neutral';
  numColors?: number;
  count?: number;
  // Add high contrast option
  highContrast?: boolean;
  // Add pastels option
  usePastels?: boolean;
}

// Wrapper function to handle extended options
export function generateColorPalette(baseColor: string, options: PaletteOptions): Color[] {
  // Debug which generator is being used
  console.log("Using ULTRA VIBRANT color generator with:", baseColor, 
              "palette type:", options.paletteType,
              "num colors:", options.numColors || options.count || 5,
              "high contrast:", options.highContrast || false,
              "use pastels:", options.usePastels || false,
              "temperature:", options.temperature || 'mixed');
              
  // Use the new extreme vibrant color generator directly - this bypasses all previous algorithms
  // for guaranteed vibrant, non-muddy colors using the pure RGB approach
  const generatedColors = generateExtremeVibrantPalette(baseColor, {
    paletteType: options.paletteType,
    numColors: options.numColors || options.count || 5,
    highContrast: options.highContrast || false,
    usePastels: options.usePastels || false,
    temperature: options.temperature as 'warm' | 'cool' | 'mixed'
  }) as Color[];
  
  console.log("Generated palette:", generatedColors.map(c => c.hex));
  
  return generatedColors;
}

// Wrapper function for regenerateWithLockedColors
export function regenerateWithLockedColors(
  currentPalette: Color[],
  lockedIndices: number[],
  options: PaletteOptions
): Color[] {
  // Since we're using a completely new algorithm, we'll handle regeneration differently
  // First convert the current palette to hex values
  const hexPalette = currentPalette.map(color => color.hex);
  
  // Create a new palette
  const newPalette = generateExtremeVibrantPalette(hexPalette[0], {
    paletteType: options.paletteType,
    numColors: hexPalette.length,
    highContrast: options.highContrast || false,
    usePastels: options.usePastels || false
  }) as Color[];
  
  // Restore locked colors
  lockedIndices.forEach(index => {
    if (index >= 0 && index < currentPalette.length && index < newPalette.length) {
      newPalette[index] = currentPalette[index];
    }
  });
  
  return newPalette;
}

// Export as namespaces
export const colorUtils = colorUtilsModule;
export const adobeColorHarmony = adobeColorHarmonyModule;

// Export types and constants
export type { Color };
export type { ColorAnalysis } from './utils/colorAnalysisNew';

// Export all functions and data
export {
  analyzeColorPalette,
  ACCURATE_COLOR_DATA,
  extractEnhancedColorsFromImage,
  extractAggressiveColors
}; 