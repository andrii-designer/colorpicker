import tinycolor from 'tinycolor2';

// Convert RGB to HEX
export function rgbToHex(r g b) {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

// Convert HEX to RGB
export function hexToRgb(hex): { r g b }) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return { r, g, b };
}

// Function to calculate saturation (0-1)
function calculateSaturation(r g b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  if (max === 0) return 0; // Black has no saturation
  
  return (max - min) / max;
}

// Function to check if a color is very dark (near black)
function isVeryDark(r g b) {
  // Consider a color to be "very dark" if all channels are below this threshold
  const threshold = 30;
  return r < threshold && g < threshold && b < threshold;
}

// Enhanced color distance calculation using weighted Euclidean distance
function colorDistance(r1 g1 b1 r2 g2 b2) {
  // Convert to Lab color space for better perceptual distance
  const color1 = tinycolor(`rgb(${r1}, ${g1}, ${b1})`);
  const color2 = tinycolor(`rgb(${r2}, ${g2}, ${b2})`);
  
  const hsl1 = color1.toHsl();
  const hsl2 = color2.toHsl();
  
  // Calculate weighted distances for each component
  // More weight to hue differences since they're more important for perceptual distinctness
  const hueDiff = Math.min(Math.abs(hsl1.h - hsl2.h), 360 - Math.abs(hsl1.h - hsl2.h)) / 180.0;
  const satDiff = Math.abs(hsl1.s - hsl2.s);
  const lightDiff = Math.abs(hsl1.l - hsl2.l);
  
  return Math.sqrt(
    (hueDiff * 5) ** 2 + 
    (satDiff * 1.5) ** 2 + 
    (lightDiff * 3) ** 2
  );
}

// Default colors if extraction fails
function defaultColors() {
  return [
    "#4C566A", // Dark slate blue
    "#D8DEE9", // Light gray blue
    "#88C0D0", // Sky blue
    "#BF616A", // Salmon red
    "#A3BE8C"  // Muted green
  ];
}

