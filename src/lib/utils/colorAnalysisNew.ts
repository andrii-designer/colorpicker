import tinycolor from 'tinycolor2';

// Cast tinycolor to any to avoid type errors
const tinycolorLib: any = tinycolor;

// Export interface for color analysis results
export interface ColorAnalysis {
  score: number;
  advice: string;
  harmony: string;
}

/**
 * Generate a harmonious palette based on a base color
 * @param baseColor - Base color in hex format
 * @param option - Harmony type ('analogous', 'monochromatic', etc.)
 * @param count - Number of colors to generate
 * @returns Array of hex color codes
 */
export function generateHarmoniousPalette(
  baseColor: string,
  option: string = 'analogous',
  count: number = 5
): string[] {
  const tc = tinycolorLib(baseColor);
  
  // Define harmony types
  const harmonies: Record<string, () => string[]> = {
    analogous: () => {
      const results = [baseColor];
      const hsl = tc.toHsl();
      const step = 30; // Degrees to step on color wheel
      
      for (let i = 1; i <= Math.floor(count / 2); i++) {
        // Add colors on both sides of the base color
        const leftHue = (hsl.h - step * i + 360) % 360;
        const leftColor = tinycolorLib({h: leftHue, s: hsl.s, l: hsl.l}).toHexString();
        
        const rightHue = (hsl.h + step * i) % 360;
        const rightColor = tinycolorLib({h: rightHue, s: hsl.s, l: hsl.l}).toHexString();
        
        // Add to the result array (left on the left, right on the right)
        if (results.length < count) results.unshift(leftColor);
        if (results.length < count) results.push(rightColor);
      }
      
      return results;
    },
    
    monochromatic: () => {
      const results = [baseColor];
      
      // Add lighter shades
      for (let i = 1; i <= Math.floor(count / 2); i++) {
        const lighter = tinycolorLib(baseColor).lighten(i * 10).toHexString();
        results.push(lighter);
      }
      
      // Add darker shades
      for (let i = 1; i <= Math.ceil(count / 2) - 1; i++) {
        const darker = tinycolorLib(baseColor).darken(i * 10).toHexString();
        results.unshift(darker);
      }
      
      return results.slice(0, count);
    },
    
    triad: () => {
      const hsl = tc.toHsl();
      const colors = [baseColor];
      
      // Add colors 120° apart on the color wheel
      if (count >= 2) {
        const secondHue = (hsl.h + 120) % 360;
        colors.push(tinycolorLib({h: secondHue, s: hsl.s, l: hsl.l}).toHexString());
      }
      
      if (count >= 3) {
        const thirdHue = (hsl.h + 240) % 360;
        colors.push(tinycolorLib({h: thirdHue, s: hsl.s, l: hsl.l}).toHexString());
      }
      
      // Add variations if we need more than 3 colors
      if (count > 3) {
        for (let i = 0; i < count - 3; i++) {
          const sourceColor = colors[i % 3];
          const variant = tinycolorLib(sourceColor).lighten(10).toHexString();
          colors.push(variant);
        }
      }
      
      return colors;
    },
    
    complementary: () => {
      const hsl = tc.toHsl();
      const colors = [baseColor];
      
      // Add complementary color (opposite on color wheel)
      if (count >= 2) {
        const complementHue = (hsl.h + 180) % 360;
        colors.push(tinycolorLib({h: complementHue, s: hsl.s, l: hsl.l}).toHexString());
      }
      
      // Add variations if needed
      if (count > 2) {
        for (let i = 0; i < count - 2; i++) {
          const index = i % 2; // Alternate between base and complement
          const sourceColor = colors[index];
          
          // Make variations by adjusting lightness
          const variant = tinycolorLib(sourceColor)
            .lighten(10 * ((i / 2) + 1))
            .toHexString();
            
          colors.push(variant);
        }
      }
      
      return colors;
    },
    
    splitComplementary: () => {
      const hsl = tc.toHsl();
      const colors = [baseColor];
      
      // Add two colors 150° and 210° from the base
      if (count >= 2) {
        const firstSplitHue = (hsl.h + 150) % 360;
        colors.push(tinycolorLib({h: firstSplitHue, s: hsl.s, l: hsl.l}).toHexString());
      }
      
      if (count >= 3) {
        const secondSplitHue = (hsl.h + 210) % 360;
        colors.push(tinycolorLib({h: secondSplitHue, s: hsl.s, l: hsl.l}).toHexString());
      }
      
      // Add variations if needed
      if (count > 3) {
        for (let i = 0; i < count - 3; i++) {
          const index = i % 3;
          const sourceColor = colors[index];
          const variant = tinycolorLib(sourceColor).lighten(10).toHexString();
          colors.push(variant);
        }
      }
      
      return colors;
    },
    
    tetrad: () => {
      const hsl = tc.toHsl();
      const colors = [baseColor];
      
      // Add colors 90°, 180°, and 270° from base
      if (count >= 2) {
        const secondHue = (hsl.h + 90) % 360;
        colors.push(tinycolorLib({h: secondHue, s: hsl.s, l: hsl.l}).toHexString());
      }
      
      if (count >= 3) {
        const thirdHue = (hsl.h + 180) % 360;
        colors.push(tinycolorLib({h: thirdHue, s: hsl.s, l: hsl.l}).toHexString());
      }
      
      if (count >= 4) {
        const fourthHue = (hsl.h + 270) % 360;
        colors.push(tinycolorLib({h: fourthHue, s: hsl.s, l: hsl.l}).toHexString());
      }
      
      // Add variations if needed
      if (count > 4) {
        for (let i = 0; i < count - 4; i++) {
          const index = i % 4;
          const sourceColor = colors[index];
          const variant = tinycolorLib(sourceColor).lighten(10).toHexString();
          colors.push(variant);
        }
      }
      
      return colors;
    }
  };
  
  // Default to analogous if requested type not found
  const harmonyFunc = harmonies[option] || harmonies.analogous;
  return harmonyFunc().slice(0, count);
}

