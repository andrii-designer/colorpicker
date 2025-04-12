// Export directly from generateColors instead of re-exporting through colorExports 
// This should avoid any potential circular dependencies
import { generateColorPalette, regenerateWithLockedColors } from './generateColors';
import type { Color } from './generateColors';

// Export all other color utilities from colorExports
export * from './colorExports';

// Make sure these are explicitly exported from here
export { generateColorPalette, regenerateWithLockedColors };
export type { Color }; 