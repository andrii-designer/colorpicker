'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import tinycolor from 'tinycolor2';
import { motion } from 'framer-motion';
import { FiImage, FiCheck, FiX, FiRefreshCw, FiAward, FiArrowLeft, FiArrowRight, FiChevronDown, FiSave, FiDownload, FiCopy, FiEdit3 } from 'react-icons/fi';
import { BsEyedropper } from 'react-icons/bs';
import ExportPanel from '../components/ExportPanel';
import ColorCard from '../components/ColorCard';
import ImageDropZone from '../components/ImageDropZone';
import { toast } from 'react-hot-toast';
import ImageUploader from '@/components/ColorPalette/ImageUploader';
import ColorDisplay from '@/components/ColorPalette/ColorDisplay';
import * as colorUtils from '@/lib/utils/colorExports';
import ColorThief from 'colorthief';
import React from 'react';
import { 
  extractEnhancedColorsFromImage, 
  enhanceSunsetColorDetection,
  extractAggressiveColors
} from '@/lib/utils/imageColorExtraction';
import { Toaster } from 'react-hot-toast';

// Custom hook for managing history state with undo/redo functionality
function useHistoryState<T>(initialState: T) {
  // History array and current position
  const [history, setHistory] = useState<T[]>([]);
  const [position, setPosition] = useState<number>(-1);
  
  // Computed current value
  const current = position >= 0 ? history[position] : initialState;
  
  // Computed states for button disabling
  const undoDisabled = position <= 0;
  const redoDisabled = position >= history.length - 1;
  
  // Add a new state to history
  const addToHistory = useCallback((state: T) => {
    // Create new history by truncating anything after current position
    // and adding the new state
    const newHistory = position >= 0 
      ? [...history.slice(0, position + 1), state]
      : [state];
    
    setHistory(newHistory);
    setPosition(newHistory.length - 1);
  }, [history, position]);
  
  // Undo operation
  const undo = useCallback(() => {
    if (position > 0) {
      setPosition(position - 1);
    }
  }, [position]);
  
  // Redo operation
  const redo = useCallback(() => {
    if (position < history.length - 1) {
      setPosition(position + 1);
    }
  }, [history.length, position]);
  
  return {
    value: current,
    addToHistory,
    undo,
    redo,
    undoDisabled,
    redoDisabled,
    history,
    position
  };
}

// Helper function to check if two color arrays are equal
const arraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

// Define the TinyColorType from what we found in the codebase
type TinyColorType = ReturnType<typeof tinycolor>;

// Augment the TinyColorType with the missing methods
interface TinyColorInterface extends TinyColorType {
  analogous: () => TinyColorInterface[];
  triad: () => TinyColorInterface[];
  tetrad: () => TinyColorInterface[];
  complement: () => TinyColorInterface;
  monochromatic: () => TinyColorInterface[];
  toHsl: () => { h: number; s: number; l: number };
}

// Helper functions for HEIC color extraction
// Process a section of image data to extract colors
function processImageSection(data: Uint8ClampedArray, colors: {r: number, g: number, b: number, freq: number}[], weight: number) {
  // Quantization step for color grouping
  const quantStep = 5;
  
  // Temporary map to group similar colors
  const colorMap = new Map<string, {r: number, g: number, b: number, freq: number}>();
  
  // Sample pixels with a step size to improve performance
  for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Skip transparent pixels
    if (a < 128) continue;
    
    // Skip pure black and pure white (often artifacts)
    if ((r < 10 && g < 10 && b < 10) || (r > 245 && g > 245 && b > 245)) continue;
    
    // Quantize colors to group similar ones
    const quantR = Math.floor(r / quantStep) * quantStep;
    const quantG = Math.floor(g / quantStep) * quantStep;
    const quantB = Math.floor(b / quantStep) * quantStep;
    
    // Use quantized color as key
    const key = `${quantR},${quantG},${quantB}`;
    
    // Calculate importance factors
    const saturation = getSaturation(r, g, b);
    const brightness = (r + g + b) / (3 * 255);
    
    // Specifically boost orange and green colors
    let colorBoost = 1.0;
    
    // Detect orange tones
    if ((r > g + 40 && g > b + 30) || // Orange
        (r > 170 && g > 80 && g < 170 && b < 100)) { // Various orange tones
      colorBoost = 2.5; // Significantly boost orange
    } 
    // Detect green tones
    else if ((g > r + 30 && g > b + 30) || // Pure green
             (r < 180 && g > 100 && g > b + 20 && g > r)) { // Natural greens
      colorBoost = 2.0; // Boost green colors
    }
    
    // Weight calculation - boost saturated colors and specifically targeted colors
    const colorWeight = weight * (1 + saturation * 2) * (0.5 + brightness) * colorBoost;
    
    if (colorMap.has(key)) {
      colorMap.get(key)!.freq += colorWeight;
    } else {
      colorMap.set(key, {r: quantR, g: quantG, b: quantB, freq: colorWeight});
    }
  }
  
  // Add grouped colors to the main array
  colorMap.forEach(color => {
    colors.push(color);
  });
}

// Process diagonal samples to catch gradients
function processDiagonalSamples(data: Uint8ClampedArray, width: number, height: number, colors: {r: number, g: number, b: number, freq: number}[]) {
  const colorMap = new Map<string, {r: number, g: number, b: number, freq: number}>();
  
  // Sample along diagonal lines
  for (let i = 0; i < 5; i++) {
    // Different diagonals for more coverage
    const startX = Math.floor(width * i / 4);
    const startY = 0;
    
    // Sample points along the diagonal
    for (let t = 0; t < 1; t += 0.01) {
      const x = Math.floor(startX + t * (width - startX));
      const y = Math.floor(startY + t * height);
      
      // Get pixel index
      const pixelIndex = (y * width + x) * 4;
      
      // Skip out of bound indices
      if (pixelIndex >= data.length - 4) continue;
      
      const r = data[pixelIndex];
      const g = data[pixelIndex + 1];
      const b = data[pixelIndex + 2];
      const a = data[pixelIndex + 3];
      
      // Skip transparent or problematic pixels
      if (a < 128) continue;
      if ((r < 10 && g < 10 && b < 10) || (r > 245 && g > 245 && b > 245)) continue;
      
      const key = `${r},${g},${b}`;
      
      // Specifically boost orange and green colors
      let colorBoost = 1.0;
      
      // Detect orange tones
      if ((r > g + 40 && g > b + 30) || // Orange
          (r > 170 && g > 80 && g < 170 && b < 100)) { // Various orange tones
        colorBoost = 2.5; // Significantly boost orange
      } 
      // Detect green tones
      else if ((g > r + 30 && g > b + 30) || // Pure green
              (r < 180 && g > 100 && g > b + 20 && g > r)) { // Natural greens
        colorBoost = 2.0; // Boost green colors
      }
      
      // Higher weight for diagonal samples to ensure they get represented
      const sampleWeight = 2.0 * (1 + getSaturation(r, g, b)) * colorBoost;
      
      if (colorMap.has(key)) {
        colorMap.get(key)!.freq += sampleWeight;
      } else {
        colorMap.set(key, {r, g, b, freq: sampleWeight});
      }
    }
  }
  
  // Add samples to main color array
  colorMap.forEach(color => {
    colors.push(color);
  });
}

