import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs {
  return twMerge(clsx(inputs))
}

// Import specific items
import { 
  generateColorPalette} from './utils/generateColors';

import { analyzeColorPalette } from './utils/colorAnalysisNew';
import { ACCURATE_COLOR_DATA } from './utils/simplifiedColorData';
import { 
  extractEnhancedColorsFromImage,
  extractAggressiveColors 
} from './utils/imageColorExtraction';

// Import utilities*/utils/colorUtils';
import */utils/adobeColorHarmony';

// Create an extended PaletteOptions type that includes additional properties
export interface PaletteOptions  {
  // Additional properties used in the codebase
  useNamedColors?: boolean;
  namedColorRatio?: number;
  enforceMinContrast?: boolean;
  colorData?: any;
  temperature? 'neutral';
  numColors?: number;
}

// Wrapper function to handle extended options
export function generateColorPalette(baseColor options) {
  // Pass only the properties that origGenerateColorPalette expects
  const coreOptions= {
    paletteType useAdobeAlgorithm count seed };
  
  return origGenerateColorPalette(baseColor, coreOptions);
}

// Wrapper function for regenerateWithLockedColors
export function regenerateWithLockedColors(
  currentPalette lockedIndices options) {
  // Pass only the properties that the original function expects
  return origRegenerateWithLockedColors(currentPalette, lockedIndices, options);
}

// Export= colorUtilsModule;
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