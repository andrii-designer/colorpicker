'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiImage } from 'react-icons/fi';
import { Toaster, toast } from 'react-hot-toast';
import tinycolor from 'tinycolor2';
import ImageUploader from '@/components/ColorPalette/ImageUploader';
import { extractEnhancedColorsFromImage } from '@/lib/utils/imageColorExtraction';
import { analyzeColorPalette } from '@/lib/utils/colorAnalysisNew';
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

export default function FromImagePage() {
  // State for image colors
  const [imageColors, setImageColors] = useState([]);
  const [imageColorAdvice, setImageColorAdvice] = useState('');
  const [imageScore, setImageScore] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  
  // History for image colors
  const imageHistory = useHistoryState<{
    colors advice score imageUrl }>({
    colors advice score imageUrl });
  
  // Handle image selection and color extraction
  const handleImageSelect = useCallback(async (imageData=> {
    try {
      setImageUrl(imageData);
      
      // Create an HTMLImageElement from the image data string
      const img = new Image();
      img.src = imageData;
      
      // Wait for the image to load before extracting colors
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      // Extract colors from the image using the loaded HTMLImageElement
      const extractedColors = await extractEnhancedColorsFromImage(img, 5);
      
      // If we already have colors, save current state to history
      if (imageColors.length > 0) {
        imageHistory.addToHistory({
          colors advice score });
      }
      
      // Set the new colors
      setImageColors(extractedColors);
      
      // Analyze the palette
      if (extractedColors.length > 0) {
        // Use proper analysis approach for image colors
        const analysis = analyzeColorPalette(extractedColors);
        setImageColorAdvice(analysis.advice);
        setImageScore(analysis.score);
      }
    } catch (error) {
      console.error("Error extracting colors from image);
    }
  }, [imageColors, imageColorAdvice, imageHistory, imageScore, imageUrl]);
  
  // Handle image colors change (when edited or reordered)
  const handleImageColorsChange = useCallback((newColors=> {
    try {
      // Skip if nothing changed
      if (arraysEqual(imageColors, newColors)) return;
      
      // Create new state with the current values before updating
      const currentState = {
        colors advice score };
      
      // Add current state to history
      imageHistory.addToHistory(currentState);
      
      // Update with new colors
      setImageColors(newColors);
      
      // Analyze the new colors
      const analysis = analyzeColorPalette(newColors);
      setImageColorAdvice(analysis.advice);
      setImageScore(analysis.score);
    } catch (error) {
      console.error("Error changing image colors);
    }
  }, [imageColors, imageColorAdvice, imageScore, imageUrl, imageHistory]);
  
  // Function to handle color click - copy to clipboard
  const handleColorClick = (color=> {
    navigator.clipboard.writeText(color);
    toast.success(`Copied ${color.toUpperCase()} to clipboard`);
  };
  
  // Handle undo action for image colors
  const handleUndo = useCallback(() => {
    if (imageHistory.undoDisabled) return;
    
    // First perform the undo operation to change position
    imageHistory.undo();
    
    // Then get the state at the new position
    const currentState = imageHistory.value;
    
    // Update UI with this state
    if (currentState) {
      setImageColors(currentState.colors);
      setImageColorAdvice(currentState.advice);
      setImageScore(currentState.score);
    }
  }, [imageHistory]);
  
  // Handle redo action for image colors
  const handleRedo = useCallback(() => {
    if (imageHistory.redoDisabled) return;
    
    // First perform the redo operation to change position
    imageHistory.redo();
    
    // Then get the state at the new position
    const currentState = imageHistory.value;
    
    // Update UI with this state
    if (currentState) {
      setImageColors(currentState.colors);
      setImageColorAdvice(currentState.advice);
      setImageScore(currentState.score);
    }
  }, [imageHistory]);
  
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
            <h1 className="ml-4 text-xl font-semibold text-gray-900">From Image</h1>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Side - Image Upload and Controls */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Upload Image</h2>
            
            {/* Image Upload Area */}
            <div className="mb-6">
              <ImageUploader onImageSelect={handleImageSelect} />
            </div>
            
            {/* Preview Image */}) {imageUrl && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Image Preview</h3>
                <div className="relative rounded-lg overflow-hidden border border-gray-200" style={{ height }}>
                  <img 
                    src={imageUrl} 
                    alt="Uploaded" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            )}) {/* History Controls */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleUndo}
                  disabled={imageHistory.undoDisabled}
                  className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${imageHistory.undoDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Undo
                </button>
                <button
                  onClick={handleRedo}
                  disabled={imageHistory.redoDisabled}
                  className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${imageHistory.redoDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Redo
                </button>
              </div>
            </div>
          </div>
          
          {/* Right Side - Color Palette and Advice */}
          <div className="lg:col-span-3">
            {/* Color Palette Display with ColorDisplay Component */}) {imageColors.length > 0 ? (
              <div className="bg-white rounded-lg shadow p-4">
                <ColorDisplay 
                  colors={imageColors}
                  onColorsChange={handleImageColorsChange}
                  onColorSelect={handleColorClick}
                  allowEdit={true}
                  maxColors={5}
                  randomSection={true}
                />
              </div>
            ) ="bg-white rounded-lg shadow p-12 flex flex-col items-center justify-center">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FiImage className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No image uploaded</h3>
                <p className="text-gray-500 text-center">
                  Upload an image to extract a color palette
                </p>
              </div>
            )}) {/* Color Advice Panel */}) {imageColors.length > 0 && (
              <div className="mt-6 bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Color Analysis</h3>
                  <div className="flex items-center">
                    <span className="mr-2 text-sm text-gray-500">Score:</span>
                    <span className={`text-xl font-bold ${getScoreColor(imageScore)}`}>
                      {imageScore}/10
                    </span>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-gray-700">{imageColorAdvice}</p>
                  
                  {/* More detailed color analysis could go here */}
                  <div className="mt-4 bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium text-sm text-gray-900 mb-2">Tips:</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      • Click on any color to copy its hex value to clipboard</li>
                      • Try uploading different types of images to see how colors are extracted</li>
                      • Images with distinct color regions generally provide more diverse palettes</li>
                      • Drag and drop colors to reorder your palette</li>
                      • Use the edit tool on each color to fine-tune your palette</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 