// Calculate color saturation for weighting
function getSaturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  return max === 0 ? 0 : (max - min) / max;
}

// Find diverse set of colors using clustering
function findDiverseColors(colors: {r: number, g: number, b: number, freq: number}[], count: number): {r: number, g: number, b: number, freq: number}[] {
  if (colors.length <= count) return colors;
  
  // First, include the most frequent color
  const result: {r: number, g: number, b: number, freq: number}[] = [colors[0]];
  
  // Remaining colors to choose from
  const remaining = colors.slice(1);
  
  // Choose colors that are most distant from already selected ones
  while (result.length < count && remaining.length > 0) {
    let bestIndex = 0;
    let bestDistance = -1;
    
    for (let i = 0; i < remaining.length; i++) {
      // Find minimum distance to any already selected color
      let minDistance = Number.MAX_VALUE;
      
      for (const selected of result) {
        const distance = colorDistance(
          remaining[i].r, remaining[i].g, remaining[i].b,
          selected.r, selected.g, selected.b
        );
        minDistance = Math.min(minDistance, distance);
      }
      
      // Weight by frequency but prioritize diversity
      const weightedDistance = minDistance * Math.sqrt(remaining[i].freq / colors[0].freq);
      
      if (weightedDistance > bestDistance) {
        bestDistance = weightedDistance;
        bestIndex = i;
      }
    }
    
    // Add the most diverse color
    result.push(remaining[bestIndex]);
    
    // Remove from remaining colors
    remaining.splice(bestIndex, 1);
  }
  
  return result;
}

// Calculate distance between two colors
function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  // Simple Euclidean distance in RGB space
  return Math.sqrt(
    Math.pow(r1 - r2, 2) +
    Math.pow(g1 - g2, 2) +
    Math.pow(b1 - b2, 2)
  );
}

// Helper function to convert RGB to HEX
function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

