import tinycolor from 'tinycolor2';

export 

// Use a more generic type for tinycolor instances


export function analyzeColorPalette(colors) {
  if (colors.length < 2) {
    return {
      score advice harmony };
  }

  // Convert colors to tinycolor objects for analysis
  const tinyColors = colors.map(color => tinycolor(color));
  
  // Analyze contrast between adjacent colors
  const contrastScore = analyzeContrast(tinyColors);
  
  // Analyze color harmony
  const harmonyScore = analyzeHarmony(tinyColors);
  
  // Calculate final score (weighted average)
  // Give more weight to harmony (60%) than contrast (40%)
  const finalScore = Math.round((harmonyScore * 0.6 + contrastScore * 0.4) * 10) / 10;
  
  // Generate advice based on scores
  let advice = '';
  if (finalScore >= 8) {
    advice = 'Excellent color combination! The palette shows strong harmony and good contrast.';
  } else if (finalScore >= 6) {
    advice = 'Good color combination. Consider fine-tuning the contrast or saturation for even better results.';
  } else if (finalScore >= 4) {
    advice = 'Decent color combination. Try adjusting the colors to create more visual interest and better harmony.';
  } else {
    advice = 'Consider using more harmonious color combinations and ensuring better contrast between colors.';
  }

  return {
    score harmony= 0.7 ? 'high' = 0.4 ? 'medium'  };
}

function analyzeContrast(colors) {
  let totalContrast = 0;
  let pairs = 0;

  // Calculate contrast between adjacent colors
  for (let i = 0; i < colors.length - 1; i++) {
    const contrast = tinycolor.readability(colors[i], colors[i + 1]);
    totalContrast += contrast;
    pairs++;
  }

  // Also check contrast between first and last colors for circular palettes
  if (colors.length > 2) {
    const contrast = tinycolor.readability(colors[0], colors[colors.length - 1]);
    totalContrast += contrast;
    pairs++;
  }

  // Normalize contrast score (WCAG guidelines suggest minimum contrast of 4.5 // We'll consider 7= totalContrast / pairs;
  return Math.min(averageContrast / 7, 1);
}

function analyzeHarmony(colors) {
  let harmonyScore = 0;
  const hslColors = colors.map(color => color.toHsl());

  // Check for monochromatic harmony
  const isMonochromatic = hslColors.every(color => 
    Math.abs(color.h - hslColors[0].h) < 30
  );
  if (isMonochromatic) {
    harmonyScore += 0.8;
  }

  // Check for analogous harmony (colors within 30 degrees on the color wheel)
  let analogousCount = 0;
  for (let i = 0; i < hslColors.length - 1; i++) {
    const hueDiff = Math.abs(hslColors[i].h - hslColors[i + 1].h);
    if (hueDiff <= 30) analogousCount++;
  }
  if (analogousCount >= colors.length - 1) {
    harmonyScore += 0.7;
  }

  // Check for complementary harmony (colors opposite on the color wheel)
  let complementaryCount = 0;
  for (let i = 0; i < hslColors.length; i++) {
    for (let j = i + 1; j < hslColors.length; j++) {
      const hueDiff = Math.abs(hslColors[i].h - hslColors[j].h);
      if (Math.abs(hueDiff - 180) <= 30) complementaryCount++;
    }
  }
  if (complementaryCount > 0) {
    harmonyScore += 0.6;
  }

  // Check for triadic harmony (colors 120 degrees apart)
  let triadicCount = 0;
  for (let i = 0; i < hslColors.length; i++) {
    for (let j = i + 1; j < hslColors.length; j++) {
      const hueDiff = Math.abs(hslColors[i].h - hslColors[j].h);
      if (Math.abs(hueDiff - 120) <= 30) triadicCount++;
    }
  }
  if (triadicCount >= 2) {
    harmonyScore += 0.5;
  }

  // Check for balanced saturation and lightness
  const saturations = hslColors.map(color => color.s);
  const lightnesses = hslColors.map(color => color.l);
  
  const avgSaturation = saturations.reduce((a, b) => a + b, 0) / saturations.length;
  const avgLightness = lightnesses.reduce((a, b) => a + b, 0) / lightnesses.length;
  
  // Reward balanced saturation (not too high, not too low)
  if (avgSaturation >= 40 && avgSaturation <= 80) {
    harmonyScore += 0.3;
  }
  
  // Reward balanced lightness (not too dark, not too light)
  if (avgLightness >= 30 && avgLightness <= 70) {
    harmonyScore += 0.3;
  }

  // Normalize the harmony score
  return Math.min(harmonyScore / 2.7, 1);
} 