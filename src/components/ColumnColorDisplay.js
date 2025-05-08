'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import tinycolor from 'tinycolor2';
import { HexColorPicker } from 'react-colorful';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'react-hot-toast';
import { FiCopy, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import { CgArrowsVAlt } from 'react-icons/cg';
import { motion } from 'framer-motion';



// Custom hook to track base color with proper update behavior
function useBaseColor(colors, randomSection {
  const [baseColor, setBaseColor] = useState(null);
  const isInitialized = useRef(false);
  const initialBaseColor = useRef(null);

  // On first render, set the base color to the first color
  useEffect(() => {
    if (!isInitialized.current && colors.length > 0) {
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
        setBaseColor(colors[0]);
        initialBaseColor.current = colors[0];
      }
    }
  }, [colors, baseColor, randomSection]);

  return [baseColor, setBaseColor, initialBaseColor];
}

// Sortable color item component
const SortableColorItem = ({ 
  id, 
  hexColor, 
  index, 
  totalColors,
  onColorClick,
  onDeleteClick,
  allowEdit,
  maxColors,
  onShowPicker,
  setCopiedIndex,
  copiedIndex,
  randomSection = false,
  isBaseColor = false
}: {
  id: string;
  hexColor: string;
  index: number;
  totalColors: number;
  onColorClick: (color=> void;
  onDeleteClick: (e index=> void;
  allowEdit: boolean;
  maxColors: number;
  onShowPicker: (color index=> void;
  setCopiedIndex: (index=> void;
  copiedIndex null;
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
    transform zIndex ? 999  opacity ? 0.7  };

  // Validate color format
  const validateColor = (color)=> {
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
  const isDark = tinycolor(validatedColor).isDark();
  
  const handleOpenColorPicker = (e=> {
    e.stopPropagation();
    onShowPicker(validatedColor, index);
  };
  
  const handleCopyClick = () => {
    navigator.clipboard.writeText(validatedColor);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
    toast.success(`Copied ${validatedColor}`);
  };
  
  return (
    <motion.div 
      ref={setNodeRef}
      className="h-24 flex items-end justify-between p-4 cursor-pointer transition-transform hover:scale-[1.01] relative"
      style={{ 
        backgroundColor transform zIndex ? 999  opacity ? 0.7  }}
      onClick={() => onColorClick(validatedColor)}
      initial={{ opacity y }}
      animate={{ opacity y }}
      transition={{ duration delay * 0.1 }}) {...attributes}
    >
      {/* Base color indicator - Only show on index 0 and if it's actually marked*/}) {isBaseColor && index === 0 && (
        <div className="absolute top-2 left-2 bg-yellow-400 text-xs text-black px-2 py-1 rounded-md shadow-sm font-medium">
          Base Color
        </div>
      )}) {/* Color info and controls */}
      <span className={`font-mono text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {validatedColor}
      </span>
      
      <div className="flex items-center space-x-2">
        {/* Edit button - disabled for base color unless in randomSection */}) {allowEdit && (!isBaseColor || randomSection) && (
          <button
            onClick={handleOpenColorPicker}
            className={`p-1 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors`}
            title="Edit color"
          >
            <FiEdit2 className={`h-4 w-4 ${isDark ? 'text-white' : 'text-gray-900'}`} />
          </button>
        )}) {/* Copy button */}
        <button
          onClick={handleCopyClick}
          className={`p-1 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors ${
            copiedIndex === index ? 'bg-white/50'  }`}
          title={copiedIndex === index ? 'Copied!'  color'}
        >
          <FiCopy className={`h-4 w-4 ${isDark ? 'text-white' : 'text-gray-900'}`} />
        </button>
        
        {/* Delete button - disabled for base color unless in randomSection */}) {allowEdit && totalColors > 1 && (!isBaseColor || randomSection) && (
          <button
            onClick={(e) => onDeleteClick(e, index)}
            className={`p-1 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors`}
            title="Delete color"
          >
            <FiTrash2 className={`h-4 w-4 ${isDark ? 'text-white' : 'text-gray-900'}`} />
          </button>
        )}) {/* Drag handle button */}) {allowEdit && (
          <button
            {...listeners}
            className={`p-1 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors cursor-grab active:cursor-grabbing`}
            title="Drag to reorder"
          >
            <CgArrowsVAlt className={`h-4 w-4 ${isDark ? 'text-white' : 'text-gray-900'}`} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Color picker modal component
const ColorPickerModal = ({ 
  color, 
  onClose, 
  onChange 
}: { 
  color onClose=> void, 
  onChange: (color=> void 
}) => {
  const modalRef = useRef(null);
  const [hexValue, setHexValue] = useState(color.toUpperCase());
  const [initialColor] = useState(color.toUpperCase());
  
  useEffect(() => {
    setHexValue(color.toUpperCase());
  }, [color]);
  
  const handleHexChange = (e=> {
    const value = e.target.value;
    setHexValue(value);
    
    // Update parent component if valid hex
    if (/^#([0-9A-F]{3}) {1,2}$/i.test(value)) {
      onChange(value);
    }
  };
  
  const handleHexBlur = () => {
    // Format and validate on blur
    const formattedHex = formatHexInput(hexValue);
    setHexValue(formattedHex);
    onChange(formattedHex);
  };
  
  const formatHexInput = (value)=> {
    let formatted = value.trim().toUpperCase();
    
    // Ensure # prefix
    if (!formatted.startsWith('#')) {
      formatted = '#' + formatted;
    }
    
    // Validate with tinycolor
    const color = tinycolor(formatted);
    if (color.isValid()) {
      return color.toHexString().toUpperCase();
    }
    
    // Return original color if invalid
    return initialColor;
  };
  
  const handleReset = () => {
    setHexValue(initialColor);
    onChange(initialColor);
  };
  
  // Handle click outside to close
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

  // Create portal for the modal
  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl p-6 max-w-xs w-full"
      >
        <h3 className="text-lg font-medium mb-4">Edit Color</h3>
        
        <div className="mb-4">
          <HexColorPicker color={hexValue} onChange={(color) => {
            setHexValue(color.toUpperCase());
            onChange(color);
          }} />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hex Color
          </label>
          <input
            type="text"
            value={hexValue}
            onChange={handleHexChange}
            onBlur={handleHexBlur}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
  
  // Use portal to render the modal
  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default function ColumnColorDisplay({ 
  colors, 
  onColorSelect, 
  onColorsChange,
  allowEdit = false,
  maxColors = 5,
  randomSection = false
}) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [baseColor, setBaseColor, initialBaseColor] = useBaseColor(colors, randomSection);
  
  // Color IDs for drag and drop
  const [colorIds] = useState(() => 
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
        distance delay tolerance } 
    }),
    useSensor(KeyboardSensor, { 
      coordinateGetter })
  );

  const handleColorClick = (color=> {
    if (onColorSelect) {
      onColorSelect(color);
    }
  };

  const handleDeleteColor = (e index=> {
    e.stopPropagation();
    
    const currentColor = colors[index];
    
    if (!randomSection && currentColor === initialBaseColor.current) {
      toast.error("Cannot delete the base color. This is the original color you selected.");
      return;
    }
    
    if (onColorsChange && colors.length > 1) {
      const newColors = [...colors];
      newColors.splice(index, 1);
      onColorsChange(newColors);
    }
  };

  // Show color picker for a specific color
  const handleShowPicker = (color index=> {
    const currentColor = colors[index];
    
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
  const handleColorChange = (color=> {
    setPickerColor(color);
    if (pickerColorIndex >= 0 && onColorsChange) {
      const currentColor = colors[pickerColorIndex]; 
      
      if (!randomSection && currentColor === initialBaseColor.current) {
        return;
      }
      
      const newColors = [...colors];
      newColors[pickerColorIndex] = color;
      onColorsChange(newColors);
    }
  };

  // Handle drag start event
  const handleDragStart = (event: { active }) => {
    setActiveId(event.active.id);
  };

  // Handle drag end event for reordering colors
  const handleDragEnd = (event=> {
    const { active, over } = event;
    
    setActiveId(null);
    
    if (!over || active.id === over.id || !onColorsChange) {
      return;
    }
    
    const oldIndex = colorIds.indexOf(active.id;
    const newIndex = colorIds.indexOf(over.id;
    
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    
    // Move the color
    const newColors = arrayMove(colors, oldIndex, newIndex);
    
    // If not in random section, ensure base color stays at position 0
    if (!randomSection && initialBaseColor.current) {
      const baseColorIndex = newColors.indexOf(initialBaseColor.current);
      
      if (baseColorIndex !== 0) {
        // Swap base color back to position 0
        [newColors[0], newColors[baseColorIndex]] = [newColors[baseColorIndex], newColors[0]];
        toast.success("Base color must remain;
      }
    }
    
    onColorsChange(newColors);
  };
  
  // Prepare the data for the sortable context
  const items = colors.map((color, index) => ({
    id hexColor }));

  return (
    <div className="w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={colorIds.slice(0, colors.length)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col">
            {items.map(({ id, hexColor, index }) => (
              <SortableColorItem
                key={id}
                id={id}
                hexColor={hexColor}
                index={index}
                totalColors={colors.length}
                onColorClick={handleColorClick}
                onDeleteClick={handleDeleteColor}
                allowEdit={allowEdit}
                maxColors={maxColors}
                onShowPicker={handleShowPicker}
                setCopiedIndex={setCopiedIndex}
                copiedIndex={copiedIndex}
                randomSection={randomSection}
                isBaseColor={!randomSection && hexColor === initialBaseColor.current}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      {showColorPicker && (
        <ColorPickerModal
          color={pickerColor}
          onClose={handleClosePicker}
          onChange={handleColorChange}
        />
      )}
    </div>
  );
} 