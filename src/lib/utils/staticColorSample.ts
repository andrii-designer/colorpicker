import { ColorEntry, ColorCategory } from './colorDatabase';

export const STATIC_COLOR_SAMPLE: ColorEntry[] = [
  {
    name: 'Red',
    hue: 0,
    saturation: 100,
    lightness: 50,
    category: 'red' as ColorCategory,
    tags: ['vibrant', 'warm'],
    hex: '#FF0000',
    rgb: { r: 255, g: 0, b: 0 }
  },
  {
    name: 'Blue',
    hue: 240,
    saturation: 100,
    lightness: 50,
    category: 'blue' as ColorCategory,
    tags: ['vibrant', 'cool'],
    hex: '#0000FF',
    rgb: { r: 0, g: 0, b: 255 }
  },
  {
    name: 'Green',
    hue: 120,
    saturation: 100,
    lightness: 50,
    category: 'green' as ColorCategory,
    tags: ['vibrant', 'cool'],
    hex: '#00FF00',
    rgb: { r: 0, g: 255, b: 0 }
  },
  {
    name: 'Yellow',
    hue: 60,
    saturation: 100,
    lightness: 50,
    category: 'yellow' as ColorCategory,
    tags: ['vibrant', 'warm'],
    hex: '#FFFF00',
    rgb: { r: 255, g: 255, b: 0 }
  },
  {
    name: 'Cyan',
    hue: 180,
    saturation: 100,
    lightness: 50,
    category: 'blue' as ColorCategory,
    tags: ['vibrant', 'cool'],
    hex: '#00FFFF',
    rgb: { r: 0, g: 255, b: 255 }
  },
  {
    name: 'Magenta',
    hue: 300,
    saturation: 100,
    lightness: 50,
    category: 'purple' as ColorCategory,
    tags: ['vibrant', 'warm'],
    hex: '#FF00FF',
    rgb: { r: 255, g: 0, b: 255 }
  },
  {
    name: 'Black',
    hue: 0,
    saturation: 0,
    lightness: 0,
    category: 'black' as ColorCategory,
    tags: ['dark'],
    hex: '#000000',
    rgb: { r: 0, g: 0, b: 0 }
  },
  {
    name: 'White',
    hue: 0,
    saturation: 0,
    lightness: 100,
    category: 'white' as ColorCategory,
    tags: ['light'],
    hex: '#FFFFFF',
    rgb: { r: 255, g: 255, b: 255 }
  },
  {
    name: 'Gray',
    hue: 0,
    saturation: 0,
    lightness: 50,
    category: 'gray' as ColorCategory,
    tags: ['neutral'],
    hex: '#808080',
    rgb: { r: 128, g: 128, b: 128 }
  },
  {
    name: 'Orange',
    hue: 39,
    saturation: 100,
    lightness: 50,
    category: 'orange' as ColorCategory,
    tags: ['vibrant', 'warm'],
    hex: '#FFA500',
    rgb: { r: 255, g: 165, b: 0 }
  },
  {
    name: 'Purple',
    hue: 300,
    saturation: 100,
    lightness: 25,
    category: 'purple' as ColorCategory,
    tags: ['deep', 'cool'],
    hex: '#800080',
    rgb: { r: 128, g: 0, b: 128 }
  },
  {
    name: 'Brown',
    hue: 0,
    saturation: 59,
    lightness: 41,
    category: 'brown' as ColorCategory,
    tags: ['warm', 'earthy'],
    hex: '#A52A2A',
    rgb: { r: 165, g: 42, b: 42 }
  },
  {
    name: 'Pink',
    hue: 350,
    saturation: 100,
    lightness: 88,
    category: 'pink' as ColorCategory,
    tags: ['light', 'warm'],
    hex: '#FFC0CB',
    rgb: { r: 255, g: 192, b: 203 }
  },
  {
    name: 'Lime',
    hue: 120,
    saturation: 61,
    lightness: 50,
    category: 'green' as ColorCategory,
    tags: ['bright', 'cool'],
    hex: '#32CD32',
    rgb: { r: 50, g: 205, b: 50 }
  },
  {
    name: 'Teal',
    hue: 180,
    saturation: 100,
    lightness: 25,
    category: 'blue' as ColorCategory,
    tags: ['deep', 'cool'],
    hex: '#008080',
    rgb: { r: 0, g: 128, b: 128 }
  },
  {
    name: 'Indigo',
    hue: 275,
    saturation: 100,
    lightness: 25,
    category: 'purple' as ColorCategory,
    tags: ['deep', 'cool'],
    hex: '#4B0082',
    rgb: { r: 75, g: 0, b: 130 }
  },
  {
    name: 'Violet',
    hue: 300,
    saturation: 76,
    lightness: 72,
    category: 'purple' as ColorCategory,
    tags: ['bright', 'cool'],
    hex: '#EE82EE',
    rgb: { r: 238, g: 130, b: 238 }
  },
  {
    name: 'Gold',
    hue: 51,
    saturation: 100,
    lightness: 50,
    category: 'yellow' as ColorCategory,
    tags: ['metallic', 'warm'],
    hex: '#FFD700',
    rgb: { r: 255, g: 215, b: 0 }
  },
  {
    name: 'Silver',
    hue: 0,
    saturation: 0,
    lightness: 75,
    category: 'metallic' as ColorCategory,
    tags: ['metallic', 'light'],
    hex: '#C0C0C0',
    rgb: { r: 192, g: 192, b: 192 }
  },
  {
    name: 'Navy',
    hue: 240,
    saturation: 100,
    lightness: 25,
    category: 'blue' as ColorCategory,
    tags: ['deep', 'dark'],
    hex: '#000080',
    rgb: { r: 0, g: 0, b: 128 }
  },
  {
    name: 'Maroon',
    hue: 0,
    saturation: 100,
    lightness: 25,
    category: 'red' as ColorCategory,
    tags: ['warm', 'earthy'],
    hex: '#800000',
    rgb: { r: 128, g: 0, b: 0 }
  },
  {
    name: 'Olive',
    hue: 60,
    saturation: 100,
    lightness: 25,
    category: 'green' as ColorCategory,
    tags: ['warm', 'earthy'],
    hex: '#808000',
    rgb: { r: 128, g: 128, b: 0 }
  },
  {
    name: 'Aquamarine',
    hue: 160,
    saturation: 100,
    lightness: 75,
    category: 'blue' as ColorCategory,
    tags: ['vibrant', 'cool'],
    hex: '#7FFFD4',
    rgb: { r: 127, g: 255, b: 212 }
  },
  {
    name: 'Turquoise',
    hue: 174,
    saturation: 72,
    lightness: 56,
    category: 'blue' as ColorCategory,
    tags: ['vibrant', 'cool'],
    hex: '#40E0D0',
    rgb: { r: 64, g: 224, b: 208 }
  },
  {
    name: 'Salmon',
    hue: 6,
    saturation: 93,
    lightness: 71,
    category: 'pink' as ColorCategory,
    tags: ['warm', 'earthy'],
    hex: '#FA8072',
    rgb: { r: 250, g: 128, b: 114 }
  },
  {
    name: 'Coral',
    hue: 16,
    saturation: 100,
    lightness: 66,
    category: 'pink' as ColorCategory,
    tags: ['vibrant', 'warm'],
    hex: '#FF7F50',
    rgb: { r: 255, g: 127, b: 80 }
  },
  {
    name: 'Khaki',
    hue: 54,
    saturation: 77,
    lightness: 75,
    category: 'yellow' as ColorCategory,
    tags: ['warm', 'earthy'],
    hex: '#F0E68C',
    rgb: { r: 240, g: 230, b: 140 }
  },
  {
    name: 'Crimson',
    hue: 348,
    saturation: 83,
    lightness: 47,
    category: 'red' as ColorCategory,
    tags: ['vibrant', 'warm'],
    hex: '#DC143C',
    rgb: { r: 220, g: 20, b: 60 }
  },
  {
    name: 'Lavender',
    hue: 240,
    saturation: 67,
    lightness: 94,
    category: 'purple' as ColorCategory,
    tags: ['light', 'cool'],
    hex: '#E6E6FA',
    rgb: { r: 230, g: 230, b: 250 }
  },
  {
    name: 'Plum',
    hue: 300,
    saturation: 47,
    lightness: 75,
    category: 'purple' as ColorCategory,
    tags: ['deep', 'cool'],
    hex: '#DDA0DD',
    rgb: { r: 221, g: 160, b: 221 }
  }
]; 