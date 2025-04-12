// Export wrapper file that re-exports the needed functions from colorAnalysisNew
import { ColorAnalysis } from './colorAnalysisNew';
import {
  generateHarmoniousPalette as genPalette,
  analyzeColorPalette as analyzePalette,
  hslToHex
} from './colorAnalysisNew';

// Re-export with clean naming
export const generateHarmoniousPalette = genPalette;
export const analyzeColorPalette = analyzePalette;
export { hslToHex };
