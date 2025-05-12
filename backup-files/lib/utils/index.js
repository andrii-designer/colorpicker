// Export from colorExports
export * from './colorExports';

// Export type from generateColors
export type { Color } from './generateColors';

// Export modules that may be used in other parts of the application
export * from './generateColors';
export * from './colorAnalysisNew';
export * from './fixedAccurateColorData';

// Export the scrapeColors functions needed elsewhere
export {
  scrapeColorRegister,
  formatColorDatabase,
  generateColorEntry,
  type ColorData
} from './scrapeColors';

// This makes imports cleaner by allowing `import { someFunction } from '@/lib/utils'` 