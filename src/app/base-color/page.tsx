'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiChevronDown } from 'react-icons/fi';
import { HexColorPicker } from 'react-colorful';
import { Toaster, toast } from 'react-hot-toast';
import tinycolor from 'tinycolor2';
import { generateColorPalette } from '@/lib/utils/generateColors';
import { analyzeColorPalette } from '@/lib/utils/colorAnalysisNew';
import ColorDisplay from '@/components/ColorPalette/ColorDisplay';

// Custom hook for managing history state with undo/redo functionality
function useHistoryState<T>(initialState: T) {
  // History array and current position
  const [history, setHistory] = useState<T[]>([]);
  const [position, setPosition] = useState<number>(-1);
  
  // Computed current value - the value at the current position or initial state if no history
  const current = position >= 0 && position < history.length 
    ? history[position] 
    : initialState;
  
  // Computed states for button disabling
  const undoDisabled = position <= 0;
  const redoDisabled = position >= history.length - 1;
  
  // Initialize history with the first state if needed
  const initializeHistory = useCallback((state: T) => {
    if (history.length === 0) {
      setHistory([state]);
      setPosition(0);
    }
  }, [history.length]);
  
  // Add a new state to history
  const addToHistory = useCallback((state: T) => {
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
  const getStateAt = useCallback((pos: number) => {
    if (pos >= 0 && pos < history.length) {
      return history[pos];
    }
    return null;
  }, [history]);
  
  return {
    value: current,
    addToHistory,
    initializeHistory,
    undo,
    redo,
    undoDisabled,
    redoDisabled,
    history,
    position,
    getStateAt
  };
}

// Function to get color for the score display
const getScoreColor = (score: number): string => {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-blue-500';
  if (score >= 4) return 'text-yellow-500';
  return 'text-red-500';
};

// Helper function to check if two color arrays are equal
const arraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

export default function BaseColorPage() {
  // State for base color
  const [baseColor, setBaseColor] = useState<string>('#1d4ed8');
  const [baseColors, setBaseColors] = useState<string[]>([]);
  const [baseColorAdvice, setBaseColorAdvice] = useState<string>('');
  const [baseScore, setBaseScore] = useState<number>(0);
  const [isFirstGeneration, setIsFirstGeneration] = useState<boolean>(true);
  const [paletteType, setPaletteType] = useState<string>('analogous');
  
  // History for base color
  const baseHistory = useHistoryState<{
    colors: string[],
    advice: string,
    score: number
  }>({
    colors: [],
    advice: '',
    score: 0
  });
  
  // Handle palette type selection
  const handlePaletteTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setPaletteType(event.target.value);
  };
  
  // Generate colors based on base color
  function handleGenerateFromBase() {
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
      
      // Use our improved Adobe-style algorithm from utils/generateColors.ts
      const generatedPalette = generateColorPalette(baseColor, {
        numColors: 5,
        paletteType: paletteType as 'monochromatic' | 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'splitComplementary',
        enforceMinContrast: true,
        useAdobeAlgorithm: true, // Enable Adobe-style algorithm by default
        seed: Date.now() + Math.random() // Add random seed to ensure different results each time
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
      const analysis = analyzeColorPalette(generatedColors);
      setBaseColorAdvice(analysis.advice);
      setBaseScore(analysis.score);
    } catch (error) {
      console.error("Error generating palette from base color:", error);
    }
  }
  
  // Generate new palette when base color or palette type changes
  useEffect(() => {
    if (baseColor) {
      handleGenerateFromBase();
    }
  }, [baseColor, paletteType]);
  
  // Handle base colors change (when edited or reordered)
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
      console.error("Error changing base colors:", error);
    }
  }, [baseColors, baseColorAdvice, baseScore, baseColor, baseHistory]);
  
  // Function to handle color click - copy to clipboard
  const handleColorClick = (color: string) => {
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
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      
      {/* Header/Nav */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="ml-4 text-xl font-semibold text-gray-900">Based on Color</h1>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Side - Color Picker and Controls */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Choose Base Color</h2>
            
            {/* Color Picker */}
            <div className="mb-6">
              <HexColorPicker color={baseColor} onChange={setBaseColor} />
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hex Color
                </label>
                <input
                  type="text"
                  value={baseColor}
                  onChange={(e) => setBaseColor(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            {/* Palette Type Selector */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Palette Type
              </label>
              <div className="relative">
                <select
                  value={paletteType}
                  onChange={handlePaletteTypeChange}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                >
                  <option value="analogous">Analogous</option>
                  <option value="monochromatic">Monochromatic</option>
                  <option value="complementary">Complementary</option>
                  <option value="triadic">Triadic</option>
                  <option value="tetradic">Tetradic</option>
                  <option value="splitComplementary">Split Complementary</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <FiChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>
            
            {/* History Controls */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleUndo}
                  disabled={baseHistory.undoDisabled}
                  className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${baseHistory.undoDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Undo
                </button>
                <button
                  onClick={handleRedo}
                  disabled={baseHistory.redoDisabled}
                  className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${baseHistory.redoDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Redo
                </button>
              </div>
            </div>
          </div>
          
          {/* Right Side - Color Display */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Color Palette</h2>
            
            <ColorDisplay colors={baseColors} />
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Advice
              </label>
              <p className="text-base text-gray-500">{baseColorAdvice}</p>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score
              </label>
              <p className={getScoreColor(baseScore)}>{baseScore}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}