'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiArrowRight, FiChevronDown, FiCopy, FiX, FiEdit2, FiMove, FiArrowLeft, FiDownload } from 'react-icons/fi';
import { toast, Toaster } from 'react-hot-toast';
import tinycolor from 'tinycolor2';
import { analyzeColorPalette } from '../lib/utils/colorAnalysisNew';
import { HarmonyType } from '../lib/utils/enhancedColorGeneration';
import { generateColorPalette } from '../lib/utils';
import { generateBeautifulPalette } from '../lib/utils/enhancedPaletteGeneration';
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
import BobbyIcon from './assets/bobby.svg';
import ColorControls from './components/ui/ColorControls';
import { addDocument } from '../lib/firebase/firebaseUtils';
import { MobileNavigation } from './components/ui/MobileNavigation';

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

// Define proper types for tinycolor
interface TinyColorInstance {
  toHexString: () => string;
  toHsl: () => {h: number; s: number; l: number};
  toHsv: () => {h: number; s: number; v: number};
  toRgb: () => {r: number; g: number; b: number};
}

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
  onColorClick: (color: string) => void;
  onEditClick: (color: string, index: number, event: React.MouseEvent) => void;
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
    animateLayoutChanges: () => false // Disable dnd-kit's layout animations
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : undefined, // Only apply transition during drag, not on drop
  };
  
  const isDark = tinycolor(color).isDark();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex-grow flex items-end justify-between p-4 cursor-pointer hover:opacity-95 relative ${
        isFirst ? 'rounded-t-[16px]' : 
        isLast ? 'rounded-b-[16px]' : 
        'rounded-none'
      } ${isDragging ? 'z-10' : 'z-0'}`}
      onClick={() => onColorClick(color)}
      {...attributes}
    >
      <motion.div 
        layout={isDragging}
        initial={false}
        style={{
          backgroundColor: color,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
          boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.15)' : 'none',
        }}
        animate={{ 
          scale: isDragging ? 1.02 : 1,
        }}
        transition={{ 
          type: "spring",
          bounce: 0.2,
          duration: 0.3,
        }}
        className={`${
          isFirst ? 'rounded-t-[16px]' : 
          isLast ? 'rounded-b-[16px]' : 
          'rounded-none'
        }`}
      />

      <span className={`font-mono text-sm ${isDark ? 'text-white' : 'text-black'} relative z-10`} style={{
        fontFamily: 'Inter, monospace',
        fontSize: '14px',
        fontWeight: 500
      }}>
        {color.toUpperCase()}
      </span>
      
      <div className="flex items-center space-x-3 relative z-10">
        {/* Edit button */}
        <button
          onClick={(e) => onEditClick(color, index, e)}
          className={`w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors`}
          title="Edit color"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${isDark ? 'text-white' : 'text-black'}`}>
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
          </svg>
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
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${isDark ? 'text-white' : 'text-black'}`}>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
          </svg>
        </button>
        
        {/* Drag handle */}
        <button
          {...listeners}
          className={`w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          title="Drag to reorder"
        >
          <span className={`${isDark ? 'text-white' : 'text-black'} text-xs font-bold`}>↕</span>
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
  onClose: () => void;
  onChange: (color: string) => void;
  anchorPosition?: { x: number, y: number };
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [hexValue, setHexValue] = useState(color.toUpperCase());
  const initialColorRef = useRef(color);
  const [activeTab, setActiveTab] = useState<'hex' | 'hsl' | 'hsb'>('hex');
  
  // Parse color to HSL and HSB values
  const tc = tinycolor(hexValue) as unknown as TinyColorInstance;
  const [hslValues, setHslValues] = useState(tc.toHsl());
  const [hsbValues, setHsbValues] = useState(tc.toHsv());
  
  // Update HSL/HSB values when hex changes
  useEffect(() => {
    const color = tinycolor(hexValue) as unknown as TinyColorInstance;
    setHslValues(color.toHsl());
    setHsbValues(color.toHsv());
  }, [hexValue]);
  
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
    // Update HSL and HSB values
    const tc = tinycolor(newColor) as unknown as TinyColorInstance;
    setHslValues(tc.toHsl());
    setHsbValues(tc.toHsv());
    // Update the color in real-time, but don't add to history
    onChange(newColor);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHexValue(e.target.value);
    // Update in real-time if it's a valid hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
      const tc = tinycolor(e.target.value) as unknown as TinyColorInstance;
      setHslValues(tc.toHsl());
      setHsbValues(tc.toHsv());
      onChange(e.target.value);
    }
  };
  
  // HSL slider handlers
  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = parseInt(e.target.value);
    const newHsl = { ...hslValues, h: newHue };
    setHslValues(newHsl);
    const newColor = tinycolor(newHsl as any).toHexString().toUpperCase();
    setHexValue(newColor);
    setHsbValues((tinycolor(newColor) as unknown as TinyColorInstance).toHsv());
    onChange(newColor);
  };

  const handleSaturationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSaturation = parseFloat(e.target.value) / 100;
    const newHsl = { ...hslValues, s: newSaturation };
    setHslValues(newHsl);
    const newColor = tinycolor(newHsl as any).toHexString().toUpperCase();
    setHexValue(newColor);
    setHsbValues((tinycolor(newColor) as unknown as TinyColorInstance).toHsv());
    onChange(newColor);
  };

  const handleLightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLightness = parseFloat(e.target.value) / 100;
    const newHsl = { ...hslValues, l: newLightness };
    setHslValues(newHsl);
    const newColor = tinycolor(newHsl as any).toHexString().toUpperCase();
    setHexValue(newColor);
    setHsbValues((tinycolor(newColor) as unknown as TinyColorInstance).toHsv());
    onChange(newColor);
  };

  // HSB slider handlers
  const handleHsvHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = parseInt(e.target.value);
    const newHsv = { ...hsbValues, h: newHue };
    setHsbValues(newHsv);
    const newColor = tinycolor(newHsv as any).toHexString().toUpperCase();
    setHexValue(newColor);
    setHslValues((tinycolor(newColor) as unknown as TinyColorInstance).toHsl());
    onChange(newColor);
  };

  const handleSaturationBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSaturation = parseFloat(e.target.value) / 100;
    const newHsv = { ...hsbValues, s: newSaturation };
    setHsbValues(newHsv);
    const newColor = tinycolor(newHsv as any).toHexString().toUpperCase();
    setHexValue(newColor);
    setHslValues((tinycolor(newColor) as unknown as TinyColorInstance).toHsl());
    onChange(newColor);
  };

  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBrightness = parseFloat(e.target.value) / 100;
    const newHsv = { ...hsbValues, v: newBrightness };
    setHsbValues(newHsv);
    const newColor = tinycolor(newHsv as any).toHexString().toUpperCase();
    setHexValue(newColor);
    setHslValues((tinycolor(newColor) as unknown as TinyColorInstance).toHsl());
    onChange(newColor);
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
    const tc = tinycolor(initialColorRef.current) as unknown as TinyColorInstance;
    setHslValues(tc.toHsl());
    setHsbValues(tc.toHsv());
    onChange(initialColorRef.current);
  };
  
  // Get the background style for slider tracks
  const getHueGradient = () => {
    return {
      background: `linear-gradient(to right, 
        rgb(255, 0, 0), 
        rgb(255, 255, 0), 
        rgb(0, 255, 0), 
        rgb(0, 255, 255), 
        rgb(0, 0, 255), 
        rgb(255, 0, 255), 
        rgb(255, 0, 0))`
    };
  };

  const getSaturationGradient = () => {
    // Fixed hue and lightness, varying saturation
    const hue = hslValues.h;
    const lightness = hslValues.l;
    return {
      background: `linear-gradient(to right, 
        ${tinycolor({h: hue, s: 0, l: lightness} as any).toHexString()}, 
        ${tinycolor({h: hue, s: 1, l: lightness} as any).toHexString()})`
    };
  };

  const getLightnessGradient = () => {
    // Fixed hue and saturation, varying lightness
    const hue = hslValues.h;
    const saturation = hslValues.s;
    return {
      background: `linear-gradient(to right, 
        ${tinycolor({h: hue, s: saturation, l: 0} as any).toHexString()}, 
        ${tinycolor({h: hue, s: saturation, l: 0.5} as any).toHexString()}, 
        ${tinycolor({h: hue, s: saturation, l: 1} as any).toHexString()})`
    };
  };

  const getHsvSaturationGradient = () => {
    // Fixed hue and value, varying saturation
    const hue = hsbValues.h;
    const value = hsbValues.v;
    return {
      background: `linear-gradient(to right, 
        ${tinycolor({h: hue, s: 0, v: value} as any).toHexString()}, 
        ${tinycolor({h: hue, s: 1, v: value} as any).toHexString()})`
    };
  };

  const getBrightnessGradient = () => {
    // Fixed hue and saturation, varying value (brightness)
    const hue = hsbValues.h;
    const saturation = hsbValues.s;
    return {
      background: `linear-gradient(to right, 
        ${tinycolor({h: hue, s: saturation, v: 0} as any).toHexString()}, 
        ${tinycolor({h: hue, s: saturation, v: 1} as any).toHexString()})`
    };
  };
  
  const getModalStyle = () => {
    if (anchorPosition) {
      // Calculate viewport-relative positions
      const viewportHeight = window.innerHeight;
      const topPosition = anchorPosition.y;
      
      // Check if there's enough space below
      const modalHeight = 450; // Increased height for the added sliders
      const spaceBelow = viewportHeight - topPosition;
      
      // If not enough space below, position above
      if (spaceBelow < modalHeight + 20) {
        return {
          position: 'fixed', // Use fixed instead of absolute
          left: `${anchorPosition.x}px`,
          bottom: `${viewportHeight - topPosition + 10}px`, // Position above the button
          transform: 'translateX(-50%)',
          zIndex: 100,
          maxHeight: `${topPosition - 20}px`, // Limit height to available space
          overflowY: 'auto' // Add scroll to the modal itself if needed
        } as React.CSSProperties;
      }
      
      // Default position below
      return {
        position: 'fixed', // Use fixed instead of absolute
        left: `${anchorPosition.x}px`,
        top: `${topPosition + 10}px`,
        transform: 'translateX(-50%)',
        zIndex: 100,
        maxHeight: `${spaceBelow - 20}px`, // Limit height to available space
        overflowY: 'auto' // Add scroll to the modal itself if needed
      } as React.CSSProperties;
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
        {/* Tabs for switching between color models */}
        <div className="flex mb-3 border-b">
          <button
            onClick={() => setActiveTab('hex')}
            className={`py-2 px-3 text-sm font-medium ${activeTab === 'hex' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Hex
          </button>
          <button
            onClick={() => setActiveTab('hsl')}
            className={`py-2 px-3 text-sm font-medium ${activeTab === 'hsl' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            HSL
          </button>
          <button
            onClick={() => setActiveTab('hsb')}
            className={`py-2 px-3 text-sm font-medium ${activeTab === 'hsb' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            HSB
          </button>
        </div>

        {/* Hex input (shown when hex tab is active) */}
        {activeTab === 'hex' && (
          <>
            <h3 className="text-base font-medium mb-2">Hex Color</h3>
            <input
              type="text"
              value={hexValue}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mb-2"
            />
          </>
        )}

        {/* HSL sliders (shown when HSL tab is active) */}
        {activeTab === 'hsl' && (
          <div className="space-y-3">
            <h3 className="text-base font-medium mb-3">HSL Color</h3>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-gray-700">Hue: {Math.round(hslValues.h)}°</label>
              </div>
              <input
                type="range"
                min="0"
                max="359"
                value={Math.round(hslValues.h)}
                onChange={handleHueChange}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={getHueGradient()}
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-gray-700">Saturation: {Math.round(hslValues.s * 100)}%</label>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(hslValues.s * 100)}
                onChange={handleSaturationChange}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={getSaturationGradient()}
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-gray-700">Lightness: {Math.round(hslValues.l * 100)}%</label>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(hslValues.l * 100)}
                onChange={handleLightnessChange}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={getLightnessGradient()}
              />
            </div>
          </div>
        )}

        {/* HSB/HSV sliders (shown when HSB tab is active) */}
        {activeTab === 'hsb' && (
          <div className="space-y-3">
            <h3 className="text-base font-medium mb-3">HSB Color</h3>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-gray-700">Hue: {Math.round(hsbValues.h)}°</label>
              </div>
              <input
                type="range"
                min="0"
                max="359"
                value={Math.round(hsbValues.h)}
                onChange={handleHsvHueChange}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={getHueGradient()}
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-gray-700">Saturation: {Math.round(hsbValues.s * 100)}%</label>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(hsbValues.s * 100)}
                onChange={handleSaturationBrightnessChange}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={getHsvSaturationGradient()}
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-gray-700">Brightness: {Math.round(hsbValues.v * 100)}%</label>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(hsbValues.v * 100)}
                onChange={handleBrightnessChange}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={getBrightnessGradient()}
              />
            </div>
          </div>
        )}

        {/* Color picker is always shown regardless of the active tab */}
        <div className="mt-3">
          <HexColorPicker color={hexValue} onChange={handleColorChange} className="w-full" />
        </div>
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
  
  // Add a flag to track if advice has been given for the current palette
  const [adviceGivenForCurrentPalette, setAdviceGivenForCurrentPalette] = useState<boolean>(false);
  
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
  
  // For drag animation
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(KeyboardSensor, { 
      coordinateGetter: sortableKeyboardCoordinates
    })
  );
  
  // Create a directly managed history
  const [paletteHistory, setPaletteHistory] = useState<string[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // State for selected harmony type and advanced options
  const [selectedHarmonyType, setSelectedHarmonyType] = useState<HarmonyType>('analogous');
  const [showHarmonyOptions, setShowHarmonyOptions] = useState(false);
  
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
    
    // Use a pleasant blue as the base color
    const baseColor = '#4080FF';
    
    // Generate initial palette using the enhanced beautiful palette generator
    const initialColors = generateBeautifulPalette(baseColor, {
      harmonyType: 'analogous',
      count: 5,
      saturationStyle: 'balanced',
      toneProfile: 'balanced'
    }).map(color => color.hex);
    
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
          id: '1',
          text: 'Press Enter to generate palettes, or click Ask Bobby for advice',
          icon: <Image src={BobbyIcon} alt="Bobby" width={36} height={36} />
        }
      ]);
    }, 1000);
    
    // Set up the initial analysis
    const analysis = analyzeColorPalette(initialColors);
    (window as any).__latestAnalysis = {
      advice: analysis.advice,
      score: analysis.score
    };
    
    // Mark initialization as complete
    hasInitializedRef.current = true;
    
    console.log("Initial palette generated and history initialized");
    
    return () => {
      clearTimeout(timer);
      clearTimeout(messageTimer);
    };
  }, []);
  
  // Handle key press for generating new palette
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle Enter key presses that aren't inside input fields
      if (event.key === 'Enter' && 
          !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) {
        event.preventDefault(); // Prevent default form submission
        
        // Select a random harmony type for variety when using Enter key
        const harmonyTypes: HarmonyType[] = [
          'analogous', 'monochromatic', 'triad', 'complementary', 
          'splitComplementary', 'tetrad', 'square'
        ];
        const randomType = harmonyTypes[Math.floor(Math.random() * harmonyTypes.length)];
        
        // Generate a truly random base color
        const randomHue = Math.floor(Math.random() * 360);
        const randomSat = 70 + Math.floor(Math.random() * 30); // 70-100% saturation 
        const randomLit = 45 + Math.floor(Math.random() * 20); // 45-65% lightness
        const baseColor = tinycolor(`hsl(${randomHue}, ${randomSat}%, ${randomLit}%)`).toHexString();
        
        // Use random saturation style and tone profile for more variety
        const satStyles = ['muted', 'balanced', 'vibrant'];
        const toneProfiles = ['light', 'balanced', 'dark'];
        const randomSatStyle = satStyles[Math.floor(Math.random() * satStyles.length)];
        const randomToneProfile = toneProfiles[Math.floor(Math.random() * toneProfiles.length)];
        
        // Generate new random colors using the beautiful palette generator
        const newColors = generateBeautifulPalette(baseColor, {
          harmonyType: randomType,
          count: 5,
          saturationStyle: randomSatStyle as any,
          toneProfile: randomToneProfile as any
        }).map(color => color.hex);
        
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
        
        console.log(`Enter key: Generated ${randomType} palette with ${randomSatStyle} saturation and ${randomToneProfile} tone profile`);
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
      // Select a random harmony type for variety
      const harmonyTypes: HarmonyType[] = [
        'analogous', 'monochromatic', 'triad', 'complementary', 
        'splitComplementary', 'tetrad', 'square'
      ];
      const randomType = harmonyTypes[Math.floor(Math.random() * harmonyTypes.length)];
      
      // NEW: Add variety to base color generation with different methods
      const colorMethods = [
        'full-random',     // Completely random (35% chance)
        'hue-based',       // Based on random hue with controlled S/L (30% chance)
        'weighted-hues',   // Use weighted hue ranges for more appealing colors (25% chance)
        'color-theory'     // Use color theory principles (10% chance)
      ];
      
      const methodChoice = Math.random();
      let baseColor: string;
      
      if (methodChoice < 0.35) {
        // Full random - RGB based (Most random)
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        baseColor = tinycolor(`rgb(${r}, ${g}, ${b})`).toHexString();
      } 
      else if (methodChoice < 0.65) {
        // Hue based with controlled saturation and lightness
        const randomHue = Math.floor(Math.random() * 360);
        // More variety in saturation and lightness
        const randomSat = 30 + Math.floor(Math.random() * 70); // 30-100% saturation
        const randomLit = 25 + Math.floor(Math.random() * 50); // 25-75% lightness
        baseColor = tinycolor(`hsl(${randomHue}, ${randomSat}%, ${randomLit}%)`).toHexString();
      }
      else if (methodChoice < 0.90) {
        // Weighted hue ranges - favor more naturally attractive hues
        // These ranges correspond to blues, greens, warm colors, etc.
        const hueRanges = [
          { min: 190, max: 240, weight: 0.25 }, // Blues
          { min: 90, max: 150, weight: 0.2 },  // Greens
          { min: 0, max: 30, weight: 0.2 },    // Reds
          { min: 30, max: 60, weight: 0.15 },  // Oranges/Yellows
          { min: 270, max: 330, weight: 0.2 }  // Purples/Magentas
        ];
        
        // Choose a hue range based on weights
        const rangeRandom = Math.random();
        let cumulativeWeight = 0;
        let selectedRange = hueRanges[0];
        
        for (const range of hueRanges) {
          cumulativeWeight += range.weight;
          if (rangeRandom <= cumulativeWeight) {
            selectedRange = range;
            break;
          }
        }
        
        // Generate a random hue within the selected range
        const hue = selectedRange.min + Math.floor(Math.random() * (selectedRange.max - selectedRange.min));
        const sat = 35 + Math.floor(Math.random() * 65); // 35-100% saturation
        const lit = 30 + Math.floor(Math.random() * 40); // 30-70% lightness
        
        baseColor = tinycolor(`hsl(${hue}, ${sat}%, ${lit}%)`).toHexString();
      }
      else {
        // Color theory based - use golden ratio for hue selection
        // Start with a random hue
        const startHue = Math.floor(Math.random() * 360);
        
        // Create a hue using the golden ratio (phi ≈ 0.618033988749895)
        // This produces aesthetically pleasing hue relationships
        const phi = 0.618033988749895;
        const hue = Math.floor((startHue + (360 * phi)) % 360);
        
        // Use more saturated, moderate lightness values for vibrant base colors
        const sat = 60 + Math.floor(Math.random() * 40); // 60-100%
        const lit = 45 + Math.floor(Math.random() * 15); // 45-60%
        
        baseColor = tinycolor(`hsl(${hue}, ${sat}%, ${lit}%)`).toHexString();
      }
      
      // Use random saturation style and tone profile for more variety
      const satStyles = ['muted', 'balanced', 'vibrant'];
      const toneProfiles = ['light', 'balanced', 'dark'];
      const randomSatStyle = satStyles[Math.floor(Math.random() * satStyles.length)];
      const randomToneProfile = toneProfiles[Math.floor(Math.random() * toneProfiles.length)];
      
      // Generate new random colors using the beautiful palette generator with full configuration
      const newColors = generateBeautifulPalette(baseColor, {
        harmonyType: randomType,
        count: 5,
        toneProfile: randomToneProfile as any,
        saturationStyle: randomSatStyle as any
      }).map(color => color.hex);
      
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
      
      console.log(`Button: Generated ${randomType} palette with ${randomSatStyle} saturation and ${randomToneProfile} tone profile`);
      
      // Reset the advice flag when a new palette is generated
      setAdviceGivenForCurrentPalette(false);
    } catch (error) {
      console.error("Error generating random palette:", error);
      toast.error("Failed to generate palette, trying alternative method...");
      
      // Fallback to simpler configuration if the advanced one fails
      try {
        // Use a simple blue base color with default settings
        const fallbackColors = generateBeautifulPalette('#3366FF', {
          harmonyType: 'analogous',
          count: 5,
          saturationStyle: 'balanced',
          toneProfile: 'balanced'
        }).map(color => color.hex);
        
        setRandomColors(fallbackColors);
        const newHistory = paletteHistory.slice(0, historyIndex + 1);
        newHistory.push(fallbackColors);
        setPaletteHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      } catch (fallbackError) {
        console.error("Fallback generation also failed:", fallbackError);
        toast.error("All palette generation methods failed");
      }
    }
  }
  
  // Function to generate palette with specific harmony type
  function handleGenerateWithHarmony(harmonyType: HarmonyType) {
    try {
      // Generate a random base color
      const randomHue = Math.floor(Math.random() * 360);
      const randomSat = 65 + Math.floor(Math.random() * 25); // 65-90% saturation
      const randomLit = 45 + Math.floor(Math.random() * 15); // 45-60% lightness
      const baseColor = tinycolor(`hsl(${randomHue}, ${randomSat}%, ${randomLit}%)`).toHexString();
      
      // Generate new colors with the selected harmony type using the beautiful palette generator
      const newColors = generateBeautifulPalette(baseColor, {
        harmonyType: harmonyType,
        count: 5,
        toneProfile: 'balanced',
        saturationStyle: 'balanced'
      }).map(color => color.hex);
      
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
      
      console.log(`Generated ${harmonyType} palette, now at history position ${newHistory.length - 1}`);
      
      // Close the harmony options dropdown
      setShowHarmonyOptions(false);
      
      // Reset the advice flag when a new palette is generated
      setAdviceGivenForCurrentPalette(false);
    } catch (error) {
      console.error(`Error generating ${harmonyType} palette:`, error);
      toast.error(`Failed to generate ${harmonyType} palette`);
    }
  }
  
  // Add a new advice message only when explicitly requested through the Ask for Advice button
  // instead of whenever randomColorAdvice changes
  const handleAskForAdvice = () => {
    // Get all buttons to find the Ask Bobby button
    const buttons = document.querySelectorAll('button');
    let askBobbyButton: HTMLButtonElement | null = null;
    
    for (let i = 0; i < buttons.length; i++) {
      if (buttons[i].textContent?.includes('Ask Bobby')) {
        askBobbyButton = buttons[i] as HTMLButtonElement;
        break;
      }
    }
    
    // Disable button if found
    if (askBobbyButton) askBobbyButton.disabled = true;
    
    // If advice has already been given for the current palette, don't generate new advice
    if (adviceGivenForCurrentPalette) {
      toast("Bobby has already analyzed this palette. Generate a new palette for more feedback.", {
        duration: 3000,
        icon: '📝',
        style: {
          background: '#f0f9ff',
          color: '#0c4a6e',
          border: '1px solid #bae6fd'
        }
      });
      
      // Re-enable button after a short delay
      setTimeout(() => {
        if (askBobbyButton) {
          askBobbyButton.disabled = false;
        }
      }, 500);
      
      return;
    }
    
    // Use a timeout to ensure state updates don't cause layout shifts
    setTimeout(() => {
      try {
        if ((window as any).__latestAnalysis) {
          // Get the advice and score
          const advice = (window as any).__latestAnalysis.advice;
          const score = (window as any).__latestAnalysis.score;
          
          // Update state in a batched update to prevent multiple renders
          setRandomColorAdvice(advice);
          setRandomScore(score);
          
          // Create and add the new message
          const newMessage: AdviceMessage = {
            id: Date.now().toString(),
            text: advice,
            score: score,
            icon: <Image src={BobbyIcon} alt="Bobby" width={36} height={36} />
          };
          
          setAdviceMessages(prev => [...prev, newMessage]);
          
          // Clear stored analysis after using it
          (window as any).__latestAnalysis = null;
          
          // Set the flag that advice has been given for this palette
          setAdviceGivenForCurrentPalette(true);
        } else {
          // If no stored analysis, generate one now
          const analysis = analyzeColorPalette(randomColors);
          
          // Update state in a batched update
          setRandomColorAdvice(analysis.advice);
          setRandomScore(analysis.score);
          
          // Create and add the new message
          const newMessage: AdviceMessage = {
            id: Date.now().toString(),
            text: analysis.advice,
            score: analysis.score,
            icon: <Image src={BobbyIcon} alt="Bobby" width={36} height={36} />
          };
          
          setAdviceMessages(prev => [...prev, newMessage]);
          
          // Set the flag that advice has been given for this palette
          setAdviceGivenForCurrentPalette(true);
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
        
        // Reset the advice flag when a color is changed
        setAdviceGivenForCurrentPalette(false);
      }
    }
    
    // Reset the editing state
    setCurrentEditingIndex(-1);
  };
  
  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
  };
  
  // Handle drag over for visual feedback
  const handleDragOver = (event: DragOverEvent) => {
    if (event.over) {
      const overId = event.over.id as string;
      const overIdx = colorIds.indexOf(overId);
      setOverIndex(overIdx);
    } else {
      setOverIndex(null);
    }
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
        
        // Immediately update UI without animation
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
        
        // Reset the advice flag when colors are rearranged
        setAdviceGivenForCurrentPalette(false);
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
      (window as any).__latestAnalysis = {
        advice: analysis.advice,
        score: analysis.score
      };
      
      // Reset the advice flag when undoing
      setAdviceGivenForCurrentPalette(false);
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
      (window as any).__latestAnalysis = {
        advice: analysis.advice,
        score: analysis.score
      };
      
      // Reset the advice flag when redoing
      setAdviceGivenForCurrentPalette(false);
    }
  };
  
  const handleExportPalette = () => {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      toast.error('Your browser does not support canvas export');
      return;
    }
    
    // Get device pixel ratio for high-resolution export
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas dimensions - vertical layout with higher resolution
    const colorCount = randomColors.length;
    const baseWidth = 800; // Increased base width
    const baseHeight = colorCount * 200; // Increased height per color
    
    // Set display size (css pixels)
    canvas.style.width = baseWidth + 'px';
    canvas.style.height = baseHeight + 'px';
    
    // Set actual size in memory (scaled for higher resolution)
    canvas.width = baseWidth * dpr;
    canvas.height = baseHeight * dpr;
    
    // Scale all drawing operations by the dpr
    ctx.scale(dpr, dpr);
    
    // Draw color boxes in a column (vertical) layout
    randomColors.forEach((color, index) => {
      const y = index * (baseHeight / colorCount);
      const colorHeight = baseHeight / colorCount;
      
      // Draw color box
      ctx.fillStyle = color;
      ctx.fillRect(0, y, baseWidth, colorHeight);
      
      // Draw color code with white text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Inter, monospace'; // Larger font
      ctx.textAlign = 'left';
      
      // Add shadow to text for better visibility on any background
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      // Draw text with more padding from the edge
      ctx.fillText(color.toUpperCase(), 40, y + colorHeight - 40);
      
      // Reset shadow for next operations
      ctx.shadowColor = 'transparent';
    });
    
    // Convert canvas to data URL with maximum quality
    try {
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      
      // Create download link
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `color-palette-${timestamp}.png`;
      link.href = dataUrl;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('Error exporting palette:', err);
      toast.error('Failed to export palette');
    }
  };
  
  // Function to handle advanced color generation with user-provided options
  function handleAdvancedGeneration(options: {
    harmonyType: HarmonyType;
    temperature: 'warm' | 'cool' | 'mixed';
    contrastEnhance: boolean;
    randomize: number;
    highContrast?: boolean;
    usePastels?: boolean;
  }) {
    try {
      // Generate a base color with appropriate temperature bias
      let baseHue: number;
      if (options.temperature === 'warm') {
        // Warm colors are in the red-yellow-orange spectrum (0-60 or 300-359)
        baseHue = Math.random() < 0.8 ? 
          Math.floor(Math.random() * 60) : // 80% chance of red-yellow (0-60)
          300 + Math.floor(Math.random() * 60); // 20% chance of purple-red (300-359)
      } else if (options.temperature === 'cool') {
        // Cool colors are in the blue-green-purple spectrum (180-300)
        baseHue = 180 + Math.floor(Math.random() * 120);
      } else {
        // Mixed can be any hue
        baseHue = Math.floor(Math.random() * 360);
      }
      
      // Create a saturated base color with the chosen hue
      const baseColor = tinycolor(`hsl(${baseHue}, 80%, 50%)`).toHexString();
      
      // Determine tone profile and saturation style based on options
      let toneProfile: 'light' | 'balanced' | 'dark' = 'balanced';
      let saturationStyle: 'muted' | 'balanced' | 'vibrant' = 'balanced';
      
      if (options.highContrast) {
        toneProfile = 'dark';
        saturationStyle = 'vibrant';
      } else if (options.usePastels) {
        toneProfile = 'light';
        saturationStyle = 'muted';
      } else {
        // Default processing
        if (options.temperature === 'warm') {
          toneProfile = Math.random() < 0.7 ? 'dark' : 'balanced';
          saturationStyle = options.contrastEnhance ? 'vibrant' : 'balanced';
        } else if (options.temperature === 'cool') {
          toneProfile = Math.random() < 0.7 ? 'light' : 'balanced';
          saturationStyle = options.contrastEnhance ? 'vibrant' : 'balanced';
        } else {
          // For mixed, use the randomize value to determine variety
          const varietyFactor = options.randomize;
          if (varietyFactor < 0.3) {
            // Low randomization - conservative, balanced palette
            toneProfile = 'balanced';
            saturationStyle = 'balanced';
          } else if (varietyFactor < 0.7) {
            // Medium randomization - some variety
            toneProfile = Math.random() < 0.5 ? 'light' : 'dark';
            saturationStyle = 'balanced';
          } else {
            // High randomization - full variety
            const profiles = ['light', 'balanced', 'dark'];
            const satStyles = ['muted', 'balanced', 'vibrant'];
            toneProfile = profiles[Math.floor(Math.random() * profiles.length)] as any;
            saturationStyle = satStyles[Math.floor(Math.random() * satStyles.length)] as any;
          }
        }
      }
      
      // Generate beautiful palette with all our carefully selected parameters
      const newColors = generateBeautifulPalette(baseColor, {
        harmonyType: options.harmonyType,
        count: 5,
        toneProfile: toneProfile,
        saturationStyle: saturationStyle
      }).map(color => color.hex);
      
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
      
      toast.success(`Generated ${options.harmonyType} palette with ${toneProfile} tones and ${saturationStyle} saturation`);
      console.log(`Generated advanced palette with ${options.harmonyType} harmony`);
    } catch (error) {
      console.error("Error generating advanced palette:", error);
      toast.error("Failed to generate palette");
    }
  }
  
  // Update the handleSavePalette function to save to Firestore instead of localStorage
  const handleSavePalette = async () => {
    // Get the current palette
    const paletteToSave = [...randomColors];
    
    try {
      // Show immediate feedback to improve perceived performance
      toast.success('Palette saved!');
      
      // Create a new palette object
      const newPalette = {
        colors: paletteToSave,
        createdAt: new Date().toISOString(),
        likes: 1 // Start with 1 like since the creator likes it
      };
      
      // Generate a temporary ID for localStorage
      const tempId = 'temp_' + Date.now();
      
      // Update localStorage first for immediate response
      const savedPalettes = JSON.parse(localStorage.getItem('savedPalettes') || '[]');
      const likedPalettes = JSON.parse(localStorage.getItem('likedPalettes') || '[]');
      
      // Add to localStorage with temporary ID
      savedPalettes.push({
        id: tempId,
        colors: paletteToSave,
        createdAt: new Date().toISOString()
      });
      
      likedPalettes.push(tempId);
      
      // Save to localStorage immediately
      localStorage.setItem('savedPalettes', JSON.stringify(savedPalettes));
      localStorage.setItem('likedPalettes', JSON.stringify(likedPalettes));
      
      // Now save to Firebase in the background (don't await)
      addDocument('palettes', newPalette)
        .then(result => {
          const firestoreId = result.id;
          console.log('Saved palette with Firestore ID:', firestoreId);
          
          // Update the localStorage entries with the real Firebase ID
          const updatedPalettes = savedPalettes.map(palette => 
            palette.id === tempId ? { ...palette, id: firestoreId } : palette
          );
          
          const updatedLikedPalettes = likedPalettes.map(id => 
            id === tempId ? firestoreId : id
          );
          
          // Update localStorage with the real IDs
          localStorage.setItem('savedPalettes', JSON.stringify(updatedPalettes));
          localStorage.setItem('likedPalettes', JSON.stringify(updatedLikedPalettes));
        })
        .catch(error => {
          console.error('Background Firebase save failed:', error);
          // Don't show error to user since localStorage save succeeded
        });
      
    } catch (error) {
      console.error('Error saving palette:', error);
      toast.error('Failed to save palette. Please try again.');
    }
  };
  
  // Render the new UI
  return (
    <div className="h-screen flex flex-col bg-white max-w-full overflow-hidden">
      <header className="bg-white py-4 flex-shrink-0">
        <div className="flex items-center justify-between w-full px-4">
          <div className="flex-shrink-0">
            <Logo />
          </div>
          
          <div className="flex-shrink-0">
            <div className="hidden md:block">
              <Navigation />
            </div>
            <div className="md:hidden">
              <MobileNavigation />
            </div>
          </div>
          
          <div className="hidden md:flex justify-end space-x-3 flex-shrink-0">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`flex items-center px-3 py-2 rounded-full border border-[#E5E5E5] hover:bg-gray-50 transition-colors ${!canUndo ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} h-10`}
              title="Undo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 14L4 9l5-5"/>
                <path d="M4 9h11a4 4 0 0 1 0 8h-1"/>
              </svg>
            </button>
            
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`flex items-center px-3 py-2 rounded-full border border-[#E5E5E5] hover:bg-gray-50 transition-colors ${!canRedo ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} h-10`}
              title="Redo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 14l5-5-5-5"/>
                <path d="M20 9H9a4 4 0 0 0 0 8h1"/>
              </svg>
            </button>
            
            <button
              onClick={handleSavePalette}
              className="flex items-center px-3 py-2 rounded-full border border-[#E5E5E5] hover:bg-gray-50 transition-colors h-10"
              title="Save palette"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span className="ml-2 hidden lg:inline">Save</span>
            </button>
            
            <button
              onClick={handleExportPalette}
              className="flex items-center px-3 py-2 rounded-full border border-[#E5E5E5] hover:bg-gray-50 transition-colors h-10"
              title="Export palette as image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span className="ml-2 hidden lg:inline">Download</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile action buttons - top row (now hidden since moved to bottom) */}
      <div className="md:hidden hidden justify-between gap-2 px-4 mt-2 mb-4">
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className={`w-[32px] h-[32px] flex items-center justify-center rounded-full border border-[#E5E5E5] ${!canUndo ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          title="Undo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 14L4 9l5-5"/>
            <path d="M4 9h11a4 4 0 0 1 0 8h-1"/>
          </svg>
        </button>
        
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          className={`w-[32px] h-[32px] flex items-center justify-center rounded-full border border-[#E5E5E5] ${!canRedo ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          title="Redo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 14l5-5-5-5"/>
            <path d="M20 9H9a4 4 0 0 0 0 8h1"/>
          </svg>
        </button>
        
        <button
          onClick={handleSavePalette}
          className="w-[32px] h-[32px] flex items-center justify-center rounded-full border border-[#E5E5E5]"
          title="Save palette"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
        
        <button
          onClick={handleExportPalette}
          className="w-[32px] h-[32px] flex items-center justify-center rounded-full border border-[#E5E5E5]"
          title="Export palette as image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>
      
      {/* Desktop layout */}
      <main className="hidden md:flex flex-1 overflow-hidden h-full pb-4">
        {/* Color palette section - Takes full height */}
        <div className="flex-1 overflow-hidden flex pl-4">
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
        
        {/* Chat panel - Fixed width on desktop */}
        <div className="w-[338px] flex-shrink-0 h-full overflow-hidden relative">
          <ChatPanel
            messages={adviceMessages}
            onAskForAdvice={handleAskForAdvice}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />
        </div>
      </main>
      
      {/* Mobile layout */}
      <div className="mobile-palette-container md:hidden">
        {randomColors.length > 0 ? (
          <>
            <div className="mobile-colors-grid"> 
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
                  <div className="mobile-colors-grid">
                    {randomColors.map((color, index) => {
                      const itemId = colorIds[index] || `color-${index}`;
                      const isBeingDragged = activeId === itemId;
                      
                      return (
                        <MobileSortableColorItem
                          key={itemId}
                          id={itemId}
                          color={color}
                          index={index}
                          onColorClick={handleColorClick}
                          onEditClick={handleEditClick}
                          isDragging={isBeingDragged}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          
            <div className="mobile-rating-box">
              <div className="flex items-start p-2.5">
                <div className="flex-shrink-0 mr-2">
                  <Image src={BobbyIcon} alt="Bobby" width={28} height={28} />
                </div>
                <div>
                  <div className="flex items-center mb-0.5">
                    <span className="font-medium text-xs">Rating: </span>
                    <span className="ml-1 text-blue-500 font-medium text-xs">{randomScore ? `${randomScore.toFixed(1)}/10` : '7.2/10'}</span>
                  </div>
                  <p className="text-sm leading-tight text-gray-700" style={{ fontSize: '14px' }}>
                    {randomColorAdvice || "The colors are generally well-chosen, but one feels slightly off. Try tweaking it for better balance. Try creating more variety in lightness values for better visual hierarchy."}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action buttons (undo, redo, save, download) */}
            <div className="mobile-action-buttons">
              <div className="grid grid-cols-4 gap-2">
                <button 
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className={`rounded-full bg-white border border-gray-200 flex items-center justify-center ${!canUndo ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 14L4 9l5-5"/>
                    <path d="M4 9h11a4 4 0 0 1 0 8h-1"/>
                  </svg>
                </button>
                <button 
                  onClick={handleRedo}
                  disabled={!canRedo}
                  className={`rounded-full bg-white border border-gray-200 flex items-center justify-center ${!canRedo ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 14l5-5-5-5"/>
                    <path d="M20 9H9a4 4 0 0 0 0 8h1"/>
                  </svg>
                </button>
                <button 
                  onClick={handleSavePalette}
                  className="rounded-full bg-white border border-gray-200 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>
                <button 
                  onClick={handleExportPalette}
                  className="rounded-full bg-white border border-gray-200 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 p-4">
            <div className="flex items-center justify-center w-16 h-16 mb-3">
              <Image src={BobbyIcon} alt="Bobby" width={60} height={60} />
            </div>
            <p className="text-center text-gray-500 text-sm mb-4">
              Press Enter to generate palettes, or click Ask Bobby for advice
            </p>
          </div>
        )}
        
        {/* Bottom buttons */}
        <div className="mobile-bottom-buttons">
          <div className="flex gap-2">
            <button
              onClick={handleAskForAdvice}
              className="w-full flex items-center justify-center px-3 py-1 rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
            >
              <span className="text-xs font-medium">Ask Bobby</span>
            </button>
            <button
              onClick={handleGenerateRandom}
              className="w-full flex items-center justify-center px-3 py-1 rounded-full bg-black text-white hover:bg-gray-800 transition-colors"
            >
              <span className="text-xs font-medium">Generate</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Keep all the modals and notifications */}
      {colorPickerVisible && (
        <ColorPickerModal
          color={currentEditingColor}
          onClose={handleCloseColorPicker}
          onChange={handleColorChange}
          anchorPosition={colorPickerPosition}
        />
      )}
      
      <Toaster position="bottom-center" />
    </div>
  );
}

// Mobile Sortable Color Item
const MobileSortableColorItem = ({
  id,
  color,
  index,
  onColorClick,
  onEditClick,
  isDragging
}: {
  id: string;
  color: string;
  index: number;
  onColorClick: (color: string) => void;
  onEditClick: (color: string, index: number, event: React.MouseEvent) => void;
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
    animateLayoutChanges: () => false
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : undefined,
    backgroundColor: color,
    position: 'relative' as const,
    flex: '1 1 0%',
    touchAction: 'none', // Improve touch handling
  };
  
  const isDark = tinycolor(color).isDark();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mobile-color-item ${isDragging ? 'z-10' : 'z-0'}`}
      {...attributes}
    >
      <div
        className="flex items-center justify-between w-full h-full"
        style={{ 
          boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.15)' : 'none',
        }}
        onClick={() => onColorClick(color)}
      >
        <span className="font-mono text-sm ml-4" style={{ color: isDark ? 'white' : 'black' }}>
          {color.toUpperCase()}
        </span>
        <div className="flex space-x-1 mr-4">
          {/* Edit button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditClick(color, index, e as React.MouseEvent);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors"
            style={{ color: isDark ? 'white' : 'black' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
          </button>
          
          {/* Copy button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(color);
              toast.success(`Copied ${color.toUpperCase()} to clipboard`);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors"
            style={{ color: isDark ? 'white' : 'black' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
            </svg>
          </button>
          
          {/* Drag handle - Using SVG instead of text character for consistency */}
          <button
            {...listeners}
            className={`w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            title="Drag to reorder"
            style={{ color: isDark ? 'white' : 'black' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="16" y2="6"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
              <line x1="8" y1="18" x2="16" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};