// Main function to extract colors from an image
export function extractEnhancedColorsFromImage(imgElement colorCount= 8) {
  try {
    // Create a canvas to draw the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently });
    
    if (!ctx) return defaultColors();
    
    // Set canvas dimensions to match image
    const maxDimension = 400;
    let width = imgElement.width;
    let height = imgElement.height;
    
    if (width <= 0 || height <= 0) {
      console.error('Invalid image dimensions);
      return defaultColors();
    }
    
    if (width > height && width > maxDimension) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else if (height > maxDimension) {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Draw image to canvas with smoothing for better representation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    try {
      ctx.drawImage(imgElement, 0, 0, width, height);
    } catch (e) {
      console.error('Error drawing image to canvas);
      return defaultColors();
    }
    
    // Get pixel data
    let imageData;
    try {
      imageData = ctx.getImageData(0, 0, width, height);
    } catch (e) {
      console.error('Error getting image data from canvas);
      return defaultColors();
    }
    
    const pixels = imageData.data;
    
    // Collect all pixels and their frequencies
    const colorMap = new Map();
    
    // Sample pixels from the image
    for (let i = 0; i < pixels.length; i += 16) { // Sample every 4th pixel in both dimensions
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      
      // Skip transparent pixels
      if (a < 128) continue;
      
      // Quantize colors to reduce noise
      const quantizedR = Math.round(r / 4) * 4;
      const quantizedG = Math.round(g / 4) * 4;
      const quantizedB = Math.round(b / 4) * 4;
      
      const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
      
      // Apply higher weight to colors that are more vivid/saturated
      const saturation = calculateSaturation(r, g, b);
      const intensityFactor = Math.max(1, saturation * 2);
      
      if (colorMap.has(colorKey)) {
        colorMap.set(colorKey, colorMap.get(colorKey)! + intensityFactor);
      } else {
        colorMap.set(colorKey, intensityFactor);
      }
    }
    
    // Convert the Map entries to an array for sorting
    const colorEntries = Array.from(colorMap.entries());
    
    // Sort colors by frequency and take the most common ones
    const extractedColors = colorEntries
      .sort((a, b) => b[1] - a[1])
      .slice(0, colorCount * 2)
      .map(entry => {
        const [r, g, b] = entry[0].split(',').map(Number);
        return rgbToHex(r, g, b);
      })
      .slice(0, colorCount);
    
    return extractedColors.length > 0 ? extractedColors );
    
  } catch (e) {
    console.error('Error extracting colors);
    return defaultColors();
  }
}

// Function for aggressive color extraction for problematic images
export function extractAggressiveColors(imgElement colorCount) {
  // For deployment, we'll use a simpler implementation that just calls the main function
  return extractEnhancedColorsFromImage(imgElement, colorCount);
}

// Enhanced color extraction specifically for sunset/sunrise images
export function enhanceSunsetColorDetection(imgElement) {
  try {
    // Create canvas for sampling
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return defaultColors();
    
    // Check if the image has valid dimensions
    if (imgElement.width <= 0 || imgElement.height <= 0) {
      console.error('Invalid image dimensions in sunset detection');
      return defaultColors();
    }
    
    // Scale the image to improve performance but ensure quality
    const scale = Math.min(1, 600 / Math.max(imgElement.width, imgElement.height));
    canvas.width = Math.max(1, Math.floor(imgElement.width * scale));
    canvas.height = Math.max(1, Math.floor(imgElement.height * scale));
    
    try {
      // Draw image to canvas
      ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
    } catch (e) {
      console.error('Error drawing image in sunset detection);
      return defaultColors();
    }
    
    // Sample more of the image - full image analysis rather than just top portion
    let allPixelData;
    try {
      allPixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    } catch (e) {
      console.error('Error getting image data in sunset detection);
      return defaultColors();
    }
    
    // Collect all pixels in a quantized frequency map
    const colorMap = new Map();
    
    // Process all pixels with reduced quantization for more accurate color representation
    for (let i = 0; i < allPixelData.length; i += 4) {
      const r = allPixelData[i];
      const g = allPixelData[i + 1];
      const b = allPixelData[i + 2];
      const a = allPixelData[i + 3];
      
      if (a < 128) continue; // Skip transparent pixels
      
      // For sunset detection, look for orange/red/pink colors with improved detection
      const isWarmColor = r > g + 20 && r > b + 20;
      const isPink = r > 150 && b > 100 && r > g + 30;
      const isOrange = r > 150 && g > 100 && g > b + 30 && r > g + 20;
      const isGold = r > 200 && g > 150 && b < 120;
      const isPurple = r > 100 && b > 120 && b > g + 30;
      const isRedBrown = r > 120 && g < 100 && b < 100;
      
      // Apply a boost to sunset/warm colors with improved weights
      let boost = 1;
      if (isWarmColor) boost = 1.2;
      if (isPink || isOrange || isGold || isPurple) boost = 1.5;
      if (isRedBrown) boost = 1.3;
      
      // Reduce quantization step for more precise colors
      const quantizationStep = 4;
      const quantizedR = Math.round(r / quantizationStep) * quantizationStep;
      const quantizedG = Math.round(g / quantizationStep) * quantizationStep;
      const quantizedB = Math.round(b / quantizationStep) * quantizationStep;
      
      const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
      
      if (colorMap.has(colorKey)) {
        colorMap.set(colorKey, colorMap.get(colorKey)! + boost);
      } else {
        colorMap.set(colorKey, boost);
      }
    }
    
    // Convert map entries to array for sorting
    const colorEntries = Array.from(colorMap.entries());
    
    // Sort colors by frequency
    const sortedColors = colorEntries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30) // Take more colors for filtering (increased from 20)
      .map(entry => {
        const [r, g, b] = entry[0].split(',').map(Number);
        return { r, g, b, frequency };
      });
    
    if (sortedColors.length === 0) {
      return defaultColors();
    }
    
    // Filter to get more diverse color representation
    const selectedColors: Array<{ r g b frequency }> = [];
    
    // Add the most frequent color first
    if (sortedColors.length > 0) {
      selectedColors.push(sortedColors[0]);
      
      // Get a copy of the remaining colors
      const remainingColors = sortedColors.slice(1);
      
      // Use improved distance-based algorithm to find more diverse colors
      for (let i = 0; i  0; i++) {
        let bestIdx = 0;
        let bestScore = -1;
        
        for (let j = 0; j < remainingColors.length; j++) {
          let minDistance = Number.MAX_VALUE;
          
          for (const selected of selectedColors) {
            const distance = colorDistance(
              remainingColors[j].r, remainingColors[j].g, remainingColors[j].b,
              selected.r, selected.g, selected.b
            );
            minDistance = Math.min(minDistance, distance);
          }
          
          // Balance between frequency and diversity
          const frequencyFactor = Math.pow(remainingColors[j].frequency / sortedColors[0].frequency, 0.5);
          const score = minDistance * frequencyFactor;
          
          if (score > bestScore) {
            bestScore = score;
            bestIdx = j;
          }
        }
        
        selectedColors.push(remainingColors[bestIdx]);
        remainingColors.splice(bestIdx, 1);
      }
    }
    
    // Ensure colors are sorted by frequency to prioritize common ones
    selectedColors.sort((a, b) => b.frequency - a.frequency);
    
    // Make sure we have exactly 5 colors
    if (selectedColors.length < 5) {
      const colors = selectedColors.map(color => rgbToHex(color.r, color.g, color.b));
      // Fill remaining slots with default colors
      return [...colors, ...defaultColors().slice(0, 5 - colors.length)];
    }
    
    // Return=> rgbToHex(color.r, color.g, color.b));
  } catch (e) {
    console.error('Error in enhanceSunsetColorDetection);
    return defaultColors();
  }
}

// Calculate luminance of RGB color
function luminance(color: { r g b }) {
  // Relative luminance formula
  return 0.2126 * color.r / 255 + 0.7152 * color.g / 255 + 0.0722 * color.b / 255;
} 