// Analyze the contrast between adjacent colors
function analyzeContrast(colors: any[]): number {
  if (colors.length < 2) return 0;
  
  let totalContrast = 0;
  
  for (let i = 0; i < colors.length - 1; i++) {
    const color1 = colors[i];
    const color2 = colors[i + 1];
    
    // Calculate contrast between adjacent colors
    const contrast = tinycolorLib.readability(color1, color2);
    
    // Normalize to a 0-1 score, where contrast of 1.5 is minimum (0) and 10 is max (1)
    const normalizedContrast = Math.min(Math.max((contrast - 1.5) / 8.5, 0), 1);
    
    totalContrast += normalizedContrast;
  }
  
  return totalContrast / (colors.length - 1);
}

// Analyze the harmony of colors
function analyzeHarmony(colors: any[]): number {
  // Simple harmony analysis for deployment
  const hslColors = colors.map(color => color.toHsl());
  
  // Calculate hue range
  const hues = hslColors.map(c => c.h);
  const maxHue = Math.max(...hues);
  const minHue = Math.min(...hues);
  
  // Account for wraparound at 360/0
  let hueRange = maxHue - minHue;
  if (hueRange > 180) {
    // Recalculate for wraparound
    const adjustedHues = hues.map(h => h > 180 ? h - 360 : h);
    hueRange = Math.max(...adjustedHues) - Math.min(...adjustedHues);
  }
  
  // Score based on hue range (perfect triadic at 120, analogous at <60)
  let harmonyScore;
  
  if (hueRange < 30) {
    // Monochromatic or analogous with very close colors
    harmonyScore = 0.9;
  } else if (hueRange < 60) {
    // Analogous palette - high harmony
    harmonyScore = 0.85;
  } else if (Math.abs(hueRange - 120) < 20) {
    // Close to triadic - good harmony
    harmonyScore = 0.8;
  } else if (Math.abs(hueRange - 180) < 20) {
    // Close to complementary - good but can be harsh
    harmonyScore = 0.7;
  } else {
    // Other cases - proportionally reduce score
    harmonyScore = 0.6;
  }
  
  return harmonyScore;
}

// Add the color analysis function
export function analyzeColorPalette(colors: string[]): ColorAnalysis {
  if (colors.length < 2) {
    return {
      score: 0,
      advice: 'Please provide at least 2 colors for analysis.',
      harmony: 'unknown'
    };
  }

  // Convert colors to tinycolor objects for analysis
  const tinyColors = colors.map(color => tinycolorLib(color));
  
  // Analyze contrast between adjacent colors
  const contrastScore = analyzeContrast(tinyColors);
  
  // Analyze color harmony with our improved analyzer
  const harmonyScore = analyzeHarmony(tinyColors);
  
  // Calculate final score (weighted average)
  let finalScore = (harmonyScore * 0.7 + contrastScore * 0.3) * 10;
  
  // More realistic curve with less inflation for bad palettes
  finalScore = Math.min(10, finalScore);
  
  // Round to one decimal
  finalScore = Math.round(finalScore * 10) / 10;
  
  // Generate advice based on score
  let advice = '';
  
  if (finalScore >= 8.5) {
    advice = 'Excellent color combination! The palette shows strong harmony and good contrast.';
  } else if (finalScore >= 7) {
    advice = 'Good color combination. Consider fine-tuning the contrast or saturation for even better results.';
  } else if (finalScore >= 5) {
    advice = 'Decent color combination. Try adjusting the colors to create more visual interest and better harmony.';
  } else {
    advice = 'Consider adjusting saturation and lightness levels for better balance and harmony.';
  }

  return {
    score: finalScore,
    advice,
    harmony: harmonyScore >= 0.7 ? 'high' : harmonyScore >= 0.4 ? 'medium' : 'low'
  };
}

