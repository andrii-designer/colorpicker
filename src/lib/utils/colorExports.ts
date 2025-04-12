// Import from colorAnalysisNew - using the correct function names
import { generateHarmoniousPalette, analyzeColorPalette, hslToHex } from './colorAnalysisNew';

// Import from generateColors - only import what's actually exported
import { generateColorPalette, regenerateWithLockedColors } from './generateColors';
import type { Color } from './generateColors';

// Export everything clearly and directly to avoid any ambiguity
export {
  // From colorAnalysisNew
  generateHarmoniousPalette,
  analyzeColorPalette,
  hslToHex,
  
  // From generateColors
  generateColorPalette,
  regenerateWithLockedColors
};

// Export types
export type { Color };
