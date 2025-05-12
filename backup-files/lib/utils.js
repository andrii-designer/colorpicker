import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Import specific items
import { 
  generateColorPalette as origGenerateColorPalette,
  regenerateWithLockedColors as origRegenerateWithLockedColors
} from './utils/generateColors';

import { analyzeColorPalette } from './utils/colorAnalysisNew';
import { ACCURATE_COLOR_DATA } from './utils/simplifiedColorData';
import { 
  extractEnhancedColorsFromImage,
  extractAggressiveColors 
} from './utils/imageColorExtraction';

// Import utilities
import * as colorUtilsModule from './utils/colorUtils';
import * as adobeColorHarmonyModule from './utils/adobeColorHarmony';

// Wrapper function to handle extended options
export function generateColorPalette(baseColor, options = {}) {
  // Pass only the properties that origGenerateColorPalette expects
  const { paletteType, useAdobeAlgorithm, count, seed } = options;
  const coreOptions = {
    paletteType, 
    useAdobeAlgorithm, 
    count, 
    seed 
  };
  
  return origGenerateColorPalette(baseColor, coreOptions);
}

// Wrapper function for regenerateWithLockedColors
export function regenerateWithLockedColors(
  currentPalette, lockedIndices, options = {}) {
  // Pass only the properties that the original function expects
  return origRegenerateWithLockedColors(currentPalette, lockedIndices, options);
}

// Export color utils
export const colorUtils = colorUtilsModule;
export const adobeColorHarmony = adobeColorHarmonyModule;

// Export all functions and data
export {
  analyzeColorPalette,
  ACCURATE_COLOR_DATA,
  extractEnhancedColorsFromImage,
  extractAggressiveColors
}; 