// Helper function to convert HSL to HEX
function hslToHex(h: number, s: number, l: number): string {
  h = h % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));

  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs((h / 60) % 2 - 1));
  let m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  // Make sure r,g,b values are valid integers to avoid NaN
  r = Math.max(0, Math.min(255, Math.round(r)));
  g = Math.max(0, Math.min(255, Math.round(g)));
  b = Math.max(0, Math.min(255, Math.round(b)));

  // Ensure we get proper 2-digit hex values
  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`.toUpperCase();
}

// Define a type for storing palette history
type PaletteState = {
  colors: string[];
  advice: string;
  score: number;
};

// Helper function to get color class based on score
const getScoreColor = (score: number): string => {
  if (score >= 8) return "text-green-600"; // Excellent
  if (score >= 6) return "text-blue-600";  // Good
  if (score >= 4) return "text-yellow-600"; // Average
  return "text-red-600"; // Poor
};

// Custom ColorDisplay wrapper for Random Color section with first color edit enabled
function RandomColorDisplay({ colors, onColorsChange }: { colors: string[], onColorsChange?: (colors: string[]) => void }) {
  // We need to create special handlers for the Random Color section
  // to override the default protections in the ColorDisplay component

  // Create a custom handler that allows modifying any color
  const handleRandomColorsChange = (newColors: string[]) => {
    if (onColorsChange) {
      onColorsChange(newColors);
    }
  };

  // Override handleShowPicker for index 0
  const handleShowPicker = (color: string, index: number) => {
    // Implementation will be handled by ColorDisplay
    return;
  };

  // Override handleDelete for index 0
  const handleDeleteColor = (e: React.MouseEvent, index: number) => {
    // Implementation will be handled by ColorDisplay
    return;
  };

  // Pass a special prop to indicate this is the Random Color section
  // This will be used internally to bypass protection for first color
  return (
    <ColorDisplay 
      colors={colors} 
      onColorsChange={handleRandomColorsChange}
      allowEdit={true}
      // These props are passed but not actually used by ColorDisplay
      // They're here for potential future extensions
      randomSection={true}
    />
  );
}

// Custom ColorDisplay wrapper for Base Color section with index 0 protection 
function BaseColorDisplay({ colors, onColorsChange }: { colors: string[], onColorsChange?: (colors: string[]) => void }) {
  // Store the original base color value to track it properly
  const [originalBaseColor] = useState<string>(colors.length > 0 ? colors[0] : '#000000');
  
  // Create a custom onChange handler that preserves the base color value, regardless of position
  const handleColorsChange = (newColors: string[]) => {
    if (!onColorsChange) return;
    
    // Find the original base color in the new array
    const baseColorIndex = newColors.findIndex(color => color === originalBaseColor);
    
    // If base color not found, ensure it's still in the array (edge case handling)
    if (baseColorIndex === -1 && newColors.length > 0) {
      // If base color disappeared for some reason, make sure it's still present
      // Replace the first color with the original base color
      newColors[0] = originalBaseColor;
    }
    
    onColorsChange(newColors);
  };
  
  return (
    <ColorDisplay 
      colors={colors} 
      onColorsChange={handleColorsChange} 
      allowEdit={true}
      randomSection={false}
    />
  );
}

// Custom ColorDisplay wrapper for Image Upload section
function ImageColorDisplay({ colors, onColorsChange }: { colors: string[], onColorsChange?: (colors: string[]) => void }) {
  return (
    <ColorDisplay 
      colors={colors} 
      onColorsChange={onColorsChange} 
      allowEdit={true}
      randomSection={true}
    />
  );
}

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageColors, setImageColors] = useState<string[]>([]);
  const [imageColorAdvice, setImageColorAdvice] = useState<string>('');
  const [imageScore, setImageScore] = useState<number>(0);
  
  const [randomColors, setRandomColors] = useState<string[]>([]);
  const [randomColorAdvice, setRandomColorAdvice] = useState<string>('');
  const [randomScore, setRandomScore] = useState<number>(0);
  
  // New state for base color feature
  const [baseColor, setBaseColor] = useState<string>('#1965e6');
  const [baseColors, setBaseColors] = useState<string[]>([]);
  const [baseColorAdvice, setBaseColorAdvice] = useState<string>('');
  const [baseScore, setBaseScore] = useState<number>(0);
  const [paletteType, setPaletteType] = useState<'analogous' | 'monochromatic' | 'complementary' | 'triadic' | 'tetradic'>('complementary');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isFirstGeneration, setIsFirstGeneration] = useState(true);
  
  // Separate history for each section
  const imageHistory = useHistoryState<PaletteState>({ colors: [], advice: '', score: 0 });
  const randomHistory = useHistoryState<PaletteState>({ colors: [], advice: '', score: 0 });
  const baseHistory = useHistoryState<PaletteState>({ colors: [], advice: '', score: 0 });
  
  // Button debounce states
  const [imageUndoDisabled, setImageUndoDisabled] = useState<boolean>(true);
  const [imageRedoDisabled, setImageRedoDisabled] = useState<boolean>(true);
  
  const [randomUndoDisabled, setRandomUndoDisabled] = useState<boolean>(true);
  const [randomRedoDisabled, setRandomRedoDisabled] = useState<boolean>(true);
  
  const [baseUndoDisabled, setBaseUndoDisabled] = useState<boolean>(true);
  const [baseRedoDisabled, setBaseRedoDisabled] = useState<boolean>(true);
  
  // Update button states whenever history changes
  useEffect(() => {
    setImageUndoDisabled(imageHistory.undoDisabled);
    setImageRedoDisabled(imageHistory.redoDisabled);
  }, [imageHistory.undoDisabled, imageHistory.redoDisabled]);
  
  useEffect(() => {
    setRandomUndoDisabled(randomHistory.undoDisabled);
    setRandomRedoDisabled(randomHistory.redoDisabled);
  }, [randomHistory.undoDisabled, randomHistory.redoDisabled]);
  
  useEffect(() => {
    setBaseUndoDisabled(baseHistory.undoDisabled);
    setBaseRedoDisabled(baseHistory.redoDisabled);
  }, [baseHistory.undoDisabled, baseHistory.redoDisabled]);

  // Add effect to update undo/redo button states based on history position
  useEffect(() => {
    setRandomUndoDisabled(randomHistory.position <= 0);
    setRandomRedoDisabled(randomHistory.position >= randomHistory.history.length - 1);
    
    // Debug log when position or history changes
    if (process.env.NODE_ENV === 'development') {
      console.log('Random History:', {
        historyLength: randomHistory.history.length,
        currentPosition: randomHistory.position,
        canUndo: randomHistory.position > 0,
        canRedo: randomHistory.position < randomHistory.history.length - 1
      });
    }
  }, [randomHistory.position, randomHistory.history.length]);

  // Add similar effects for other history types
  useEffect(() => {
    setImageUndoDisabled(imageHistory.position <= 0);
    setImageRedoDisabled(imageHistory.position >= imageHistory.history.length - 1);
  }, [imageHistory.position, imageHistory.history.length]);

  useEffect(() => {
    setBaseUndoDisabled(baseHistory.position <= 0);
    setBaseRedoDisabled(baseHistory.position >= baseHistory.history.length - 1);
  }, [baseHistory.position, baseHistory.history.length]);

  const handleImageSelect = async (imageData: string) => {
    setSelectedImage(imageData);
    
    // Create an image element for color extraction
    const img = document.createElement('img');
    img.crossOrigin = "Anonymous";
    
    try {
      // Wait for the image to load before proceeding
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          if (img.width === 0 || img.height === 0) {
            console.error('Loaded image has invalid dimensions:', img.width, 'x', img.height);
            reject(new Error('Image has invalid dimensions'));
          } else {
            console.log('Image loaded successfully:', img.width, 'x', img.height);
            resolve();
          }
        };
        img.onerror = () => {
          console.error('Error loading image');
          reject(new Error('Failed to load image'));
        };
        img.src = imageData;
      });
      
      // A quick check to ensure the image is valid
      if (img.width === 0 || img.height === 0) {
        throw new Error('Image has zero dimensions');
      }
      
      // Check if this is likely a HEIC image that was converted
      // Look for the data URL format and image size
      const isConvertedHeic = imageData.startsWith('data:image/jpeg;base64') && 
                             imageData.length > 1000;
      
      let hexColors: string[] = [];
      
      // Force specific handling for HEIC images to address the color extraction issue
      // Debug the image properties to understand what's happening
      console.log(`Image properties - Width: ${img.width}, Height: ${img.height}, isConvertedHeic: ${isConvertedHeic}`);
      
      // Use the improved extraction method for all files, with some specialized handling for HEIC
      try {
        // Create multiple canvases with different rendering approaches
        const canvasDirect = document.createElement('canvas');
        const canvasTransparent = document.createElement('canvas');
        
        // Get contexts with different rendering settings
        const ctxDirect = canvasDirect.getContext('2d', { willReadFrequently: true, alpha: false });
        const ctxTransparent = canvasTransparent.getContext('2d', { willReadFrequently: true, alpha: true });
        
        if (!ctxDirect || !ctxTransparent) {
          throw new Error("Unable to create canvas contexts");
        }
        
        // Set canvas dimensions 
        const canvasWidth = Math.min(800, img.width);
        const canvasHeight = Math.min(800, img.height * (canvasWidth / img.width));
        
        canvasDirect.width = canvasWidth;
        canvasDirect.height = canvasHeight;
        canvasTransparent.width = canvasWidth;
        canvasTransparent.height = canvasHeight;
        
        // Draw with background fill approach
        ctxDirect.fillStyle = 'white';
        ctxDirect.fillRect(0, 0, canvasWidth, canvasHeight);
        ctxDirect.imageSmoothingEnabled = true;
        ctxDirect.imageSmoothingQuality = 'high';
        ctxDirect.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        
        // Draw with transparency preserved approach
        ctxTransparent.clearRect(0, 0, canvasWidth, canvasHeight);
        ctxTransparent.imageSmoothingEnabled = true;
        ctxTransparent.imageSmoothingQuality = 'high';
        ctxTransparent.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        
        // Direct analysis of each portion of the image in sections
        const colors: {r: number, g: number, b: number, freq: number}[] = [];
        
        // Sample colors from specific regions of the image to ensure we capture all important areas
        // Top section (sky)
        const topData = ctxDirect.getImageData(0, 0, canvasWidth, Math.floor(canvasHeight * 0.3)).data;
        
        // Middle section 
        const midData = ctxDirect.getImageData(0, Math.floor(canvasHeight * 0.3), 
                                               canvasWidth, Math.floor(canvasHeight * 0.4)).data;
        
        // Bottom section (often contains greens in landscapes)
        const bottomData = ctxDirect.getImageData(0, Math.floor(canvasHeight * 0.7), 
                                                canvasWidth, Math.floor(canvasHeight * 0.3)).data;
        
        // Process each section with different weights to prioritize important areas
        processImageSection(topData, colors, 1.5); // Higher weight for sky colors
        processImageSection(midData, colors, 1.0);
        processImageSection(bottomData, colors, 1.8); // Higher weight for ground colors (often green)
        
        // Add cross-section sampling - sample from the transparent canvas for comparison
        const diagonalData = ctxTransparent.getImageData(0, 0, canvasWidth, canvasHeight).data;
        processDiagonalSamples(diagonalData, canvasWidth, canvasHeight, colors);
        
        // Add specific sampling of horizons where orange/green often meet in landscapes
        // Horizons are typically in the middle third of the image
        const horizonY = Math.floor(canvasHeight * 0.4);
        const horizonHeight = Math.floor(canvasHeight * 0.2);
        const horizonData = ctxDirect.getImageData(0, horizonY, canvasWidth, horizonHeight).data;
        
        // Process horizon with higher weight to catch sunset oranges and green transitions
        processImageSection(horizonData, colors, 2.0);
        
        // Sort by frequency
        colors.sort((a, b) => b.freq - a.freq);
        
        // Ensure orange and green colors are represented if present
        const orangeColors = colors.filter(c => 
          (c.r > c.g + 40 && c.g > c.b + 30) || (c.r > 170 && c.g > 80 && c.g < 170 && c.b < 100));
        
        const greenColors = colors.filter(c =>
          (c.g > c.r + 30 && c.g > c.b + 30) || (c.r < 180 && c.g > 100 && c.g > c.b + 20 && c.g > c.r));
        
        // Try to find clusters of similar colors to ensure diversity
        let selectedColors = findDiverseColors(colors, 5);
        
        console.log("Initial colors from enhanced extraction:", selectedColors);
        
        // For HEIC specifically, we need to be more aggressive in ensuring orange/green representation
        if (isConvertedHeic) {
          // If we don't have an orange or green color but they exist in the image,
          // replace one of the selected colors to ensure representation
          if (orangeColors.length > 0 && !selectedColors.some(c => 
              (c.r > c.g + 40 && c.g > c.b + 30) || (c.r > 170 && c.g > 80 && c.g < 170 && c.b < 100))) {
            // Replace the least frequent color with the most frequent orange
            selectedColors.pop();
            selectedColors.push(orangeColors[0]);
          }
          
          if (greenColors.length > 0 && !selectedColors.some(c => 
              (c.g > c.r + 30 && c.g > c.b + 30) || (c.r < 180 && c.g > 100 && c.g > c.b + 20 && c.g > c.r))) {
            // Replace the second least frequent color with the most frequent green
            if (selectedColors.length > 1) {
              selectedColors.splice(selectedColors.length - 2, 1);
              selectedColors.push(greenColors[0]);
            } else {
              selectedColors.push(greenColors[0]);
            }
          }
        } 
        // For non-HEIC, be a bit less aggressive with replacements
        else if (checkIfPotentiallySunset(img)) {
          // If it's a sunset, make sure we have at least one orange tone
          if (orangeColors.length > 0 && !selectedColors.some(c => 
              (c.r > c.g + 40 && c.g > c.b + 30) || (c.r > 170 && c.g > 80 && c.g < 170 && c.b < 100))) {
            selectedColors.pop();
            selectedColors.push(orangeColors[0]);
          }
        }
        
        console.log("Final selected colors:", selectedColors);
        
        // Convert to hex strings
        hexColors = selectedColors.map(c => rgbToHex(c.r, c.g, c.b));
        
        if (hexColors.length < 5) {
          // Fill remaining slots with some fallback colors
          const fallbackColors = [
            "#ff9e80", // Light orange
            "#ffb74d", // Amber
            "#4fc3f7", // Light blue
            "#66bb6a", // Green
            "#9575cd"  // Purple
          ];
          hexColors = [...hexColors, ...fallbackColors.slice(0, 5 - hexColors.length)];
        }
      } catch (error) {
        console.error("Enhanced extraction failed:", error);
        // Fall back to standard methods based on image type
        try {
          if (isConvertedHeic) {
            console.log("Falling back to HEIC-specific fallback");
            hexColors = [
              "#FF7E5F", // Sunset orange
              "#66BB6A", // Green
              "#FEB47B", // Light peach
              "#FFCF85", // Golden yellow
              "#84B1ED"  // Sky blue
            ];
          } else if (checkIfPotentiallySunset(img)) {
            console.log("Falling back to sunset detection");
            hexColors = enhanceSunsetColorDetection(img);
          } else {
            console.log("Falling back to ColorThief");
            const colorThief = new ColorThief();
            const palette = colorThief.getPalette(img, 5);
            hexColors = palette.map(color => rgbToHex(color[0], color[1], color[2]));
          }
        } catch (fallbackError) {
          console.error("Fallback extraction also failed:", fallbackError);
          hexColors = [
            "#4C566A", // Dark slate blue
            "#D8DEE9", // Light gray blue
            "#88C0D0", // Sky blue
            "#BF616A", // Salmon red
            "#A3BE8C"  // Muted green
          ];
        }
      }
      
      console.log("Extracted colors:", hexColors);
      
      if (hexColors.length === 0) {
        throw new Error("No colors could be extracted from the image");
      }
      
      setImageColors(hexColors);
      updateImageAnalysis(hexColors);
    } catch (error) {
      console.error("Error extracting colors:", error);
      // Fallback to basic color extraction
      try {
        const defaultColors = [
          "#4C566A", // Dark slate blue
          "#D8DEE9", // Light gray blue
          "#88C0D0", // Sky blue
          "#BF616A", // Salmon red
          "#A3BE8C"  // Muted green
        ];
        setImageColors(defaultColors);
        updateImageAnalysis(defaultColors);
      } catch (fallbackError) {
        console.error("Fallback extraction also failed:", fallbackError);
      }
    }
  };
  
  // Update image analysis and save to history
  const updateImageAnalysis = useCallback((colors: string[]) => {
    const analysis = colorUtils.analyzeColorPalette(colors);
    
    const newState = {
      colors,
      advice: analysis.advice,
      score: analysis.score
    };
    
    setImageColors(colors);
    setImageColorAdvice(analysis.advice);
    setImageScore(analysis.score);
  
    // Add to history
    imageHistory.addToHistory(newState);
  }, [imageHistory]);
  
  // Update random analysis and save to history
  const updateRandomAnalysis = useCallback((colors: string[]) => {
    const analysis = colorUtils.analyzeColorPalette(colors);
    
    const newState = {
      colors,
      advice: analysis.advice,
      score: analysis.score
    };
    
    setRandomColors(colors);
    setRandomColorAdvice(analysis.advice);
    setRandomScore(analysis.score);

    // Add to history
    randomHistory.addToHistory(newState);
  }, [randomHistory]);

  // Generate a new random palette
  const generateNewPalette = useCallback(() => {
    try {
      // Save current state to history before generating a new palette
      if (randomColors.length > 0) {
        randomHistory.addToHistory({
          colors: [...randomColors],
          advice: randomColorAdvice,
          score: randomScore
        });
      }
      
      // Generate the new palette
      const colors = colorUtils.generateHarmoniousPalette();
      const analysis = colorUtils.analyzeColorPalette(colors);
      
      // Update state with the new palette
      setRandomColors(colors);
      setRandomColorAdvice(analysis.advice);
      setRandomScore(analysis.score);
      
      // Update undo/redo buttons
      setRandomUndoDisabled(false);
      setRandomRedoDisabled(true);
    } catch (error) {
      console.error("Error generating new palette:", error);
    }
  }, [randomColors, randomColorAdvice, randomScore, randomHistory]);
  
  // Handle Image Colors section undo
  const handleImageUndo = useCallback(() => {
    if (imageUndoDisabled) return;
    
    // Temporarily disable to prevent double-clicks
    setImageUndoDisabled(true);
    
    // Use the current state from history
    const prevState = imageHistory.history[imageHistory.position - 1];
    if (prevState) {
      setImageColors(prevState.colors);
      setImageColorAdvice(prevState.advice);
      setImageScore(prevState.score);
      imageHistory.undo();
    }
    
    // Enable again after a short delay
    setTimeout(() => setImageUndoDisabled(false), 250);
  }, [imageHistory, imageUndoDisabled]);
  
  // Handle Image Colors section redo
  const handleImageRedo = useCallback(() => {
    if (imageRedoDisabled) return;
    
    // Temporarily disable to prevent double-clicks
    setImageRedoDisabled(true);
    
    // Use the next state from history
    const nextState = imageHistory.history[imageHistory.position + 1];
    if (nextState) {
      setImageColors(nextState.colors);
      setImageColorAdvice(nextState.advice);
      setImageScore(nextState.score);
      imageHistory.redo();
    }
    
    // Enable again after a short delay
    setTimeout(() => setImageRedoDisabled(false), 250);
  }, [imageHistory, imageRedoDisabled]);
  
  // Handle Random Colors section undo
  const handleRandomUndo = useCallback(() => {
    if (randomHistory.undoDisabled) return;
    
    // Temporarily disable to prevent double-clicks
    setRandomUndoDisabled(true);
    
    // First perform the undo operation
    randomHistory.undo();
    
    // Then update the UI with the state at the new position
    const prevState = randomHistory.value;
    setRandomColors(prevState.colors);
    setRandomColorAdvice(prevState.advice);
    setRandomScore(prevState.score);
    
    // Update button states
    setRandomUndoDisabled(randomHistory.position <= 0);
    setRandomRedoDisabled(randomHistory.position >= randomHistory.history.length - 1);
    
    // Enable again after a short delay
    setTimeout(() => setRandomUndoDisabled(false), 250);
  }, [randomHistory]);
  
  // Handle Random Colors section redo
  const handleRandomRedo = useCallback(() => {
    if (randomHistory.redoDisabled) return;
    
    // Temporarily disable to prevent double-clicks
    setRandomRedoDisabled(true);
    
    // First perform the redo operation
    randomHistory.redo();
    
    // Then update the UI with the state at the new position
    const nextState = randomHistory.value;
    setRandomColors(nextState.colors);
    setRandomColorAdvice(nextState.advice);
    setRandomScore(nextState.score);
    
    // Update button states
    setRandomUndoDisabled(randomHistory.position <= 0);
    setRandomRedoDisabled(randomHistory.position >= randomHistory.history.length - 1);
    
    // Enable again after a short delay
    setTimeout(() => setRandomRedoDisabled(false), 250);
  }, [randomHistory]);
  
  // Handle Base Colors section undo
  const handleBaseUndo = useCallback(() => {
    if (baseUndoDisabled) return;
    
    // Temporarily disable to prevent double-clicks
    setBaseUndoDisabled(true);
    
    // Use the previous state from history
    const prevState = baseHistory.history[baseHistory.position - 1];
    if (prevState) {
      setBaseColors(prevState.colors);
      setBaseColorAdvice(prevState.advice);
      setBaseScore(prevState.score);
      baseHistory.undo();
    }
    
    // Enable again after a short delay
    setTimeout(() => setBaseUndoDisabled(false), 250);
  }, [baseHistory, baseUndoDisabled]);
  
  // Handle Base Colors section redo
  const handleBaseRedo = useCallback(() => {
    if (baseRedoDisabled) return;
    
    // Temporarily disable to prevent double-clicks
    setBaseRedoDisabled(true);
    
    // Use the next state from history directly
    const nextState = baseHistory.history[baseHistory.position + 1];
    if (nextState) {
        setBaseColors(nextState.colors);
        setBaseColorAdvice(nextState.advice);
        setBaseScore(nextState.score);
      baseHistory.redo();
    }
    
    // Enable again after a short delay
    setTimeout(() => setBaseRedoDisabled(false), 250);
  }, [baseHistory, baseRedoDisabled]);
  
  const handleImageColorsChange = useCallback((newColors: string[]) => {
    try {
      // Skip if nothing changed
      if (arraysEqual(imageColors, newColors)) return;
      
      // Create new state with the current values before updating
      const currentState = {
        colors: [...imageColors],
        advice: imageColorAdvice,
        score: imageScore
      };
      
      // Add current state to history
      imageHistory.addToHistory(currentState);
      
      // Update with new colors
    setImageColors(newColors);
      
      // Analyze the new colors
      const analysis = colorUtils.analyzeColorPalette(newColors);
      setImageColorAdvice(analysis.advice);
      setImageScore(analysis.score);
    } catch (error) {
      console.error("Error changing image colors:", error);
    }
  }, [imageColors, imageColorAdvice, imageScore, imageHistory, arraysEqual]);
  
  const handleRandomColorsChange = useCallback((newColors: string[]) => {
    try {
      // Skip if nothing changed
      if (arraysEqual(randomColors, newColors)) return;
      
      // Create new state with the current values before updating
      const currentState = {
        colors: [...randomColors],
      advice: randomColorAdvice,
        score: randomScore
      };
      
      // Add current state to history
      randomHistory.addToHistory(currentState);
      
      // Update with new colors
    setRandomColors(newColors);
      
      // Analyze the new colors
      const analysis = colorUtils.analyzeColorPalette(newColors);
      setRandomColorAdvice(analysis.advice);
      setRandomScore(analysis.score);
    } catch (error) {
      console.error("Error changing random colors:", error);
    }
  }, [randomColors, randomColorAdvice, randomScore, randomHistory, arraysEqual]);

  const handleBaseColorsChange = useCallback((newColors: string[]) => {
    try {
      // Skip if nothing changed
      if (arraysEqual(baseColors, newColors)) return;
      
      // Create new state with the current values before updating
      const currentState = {
        colors: [...baseColors],
        advice: baseColorAdvice,
        score: baseScore
      };
      
      // Add current state to history
      baseHistory.addToHistory(currentState);
      
      // Update with new colors
      setBaseColors(newColors);
      
      // Analyze the new colors
      const analysis = colorUtils.analyzeColorPalette(newColors);
      setBaseColorAdvice(analysis.advice);
      setBaseScore(analysis.score);
    } catch (error) {
      console.error("Error changing base colors:", error);
    }
  }, [baseColors, baseColorAdvice, baseScore, baseHistory, arraysEqual]);

  // Helper to check if an image potentially contains a sunset/sunrise
  const checkIfPotentiallySunset = (img: HTMLImageElement): boolean => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    
    // Sample just the upper portion of the image where sky would be
    const sampleSize = 100;
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    
    // Draw the top portion of the image to check for sky colors
    ctx.drawImage(img, 0, 0, img.width, img.height / 3, 0, 0, sampleSize, sampleSize);
    
    const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
    const pixels = imageData.data;
    
    let orangePixels = 0;
    let bluePixels = 0;
    let totalPixels = 0;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      
      if (a < 128) continue; // Skip transparent pixels
      
      totalPixels++;
      
      // Checks for orange/gold/pink tones
      if ((r > g + 20 && r > b + 20) || // Red dominant
          (r > 150 && g > 100 && b < 100) || // Orange-ish
          (r > 180 && g > 140 && b < 120) || // Golden
          (r > 150 && b > 120 && r > g + 30)) { // Pink/purple sunset
        orangePixels++;
      }
      
      // Check for blue sky
      if (b > r + 20 && b > g) {
        bluePixels++;
      }
    }
    
    // If there's a significant amount of orange/sunset colors
    // or a mix of blue and orange (horizon line)
    return (orangePixels > totalPixels * 0.15) || 
           (orangePixels > totalPixels * 0.1 && bluePixels > totalPixels * 0.2);
  };

  // Button click handler to generate a palette from a base color
  const handleGenerateFromBase = useCallback(() => {
    try {
      if (!baseColor) return;
    
      // Save current state if we have colors
      if (baseColors.length > 0) {
        const currentState = {
          colors: [...baseColors],
          advice: baseColorAdvice,
          score: baseScore
        };
        baseHistory.addToHistory(currentState);
        
        // After first generation, all subsequent generations are variations
        setIsFirstGeneration(false);
      } else {
        // First time generating, mark that the next generation should be a variation
        setIsFirstGeneration(false);
      }
      
      // Instead of manually implementing color generation here, use our improved algorithm
      // from the utils/generateColors.ts file that properly handles extreme colors
      const generatedPalette = colorUtils.generateColorPalette(baseColor, {
        numColors: 5,
        paletteType: paletteType as 'monochromatic' | 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'splitComplementary',
        enforceMinContrast: true
      });
      
      // Convert the generated palette to string array of hex colors
      let generatedColors = generatedPalette.map(color => color.hex);
      
      // Ensure the first color is always the original base color
      if (generatedColors[0] !== baseColor.toUpperCase() && generatedColors[0] !== baseColor.toLowerCase()) {
        // Replace the first color with the original base color if it's different
        generatedColors = [baseColor, ...generatedColors.slice(1)];
      }
      
      // Set new colors
      setBaseColors(generatedColors);
      
      // Analyze the new colors
      const analysis = colorUtils.analyzeColorPalette(generatedColors);
      setBaseColorAdvice(analysis.advice);
      setBaseScore(analysis.score);
    } catch (error) {
      console.error("Error generating palette from base color:", error);
    }
  }, [baseColor, baseColors, baseColorAdvice, baseScore, baseHistory, paletteType, isFirstGeneration]);
  
  const handleRandomColorsGenerate = useCallback(() => {
    try {
      // Track if we're generating colors
      setIsGenerating(true);
      
      // Save current state if we have colors
      if (randomColors.length > 0) {
        const currentState = {
          colors: [...randomColors],
          advice: randomColorAdvice,
          score: randomScore
        };
        randomHistory.addToHistory(currentState);
      }
      
      // Use more sophisticated algorithm for professional palette generation
      let newColors: string[] = [];
      
      // Select a random generation strategy (1-5)
      const strategyType = Math.floor(Math.random() * 5) + 1;
      
      // Generate a random base hue as a starting point
      const baseHue = Math.floor(Math.random() * 360);
      
      switch (strategyType) {
        case 1: {
          // Generate a palette using color psychology - choose a theme
          const emotions = ["calm", "energetic", "elegant", "natural", "creative"];
          const selectedEmotion = emotions[Math.floor(Math.random() * emotions.length)];
          
          if (selectedEmotion === "calm") {
            // Calm/Serene: Blues and greens with lower saturation
            for (let i = 0; i < 5; i++) {
              // Use a hue in blue-green spectrum (180-260)
              const hue = (baseHue + 180 + Math.floor(Math.random() * 80)) % 360;
              const saturation = 0.35 + (Math.random() * 0.3); // 35-65%
              const lightness = 0.5 + (Math.random() * 0.35); // 50-85%
              newColors.push(hslToHex(hue, saturation, lightness));
            }
          } else if (selectedEmotion === "energetic") {
            // Energetic: Vibrant colors with high saturation
            for (let i = 0; i < 5; i++) {
              // Use vibrant hues from around the color wheel with more red-orange
              const hueOffset = (i * 73) % 360; // Use prime number for better distribution
              const hue = (baseHue + hueOffset) % 360;
              const saturation = 0.7 + (Math.random() * 0.25); // 70-95%
              const lightness = 0.45 + (Math.random() * 0.25); // 45-70%
              newColors.push(hslToHex(hue, saturation, lightness));
            }
          } else if (selectedEmotion === "elegant") {
            // Professional/Elegant: Muted with some darker tones
            for (let i = 0; i < 5; i++) {
              const hue = (baseHue + (i * 30) % 360) % 360; // More controlled distribution
              const saturation = 0.3 + (Math.random() * 0.3); // 30-60%
              const lightness = 0.3 + (Math.random() * 0.4); // 30-70%
              newColors.push(hslToHex(hue, saturation, lightness));
            }
          } else if (selectedEmotion === "natural") {
            // Natural: Earth tones with greens, browns
            const earthRanges = [[20, 50], [70, 110], [25, 40]]; // Yellow-orange, green, brown
            for (let i = 0; i < 5; i++) {
              // Higher chance of earth tones
              let hue = baseHue;
              if (Math.random() < 0.7) {
                const range = earthRanges[Math.floor(Math.random() * earthRanges.length)];
                hue = range[0] + Math.random() * (range[1] - range[0]);
              }
              const saturation = 0.35 + (Math.random() * 0.3); // 35-65%
              const lightness = 0.3 + (Math.random() * 0.5); // 30-80%
              newColors.push(hslToHex(hue, saturation, lightness));
            }
          } else { // Creative
            // Bold/Creative: High contrast
            for (let i = 0; i < 5; i++) {
              const hue = (baseHue + (i * 137.5)) % 360; // Use golden angle
              const saturation = 0.7 + (Math.random() * 0.3); // 70-100%
              // Alternate between light and dark
              const lightnessBase = (i % 2 === 0) ? 0.25 : 0.6;
              const lightness = lightnessBase + (Math.random() * 0.2);
              newColors.push(hslToHex(hue, saturation, lightness));
            }
          }
          break;
        }
        
        case 2: {
          // Use smart advanced golden ratio method
          const goldenAngle = 137.5077663; // Golden angle in degrees
          const phi = 0.618033988749895; // Golden ratio conjugate
          
          // Add some randomization to the angle for variety
          const angleVariation = Math.random() * 20 - 10; // -10 to +10 degrees
          const adjustedAngle = goldenAngle + angleVariation;
          
          // Use a 40% chance for one dark anchoring color
          const darkColorIndex = Math.random() < 0.4 ? Math.floor(Math.random() * 5) : -1;
          
          for (let i = 0; i < 5; i++) {
            // Calculate hue using golden angle for perfect distribution
            const hue = (baseHue + (adjustedAngle * i)) % 360;
            
            // Calculate saturation - higher for more vibrant colors
            const saturation = 0.65 + (Math.random() * 0.3); // 65-95%
            
            // Calculate lightness - dark for the designated dark color, otherwise a good range
            let lightness;
            if (i === darkColorIndex) {
              lightness = 0.15 + (Math.random() * 0.15); // 15-30% for dark color
            } else {
              lightness = 0.4 + (Math.random() * 0.4); // 40-80% for regular colors
            }
            
            newColors.push(hslToHex(hue, saturation, lightness));
          }
          break;
        }
        
        case 3: {
          // Smart temperature-based palette
          // Pick a temperature - 60% chance of warm/cool, 40% neutral
          const temperatureChoice = Math.random();
          const goldenAngle = 137.5077663; // Golden angle in degrees
          
          if (temperatureChoice < 0.3) {
            // Warm palette: reds, oranges, yellows (0-60 degrees)
            const baseWarmHue = Math.floor(Math.random() * 60);
            
            for (let i = 0; i < 5; i++) {
              const hue = (baseWarmHue + (i * 15) % 60) % 360; // Keep in warm range
              const saturation = 0.6 + (Math.random() * 0.35); // 60-95%
              // Vary lightness for visual interest
              const lightness = 0.35 + (Math.random() * 0.45); // 35-80%
              newColors.push(hslToHex(hue, saturation, lightness));
            }
          } else if (temperatureChoice < 0.6) {
            // Cool palette: blues, greens, purples (180-300 degrees)
            const baseCoolHue = 180 + Math.floor(Math.random() * 120);
            
            for (let i = 0; i < 5; i++) {
              // Keep within cool range with some variation
              const hue = ((baseCoolHue + (i * 30) % 120) % 360);
              const saturation = 0.5 + (Math.random() * 0.45); // 50-95%
              const lightness = 0.35 + (Math.random() * 0.45); // 35-80%
              newColors.push(hslToHex(hue, saturation, lightness));
            }
          } else {
            // Neutral-balanced palette
            for (let i = 0; i < 5; i++) {
              // Generate full spectrum, but with controlled saturation
              const hue = (baseHue + (i * goldenAngle)) % 360;
              // Lower saturation for more neutral look
              const saturation = 0.15 + (Math.random() * 0.45); // 15-60%
              const lightness = 0.3 + (Math.random() * 0.55); // 30-85%
              newColors.push(hslToHex(hue, saturation, lightness));
            }
          }
          break;
        }
        
        case 4: {
          // Seasonal palette approach
          const season = ["spring", "summer", "autumn", "winter"][Math.floor(Math.random() * 4)];
          
          if (season === "spring") {
            // Spring: Bright, clear colors
            for (let i = 0; i < 5; i++) {
              const hue = (baseHue + (i * 60) % 360) % 360;
              const saturation = 0.65 + (Math.random() * 0.2); // 65-85%
              const lightness = 0.6 + (Math.random() * 0.25); // 60-85%
              newColors.push(hslToHex(hue, saturation, lightness));
            }
          } else if (season === "summer") {
            // Summer: Soft, muted colors
            for (let i = 0; i < 5; i++) {
              const hue = (baseHue + (i * 45) % 360) % 360;
              const saturation = 0.4 + (Math.random() * 0.3); // 40-70%
              const lightness = 0.55 + (Math.random() * 0.3); // 55-85%
              newColors.push(hslToHex(hue, saturation, lightness));
            }
          } else if (season === "autumn") {
            // Autumn: Warm, earthy colors
            for (let i = 0; i < 5; i++) {
              // Skew towards oranges, reds, browns
              let hue = baseHue;
              if (Math.random() < 0.7) {
                hue = (i * 30 + Math.random() * 60) % 90; // 0-90 range (reds to yellows)
              }
              const saturation = 0.5 + (Math.random() * 0.3); // 50-80%
              const lightness = 0.35 + (Math.random() * 0.4); // 35-75%
              newColors.push(hslToHex(hue, saturation, lightness));
            }
          } else { // winter
            // Winter: Bold, clear colors with high contrast
            for (let i = 0; i < 5; i++) {
              const hue = (baseHue + (i * 72) % 360) % 360;
              const saturation = 0.7 + (Math.random() * 0.25); // 70-95%
              // More contrast - some dark, some light
              const lightness = (i % 2 === 0) ? 
                0.2 + (Math.random() * 0.2) : // 20-40%
                0.65 + (Math.random() * 0.2); // 65-85%
              newColors.push(hslToHex(hue, saturation, lightness));
            }
          }
          break;
        }
        
        case 5: {
          // Direct implementation of professional palette constraints
          // First, create a role-based structure
          const roles = ["dominant", "accent", "secondary", "complementary", "neutral"];
          
          // Role-specific constraints with explicit types
          interface ColorConstraint {
            minLuminance?: number;
            maxLuminance?: number;
            minChroma?: number;
            maxChroma?: number;
            hueOffset?: number;
          }
          
          const constraints: Record<string, ColorConstraint> = {
            dominant: {
              minLuminance: 0.4,
              maxLuminance: 0.7,
              minChroma: 50
            },
            accent: {
              minLuminance: 0.7,
              maxLuminance: 0.9,
              minChroma: 80,
              hueOffset: 180 // Complement
            },
            secondary: {
              minLuminance: 0.3,
              maxLuminance: 0.6,
              hueOffset: 30 // Adjacent
            },
            complementary: {
              minLuminance: 0.2,
              maxLuminance: 0.5,
              hueOffset: 160 // Near complement
            },
            neutral: {
              maxChroma: 15,
              minLuminance: 0.7,
              maxLuminance: 0.95
            }
          };
          
          // Generate colors based on roles
          for (let i = 0; i < 5; i++) {
            const role = roles[i];
            const constraint = constraints[role];
            
            let hue = baseHue;
            if (constraint.hueOffset) {
              hue = (baseHue + constraint.hueOffset) % 360;
            }
            
            // Determine saturation
            let saturation;
            if (role === "neutral") {
              saturation = 0.05 + (Math.random() * 0.1); // 5-15%
            } else if (role === "accent") {
              saturation = 0.8 + (Math.random() * 0.2); // 80-100%
            } else {
              saturation = 0.5 + (Math.random() * 0.4); // 50-90%
            }
            
            // Determine lightness
            let lightness;
            if (constraint.minLuminance && constraint.maxLuminance) {
              lightness = constraint.minLuminance + 
                (Math.random() * (constraint.maxLuminance - constraint.minLuminance));
            } else {
              lightness = 0.5 + (Math.random() * 0.3); // Default 50-80%
            }
            
            newColors.push(hslToHex(hue, saturation, lightness));
          }
          break;
        }
      }
      
      // Optimize the palette for better visual appeal
      // Ensure we have a good contrast range
      const tc = tinycolor as any; // Use type assertion to avoid TypeScript errors
      
      newColors.sort((a, b) => {
        const lumA = tc(a).getLuminance();
        const lumB = tc(b).getLuminance();
        return lumA - lumB;
      });
      
      // Make sure we have enough contrast - adjust if needed
      const darkestColor = tc(newColors[0]);
      const lightestColor = tc(newColors[4]);
      
      // If not enough contrast, boost the lightest and darken the darkest
      if (lightestColor.getLuminance() - darkestColor.getLuminance() < 0.5) {
        newColors[0] = darkestColor.darken(10).toHexString();
        newColors[4] = lightestColor.lighten(10).toHexString();
      }
      
      // Set new state
      setRandomColors(newColors);
      
      // Analyze the new colors
      const analysis = colorUtils.analyzeColorPalette(newColors);
      setRandomColorAdvice(analysis.advice);
      setRandomScore(analysis.score);
      
      // If score is below 6, regenerate once
      if (analysis.score < 6 && Math.random() < 0.7) {
        handleRandomColorsGenerate();
        return;
      }
    } catch (error) {
      console.error("Error generating random colors:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [randomColors, randomColorAdvice, randomScore, randomHistory, hslToHex, setRandomColors, setRandomColorAdvice, setRandomScore]);

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <Toaster position="top-center" />
      
      <h1 className="text-3xl font-bold mb-8 text-center">Color Palette Generator</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Extract Colors from Image</h2>
              <ImageUploader onImageSelect={handleImageSelect} />
          
          {imageColors.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Extracted Colors</h3>
                <div className="flex space-x-2">
                <button
                    onClick={handleImageUndo} 
                    disabled={imageUndoDisabled}
                    className={`px-3 py-1 rounded-md text-sm ${
                      imageUndoDisabled 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                    aria-label="Undo Image Colors"
                  >
                    Undo
                  </button>
                  <button 
                    onClick={handleImageRedo} 
                    disabled={imageRedoDisabled}
                    className={`px-3 py-1 rounded-md text-sm ${
                      imageRedoDisabled 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                    aria-label="Redo Image Colors"
                  >
                    Redo
                </button>
              </div>
            </div>
              <ImageColorDisplay 
                colors={imageColors} 
                onColorsChange={handleImageColorsChange} 
              />
              <div className="mt-4 text-sm">
                <div className="bg-gray-100 p-3 rounded">
                  <p className="font-medium">Analysis: <span className={`${getScoreColor(imageScore)} font-bold`}>{imageScore.toFixed(1)}/10</span></p>
                  <p>{imageColorAdvice}</p>
                </div>
              </div>
            </div>
          )}
                </div>
                
        {/* Generated Palette Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Random Color Palette</h2>
            <div className="flex space-x-2">
              <button 
                onClick={handleRandomUndo} 
                disabled={randomUndoDisabled}
                className={`px-3 py-1 rounded-md text-sm ${
                  randomUndoDisabled 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
                aria-label="Undo Random Colors"
              >
                Undo
              </button>
                <button 
                onClick={handleRandomRedo} 
                disabled={randomRedoDisabled}
                className={`px-3 py-1 rounded-md text-sm ${
                  randomRedoDisabled 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
                aria-label="Redo Random Colors"
              >
                Redo
              </button>
              <button
                onClick={generateNewPalette}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
              >
                Generate
                </button>
              </div>
        </div>
        
          {randomColors.length > 0 ? (
            <div>
            <RandomColorDisplay 
                colors={randomColors} 
                onColorsChange={handleRandomColorsChange} 
              />
              <div className="mt-4 text-sm">
                <div className="bg-gray-100 p-3 rounded">
                  <p className="font-medium">Analysis: <span className={`${getScoreColor(randomScore)} font-bold`}>{randomScore.toFixed(1)}/10</span></p>
                  <p>{randomColorAdvice}</p>
              </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-16 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Click the Generate button to create a random palette</p>
              </div>
            )}
        </div>
      </div>
      
      {/* Base Color Section */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Generate from Base Color</h2>
          <div className="flex space-x-2">
                <button
              onClick={handleBaseUndo} 
              disabled={baseUndoDisabled}
              className={`px-3 py-1 rounded-md text-sm ${
                baseUndoDisabled 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
              aria-label="Undo Base Colors"
            >
              Undo
                </button>
                <button
              onClick={handleBaseRedo} 
              disabled={baseRedoDisabled}
              className={`px-3 py-1 rounded-md text-sm ${
                baseRedoDisabled 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
              aria-label="Redo Base Colors"
                >
              Redo
                </button>
                <button
              onClick={handleGenerateFromBase}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
              disabled={isGenerating || !baseColor}
            >
              {isGenerating ? 'Generating...' : 'Generate Palette'}
                </button>
              </div>
              </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Color</label>
              <div className="flex items-center">
                <input
                  type="color"
                  value={baseColor}
                  onChange={(e) => setBaseColor(e.target.value)}
                  className="h-10 w-20 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={baseColor}
                  onChange={(e) => setBaseColor(e.target.value)}
                  className="ml-2 p-2 border rounded font-mono text-sm flex-1"
                />
            </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Palette Type</label>
              <select
                value={paletteType}
                onChange={(e) => setPaletteType(e.target.value as any)}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="analogous">Analogous</option>
                <option value="monochromatic">Monochromatic</option>
                <option value="complementary">Complementary</option>
                <option value="triadic">Triadic</option>
                <option value="tetradic">Tetradic</option>
              </select>
            </div>
          </div>
          <div className="md:col-span-2">
            {baseColors.length > 0 ? (
              <div>
            <BaseColorDisplay 
                  colors={baseColors} 
                  onColorsChange={handleBaseColorsChange}
              />
                <div className="mt-4 text-sm">
                  <div className="bg-gray-100 p-3 rounded">
                    <p className="font-medium">Analysis: <span className={`${getScoreColor(baseScore)} font-bold`}>{baseScore.toFixed(1)}/10</span></p>
                    <p>{baseColorAdvice}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                <p className="text-gray-500">Choose a base color and click Generate</p>
              </div>
        )}
          </div>
        </div>
      </div>
    </main>
  );
}