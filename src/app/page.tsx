'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiArrowRight, FiChevronDown, FiCopy, FiMessageSquare, FiX, FiEdit2, FiMove } from 'react-icons/fi';
import { toast, Toaster } from 'react-hot-toast';
import tinycolor from 'tinycolor2';
import { generateHarmoniousPalette, analyzeColorPalette } from '../lib/utils/colorAnalysisNew';
import ColorDisplay from '../components/ColorPalette/ColorDisplay';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HexColorPicker } from 'react-colorful';
import { createPortal } from 'react-dom';

// Custom hook for managing history state with undo/redo functionality
function useHistoryState<T>(initialState: T) {
  // History array and current position
  const [history, setHistory] = useState<T[]>([]);
  const [position, setPosition] = useState<number>(-1);
  
  // Ensure we have a valid initial state for the UI
  useEffect(() => {
    if (history.length === 0) {
      setHistory([initialState]);
      setPosition(0);
    }
  }, [initialState]);
  
  // Computed current value - carefully handle edge cases
  const current = useMemo(() => {
    if (position >= 0 && position < history.length) {
      return history[position];
    }
    if (history.length > 0) {
      return history[0];
    }
    return initialState;
  }, [history, position, initialState]);
  
  // Computed states for button disabling
  const undoDisabled = position <= 0 || history.length <= 1;
  const redoDisabled = position >= history.length - 1;
  
  // Add a new state to history
  const addToHistory = useCallback((newState: T) => {
    // If history is empty, initialize it
    if (history.length === 0) {
      setHistory([newState]);
      setPosition(0);
      return;
    }
    
    // Skip if the new state is identical to the current state
    if (JSON.stringify(newState) === JSON.stringify(current)) {
      return;
    }
    
    // Create new history by truncating anything after current position
    const newHistory = [
      ...history.slice(0, position + 1),
      newState
    ];
    
    setHistory(newHistory);
    setPosition(newHistory.length - 1);
    
    // Log history for debugging
    console.log("History updated", { 
      newHistoryLength: newHistory.length, 
      newPosition: newHistory.length - 1,
      currentState: JSON.stringify(newState).substring(0, 50) + "..."
    });
  }, [history, position, current]);
  
  // Undo operation with direct state access
  const undo = useCallback(() => {
    if (position > 0) {
      const newPosition = position - 1;
      setPosition(newPosition);
      // Log undo operation
      console.log("Undo to position", newPosition, "of", history.length - 1);
      // Return the state at the new position for immediate access
      return history[newPosition];
    }
    return null;
  }, [history, position]);
  
  // Redo operation with direct state access
  const redo = useCallback(() => {
    if (position < history.length - 1) {
      const newPosition = position + 1;
      setPosition(newPosition);
      // Log redo operation
      console.log("Redo to position", newPosition, "of", history.length - 1);
      // Return the state at the new position for immediate access
      return history[newPosition];
    }
    return null;
  }, [history, position]);
  
  // Get all history states for debugging
  const getFullHistory = useCallback(() => {
    return {
      history,
      position,
      current
    };
  }, [history, position, current]);
  
  return {
    value: current,
    addToHistory,
    undo,
    redo,
    undoDisabled,
    redoDisabled,
    history,
    position,
    getFullHistory
  };
}

// Function to get color for the score display
const getScoreColor = (score: number): string => {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-blue-500';
  if (score >= 4) return 'text-yellow-500';
  return 'text-red-500';
};

// Define a type for the advice message
interface AdviceMessage {
  id: string;
  text: string;
  score?: number;
  icon?: React.ReactNode;
}

// Helper function to check if two color arrays are equal
const arraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

