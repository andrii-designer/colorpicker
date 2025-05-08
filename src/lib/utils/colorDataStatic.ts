// This file contains fixed static color data
import { ColorEntry } from './colorDatabase';
import { ACCURATE_COLOR_DATA } from './simplifiedColorData';

// Use a subset of the accurate color data for static color data
export const STATIC_COLOR_DATA: ColorEntry[] = ACCURATE_COLOR_DATA.slice(0, 5); 