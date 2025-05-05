'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiArrowRight, FiChevronDown, FiCopy, FiMessageSquare, FiX, FiEdit2, FiMove, FiArrowLeft } from 'react-icons/fi';
import { toast, Toaster } from 'react-hot-toast';
import tinycolor from 'tinycolor2';
import { generateHarmoniousPalette, analyzeColorPalette } from '../lib/utils/colorAnalysisNew';
import ColorDisplay from '../components/ColorPalette/ColorDisplay';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HexColorPicker } from 'react-colorful';
import { createPortal } from 'react-dom';
import { Logo } from './components/ui/Logo';
import { Navigation } from './components/ui/Navigation';
import { PaletteToolbar } from './components/ui/PaletteToolbar';
import { ChatPanel } from './components/ui/ChatPanel';
import { PaletteDisplay } from './components/ui/PaletteDisplay';

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
      console.log("Initialized history with first state");
      return;
    }
    
    // Skip if the new state is identical to the current state
    if (JSON.stringify(newState) === JSON.stringify(current)) {
      console.log("Skipping identical state");
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
      console.log("Undo to position", newPosition, "of", history.length - 1, 
                  "history length:", history.length);
      
      // Return the state at the new position for immediate access
      return history[newPosition];
    }
    console.log("Cannot undo, at earliest position", position, "history length:", history.length);
    return null;
  }, [history, position]);
  
  // Redo operation with direct state access
  const redo = useCallback(() => {
    if (position < history.length - 1) {
      const newPosition = position + 1;
      setPosition(newPosition);
      // Log redo operation
      console.log("Redo to position", newPosition, "of", history.length - 1,
                  "history length:", history.length);
      
      // Return the state at the new position for immediate access
      return history[newPosition];
    }
    console.log("Cannot redo, at latest position", position, "history length:", history.length);
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
      className="h-32 flex items-end justify-between p-5 cursor-pointer relative rounded-xl"
      onClick={() => onColorClick(color)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      {...attributes}
    >
      <span className={`font-mono text-sm ${isDark ? 'text-white' : 'text-black'}`} style={{
        fontFamily: 'Inter, monospace',
        fontSize: '14px',
        fontWeight: 500
      }}>
        {color.toUpperCase()}
      </span>
      
      <div className="flex items-center space-x-3">
        {/* Edit button */}
        <button
          onClick={(e) => onEditClick(color, index, e)}
          className={`w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors`}
          title="Edit color"
        >
          <FiEdit2 className={`h-4 w-4 ${isDark ? 'text-white' : 'text-black'}`} />
        </button>
        
        {/* Copy button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(color);
            toast.success(`Copied ${color.toUpperCase()} to clipboard`);
          }}
          className={`w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors`}
          title="Copy hex code"
        >
          <FiCopy className={`h-4 w-4 ${isDark ? 'text-white' : 'text-black'}`} />
        </button>
        
        {/* Drag handle */}
        <button
          {...listeners}
          className={`w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors cursor-grab active:cursor-grabbing`}
          title="Drag to reorder"
        >
          <FiMove className={`h-4 w-4 ${isDark ? 'text-white' : 'text-black'}`} />
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
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [currentEditingColor, setCurrentEditingColor] = useState('');
  const [currentEditingIndex, setCurrentEditingIndex] = useState(-1);
  const [colorPickerPosition, setColorPickerPosition] = useState<{ x: number, y: number } | undefined>(undefined);
  // Track the pre-editing colors for history
  const preEditColorsRef = useRef<string[]>([]);
  
  // Maintain a boolean to track if initialization has happened
  const hasInitializedRef = useRef(false);
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  // Create a directly managed history
  const [paletteHistory, setPaletteHistory] = useState<string[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Computed undo/redo status
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < paletteHistory.length - 1;
  
  // Function to add to history properly
  const addPaletteToHistory = useCallback((colors: string[]) => {
    // Don't add empty colors
    if (!colors || colors.length === 0) return;
    
    // Create a new history by truncating anything after the current position
    const newHistory = paletteHistory.slice(0, historyIndex + 1);
    
    // Add the new colors to history
    newHistory.push([...colors]);
    
    // Update history state
    setPaletteHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    console.log(`Added to history - now at position ${newHistory.length - 1} of ${newHistory.length - 1}`);
  }, [paletteHistory, historyIndex]);
  
  // Initialize random IDs for drag and drop
  useEffect(() => {
    setColorIds(Array(10).fill(0).map(() => Math.random().toString(36).substring(2, 10)));
  }, []);
  
  // Generate random colors on initial load
  useEffect(() => {
    if (hasInitializedRef.current) return;
    
    // Generate initial palette
    const initialColors = generateHarmoniousPalette();
    
    // Set the colors
    setRandomColors(initialColors);
    
    // Initialize history with the initial palette
    setPaletteHistory([initialColors]);
    setHistoryIndex(0);
    
    // Set up the initial analysis
    const analysis = analyzeColorPalette(initialColors);
    (window as any).__latestAnalysis = {
      advice: analysis.advice,
      score: analysis.score
    };
    
    // Mark initialization as complete
    hasInitializedRef.current = true;
    
    console.log("Initial palette generated and history initialized");
  }, []);
  
  // Scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [adviceMessages]);
  
  // Handle key press for generating new palette
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle Enter key presses that aren't inside input fields
      if (event.key === 'Enter' && 
          !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) {
        event.preventDefault(); // Prevent default form submission
        
        // Generate new palette directly here
        const newColors = generateHarmoniousPalette();
        
        // Add to history
        const newHistory = paletteHistory.slice(0, historyIndex + 1);
        newHistory.push(newColors);
        setPaletteHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        
        // Update UI with new colors
        setRandomColors(newColors);
        
        // Update analysis for later use
        const analysis = analyzeColorPalette(newColors);
        (window as any).__latestAnalysis = {
          advice: analysis.advice,
          score: analysis.score
        };
        
        console.log(`Enter key: Generated palette, now at history position ${newHistory.length - 1}`);
      }
    };
    
    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [paletteHistory, historyIndex]);
  
  // Function to generate random palette (button click)
  function handleGenerateRandom() {
    try {
      // Generate new random colors
      const newColors = generateHarmoniousPalette();
      
      // Analyze the new colors
      const analysis = analyzeColorPalette(newColors);
      
      // Add to history
      const newHistory = paletteHistory.slice(0, historyIndex + 1);
      newHistory.push(newColors);
      setPaletteHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      // Update UI with new colors
      setRandomColors(newColors);
      
      // Save the analysis for later use
      (window as any).__latestAnalysis = {
        advice: analysis.advice,
        score: analysis.score
      };
      
      console.log(`Button: Generated palette, now at history position ${newHistory.length - 1}`);
    } catch (error) {
      console.error("Error generating random palette:", error);
    }
  }
  
  // Add a new advice message only when explicitly requested through the Ask for Advice button
  // instead of whenever randomColorAdvice changes
  const handleAskForAdvice = () => {
    if ((window as any).__latestAnalysis) {
      // Get the advice and score
      const advice = (window as any).__latestAnalysis.advice;
      const score = (window as any).__latestAnalysis.score;
      
      // Update state
      setRandomColorAdvice(advice);
      setRandomScore(score);
      
      // Create and add the new message
      const newMessage: AdviceMessage = {
        id: Date.now().toString(),
        text: advice,
        score: score,
        icon: <FiMessageSquare className="h-5 w-5" />
      };
      
      setAdviceMessages(prev => [...prev, newMessage]);
      
      // Clear stored analysis after using it
      (window as any).__latestAnalysis = null;
    } else {
      // If no stored analysis, generate one now
      const analysis = analyzeColorPalette(randomColors);
      
      // Update state
      setRandomColorAdvice(analysis.advice);
      setRandomScore(analysis.score);
      
      // Create and add the new message
      const newMessage: AdviceMessage = {
        id: Date.now().toString(),
        text: analysis.advice,
        score: analysis.score,
        icon: <FiMessageSquare className="h-5 w-5" />
      };
      
      setAdviceMessages(prev => [...prev, newMessage]);
    }
  };
  
  // Function to handle color click - copy to clipboard
  const handleColorClick = (color: string) => {
    navigator.clipboard.writeText(color);
    toast.success(`Copied ${color.toUpperCase()} to clipboard`);
  };
  
  // Handle edit button click
  const handleEditClick = (color: string, index: number, event: React.MouseEvent) => {
    // Stop propagation to prevent triggering the color click handler
    event.stopPropagation();
    
    // Get the target element and its position
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // Store the current colors for undo history when the color picker is closed
    preEditColorsRef.current = [...randomColors];
    console.log("Storing pre-edit colors:", preEditColorsRef.current);
    
    setCurrentEditingColor(color);
    setCurrentEditingIndex(index);
    setColorPickerPosition({
      x: rect.left + (rect.width / 2),
      y: rect.bottom
    });
    setColorPickerVisible(true);
  };
  
  // Handle color change from color picker
  const handleColorChange = (newColor: string) => {
    if (currentEditingIndex >= 0) {
      const newColors = [...randomColors];
      newColors[currentEditingIndex] = newColor;
      
      // Just update the UI without adding to history during active editing
      setRandomColors(newColors);
    }
  };
  
  // Handle closing the color picker
  const handleCloseColorPicker = () => {
    setColorPickerVisible(false);
    
    // When the color picker is closed, add the final color to history
    if (currentEditingIndex >= 0 && preEditColorsRef.current.length > 0) {
      // Compare arrays to see if there was a change
      const hasChanged = !arraysEqual(preEditColorsRef.current, randomColors);
      console.log("Has palette changed?", hasChanged);
      
      if (hasChanged) {
        // Add to history
        const newHistory = paletteHistory.slice(0, historyIndex + 1);
        newHistory.push([...randomColors]);
        setPaletteHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        
        // Update analysis
        const analysis = analyzeColorPalette(randomColors);
        (window as any).__latestAnalysis = {
          advice: analysis.advice,
          score: analysis.score
        };
        
        console.log(`Updated color, now at history position ${newHistory.length - 1}`);
      }
    }
    
    // Reset the editing state
    setCurrentEditingIndex(-1);
  };
  
  // Handle drag end for reordering colors
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const activeIndex = colorIds.indexOf(active.id as string);
      const overIndex = colorIds.indexOf(over.id as string);
      
      if (activeIndex !== -1 && overIndex !== -1) {
        // Create the new color array with the reordered colors
        const newColors = arrayMove(randomColors, activeIndex, overIndex);
        
        // Update the UI
        setRandomColors(newColors);
        
        // Add to history
        const newHistory = paletteHistory.slice(0, historyIndex + 1);
        newHistory.push([...newColors]);
        setPaletteHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        
        // Update analysis
        const analysis = analyzeColorPalette(newColors);
        (window as any).__latestAnalysis = {
          advice: analysis.advice,
          score: analysis.score
        };
        
        console.log(`Reordered colors, now at history position ${newHistory.length - 1}`);
      }
    }
  };
  
  // Render the new UI
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header with max width */}
      <header className="py-6 border-b border-[#E5E5E5]">
        <div className="max-w-[1440px] mx-auto px-4 flex items-center justify-between">
          <div className="flex-1 flex items-center justify-start">
            <Logo />
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <Navigation />
          </div>
          
          <div className="flex-1">
            {/* Empty space for balance */}
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <div className="max-w-[1440px] mx-auto px-4">
        <main className="pt-8 flex gap-4">
          {/* Color palette section - Takes up most of the space (1086px from Figma) */}
          <div className="w-[1086px] flex flex-col space-y-4">
            {/* Palette toolbar */}
            <PaletteToolbar
              onGenerateRandom={handleGenerateRandom}
              onUndo={() => {
                if (canUndo) {
                  // Use the previous state from history
                  const prevColors = paletteHistory[historyIndex - 1];
                  setRandomColors(prevColors);
                  setHistoryIndex(historyIndex - 1);
                  
                  // Update analysis for the restored palette
                  const analysis = analyzeColorPalette(prevColors);
                  (window as any).__latestAnalysis = {
                    advice: analysis.advice,
                    score: analysis.score
                  };
                }
              }}
              onRedo={() => {
                if (canRedo) {
                  // Use the next state from history
                  const nextColors = paletteHistory[historyIndex + 1];
                  setRandomColors(nextColors);
                  setHistoryIndex(historyIndex + 1);
                  
                  // Update analysis for the restored palette
                  const analysis = analyzeColorPalette(nextColors);
                  (window as any).__latestAnalysis = {
                    advice: analysis.advice,
                    score: analysis.score
                  };
                }
              }}
              undoDisabled={!canUndo}
              redoDisabled={!canRedo}
            />
            
            {/* DnD Context for drag and drop functionality */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={randomColors.map((_, i) => colorIds[i] || `color-${i}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 gap-4">
                  {randomColors.map((color, index) => (
                    <SortableColorItem
                      key={colorIds[index] || `color-${index}`}
                      id={colorIds[index] || `color-${index}`}
                      color={color}
                      index={index}
                      onColorClick={handleColorClick}
                      onEditClick={handleEditClick}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
          
          {/* Chat panel - Fixed width on the right with 16px gap */}
          <div className="w-[322px]">
            <ChatPanel
              messages={adviceMessages}
              onAskForAdvice={handleAskForAdvice}
            />
          </div>
        </main>
      </div>
      
      {/* Keep all the modals and notifications */}
      {colorPickerVisible && (
        createPortal(
          <ColorPickerModal
            color={currentEditingColor}
            onClose={handleCloseColorPicker}
            onChange={handleColorChange}
            anchorPosition={colorPickerPosition}
          />,
          document.body
        )
      )}
      
      <Toaster position="bottom-center" />
    </div>
  );
}