// Sortable color item component for drag and drop
const SortableColorItem = ({ 
  id, 
  color, 
  index,
  onColorClick,
  onEditClick
}: {
  id: string;
  color: string;
  index: number;
  onColorClick: (color: string) => void;
  onEditClick: (color: string, index: number, event: React.MouseEvent) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 1,
    opacity: isDragging ? 0.7 : 1,
  };
  
  const isDark = tinycolor(color).isDark();

  return (
    <motion.div 
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: color
      }}
      className="h-24 flex items-end justify-between p-4 cursor-pointer transition-transform hover:scale-[1.01] relative"
      onClick={() => onColorClick(color)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      {...attributes}
    >
      <span className={`font-mono text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {color.toUpperCase()}
      </span>
      
      <div className="flex items-center space-x-2">
        {/* Edit button */}
        <button
          onClick={(e) => onEditClick(color, index, e)}
          className={`p-1 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors`}
          title="Edit color"
        >
          <FiEdit2 className={`h-4 w-4 ${isDark ? 'text-white' : 'text-gray-900'}`} />
        </button>
        
        {/* Copy button is already in the UI */}
        <FiCopy className={`h-4 w-4 ${isDark ? 'text-white' : 'text-gray-900'}`} />
        
        {/* Drag handle */}
        <button
          {...listeners}
          className={`p-1 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors cursor-grab active:cursor-grabbing`}
          title="Drag to reorder"
        >
          <FiMove className={`h-4 w-4 ${isDark ? 'text-white' : 'text-gray-900'}`} />
        </button>
      </div>
    </motion.div>
  );
};

// Color picker modal component
const ColorPickerModal = ({ 
  color, 
  onClose, 
  onChange,
  anchorPosition
}: { 
  color: string;
  onClose: () => void;
  onChange: (color: string) => void;
  anchorPosition?: { x: number, y: number };
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [hexValue, setHexValue] = useState(color.toUpperCase());
  const initialColorRef = useRef(color);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  const handleColorChange = (newColor: string) => {
    setHexValue(newColor.toUpperCase());
    // Update the color in real-time, but don't add to history
    onChange(newColor);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHexValue(e.target.value);
    // Update in real-time if it's a valid hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
      onChange(e.target.value);
    }
  };
  
  const handleDone = () => {
    // Only add to history when Done is clicked
    if (hexValue !== initialColorRef.current) {
      // The onChange here will trigger handleColorChange in the parent
      onChange(hexValue);
    }
    onClose();
  };

  const handleReset = () => {
    // Reset to initial color
    setHexValue(initialColorRef.current);
    onChange(initialColorRef.current);
  };
  
  const getModalStyle = () => {
    if (anchorPosition) {
      return {
        position: 'absolute',
        left: `${anchorPosition.x}px`,
        top: `${anchorPosition.y}px`,
        transform: 'translate(-50%, 10px)',
        zIndex: 100
      } as React.CSSProperties;
    }
    return {};
  };
  
  return typeof document !== 'undefined' ? createPortal(
    <div 
      ref={modalRef}
      className="bg-white rounded-lg shadow-xl p-4 w-[300px]"
      style={getModalStyle()}
    >
      <div className="mb-4">
        <h3 className="text-base font-medium mb-2">Hex Color</h3>
        <input
          type="text"
          value={hexValue}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mb-2"
        />
        <HexColorPicker color={hexValue} onChange={handleColorChange} className="w-full" />
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Reset
        </button>
        <button
          onClick={handleDone}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Done
        </button>
      </div>
    </div>,
    document.body
  ) : null;
};

export default function Home() {
  // State for random colors
  const [randomColors, setRandomColors] = useState<string[]>([]);
  const [randomColorAdvice, setRandomColorAdvice] = useState<string>('');
  const [randomScore, setRandomScore] = useState<number>(0);
  const [showAdviceChat, setShowAdviceChat] = useState<boolean>(true);
  const [adviceMessages, setAdviceMessages] = useState<AdviceMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // State for drag and drop
  const [colorIds, setColorIds] = useState<string[]>([]);
  
  // Color picker state
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editingColor, setEditingColor] = useState('');
  const [editingColorIndex, setEditingColorIndex] = useState(-1);
  const [pickerPosition, setPickerPosition] = useState<{ x: number, y: number } | undefined>(undefined);
  // Track the pre-editing colors for history
  const preEditColorsRef = useRef<string[]>([]);
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  // History for random colors
  const randomHistory = useHistoryState<{
    colors: string[],
    advice: string,
    score: number
  }>({
    colors: [],
    advice: '',
    score: 0
  });
  
  // Initialize random IDs for drag and drop
  useEffect(() => {
    setColorIds(Array(10).fill(0).map(() => Math.random().toString(36).substring(2, 10)));
  }, []);
  
  // Generate random colors on initial load
  useEffect(() => {
    handleGenerateRandom();
  }, []);
  
  // Scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [adviceMessages]);
  
  // Add a new advice message whenever the randomColorAdvice changes
  useEffect(() => {
    if (randomColorAdvice) {
      const newMessage: AdviceMessage = {
        id: Date.now().toString(),
        text: randomColorAdvice,
        score: randomScore,
        icon: <FiMessageSquare className="h-5 w-5" />
      };
      
      setAdviceMessages(prev => [...prev, newMessage]);
    }
  }, [randomColorAdvice, randomScore]);
  
  // Handle key press for generating new palette
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleGenerateRandom();
      }
    };
    
    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, []);
  
  // Handle random colors change
  const handleRandomColorsChange = useCallback((newColors: string[]) => {
    try {
      // Skip if nothing changed
      if (arraysEqual(randomColors, newColors)) return;
      
      // Create new state with the new colors
      const newState = {
        colors: [...newColors],
        advice: '',  // Clear advice when colors change
        score: 0     // Clear score when colors change
      };
      
      // Add new state to history
      randomHistory.addToHistory(newState);
      
      // Update UI with new colors
      setRandomColors(newColors);
      setRandomColorAdvice('');
      setRandomScore(0);
      
      // Analyze the new colors but don't show advice/score yet
      const analysis = analyzeColorPalette(newColors);
      // Save the analysis for later use when Ask button is clicked
      (window as any).__latestAnalysis = {
        advice: analysis.advice,
        score: analysis.score
      };
    } catch (error) {
      console.error("Error changing random colors:", error);
    }
  }, [randomColors, randomHistory]);
  
  // Function to generate random palette
  function handleGenerateRandom() {
    try {
      // Generate new random colors
      const newColors = generateHarmoniousPalette();
      
      // Analyze the new colors
      const analysis = analyzeColorPalette(newColors);
      
      // Create the state to save
      const newState = {
        colors: newColors,
        advice: '',  // We don't show advice immediately
        score: 0     // We don't show score immediately
      };
      
      // Save current state to history
      randomHistory.addToHistory(newState);
      
      // Update UI
      setRandomColors(newColors);
      setRandomColorAdvice('');
      setRandomScore(0);
      
      // Save the analysis for later use when Ask button is clicked
      (window as any).__latestAnalysis = {
        advice: analysis.advice,
        score: analysis.score
      };
    } catch (error) {
      console.error("Error generating random palette:", error);
    }
  }
  
  // Handle request for advice (when Ask button is clicked)
  const handleAskForAdvice = () => {
    if ((window as any).__latestAnalysis) {
      setRandomColorAdvice((window as any).__latestAnalysis.advice);
      setRandomScore((window as any).__latestAnalysis.score);
      // Clear stored analysis after using it
      (window as any).__latestAnalysis = null;
    } else {
      // If no stored analysis, generate one now
      const analysis = analyzeColorPalette(randomColors);
      setRandomColorAdvice(analysis.advice);
      setRandomScore(analysis.score);
    }
  };
  
  // Function to handle color click - copy to clipboard
  const handleColorClick = (color: string) => {
    navigator.clipboard.writeText(color);
    toast.success(`Copied ${color.toUpperCase()} to clipboard`);
  };
  
  // Handle edit button click
  const handleEditClick = (color: string, index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const buttonElement = event.currentTarget as HTMLElement;
    const rect = buttonElement.getBoundingClientRect();
    
    // Store the pre-edit colors for history
    preEditColorsRef.current = JSON.parse(JSON.stringify(randomColors));
    console.log("Storing pre-edit colors:", preEditColorsRef.current);
    
    setEditingColor(color);
    setEditingColorIndex(index);
    setPickerPosition({
      x: rect.left + (rect.width / 2),
      y: rect.bottom
    });
    setShowColorPicker(true);
  };
  
  // Handle color change from color picker
  const handleColorChange = (newColor: string) => {
    if (editingColorIndex >= 0) {
      const newColors = [...randomColors];
      newColors[editingColorIndex] = newColor;
      
      // Just update the UI without adding to history during active editing
      setRandomColors(newColors);
    }
  };
  
  // Handle closing the color picker
  const handleCloseColorPicker = () => {
    setShowColorPicker(false);
    
    // When the color picker is closed, add the final color to history
    if (editingColorIndex >= 0 && preEditColorsRef.current.length > 0) {
      // Compare arrays to see if there was a change
      const hasChanged = !arraysEqual(preEditColorsRef.current, randomColors);
      console.log("Has palette changed?", hasChanged);
      
      if (hasChanged) {
        // Create new state with the current values before updating
        const newState = {
          colors: [...randomColors],
          advice: randomColorAdvice,
          score: randomScore
        };
        
        // Add to history
        randomHistory.addToHistory(newState);
      }
      
      // Reset the pre-edit colors regardless
      preEditColorsRef.current = [];
    }
  };
  
  // Handle drag end for reordering colors
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const activeIndex = colorIds.indexOf(active.id as string);
      const overIndex = colorIds.indexOf(over.id as string);
      
      if (activeIndex !== -1 && overIndex !== -1) {
        const newColors = arrayMove(randomColors, activeIndex, overIndex);
        handleRandomColorsChange(newColors);
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      
      {/* Header/Nav */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-700 font-medium">Logo</span>
            </div>
          </div>
          
          {/* Navigation buttons */}
          <div className="flex space-x-2">
            <button 
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-full font-medium hover:bg-gray-300 transition-colors"
              onClick={handleGenerateRandom}
            >
              Random palette
            </button>
            
            <Link 
              href="/base-color" 
              className="bg-white border border-gray-300 text-gray-800 px-4 py-2 rounded-full font-medium hover:bg-gray-50 transition-colors"
            >
              Based on color
            </Link>
            
            <Link 
              href="/from-image" 
              className="bg-white border border-gray-300 text-gray-800 px-4 py-2 rounded-full font-medium hover:bg-gray-50 transition-colors"
            >
              From image
            </Link>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Side - Color Palette */}
          <div className="lg:col-span-3">
            {/* Color Palette Display */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={colorIds.slice(0, randomColors.length)}
                  strategy={verticalListSortingStrategy}
                >
                  {randomColors.map((color, index) => (
                    <SortableColorItem
                      key={colorIds[index]}
                      id={colorIds[index]}
                      color={color}
                      index={index}
                      onColorClick={handleColorClick}
                      onEditClick={handleEditClick}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
            
            {/* Controls */}
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    const prevState = randomHistory.undo();
                    if (prevState) {
                      setRandomColors(prevState.colors);
                      setRandomColorAdvice(prevState.advice);
                      setRandomScore(prevState.score);
                    }
                  }}
                  disabled={randomHistory.undoDisabled}
                  className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${randomHistory.undoDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label="Undo"
                  title="Undo to previous color palette"
                >
                  Undo
                </button>
                <button
                  onClick={() => {
                    const nextState = randomHistory.redo();
                    if (nextState) {
                      setRandomColors(nextState.colors);
                      setRandomColorAdvice(nextState.advice);
                      setRandomScore(nextState.score);
                    }
                  }}
                  disabled={randomHistory.redoDisabled}
                  className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${randomHistory.redoDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label="Redo"
                  title="Redo to next color palette"
                >
                  Redo
                </button>
              </div>
              
              <button
                onClick={handleGenerateRandom}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
              >
                <FiRefreshCw className="mr-2 h-4 w-4" />
                Generate New Palette
              </button>
            </div>
            
            {/* Keyboard Hint */}
            <div className="mt-3 text-center text-sm text-gray-500">
              Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded font-mono text-xs">Enter</kbd> to generate new palette
            </div>
          </div>
          
          {/* Right Side - Advice Chat */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden h-full flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="font-medium">Color Advice</span>
                  <div className="ml-2 flex items-center">
                    <span className={`h-2 w-2 rounded-full bg-green-500 mr-1`}></span>
                    <span className="text-xs text-gray-500">active</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={() => setShowAdviceChat(!showAdviceChat)}>
                    <FiX className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
              
              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto max-h-[500px]">
                {adviceMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <FiMessageSquare className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">Generate a color palette to see analysis and advice here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {adviceMessages.map((message, index) => (
                      <div key={message.id} className="bg-gray-100 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center mr-2">
                            {message.icon}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-500">Color Advisor</div>
                            {message.score !== undefined && (
                              <div className="flex items-center">
                                <span className="text-xs text-gray-500">Score: </span>
                                <span className={`text-xs font-bold ml-1 ${getScoreColor(message.score)}`}>
                                  {message.score}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{message.text}</p>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>
              
              {/* Chat Input */}
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={handleAskForAdvice}
                  className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Ask for Advice
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Color Picker Modal */}
      {showColorPicker && (
        <ColorPickerModal
          color={editingColor}
          onClose={handleCloseColorPicker}
          onChange={handleColorChange}
          anchorPosition={pickerPosition}
        />
      )}
    </div>
  );
}