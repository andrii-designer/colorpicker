import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Import specific items
import { 
  generateColorPalette as origGenerateColorPalette, 
  regenerateWithLockedColors as origRegenerateWithLockedColors,
  Color,
  PaletteOptions as OrigPaletteOptions
} from './utils/generateColors';

import { analyzeColorPalette } from './utils/colorAnalysisNew';
import { ACCURATE_COLOR_DATA } from './utils/simplifiedColorData';
import { 
  extractEnhancedColorsFromImage,
  extractAggressiveColors 
} from './utils/imageColorExtraction';

// Import utilities as namespaces
import * as colorUtilsModule from './utils/colorUtils';
import * as adobeColorHarmonyModule from './utils/adobeColorHarmony';

// Create an extended PaletteOptions type that includes additional properties
export interface PaletteOptions extends OrigPaletteOptions {
  // Additional properties used in the codebase
  useNamedColors?: boolean;
  namedColorRatio?: number;
  enforceMinContrast?: boolean;
  colorData?: any;
  temperature?: 'warm' | 'cool' | 'neutral';
  numColors?: number;
}

// Wrapper function to handle extended options
export function generateColorPalette(baseColor: string, options: PaletteOptions): Color[] {
  // Pass only the properties that origGenerateColorPalette expects
  const coreOptions: OrigPaletteOptions = {
    paletteType: options.paletteType,
    useAdobeAlgorithm: options.useAdobeAlgorithm,
    count: options.count || options.numColors,
    seed: options.seed
  };
  
  return origGenerateColorPalette(baseColor, coreOptions);
}

// Wrapper function for regenerateWithLockedColors
export function regenerateWithLockedColors(
  currentPalette: Color[],
  lockedIndices: number[],
  options: PaletteOptions
): Color[] {
  // Pass only the properties that the original function expects
  return origRegenerateWithLockedColors(currentPalette, lockedIndices, options);
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