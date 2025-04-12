'use client';

import { useState, useEffect, useRef } from 'react';
import * as colorUtils from '@/lib/utils';
import type { Color } from '@/lib/utils/generateColors';
import { ACCURATE_COLOR_DATA } from '@/lib/utils/fixedAccurateColorData';

export default function ColorGenerator() {
  const [baseColor, setBaseColor] = useState('#FF0000');
  const [firstColor, setFirstColor] = useState('');
  const [randomSection, setRandomSection] = useState('yes');
  const [numColors, setNumColors] = useState(5);
  const [useNamedColors, setUseNamedColors] = useState(true);
  const [namedColorRatio, setNamedColorRatio] = useState(0.3);
  const [paletteType, setPaletteType] = useState<'monochromatic' | 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'splitComplementary'>('analogous');
  const [palette, setPalette] = useState<Color[]>([]);
  const [totalColors, setTotalColors] = useState(0);
  const [enforceMinContrast, setEnforceMinContrast] = useState(true);
  const [analysisScore, setAnalysisScore] = useState<number | null>(null);
  const [analysisMessage, setAnalysisMessage] = useState<string>('');
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null);
  const [lockedColors, setLockedColors] = useState<number[]>([]);
  
  // Set up undo/redo functionality
  const [history, setHistory] = useState<Color[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Add temperature state and update component
  const [temperature, setTemperature] = useState<'warm' | 'cool' | 'neutral'>('neutral');
  
  // Calculate the contrast between two colors
  const calculateContrast = (color1: string, color2: string): number => {
    // Helper to convert hex to RGB
    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      return { r, g, b };
    };
    
    // Calculate relative luminance
    const getLuminance = (rgb: { r: number, g: number, b: number }) => {
      const sRGB = [rgb.r, rgb.g, rgb.b].map(val => {
        return val <= 0.03928
          ? val / 12.92
          : Math.pow((val + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    };
    
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    const l1 = getLuminance(rgb1);
    const l2 = getLuminance(rgb2);
    
    const brightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  };
  
  // For palette analysis
  const analyzeColorPalette = (colors: string[]) => {
    if (colors.length < 2) return { score: 0, message: '' };
    
    // Calculate contrasts between adjacent colors
    let totalContrast = 0;
    let lowContrastPairs = 0;
    
    for (let i = 0; i < colors.length - 1; i++) {
      const contrast = calculateContrast(colors[i], colors[i + 1]);
      totalContrast += contrast;
      
      if (contrast < 3.0) {
        lowContrastPairs++;
      }
    }
    
    const avgContrast = totalContrast / (colors.length - 1);
    
    // Calculate hue distribution
    const hexToHue = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      
      if (max === min) return 0;
      
      let h = 0;
      if (max === r) {
        h = (g - b) / (max - min);
      } else if (max === g) {
        h = 2 + (b - r) / (max - min);
      } else {
        h = 4 + (r - g) / (max - min);
      }
      
      h *= 60;
      if (h < 0) h += 360;
      
      return h;
    };
    
    const hues = colors.map(hexToHue);
    
    // Measure how well-distributed the hues are
    let hueDistribution = 10;
    for (let i = 0; i < hues.length; i++) {
      for (let j = i + 1; j < hues.length; j++) {
        const hueDiff = Math.min(
          Math.abs(hues[i] - hues[j]),
          360 - Math.abs(hues[i] - hues[j])
        );
        
        // Penalize hues that are too close (unless monochromatic)
        if (paletteType !== 'monochromatic' && hueDiff < 30) {
          hueDistribution -= 1;
        }
      }
    }
    
    // Calculate final score
    let score = 7.5; // Base score
    
    // Adjust based on contrast
    if (avgContrast > 4.5) score += 1.0;
    else if (avgContrast > 3.0) score += 0.5;
    else score -= 0.5;
    
    // Penalize for low contrast pairs
    score -= lowContrastPairs * 0.5;
    
    // Adjust for hue distribution
    score += Math.max(-1.5, Math.min(1.5, (hueDistribution - 7) * 0.3));
    
    // Clamp final score
    score = Math.max(5.0, Math.min(10.0, score));
    
    // Generate message
    let message = '';
    if (score >= 9.0) {
      message = 'Excellent color palette with exceptional harmony and contrast.';
    } else if (score >= 8.0) {
      message = 'Great color combination with strong harmony and good contrast.';
    } else if (score >= 7.0) {
      message = 'Good color palette. The contrast and harmony are well-balanced.';
    } else {
      message = 'This palette could be improved. Consider adjusting contrast and hue spacing.';
    }
    
    return { 
      score: parseFloat(score.toFixed(1)), 
      message 
    };
  };

  useEffect(() => {
    setTotalColors(ACCURATE_COLOR_DATA.length);
    generatePalette();
  }, []);

  const addToHistory = (newPalette: Color[]) => {
    // Remove any forward history if we're in the middle of the history stack
    const newHistory = history.slice(0, historyIndex + 1);
    
    // Add the new palette to history
    newHistory.push(newPalette);
    
    // Update history state and index
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const generatePalette = () => {
    // Occasionally use a completely random base color for more variety
    const shouldUseRandomColor = Math.random() < 0.6; // 60% chance of using a random color
    
    const randomizedBaseColor = (() => {
      if (shouldUseRandomColor) {
        // Generate a completely random color
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      } else if (/^#([0-9A-F]{3}){1,2}$/i.test(baseColor)) {
        // Parse the current base color into R, G, B
        const r = parseInt(baseColor.slice(1, 3), 16);
        const g = parseInt(baseColor.slice(3, 5), 16);
        const b = parseInt(baseColor.slice(5, 7), 16);
        
        // Add more significant random variation (±25)
        const newR = Math.max(0, Math.min(255, r + Math.floor(Math.random() * 51) - 25));
        const newG = Math.max(0, Math.min(255, g + Math.floor(Math.random() * 51) - 25));
        const newB = Math.max(0, Math.min(255, b + Math.floor(Math.random() * 51) - 25));
        
        // Convert back to hex
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
      }
      return baseColor;
    })();

    // Randomize color scheme type for more variety
    const randomPaletteType = (() => {
      if (Math.random() < 0.4) { // 40% chance to randomize palette type
        const types = ['monochromatic', 'complementary', 'analogous', 'triadic', 'tetradic', 'splitComplementary'] as const;
        return types[Math.floor(Math.random() * types.length)];
      }
      return paletteType;
    })();

    const newPalette = colorUtils.generateColorPalette(randomizedBaseColor, {
      numColors,
      useNamedColors,
      namedColorRatio,
      paletteType: randomPaletteType,
      colorData: ACCURATE_COLOR_DATA,
      enforceMinContrast,
      temperature
    });
    
    // Update state
    setPalette(newPalette);
    setFirstColor(newPalette[0]?.hex || '');
    setSelectedColorIndex(null);
    setLockedColors([]); // Reset locked colors when generating a new palette
    
    // Add to history
    addToHistory(newPalette);
    
    // Check if we have evaluation metrics
    if (newPalette[0] && (newPalette[0] as any).evaluation) {
      setAnalysisScore((newPalette[0] as any).evaluation.totalScore);
      
      // Generate message based on score
      let message = '';
      const score = (newPalette[0] as any).evaluation.totalScore;
      
      if (score >= 9.0) {
        message = 'Excellent color palette with exceptional harmony and contrast.';
      } else if (score >= 8.0) {
        message = 'Great color combination with strong harmony and good contrast.';
      } else if (score >= 7.0) {
        message = 'Good color palette. The contrast and harmony are well-balanced.';
      } else {
        message = 'This palette could be improved. Consider adjusting contrast and hue spacing.';
      }
      
      setAnalysisMessage(message);
    } else {
      // Use the original analysis function as fallback
      const colors = newPalette.map(c => c.hex);
      const { score, message } = analyzeColorPalette(colors);
      setAnalysisScore(score);
      setAnalysisMessage(message);
    }
  };
  
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPalette(history[historyIndex - 1]);
      setSelectedColorIndex(null);
    }
  };
  
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPalette(history[historyIndex + 1]);
      setSelectedColorIndex(null);
    }
  };
  
  // Function to copy color to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Could add toast notification here
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };
  
  // Function to handle drag and drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('index', index.toString());
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('index'));
    
    if (sourceIndex === targetIndex) return;
    
    // Create a new palette with the reordered colors
    const newPalette = [...palette];
    const [movedColor] = newPalette.splice(sourceIndex, 1);
    newPalette.splice(targetIndex, 0, movedColor);
    
    // Update state and history
    setPalette(newPalette);
    setSelectedColorIndex(null);
    addToHistory(newPalette);
    
    // Reanalyze after reordering
    const colors = newPalette.map(c => c.hex);
    const { score, message } = analyzeColorPalette(colors);
    setAnalysisScore(score);
    setAnalysisMessage(message);
  };
  
  // Handle color selection for details view
  const handleColorSelect = (index: number) => {
    setSelectedColorIndex(selectedColorIndex === index ? null : index);
  };

  // Add a toggle lock color function
  const toggleLockColor = (index: number) => {
    setLockedColors(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  // Add a regenerate with locked colors function
  const regeneratePaletteWithLocks = () => {
    if (palette.length === 0) {
      generatePalette();
      return;
    }

    // Apply similar randomization to the base color for locked regeneration
    const randomizedBaseColor = (() => {
      // Find a non-locked color to use as base, or use the first color
      let baseColorHex = palette[0].hex;
      for (let i = 0; i < palette.length; i++) {
        if (!lockedColors.includes(i)) {
          baseColorHex = palette[i].hex;
          break;
        }
      }
      
      // Parse the base color
      const r = parseInt(baseColorHex.slice(1, 3), 16);
      const g = parseInt(baseColorHex.slice(3, 5), 16);
      const b = parseInt(baseColorHex.slice(5, 7), 16);
      
      // Add random variation (±10)
      const newR = Math.max(0, Math.min(255, r + Math.floor(Math.random() * 21) - 10));
      const newG = Math.max(0, Math.min(255, g + Math.floor(Math.random() * 21) - 10));
      const newB = Math.max(0, Math.min(255, b + Math.floor(Math.random() * 21) - 10));
      
      // Convert back to hex
      return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    })();

    const newPalette = colorUtils.regenerateWithLockedColors(palette, lockedColors, {
      numColors,
      useNamedColors,
      namedColorRatio,
      paletteType,
      colorData: ACCURATE_COLOR_DATA,
      enforceMinContrast,
      temperature
    });
    
    // Update state
    setPalette(newPalette);
    setFirstColor(newPalette[0]?.hex || '');
    setSelectedColorIndex(null);
    
    // Add to history
    addToHistory(newPalette);
    
    // Check if we have evaluation metrics
    if (newPalette[0] && (newPalette[0] as any).evaluation) {
      setAnalysisScore((newPalette[0] as any).evaluation.totalScore);
      
      // Generate message based on score
      let message = '';
      const score = (newPalette[0] as any).evaluation.totalScore;
      
      if (score >= 9.0) {
        message = 'Excellent color palette with exceptional harmony and contrast.';
      } else if (score >= 8.0) {
        message = 'Great color combination with strong harmony and good contrast.';
      } else if (score >= 7.0) {
        message = 'Good color palette. The contrast and harmony are well-balanced.';
      } else {
        message = 'This palette could be improved. Consider adjusting contrast and hue spacing.';
      }
      
      setAnalysisMessage(message);
    } else {
      // Use the original analysis function as fallback
      const colors = newPalette.map(c => c.hex);
      const { score, message } = analyzeColorPalette(colors);
      setAnalysisScore(score);
      setAnalysisMessage(message);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Professional Color Palette Generator</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Existing configuration options... */}
          
          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Color
            </label>
            <input
              type="color"
              value={baseColor}
              onChange={(e) => setBaseColor(e.target.value)}
              className="h-10 w-full rounded border border-gray-300"
            />
          </div>
          
          {/* Number of colors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Colors: {numColors}
            </label>
            <input
              type="range"
              min="3"
              max="9"
              value={numColors}
              onChange={(e) => setNumColors(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          
          {/* Palette type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Palette Type
            </label>
            <select
              value={paletteType}
              onChange={(e) => setPaletteType(e.target.value as any)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
            >
              <option value="monochromatic">Monochromatic</option>
              <option value="analogous">Analogous</option>
              <option value="complementary">Complementary</option>
              <option value="triadic">Triadic</option>
              <option value="tetradic">Tetradic</option>
              <option value="splitComplementary">Split Complementary</option>
            </select>
          </div>
          
          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temperature
            </label>
            <select
              value={temperature}
              onChange={(e) => setTemperature(e.target.value as any)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
            >
              <option value="neutral">Neutral</option>
              <option value="warm">Warm</option>
              <option value="cool">Cool</option>
            </select>
          </div>
          
          {/* Use named colors */}
          <div className="flex items-center">
            <input
              id="use-named-colors"
              type="checkbox"
              checked={useNamedColors}
              onChange={(e) => setUseNamedColors(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="use-named-colors" className="ml-2 block text-sm text-gray-700">
              Use Named Colors
            </label>
          </div>
          
          {/* Enforce minimum contrast */}
          <div className="flex items-center">
            <input
              id="enforce-min-contrast"
              type="checkbox"
              checked={enforceMinContrast}
              onChange={(e) => setEnforceMinContrast(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="enforce-min-contrast" className="ml-2 block text-sm text-gray-700">
              Enforce Minimum Contrast
            </label>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Generated Palette</h2>
        <p className="text-sm text-gray-600 mb-2">Click on a color to select it. Double-click to lock/unlock it.</p>
        
        <div className="flex flex-wrap gap-3 mb-4">
          {palette.map((color, index) => (
            <div 
              key={index}
              className={`relative w-24 h-24 rounded cursor-pointer transition-transform transform ${selectedColorIndex === index ? 'scale-110 ring-2 ring-blue-500' : ''}`}
              style={{ backgroundColor: color.hex }}
              onClick={() => handleColorSelect(index)}
              onDoubleClick={() => toggleLockColor(index)}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              {lockedColors.includes(index) && (
                <div className="absolute top-1 right-1 bg-white rounded-full p-1 shadow">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              )}
              
              <div className="absolute bottom-1 left-1 right-1 bg-white/80 rounded px-1 py-0.5 text-xs font-mono">
                {color.hex.toUpperCase()}
              </div>
              
              {color.name && (
                <div className="absolute bottom-6 left-1 right-1 bg-white/80 rounded px-1 py-0.5 text-xs truncate">
                  {color.name}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={generatePalette}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Generate New Palette
          </button>
          
          <button
            onClick={regeneratePaletteWithLocks}
            className={`px-4 py-2 rounded transition ${lockedColors.length > 0 ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            disabled={lockedColors.length === 0}
          >
            Regenerate With Locks
          </button>
          
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className={`px-4 py-2 rounded transition ${historyIndex > 0 ? 'bg-gray-700 text-white hover:bg-gray-800' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            Undo
          </button>
          
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className={`px-4 py-2 rounded transition ${historyIndex < history.length - 1 ? 'bg-gray-700 text-white hover:bg-gray-800' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            Redo
          </button>
        </div>
        
        {/* Analysis score section */}
        {analysisScore !== null && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium">Palette Score:</h3>
              <div className="font-bold text-lg">{analysisScore}/10</div>
            </div>
            <p className="text-sm text-gray-700">{analysisMessage}</p>
          </div>
        )}
      </div>
      
      {/* Selected color details */}
      {selectedColorIndex !== null && selectedColorIndex < palette.length && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Selected Color Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="h-32 rounded-md shadow-sm" style={{ backgroundColor: palette[selectedColorIndex].hex }}></div>
            </div>
            <div>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">HEX:</span>
                  <div className="flex items-center">
                    <span className="font-mono">{palette[selectedColorIndex].hex.toUpperCase()}</span>
                    <button 
                      onClick={() => copyToClipboard(palette[selectedColorIndex].hex)}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div>
                  <span className="text-sm text-gray-500">RGB:</span>
                  <div className="flex items-center">
                    <span className="font-mono">
                      rgb({palette[selectedColorIndex].rgb.r}, {palette[selectedColorIndex].rgb.g}, {palette[selectedColorIndex].rgb.b})
                    </span>
                    <button 
                      onClick={() => copyToClipboard(`rgb(${palette[selectedColorIndex].rgb.r}, ${palette[selectedColorIndex].rgb.g}, ${palette[selectedColorIndex].rgb.b})`)}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div>
                  <span className="text-sm text-gray-500">HSL:</span>
                  <div className="flex items-center">
                    <span className="font-mono">
                      hsl({palette[selectedColorIndex].hsl.h}°, {palette[selectedColorIndex].hsl.s}%, {palette[selectedColorIndex].hsl.l}%)
                    </span>
                    <button 
                      onClick={() => copyToClipboard(`hsl(${palette[selectedColorIndex].hsl.h}, ${palette[selectedColorIndex].hsl.s}%, ${palette[selectedColorIndex].hsl.l}%)`)}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {palette[selectedColorIndex].name && (
                  <div>
                    <span className="text-sm text-gray-500">Name:</span>
                    <div className="font-medium">{palette[selectedColorIndex].name}</div>
                  </div>
                )}
                
                <div className="mt-2">
                  <button 
                    onClick={() => toggleLockColor(selectedColorIndex)}
                    className={`px-3 py-1 rounded-md text-sm flex items-center gap-1 ${
                      lockedColors.includes(selectedColorIndex) 
                        ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' 
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {lockedColors.includes(selectedColorIndex) ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                        Unlock Color
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Lock Color
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 