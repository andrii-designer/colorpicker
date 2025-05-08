'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiChevronDown } from 'react-icons/fi';
import { HexColorPicker } from 'react-colorful';
import { Toaster, toast } from 'react-hot-toast';
import tinycolor from 'tinycolor2';
import { generateColorPalette, analyzeColorPalette, PaletteOptions } from '@/lib/utils';
import ColorDisplay from '@/components/ColorPalette/ColorDisplay';

// Custom hook for managing history state with undo/redo functionality
function useHistoryState(initialState {
  // History array and current position
  const [history, setHistory] = useState([]);
  const [position, setPosition] = useState(-1);
  
  // Computed current value - the value at the current position or initial state if no history
  const current = position >= 0 && position < history.length 
    ? history[position] 
    : initialState;
  
  // Computed states for button disabling
  const undoDisabled = position <= 0;
  const redoDisabled = position >= history.length - 1;
  
  // Initialize history with the first state if needed
  const initializeHistory = useCallback((state=> {
    if (history.length === 0) {
      setHistory([state]);
      setPosition(0);
    }
  }, [history.length]);
  
  // Add a new state to history
  const addToHistory = useCallback((state=> {
    // If this is the very first state, just initialize
    if (history.length === 0) {
      setHistory([state]);
      setPosition(0);
      return;
    }
    
    // Create new history by truncating anything after current position
    // and adding the new state
    const newHistory = [
      ...history.slice(0, position + 1),
      state
    ];
    
    setHistory(newHistory);
    setPosition(newHistory.length - 1);
  }, [history, position]);
  
  // Undo operation - just update the position
  const undo = useCallback(() => {
    if (position > 0) {
      setPosition(position - 1);
    }
  }, [position]);
  
  // Redo operation - just update the position
  const redo = useCallback(() => {
    if (position < history.length - 1) {
      setPosition(position + 1);
    }
  }, [position, history.length]);
  
  // Get state at a specific position safely
  const getStateAt = useCallback((pos=> {
    if (pos >= 0 && pos < history.length) {
      return history[pos];
    }
    return null;
  }, [history]);
  
  return {
    value };
}

// Function to get color for the score display
const getScoreColor = (score)=> {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-blue-500';
  if (score >= 4) return 'text-yellow-500';
  return 'text-red-500';
};

// Helper function to check if two color arrays are equal
const arraysEqual = (a b=> {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

export default function BaseColorPage() {
  // State for base color
  const [baseColor, setBaseColor] = useState('#1d4ed8');
  const [baseColors, setBaseColors] = useState([]);
  const [baseColorAdvice, setBaseColorAdvice] = useState('');
  const [baseScore, setBaseScore] = useState(0);
  const [isFirstGeneration, setIsFirstGeneration] = useState(true);
  const [paletteType, setPaletteType] = useState('analogous');
  
  // History for base color
  const baseHistory = useHistoryState<{
    colors advice score }>({
    colors advice score });
  
  // Handle palette type selection
  const handlePaletteTypeChange = (event=> {
    setPaletteType(event.target.value);
  };
  
  // Generate colors based on base color
  function handleGenerateFromBase() {
    try {
      if (!baseColor) return;
    
      // Save current state if we have colors
      if (baseColors.length > 0) {
        const currentState = {
          colors advice score };
        baseHistory.addToHistory(currentState);
        
        // After first generation, all subsequent generations are variations
        setIsFirstGeneration(false);
      } else {
        // First time generating, mark that the next generation should be a variation
        setIsFirstGeneration(false);
      }
      
      // Options for color palette generation
      const options= {
        paletteType enforceMinContrast useAdobeAlgorithm seed + Math.random()
      };
      
      // Use our improved Adobe-style algorithm from utils/generateColors.ts
      const generatedPalette = generateColorPalette(baseColor, options);
      
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
      const analysis = analyzeColorPalette(generatedColors);
      setBaseColorAdvice(analysis.advice);
      setBaseScore(analysis.score);
    } catch (error) {
      console.error("Error generating palette from base color);
    }
  }
  
  // Generate new palette when base color or palette type changes
  useEffect(() => {
    if (baseColor) {
      handleGenerateFromBase();
    }
  }, [baseColor, paletteType]);
  
  // Handle base colors change (when edited or reordered)
  const handleBaseColorsChange = useCallback((newColors=> {
    try {
      // Skip if nothing changed
      if (arraysEqual(baseColors, newColors)) return;
      
      // Create new state with the current values before updating
      const currentState = {
        colors advice score };
      
      // Add current state to history
      baseHistory.addToHistory(currentState);
      
      // Update the base color if the first color has changed
      if (newColors.length > 0 && newColors[0] !== baseColor) {
        setBaseColor(newColors[0]);
      }
      
      // Update with new colors
      setBaseColors(newColors);
      
      // Analyze the new colors
      const analysis = analyzeColorPalette(newColors);
      setBaseColorAdvice(analysis.advice);
      setBaseScore(analysis.score);
    } catch (error) {
      console.error("Error changing base colors);
    }
  }, [baseColors, baseColorAdvice, baseScore, baseColor, baseHistory]);
  
  // Function to handle color click - copy to clipboard
  const handleColorClick = (color=> {
    navigator.clipboard.writeText(color);
    toast.success(`Copied ${color.toUpperCase()} to clipboard`);
  };
  
  // Handle undo action for base colors
  const handleUndo = useCallback(() => {
    if (baseHistory.undoDisabled) return;
    
    // First perform the undo operation to change position
    baseHistory.undo();
    
    // Then get the state at the new position
    const currentState = baseHistory.value;
    
    // Update UI with this state
    if (currentState) {
      setBaseColors(currentState.colors);
      setBaseColorAdvice(currentState.advice);
      setBaseScore(currentState.score);
    }
  }, [baseHistory]);
  
  // Handle redo action for base colors
  const handleRedo = useCallback(() => {
    if (baseHistory.redoDisabled) return;
    
    // First perform the redo operation to change position
    baseHistory.redo();
    
    // Then get the state at the new position
    const currentState = baseHistory.value;
    
    // Update UI with this state
    if (currentState) {
      setBaseColors(currentState.colors);
      setBaseColorAdvice(currentState.advice);
      setBaseScore(currentState.score);
    }
  }, [baseHistory]);

  return (
    <main className="p-4 sm:p-8 flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <Toaster position="top-center" />
      
      {/* Header with navigation */}
      <header className="flex items-center mb-6">
        <Link href="/" className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition">
          <FiArrowLeft className="mr-2" />
          Back to Home</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold ml-auto text-center text-gray-900 dark:text-white">
          Base Color Palette Generator
        </h1>
        <div className="ml-auto">
          {/* Placeholder to keep title centered */}
          <div className="w-[88px]"></div>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 flex-grow">
        {/* Left side - Controls and stats */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 flex flex-col">
          {/* Color picker section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Pick Base Color</h2>
            <div className="flex flex-col items-center">
              <HexColorPicker color={baseColor} onChange={setBaseColor} className="mb-4 w-full" />
              <div className="flex items-center gap-2 w-full">
                <div 
                  className="w-8 h-8 rounded-md border border-gray-300 dark:border-gray-600" 
                  style={{ backgroundColor }}
                ></div>
                <input 
                  type="text" 
                  value={baseColor} 
                  onChange={(e) => setBaseColor(e.target.value)} 
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
          
          {/* Palette type */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Palette Type</h2>
            <div className="relative">
              <select
                value={paletteType}
                onChange={handlePaletteTypeChange}
                className="appearance-none w-full p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="monochromatic">Monochromatic</option>
                <option value="analogous">Analogous</option>
                <option value="complementary">Complementary</option>
                <option value="triadic">Triadic</option>
                <option value="tetradic">Tetradic</option>
                <option value="splitComplementary">Split Complementary</option>
              </select>
              <FiChevronDown className="absolute right-3 top-3.5 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
          
          {/* Actions */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Actions</h2>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleGenerateFromBase}
                className="w-full p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition font-medium"
              >
                {isFirstGeneration ? "Generate Palette"  Variation"}
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={handleUndo}
                  disabled={baseHistory.undoDisabled}
                  className={`flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-md font-medium
                    ${baseHistory.undoDisabled 
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                      : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                  Undo
                </button>
                <button
                  onClick={handleRedo}
                  disabled={baseHistory.redoDisabled}
                  className={`flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-md font-medium
                    ${baseHistory.redoDisabled 
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                      : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                  Redo
                </button>
              </div>
            </div>
          </div>
          
          {/* Palette statistics */}) {baseScore > 0 && (
            <div className="mt-auto">
              <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Palette Analysis</h2>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 dark:text-gray-300">Harmony Score</span>
                  <span className={`font-semibold ${getScoreColor(baseScore)}`}>
                    {baseScore.toFixed(1)}/10
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{baseColorAdvice}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Right side - Color Palette Display */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 flex flex-col">
          <h2 className="text-lg font-semibold mb-6 text-gray-800 dark:text-gray-100">Your Color Palette</h2>
          
          {baseColors.length > 0 ? (
            <ColorDisplay 
              colors={baseColors}
              onColorsChange={handleBaseColorsChange}
              onColorClick={handleColorClick}
              showControls={true}
              showColorNames={true}
              showAccessibility={true}
              enableReordering={true}
              enableEditing={true}
              compactView={false}
            />
          ) ="flex-grow flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400 text-center">
                Pick a base color and generate a palette to see it here.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}