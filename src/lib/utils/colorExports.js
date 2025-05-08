// Import from colorAnalysisNew - using the correct function names
import { generateHarmoniousPalette, analyzeColorPalette } from './colorAnalysisNew';

// Import from generateColors - only import what's actually exported
import { generateColorPalette, regenerateWithLockedColors } from './generateColors';


// Export everything clearly and directly to avoid any ambiguity
export {
  // From colorAnalysisNew
  generateHarmoniousPalette,
  analyzeColorPalette,
  
  // From generateColors
  generateColorPalette,
  regenerateWithLockedColors
};

// Export types
export type { Color };
