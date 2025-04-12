'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import tinycolor from 'tinycolor2';
import { HexColorPicker } from 'react-colorful';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'react-hot-toast';

interface ColorDisplayProps {
  colors: string[];
  onColorSelect?: (color: string) => void;
  onColorsChange?: (colors: string[]) => void;
  allowEdit?: boolean;
  maxColors?: number;
  randomSection?: boolean;
}

// Custom hook to track base color with proper update behavior
function useBaseColor(colors: string[], randomSection: boolean) {
  const [baseColor, setBaseColor] = useState<string | null>(null);
  const isInitialized = useRef(false);
  const initialBaseColor = useRef<string | null>(null);

  // On first render, set the base color to the first color
  useEffect(() => {
    if (!isInitialized.current && colors.length > 0) {
      console.log('Initializing base color to:', colors[0]);
      setBaseColor(colors[0]);
      initialBaseColor.current = colors[0];
      isInitialized.current = true;
    }
  }, [colors]);

  // If the parent component changes the base color directly (through input),
  // update our base color tracking
  useEffect(() => {
    if (!randomSection && isInitialized.current && colors.length > 0) {
      // If our base color is not in the array anymore, the parent must have changed it
      if (baseColor && !colors.includes(baseColor)) {
        console.log('Base color changed by parent from:', baseColor, 'to:', colors[0]);
        setBaseColor(colors[0]);
        initialBaseColor.current = colors[0];
      }
    }
  }, [colors, baseColor, randomSection]);

  return [baseColor, setBaseColor, initialBaseColor] as const;
}

