// Tests for the enhanced color generation algorithm
import { generateEnhancedPalette, HarmonyType } from './enhancedColorGeneration';
import tinycolor from 'tinycolor2';

// Helper function to test if a color is valid hex
function isValidHexColor(color: string) {
  return /^#[0-9A-F]{6}$/i.test(color);
}

// Helper function to calculate hue difference between colors
function getHueDifference(color1: string, color2: string) {
  const hue1 = tinycolor(color1).toHsl().h;
  const hue2 = tinycolor(color2).toHsl().h;
  
  // Account for hue being circular (0-360)
  let diff = Math.abs(hue1 - hue2);
  if (diff > 180) diff = 360 - diff;
  
  return diff;
}

describe('Enhanced Color Generation', () => {
  test('Generates a palette with the default options', () => {
    const palette = generateEnhancedPalette();
    
    // Should generate 5 colors by default
    expect(palette.length).toBe(5);
    
    // All colors should be valid hex
    palette.forEach(color => {
      expect(isValidHexColor(color)).toBe(true);
    });
  });
  
  test('Respects the count parameter', () => {
    const count = 3;
    const palette = generateEnhancedPalette({ count });
    
    expect(palette.length).toBe(count);
  });
  
  test('Generates an analogous palette correctly', () => {
    const baseColor = '#FF0000'; // Red
    const palette = generateEnhancedPalette({
      baseColor,
      harmonyType: 'analogous',
      count: 3,
      randomize: 0 // Disable randomization for predictable results
    });
    
    // Check if colors are reasonably close to each other (analogous = ~30° apart)
    const diff1 = getHueDifference(palette[0], palette[1]);
    const diff2 = getHueDifference(palette[1], palette[2]);
    
    expect(diff1).toBeLessThan(60);
    expect(diff2).toBeLessThan(60);
  });
  
  test('Generates a complementary palette correctly', () => {
    const baseColor = '#FF0000'; // Red
    const palette = generateEnhancedPalette({
      baseColor,
      harmonyType: 'complementary',
      count: 2,
      randomize: 0 // Disable randomization for predictable results
    });
    
    // Check if colors are roughly opposite (complementary = ~180° apart)
    const diff = getHueDifference(palette[0], palette[1]);
    
    expect(diff).toBeGreaterThan(150);
  });
  
  test('Generates a triad palette correctly', () => {
    const baseColor = '#FF0000'; // Red
    const palette = generateEnhancedPalette({
      baseColor,
      harmonyType: 'triad',
      count: 3,
      randomize: 0 // Disable randomization for predictable results
    });
    
    // Check if colors are roughly 120° apart
    const diff1 = getHueDifference(palette[0], palette[1]);
    const diff2 = getHueDifference(palette[1], palette[2]);
    
    expect(diff1).toBeGreaterThan(90);
    expect(diff2).toBeGreaterThan(90);
  });
  
  test('Enhances contrast between colors', () => {
    const baseColor = '#888888'; // Medium gray
    const palette = generateEnhancedPalette({
      baseColor,
      harmonyType: 'monochromatic',
      count: 3,
      contrastEnhance: true
    });
    
    // Check if there's reasonable contrast between colors
    const color1 = tinycolor(palette[0]);
    const color2 = tinycolor(palette[1]);
    const color3 = tinycolor(palette[2]);
    
    const contrast12 = tinycolor.readability(color1, color2);
    const contrast23 = tinycolor.readability(color2, color3);
    
    // WCAG AA minimum is 4.5:1, but we'll be more lenient for color palettes
    expect(contrast12).toBeGreaterThan(1.5);
    expect(contrast23).toBeGreaterThan(1.5);
  });
  
  test('Generates different results with randomization', () => {
    const baseColor = '#FF0000'; // Red
    const palette1 = generateEnhancedPalette({
      baseColor,
      harmonyType: 'analogous',
      randomize: 1 // Full randomization
    });
    
    const palette2 = generateEnhancedPalette({
      baseColor,
      harmonyType: 'analogous',
      randomize: 1 // Full randomization
    });
    
    // The two palettes should be different due to randomization
    expect(palette1).not.toEqual(palette2);
  });
}); 