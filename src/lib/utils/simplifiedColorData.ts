import { ColorEntry } from './colorDatabase';

type ColorCategory = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'brown' | 'gray' | 'black' | 'white';

// Simplified color data for deployment
export const ACCURATE_COLOR_DATA: ColorEntry[] = [
  {
    'name': '4G GREEN',
    'hue': 97,
    'saturation': 87,
    'lightness': 63,
    category: 'green' as ColorCategory,
    tags: [
      'vibrant',
      'cool'
    ],
    'hex': '#7CDB39',
    'rgb': {
      'r': 124,
      'g': 219,
      'b': 57
    }
  },
  {
    'name': 'Acid Green',
    'hue': 65,
    'saturation': 100,
    'lightness': 63,
    category: 'green' as ColorCategory,
    tags: [
      'vibrant',
      'cool'
    ],
    'hex': '#B0BF1A',
    'rgb': {
      'r': 176,
      'g': 191,
      'b': 26
    }
  },
  {
    'name': 'Azure',
    'hue': 210,
    'saturation': 100,
    'lightness': 50,
    category: 'blue' as ColorCategory,
    tags: [
      'vibrant',
      'cool'
    ],
    'hex': '#0080FF',
    'rgb': {
      'r': 0,
      'g': 128,
      'b': 255
    }
  },
  {
    'name': 'Baby Blue',
    'hue': 200,
    'saturation': 67,
    'lightness': 80,
    category: 'blue' as ColorCategory,
    tags: [
      'light',
      'cool'
    ],
    'hex': '#89CFF0',
    'rgb': {
      'r': 137,
      'g': 207,
      'b': 240
    }
  },
  {
    'name': 'Crimson',
    'hue': 348,
    'saturation': 83,
    'lightness': 47,
    category: 'red' as ColorCategory,
    tags: [
      'vibrant',
      'warm'
    ],
    'hex': '#DC143C',
    'rgb': {
      'r': 220,
      'g': 20,
      'b': 60
    }
  }
]; 