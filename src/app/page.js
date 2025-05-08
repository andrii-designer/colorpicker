'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiArrowRight, FiChevronDown, FiCopy, FiMessageSquare, FiX, FiEdit2, FiMove, FiArrowLeft, FiDownload } from 'react-icons/fi';
import { toast, Toaster } from 'react-hot-toast';
import tinycolor from 'tinycolor2';
import { generateHarmoniousPalette, analyzeColorPalette } from '../lib/utils/colorAnalysisNew';
import ColorDisplay from '../components/ColorPalette/ColorDisplay';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { HexColorPicker } from 'react-colorful';
import { createPortal } from 'react-dom';
import { Logo } from './components/ui/Logo';
import { Navigation } from './components/ui/Navigation';
import { PaletteToolbar } from './components/ui/PaletteToolbar';
import { ChatPanel } from './components/ui/ChatPanel';
import { PaletteDisplay } from './components/ui/PaletteDisplay';
import { cn } from '../lib/utils';
import Image from 'next/image';

// Custom hook for managing history state with undo/redo functionality
function useHistoryState(initialState {
  // History array and current position
  const [history, setHistory] = useState([]);
  const [position, setPosition] = useState(-1);
  
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
  const addToHistory = useCallback((newState=> {
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
      newHistoryLength newPosition - 1,
      currentState + "..."
    });
  }, [history, position, current]);
  
  // Undo operation with direct state access
  const undo = useCallback(() => {
    if (position > 0) {
      const newPosition = position - 1;
      setPosition(newPosition);
      // Log undo operation
      console.log("Undo to position", newPosition, "of", history.length - 1, 
                  "history length);
      
      // Return the state at the new position for immediate access
      return history[newPosition];
    }
    console.log("Cannot undo, at earliest position", position, "history length);
    return null;
  }, [history, position]);
  
  // Redo operation with direct state access
  const redo = useCallback(() => {
    if (position < history.length - 1) {
      const newPosition = position + 1;
      setPosition(newPosition);
      // Log redo operation
      console.log("Redo to position", newPosition, "of", history.length - 1,
                  "history length);
      
      // Return the state at the new position for immediate access
      return history[newPosition];
    }
    console.log("Cannot redo, at latest position", position, "history length);
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
    value };
}

// Function to get color for the score display
const getScoreColor = (score)=> {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-blue-500';
  if (score >= 4) return 'text-yellow-500';
  return 'text-red-500';
};

// Define a type for the advice message


// Helper function to check if two color arrays are equal
const arraysEqual = (a b=> {
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
  onEditClick,
  isFirst,
  isLast,
  isDragging
}: {
  id: string;
  color: string;
  index: number;
  onColorClick: (color=> void;
  onEditClick: (color index event=> void;
  isFirst?: boolean;
  isLast?: boolean;
  isDragging?: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
    id,
    animateLayoutChanges=> false // Disable dnd-kit's layout animations
  });

  const style = {
    transform transition ? transition  // Only apply transition during drag, not on drop
  };
  
  const isDark = tinycolor(color).isDark();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex-grow flex items-end justify-between p-4 cursor-pointer hover:opacity-95 relative ${
        isFirst ? 'rounded-t-[16px]'  ? 'rounded-b-[16px]'  'rounded-none'
      } ${isDragging ? 'z-10' : 'z-0'}`}
      onClick={() => onColorClick(color)}) {...attributes}
    >
      <motion.div 
        layout={isDragging}
        initial={false}
        style={{
          backgroundColor position top left right bottom zIndex: -1,
          boxShadow ? '0 8px 16px rgba(0,0,0,0.15)'  }}
        animate={{ 
          scale ? 1.02  }}
        transition={{ 
          type bounce duration }}
        className={`${
          isFirst ? 'rounded-t-[16px]'  ? 'rounded-b-[16px]'  'rounded-none'
        }`}
      />

      <span className={`font-mono text-sm ${isDark ? 'text-white' : 'text-black'} relative z-10`} style={{
        fontFamily fontSize fontWeight }}>
        {color.toUpperCase()}
      </span>
      
      <div className="flex items-center space-x-3 relative z-10">
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
          className={`w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          title="Drag to reorder"
        >
          <FiMove className={`h-4 w-4 ${isDark ? 'text-white' : 'text-black'}`} />
        </button>
      </div>
    </div>
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
  onClose=> void;
  onChange: (color=> void;
  anchorPosition?: { x y };
}) => {
  const modalRef = useRef(null);
  const [hexValue, setHexValue] = useState(color.toUpperCase());
  const initialColorRef = useRef(color);
  
  useEffect(() => {
    const handleClickOutside = (e=> {
      if (modalRef.current && !modalRef.current.contains(e.target{
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  const handleColorChange = (newColor=> {
    setHexValue(newColor.toUpperCase());
    // Update the color in real-time, but don't add to history
    onChange(newColor);
  };
  
  const handleInputChange = (e=> {
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
      // Calculate viewport-relative positions
      const viewportHeight = window.innerHeight;
      const topPosition = anchorPosition.y;
      
      // Check if there's enough space below
      const modalHeight = 350; // Approximate height of the modal
      const spaceBelow = viewportHeight - topPosition;
      
      // If not enough space below, position above
      if (spaceBelow < modalHeight + 20) {
        return {
          position // Use fixed instead of absolute
          left: `${anchorPosition.x}px`,
          bottom: `${viewportHeight - topPosition + 10}px`, // Position above the button
          transform: 'translateX(-50%)',
          zIndex maxHeight: `${topPosition - 20}px`, // Limit height to available space
          overflowY // Add scroll to the modal itself if needed
        };
      }
      
      // Default position below
      return {
        position // Use fixed instead of absolute
        left: `${anchorPosition.x}px`,
        top: `${topPosition + 10}px`,
        transform: 'translateX(-50%)',
        zIndex maxHeight: `${spaceBelow - 20}px`, // Limit height to available space
        overflowY // Add scroll to the modal itself if needed
      };
    }
    return {};
  };
  
  return typeof document !== 'undefined' ? createPortal(
    <div 
      ref={modalRef}
      className="bg-white rounded-lg shadow-xl p-4 w-[300px] pointer-events-auto"
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
  const [randomColors, setRandomColors] = useState([]);
  const [randomColorAdvice, setRandomColorAdvice] = useState('');
  const [randomScore, setRandomScore] = useState(0);
  const [showAdviceChat, setShowAdviceChat] = useState(true);
  const [adviceMessages, setAdviceMessages] = useState([]);
  
  // State for drag and drop
  const [colorIds, setColorIds] = useState([]);
  
  // Color picker state
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [currentEditingColor, setCurrentEditingColor] = useState('');
  const [currentEditingIndex, setCurrentEditingIndex] = useState(-1);
  const [colorPickerPosition, setColorPickerPosition] = useState<{ x y } | undefined>(undefined);
  // Track the pre-editing colors for history
  const preEditColorsRef = useRef([]);
  
  // Maintain a boolean to track if initialization has happened
  const hasInitializedRef = useRef(false);
  
  // For drag animation
  const [activeId, setActiveId] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance }
    }),
    useSensor(KeyboardSensor, { 
      coordinateGetter })
  );
  
  // Create a directly managed history
  const [paletteHistory, setPaletteHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Computed undo/redo status
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < paletteHistory.length - 1;
  
  // Function to add to history properly
  const addPaletteToHistory = useCallback((colors=> {
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
    const initialColors = generateHarmoniousPalette('#4080FF', 'analogous', 5);
    
    // Set the colors
    setRandomColors(initialColors);
    
    // Initialize history with the initial palette
    setPaletteHistory([initialColors]);
    setHistoryIndex(0);
    
    // Set up loading/banner animation
    const timer = setTimeout(() => {
      setShowAdviceChat(true);
    }, 300);
    
    // Set up assistant message animation
    const messageTimer = setTimeout(() => {
      setAdviceMessages([
        {
          id text: 'Welcome! Generate color palettes, or click a color to copy it.',
          icon />
        }
      ]);
    }, 1000);
    
    // Set up the initial analysis
    const analysis = analyzeColorPalette(initialColors);
    (window= {
      advice score };
    
    // Mark initialization= true;
    
    console.log("Initial palette generated and history initialized");
    
    return () => {
      clearTimeout(timer);
      clearTimeout(messageTimer);
    };
  }, []);
  
  // Handle key press for generating new palette
  useEffect(() => {
    const handleKeyPress = (event=> {
      // Only handle Enter key presses that aren't inside input fields
      if (event.key === 'Enter' && 
          !['INPUT', 'TEXTAREA'].includes((event.target?.tagName)) {
        event.preventDefault(); // Prevent default form submission
        
        // Generate new palette directly here
        const newColors = generateHarmoniousPalette('#' + Math.floor(Math.random()*16777215).toString(16), 'analogous', 5);
        
        // Add to history
        const newHistory = paletteHistory.slice(0, historyIndex + 1);
        newHistory.push(newColors);
        setPaletteHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        
        // Update UI with new colors
        setRandomColors(newColors);
        
        // Update analysis for later use
        const analysis = analyzeColorPalette(newColors);
        (window= {
          advice score };
        
        console.log(`Enter key ${newHistory.length - 1}`);
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
      const newColors = generateHarmoniousPalette('#' + Math.floor(Math.random()*16777215).toString(16), 'analogous', 5);
      
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
      (window= {
        advice score };
      
      console.log(`Button ${newHistory.length - 1}`);
    } catch (error) {
      console.error("Error generating random palette);
    }
  }
  
  // Add a new advice message only when explicitly requested through the Ask for Advice button
  // instead of whenever randomColorAdvice changes
  const handleAskForAdvice = () => {
    // Get all buttons to find the Ask Bobby button
    const buttons = document.querySelectorAll('button');
    let askBobbyButton= null;
    
    for (let i = 0; i < buttons.length; i++) {
      if (buttons[i].textContent?.includes('Ask Bobby')) {
        askBobbyButton = buttons[i];
        break;
      }
    }
    
    // Disable button if found
    if (askBobbyButton) askBobbyButton.disabled = true;
    
    // Use a timeout to ensure state updates don't cause layout shifts
    setTimeout(() => {
      try {
        if ((window{
          // Get the advice and score
          const advice = (window;
          const score = (window;
          
          // Update state in a batched update to prevent multiple renders
          setRandomColorAdvice(advice);
          setRandomScore(score);
          
          // Create and add the new message
          const newMessage= {
            id text score icon="h-5 w-5" />
          };
          
          setAdviceMessages(prev => [...prev, newMessage]);
          
          // Clear stored analysis after using it
          (window= null;
        } else {
          // If no stored analysis, generate one now
          const analysis = analyzeColorPalette(randomColors);
          
          // Update state in a batched update
          setRandomColorAdvice(analysis.advice);
          setRandomScore(analysis.score);
          
          // Create and add the new message
          const newMessage= {
            id text score icon="h-5 w-5" />
          };
          
          setAdviceMessages(prev => [...prev, newMessage]);
        }
      } finally {
        // Re-enable button after a short delay
        setTimeout(() => {
          if (askBobbyButton) {
            askBobbyButton.disabled = false;
          }
        }, 500);
      }
    }, 0);
  };
  
  // Function to handle color click - copy to clipboard
  const handleColorClick = (color=> {
    navigator.clipboard.writeText(color);
    toast.success(`Copied ${color.toUpperCase()} to clipboard`);
  };
  
  // Handle edit button click
  const handleEditClick = (color index event=> {
    // Stop propagation to prevent triggering the color click handler
    event.stopPropagation();
    
    // Get the target element and its position
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    
    // Store the current colors for undo history when the color picker is closed
    preEditColorsRef.current = [...randomColors];
    console.log("Storing pre-edit colors);
    
    setCurrentEditingColor(color);
    setCurrentEditingIndex(index);
    setColorPickerPosition({
      x + (rect.width / 2),
      y });
    setColorPickerVisible(true);
  };
  
  // Handle color change from color picker
  const handleColorChange = (newColor=> {
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
        (window= {
          advice score };
        
        console.log(`Updated color, now at history position ${newHistory.length - 1}`);
      }
    }
    
    // Reset the editing state
    setCurrentEditingIndex(-1);
  };
  
  // Handle drag start
  const handleDragStart = (event=> {
    const id = event.active.id;
    setActiveId(id);
  };
  
  // Handle drag over for visual feedback
  const handleDragOver = (event=> {
    if (event.over) {
      const overId = event.over.id;
      const overIdx = colorIds.indexOf(overId);
      setOverIndex(overIdx);
    } else {
      setOverIndex(null);
    }
  };
  
  // Handle drag end for reordering colors
  const handleDragEnd = (event=> {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const activeIndex = colorIds.indexOf(active.id;
      const overIndex = colorIds.indexOf(over.id;
      
      if (activeIndex !== -1 && overIndex !== -1) {
        // Create the new color array with the reordered colors
        const newColors = arrayMove(randomColors, activeIndex, overIndex);
        
        // Immediately update UI without animation
        setRandomColors(newColors);
        
        // Add to history
        const newHistory = paletteHistory.slice(0, historyIndex + 1);
        newHistory.push([...newColors]);
        setPaletteHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        
        // Update analysis
        const analysis = analyzeColorPalette(newColors);
        (window= {
          advice score };
      }
    }
    
    // Immediately reset state
    setActiveId(null);
    setOverIndex(null);
  };
  
  const handleUndo = () => {
    if (canUndo) {
      // Use the previous state from history
      const prevColors = paletteHistory[historyIndex - 1];
      setRandomColors(prevColors);
      setHistoryIndex(historyIndex - 1);
      
      // Update analysis for the restored palette
      const analysis = analyzeColorPalette(prevColors);
      (window= {
        advice score };
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      // Use the next state from history
      const nextColors = paletteHistory[historyIndex + 1];
      setRandomColors(nextColors);
      setHistoryIndex(historyIndex + 1);
      
      // Update analysis for the restored palette
      const analysis = analyzeColorPalette(nextColors);
      (window= {
        advice score };
    }
  };
  
  // Render the new UI
  return (
    <div className="h-screen flex flex-col bg-white max-w-full overflow-hidden">
      {/* Header with max width - remove border-b and set padding to 16px */}
      <header className="py-0 bg-white flex-shrink-0">
        <div 
          className="w-full flex items-center justify-between" 
          style={{
            height background: '#FFF'
          }}
        >
          <div className="flex items-center justify-start ml-4">
            <Logo />
          </div>
          
          <div className="flex items-center justify-center">
            <Navigation />
          </div>
          
          <div className="flex items-center justify-end">
            <div 
              className="flex items-center" 
              style={{
                width justifyContent: 'space-between',
                marginRight }}
            >
              <button 
                onClick={() => { if (canUndo) handleUndo(); }} 
                disabled={!canUndo}
                style={{
                  display padding alignItems gap }}
                className={`rounded hover:bg-gray-100 transition-colors ${!canUndo ? 'opacity-40 cursor-not-allowed' : ''}`}
                title="Undo"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.13086 18.3105H15.1309C17.8909 18.3105 20.1309 16.0705 20.1309 13.3105C20.1309 10.5505 17.8909 8.31055 15.1309 8.31055H4.13086" stroke="#292D32" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.42914 10.8095L3.86914 8.24945L6.42914 5.68945" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button 
                onClick={() => { if (canRedo) handleRedo(); }} 
                disabled={!canRedo}
                style={{
                  display padding alignItems gap }}
                className={`rounded hover:bg-gray-100 transition-colors ${!canRedo ? 'opacity-40 cursor-not-allowed' : ''}`}
                title="Redo"
              >
                <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.3691 18.3105H9.36914C6.60914 18.3105 4.36914 16.0705 4.36914 13.3105C4.36914 10.5505 6.60914 8.31055 9.36914 8.31055H20.3691" stroke="#292D32" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.0703 10.8095L20.6303 8.24945L18.0703 5.68945" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button 
                onClick={() => toast.success('Palette downloaded!')} 
                style={{
                  display padding alignItems gap }}
                className="rounded hover:bg-gray-100 transition-colors"
                title="Export palette"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.32031 6.49945L11.8803 3.93945L14.4403 6.49945" stroke="#292D32" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11.8809 14.1798V4.00977" stroke="#292D32" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 12C4 16.42 7 20 12 20C17 20 20 16.42 20 12" stroke="#292D32" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content - remove toolbar and adjust spacing */}
      <div className="w-full flex-1 flex flex-col"
        style={{
          maxWidth: '100%',
          overflow height - 80px)', // Subtract header height to ensure consistent sizing
          background: '#FFFFFF',
          border }}>
        <main className="flex flex-1 pb-4 overflow-hidden h-full" style={{ border }}>
          {/* Color palette section - Takes full height with top margin */}
          <div className="flex-1 ml-4 overflow-hidden flex">
            {/* DnD Context for drag and drop functionality */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={colorIds.slice(0, randomColors.length)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 auto-rows-fr overflow-hidden w-full h-full">
                  {randomColors.map((color, index) => {
                    const itemId = colorIds[index] || `color-${index}`;
                    const isBeingDragged = activeId === itemId;
                    
                    return (
                      <SortableColorItem
                        key={itemId}
                        id={itemId}
                        color={color}
                        index={index}
                        onColorClick={handleColorClick}
                        onEditClick={handleEditClick}
                        isFirst={index === 0}
                        isLast={index === randomColors.length - 1}
                        isDragging={isBeingDragged}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
          
          {/* Chat panel - Fixed width (338px) on the right */}
          <div className="w-[338px] flex-shrink-0 h-full overflow-hidden relative" style={{ border }}>
            <ChatPanel
              messages={adviceMessages}
              onAskForAdvice={handleAskForAdvice}
              onGeneratePalette={handleGenerateRandom}
              onUndo={handleUndo}
              onRedo={handleRedo}
            />
          </div>
        </main>
      </div>
      
      {/* Keep all the modals and notifications */}) {colorPickerVisible && (
        createPortal(
          <div className="fixed inset-0 z-50 pointer-events-none">
            <ColorPickerModal
              color={currentEditingColor}
              onClose={handleCloseColorPicker}
              onChange={handleColorChange}
              anchorPosition={colorPickerPosition}
            />
          </div>,
          document.body
        )
      )}
      
      <Toaster position="bottom-center" />
    </div>
  );
}