// Sortable color item component
const SortableColorItem = ({ 
  id, 
  hexColor, 
  index, 
  totalColors,
  onColorClick,
  onDeleteClick,
  onAddBetween,
  allowEdit,
  maxColors,
  hoverIndex,
  copiedIndex,
  onMouseEnter,
  onColorChange,
  onShowPicker,
  setCopiedIndex,
  onCopyClick,
  randomSection = false,
  isBaseColor = false
}: {
  id: string;
  hexColor: string;
  index: number;
  totalColors: number;
  onColorClick: (color: string) => void;
  onDeleteClick: (e: React.MouseEvent, index: number) => void;
  onAddBetween: (e: React.MouseEvent, index: number) => void;
  allowEdit: boolean;
  maxColors: number;
  hoverIndex: number | null;
  copiedIndex: number | null;
  onMouseEnter: (index: number | null) => void;
  onColorChange: (color: string) => void;
  onShowPicker: (color: string, index: number) => void;
  setCopiedIndex: (index: number | null) => void;
  onCopyClick: (e: React.MouseEvent, color: string, index: number) => void;
  randomSection?: boolean;
  isBaseColor?: boolean;
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
    cursor: isDragging ? 'grabbing' : 'auto'
  };

  // Validate color format
  const validateColor = (color: string): string => {
    // Check if it's a valid color
    const tc = tinycolor(color);
    // Use .isValid() and convert to hex format
    if (tc.isValid()) {
      return tc.toHexString().toUpperCase();
    }
    // Return fallback color if invalid
    return "#CCCCCC";
  };
  
  const validatedColor = validateColor(hexColor);
  
  const isHighlight = hoverIndex === index || copiedIndex === index;
  
  const handleOpenColorPicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowPicker(validatedColor, index);
  };
  
  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`relative group w-full bg-white rounded-lg overflow-hidden shadow-sm transition-all
        ${isDragging ? 'shadow-xl scale-105' : ''}
        ${isHighlight ? 'ring-2 ring-blue-400 shadow-md' : 'hover:shadow-md transition-shadow'}
        ${isBaseColor ? 'border-2 border-yellow-400' : ''}`}
      onMouseEnter={() => onMouseEnter(index)}
      onMouseLeave={() => onMouseEnter(null)}
      {...attributes}
    >
      <div 
        className="h-36 w-full cursor-pointer"
        style={{ backgroundColor: validatedColor }}
        onClick={() => onColorClick(validatedColor)}
      >
        {/* Base color indicator - Only show on index 0 and if it's actually marked as base color */}
        {isBaseColor && index === 0 && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-xs text-black px-2 py-1 rounded-md shadow-sm font-medium">
            Base Color
          </div>
        )}
        
        {/* Add drag handle button for all colors */}
        {allowEdit && (
          <button
            {...listeners}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    bg-white/30 backdrop-blur-sm rounded-lg p-2.5
                    text-gray-800 hover:bg-white/70 transition-all 
                    opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
          >
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
              <span className="text-xs font-bold mt-1">Drag</span>
            </div>
          </button>
        )}
        
        {/* Edit button - disabled for base color unless in randomSection */}
        {allowEdit && (!isBaseColor || randomSection) && (
          <button
            onClick={handleOpenColorPicker}
            className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-full p-1.5 
                      text-gray-700 hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"
            title="Edit color"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}
        
        {/* Delete button - disabled for base color unless in randomSection */}
        {allowEdit && totalColors > 1 && (!isBaseColor || randomSection) && (
          <button
            onClick={(e) => onDeleteClick(e, index)}
            className="absolute top-2 right-8 bg-white/20 backdrop-blur-sm rounded-full p-1.5 
                     text-red-500 hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"
            title="Delete color"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
        
        {/* Add button between colors */}
        {allowEdit && index < totalColors - 1 && totalColors < maxColors && (
          <button
            onClick={(e) => onAddBetween(e, index)}
            className="absolute bottom-2 right-2 bg-white/20 backdrop-blur-sm rounded-full p-1.5 
                     text-blue-500 hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"
            title="Add color between"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Color info section */}
      <div className="p-3 text-black">
        <div className="flex flex-col items-center space-y-1">
          <span className="text-xs font-mono font-medium text-gray-700 mb-0.5">{validatedColor}</span>
          <button
            onClick={(e) => onCopyClick(e, validatedColor, index)}
            className={`mt-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors ${
              copiedIndex === index ? 'bg-green-100 text-green-700' : 'text-gray-700'
            }`}
          >
            {copiedIndex === index ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Color picker modal component
const ColorPickerModal = ({ 
  color, 
  onClose, 
  onChange 
}: { 
  color: string, 
  onClose: () => void, 
  onChange: (color: string) => void 
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [hexValue, setHexValue] = useState(color.toUpperCase());
  const [initialColor] = useState(color.toUpperCase());
  
  useEffect(() => {
    setHexValue(color.toUpperCase());
  }, [color]);
  
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHexValue(value);
    
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      onChange(value);
    }
  };
  
  const formatHexInput = (value: string) => {
    if (value.charAt(0) !== '#') {
      value = '#' + value;
    }
    
    value = value.slice(0, 7);
    
    return value;
  };
  
  const handleHexBlur = () => {
    let validHex = hexValue;
    
    if (!validHex.startsWith('#')) {
      validHex = '#' + validHex;
    }
    
    while (validHex.length < 7) {
      validHex += '0';
    }
    
    if (/^#[0-9A-Fa-f]{6}$/.test(validHex)) {
      setHexValue(validHex.toUpperCase());
      onChange(validHex);
    } else {
      setHexValue(color.toUpperCase());
    }
  };
  
  const handleReset = () => {
    setHexValue(initialColor);
    onChange(initialColor);
  };
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);
  
  return createPortal(
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl p-4 w-[420px] max-w-[95vw]"
      >
        <div className="relative w-full">
          <HexColorPicker 
            color={color} 
            onChange={onChange} 
            className="w-full mb-4" 
          />
          <div className="flex items-center mt-4 mb-3">
            <div className="w-12 h-12 relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full absolute top-1 left-1" style={{ backgroundColor: color, border: '2px solid #e5e7eb' }}></div>
            </div>
          </div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex-1 mr-3">
              <input 
                type="text" 
                className="w-full text-center p-2 border rounded font-mono text-lg"
                value={hexValue}
                onChange={handleHexChange}
                onBlur={handleHexBlur}
                maxLength={7}
              />
            </div>
            <div className="flex space-x-2">
              <button
                className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-md text-gray-700"
                onClick={handleReset}
                title="Reset to initial color"
              >
                Reset
              </button>
              <button
                className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-md text-gray-700"
                onClick={onClose}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default function ColorDisplay({ 
  colors, 
  onColorSelect, 
  onColorsChange,
  allowEdit = false,
  maxColors = 5,
  randomSection = false
}: ColorDisplayProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [baseColor, setBaseColor, initialBaseColor] = useBaseColor(colors, randomSection);
  
  // Color IDs for drag and drop
  const [colorIds] = useState<string[]>(() => 
    Array(maxColors * 2).fill(0).map(() => Math.random().toString(36).substring(2, 10))
  );
  
  // Color picker state
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerColor, setPickerColor] = useState('');
  const [pickerColorIndex, setPickerColorIndex] = useState(-1);
  
  // DnD sensors setup
  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { 
        distance: 5,
        delay: 100,
        tolerance: 5
      } 
    }),
    useSensor(KeyboardSensor, { 
      coordinateGetter: sortableKeyboardCoordinates 
    })
  );

  const handleColorClick = (color: string) => {
    setSelectedColor(color);
    if (onColorSelect) {
      onColorSelect(color);
    }
  };

  const handleCopyHex = (e: React.MouseEvent, hexColor: string, index: number) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hexColor);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleDeleteColor = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    
    const currentColor = colors[index];
    console.log('Trying to delete color:', currentColor, 'at index:', index, 'Is base color:', (!randomSection && currentColor === initialBaseColor.current));
    
    if (!randomSection && currentColor === initialBaseColor.current) {
      console.log('Cannot delete base color:', currentColor);
      toast.error("Cannot delete the base color. This is the original color you selected.");
      return;
    }
    
    if (onColorsChange && colors.length > 1) {
      console.log('Deleting color at index:', index);
      const newColors = [...colors];
      newColors.splice(index, 1);
      onColorsChange(newColors);
    }
  };
  
  const handleAddColorBetween = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (onColorsChange && colors.length < maxColors) {
      const color1 = colors[index].replace('#', '');
      const color2 = colors[index + 1].replace('#', '');
      
      const r1 = parseInt(color1.substring(0, 2), 16);
      const g1 = parseInt(color1.substring(2, 4), 16);
      const b1 = parseInt(color1.substring(4, 6), 16);
      
      const r2 = parseInt(color2.substring(0, 2), 16);
      const g2 = parseInt(color2.substring(2, 4), 16);
      const b2 = parseInt(color2.substring(4, 6), 16);
      
      const r = Math.round((r1 + r2) / 2);
      const g = Math.round((g1 + g2) / 2);
      const b = Math.round((b1 + b2) / 2);
      
      const blendedColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      
      const newColors = [...colors];
      newColors.splice(index + 1, 0, blendedColor);
      onColorsChange(newColors);
    }
  };
  
  const handleAddColorStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onColorsChange && colors.length < maxColors) {
      const firstColor = tinycolor(colors[0]);
      const hsl = firstColor.toHsl();
      
      const newHue = (hsl.h - 15) % 360;
      const newColor = tinycolor(`hsl(${newHue}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`).toString();
      
      const newColors = [newColor, ...colors];
      onColorsChange(newColors);
    }
  };
  
  const handleAddColorEnd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onColorsChange && colors.length < maxColors) {
      const lastColor = tinycolor(colors[colors.length - 1]);
      const hsl = lastColor.toHsl();
      
      const newHue = (hsl.h + 15) % 360;
      const newColor = tinycolor(`hsl(${newHue}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`).toString();
      
      const newColors = [...colors, newColor];
      onColorsChange(newColors);
    }
  };

  // Show color picker for a specific color
  const handleShowPicker = (color: string, index: number) => {
    const currentColor = colors[index];
    console.log('Show picker for color:', currentColor, 'at index:', index, 'Is base color:', (!randomSection && currentColor === initialBaseColor.current));
    
    if (!randomSection && currentColor === initialBaseColor.current) {
      toast.error("Cannot edit the base color. This is the original color you selected.");
      return;
    }
    
    setPickerColor(color);
    setPickerColorIndex(index);
    setShowColorPicker(true);
  };
  
  // Hide color picker
  const handleClosePicker = () => {
    setShowColorPicker(false);
    setPickerColorIndex(-1);
  };

  // Handle color change from color picker
  const handleColorChange = (color: string) => {
    setPickerColor(color);
    if (pickerColorIndex >= 0 && onColorsChange) {
      const currentColor = colors[pickerColorIndex]; 
      
      console.log('Color change attempt:', {
        pickerColorIndex,
        currentColor,
        baseColor: initialBaseColor.current,
        isBaseColor: (!randomSection && currentColor === initialBaseColor.current),
        randomSection
      });
      
      if (!randomSection && currentColor === initialBaseColor.current) {
        console.log('Cannot edit base color:', currentColor, 'at index:', pickerColorIndex);
        return;
      }
      
      console.log('Changing color at index:', pickerColorIndex, 'from:', currentColor, 'to:', color);
      const newColors = [...colors];
      newColors[pickerColorIndex] = color;
      onColorsChange(newColors);
    }
  };

  // Handle drag start event
  const handleDragStart = (event: { active: any }) => {
    setActiveId(event.active.id);
  };

  // Handle drag end event for reordering colors
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    
    if (!over || active.id === over.id || !onColorsChange) {
      return;
    }
    
    const oldIndex = colorIds.indexOf(active.id as string);
    const newIndex = colorIds.indexOf(over.id as string);
    
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    
    console.log(`Moving color from position ${oldIndex} to ${newIndex}`);
    
    const newColors = arrayMove([...colors], oldIndex, newIndex);
    onColorsChange(newColors);
  };

  // Find the active color for drag overlay
  const dragActiveIndex = activeId ? colorIds.indexOf(activeId) : -1;
  const activeColor = dragActiveIndex !== -1 ? colors[dragActiveIndex] : null;

  if (!colors.length) {
    return (
      <div className="text-center p-8 text-gray-500">
        No colors selected. Upload an image or generate a random palette.
      </div>
    );
  }

  // Get color items from the current colors
  const items = colors.map((_, index) => colorIds[index]);

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-3 relative">
        {/* Add color button at the beginning */}
        {allowEdit && colors.length < maxColors && colors.length > 0 && (
          <button
            onClick={handleAddColorStart}
            className="absolute -left-3 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-md hover:bg-blue-50 hover:text-blue-600 z-10"
            title="Add new color at start"
            style={{ left: "0px" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Debug info - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-2 p-2 bg-gray-100 text-xs text-gray-700 rounded">
          <div>Base color: {baseColor || 'none'}</div>
          <div>First color: {colors[0] || 'none'}</div>
          <div>Random section: {randomSection ? 'yes' : 'no'}</div>
        </div>
      )}
      
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="mb-2 text-center text-xs text-gray-500">
          Drag colors to reorder them
        </div>
        <SortableContext 
          items={items}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-5 gap-4 overflow-x-auto">
            {colors.map((color, index) => (
              <SortableColorItem
                key={colorIds[index]}
                id={colorIds[index]}
                hexColor={color}
                index={index}
                totalColors={colors.length}
                onColorClick={handleColorClick}
                onDeleteClick={handleDeleteColor}
                onAddBetween={handleAddColorBetween}
                allowEdit={allowEdit}
                maxColors={maxColors}
                hoverIndex={hoverIndex}
                copiedIndex={copiedIndex}
                onMouseEnter={setHoverIndex}
                onColorChange={(color) => handleColorChange(color)}
                onShowPicker={handleShowPicker}
                setCopiedIndex={setCopiedIndex}
                onCopyClick={handleCopyHex}
                randomSection={randomSection}
                isBaseColor={!randomSection && color === initialBaseColor.current}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      {/* Add color button at the end */}
      {allowEdit && colors.length < maxColors && colors.length > 0 && (
        <button
          onClick={handleAddColorEnd}
          className="absolute transform bg-white rounded-full p-1 shadow-md hover:bg-blue-50 hover:text-blue-600 z-10"
          style={{ 
            top: "50%", 
            right: "0px",
            transform: "translateY(-50%)"
          }}
          title="Add new color"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      )}
      
      {/* Render color picker modal if shown */}
      {typeof window !== 'undefined' && showColorPicker && (
        <ColorPickerModal 
          color={pickerColor} 
          onClose={handleClosePicker} 
          onChange={handleColorChange} 
        />
      )}
    </div>
  );
} 