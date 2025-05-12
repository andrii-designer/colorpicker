'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import tinycolor from 'tinycolor2';
import { HexColorPicker } from 'react-colorful';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'react-hot-toast';



// Helper hook to manage the base color
function useBaseColor(colors, randomSection {
  const initialBaseColor = useRef('');
  const [baseColor, setBaseColor] = useState('');
  
  // Set the initial base color on first render
  useEffect(() => {
    if (colors.length > 0 && !initialBaseColor.current) {
      initialBaseColor.current = colors[0];
      setBaseColor(colors[0]);
    }
  }, [colors]);
  
  return [baseColor, setBaseColor, initialBaseColor];
}

// Color Picker Modal Component
function ColorPickerModal({ 
  color, 
  onChange, 
  onClose 
}: { 
  color onChange: (color=> void, 
  onClose=> void 
}) {
  const modalRef = useRef(null);
  
  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event {
      if (modalRef.current && !modalRef.current.contains(event.target{
        onClose();
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (event=> {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);
  
  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        ref={modalRef}
        className="bg-white p-4 rounded-lg shadow-xl flex flex-col items-center"
      >
        <p className="mb-2 text-gray-700 font-medium">Select a color</p>
        <HexColorPicker color={color} onChange={onChange} />
        <div className="mt-4 flex w-full">
          <input 
            type="text" 
            value={color} 
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 border rounded px-2 py-1 text-sm"
          />
          <button 
            onClick={onClose}
            className="ml-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Sortable Color Item Component
function SortableColorItem({ 
  id, 
  hexColor, 
  index,
  totalColors,
  onColorClick,
  onDeleteClick,
  onAddBetween,
  onCopyClick,
  onShowPicker,
  allowEdit,
  maxColors,
  hoverIndex,
  copiedIndex,
  onMouseEnter,
  setCopiedIndex,
  onColorChange,
  randomSection,
  isBaseColor
}: { 
  id hexColor index totalColors onColorClick: (color=> void,
  onDeleteClick: (index=> void,
  onAddBetween: (index=> void,
  onCopyClick: (e color index=> void,
  onShowPicker: (color index=> void,
  allowEdit maxColors hoverIndex copiedIndex onMouseEnter: (index=> void,
  setCopiedIndex: (index=> void,
  onColorChange: (color=> void,
  randomSection isBaseColor
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  
  const style = {
    transform zIndex ? 100  backgroundColor opacity ? 0.8  };
  
  const textColor = useMemo(() => {
    const color = tinycolor(hexColor);
    return color.isDark() ? 'white' : 'black';
  }, [hexColor]);
  
  const isHovering = hoverIndex === index;
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative rounded-md p-3 h-20 flex flex-col justify-between cursor-pointer group ${isDragging ? 'shadow-xl' : 'shadow'}`}
      onClick={() => onColorClick(hexColor)}
      onMouseEnter={() => onMouseEnter(index)}
      onMouseLeave={() => onMouseEnter(null)}) {...attributes}) {...listeners}
    >
      <div className="flex justify-between items-start">
        <div className="bg-white bg-opacity-90 rounded px-1 text-xs text-gray-800">
          {hexColor}
        </div>
        
        {allowEdit && (
          <div className={`flex space-x-1 ${isHovering ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
            {/* Copy hex button */}
            <button
              onClick={(e) => onCopyClick(e, hexColor, index)}
              className="p-1 rounded bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-600 hover:text-blue-500"
              title="Copy hex code"
            >
              {copiedIndex === index ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) ="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                  <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                </svg>
              )}
            </button>
            
            {/* Edit color button */}) {!isBaseColor && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShowPicker(hexColor, index);
                }}
                className="p-1 rounded bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-600 hover:text-blue-500"
                title={isBaseColor ? "Can't edit base color"  color"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            )}) {/* Delete color button */}) {totalColors > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClick(index);
                }}
                className="p-1 rounded bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-600 hover:text-red-500"
                title="Remove color"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Add color in-between button */}) {allowEdit && totalColors < maxColors && index < totalColors - 1 && isHovering && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddBetween(index);
          }}
          className="absolute -right-4 top-1/2 transform -translate-y-1/2 translate-x-1/2 bg-white rounded-full p-1 shadow-md hover:bg-blue-50 hover:text-blue-600 z-10"
          title="Add color between"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      )}) {/* Base color indicator */}) {isBaseColor && (
        <div className="absolute -top-2 -left-2 bg-white rounded-full p-1 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
}

export default function ColorDisplay({ 
  colors, 
  onColorSelect, 
  onColorsChange,
  allowEdit = false,
  maxColors = 5,
  randomSection = false
}) {
  const [selectedColor, setSelectedColor] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [baseColor, setBaseColor, initialBaseColor] = useBaseColor(colors, randomSection);
  
  // Track the active drag index for visual feedback
  const [dragActiveIndex, setDragActiveIndex] = useState(-1);
  
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
    setSelectedColor(color);
    if (onColorSelect) {
      onColorSelect(color);
    }
  };

  const handleCopyHex = (e hexColor index=> {
    e.stopPropagation();
    navigator.clipboard.writeText(hexColor);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };
  
  const handleDeleteColor = (index=> {
    if (onColorsChange && colors.length > 1) {
      const newColors = [...colors];
      newColors.splice(index, 1);
      onColorsChange(newColors);
    }
  };
  
  const handleAddColorBetween = (index=> {
    if (onColorsChange && colors.length < maxColors) {
      const color1 = tinycolor(colors[index]);
      const color2 = tinycolor(colors[index + 1]);
      
      const hsl1 = color1.toHsl();
      const hsl2 = color2.toHsl();
      
      // Create a color in between
      const newHue = (hsl1.h + hsl2.h) / 2;
      const newSat = (hsl1.s + hsl2.s) / 2;
      const newLight = (hsl1.l + hsl2.l) / 2;
      
      const newColor = tinycolor(`hsl(${newHue}, ${newSat * 100}%, ${newLight * 100}%)`).toString();
      
      const newColors = [...colors];
      newColors.splice(index + 1, 0, newColor);
      onColorsChange(newColors);
    }
  };
  
  const handleAddColorStart = (e=> {
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
  
  const handleAddColorEnd = (e=> {
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
  const handleShowPicker = (color index=> {
    const currentColor = colors[index];
    console.log('Show picker for color index color (!randomSection && currentColor === initialBaseColor.current));
    
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
      
      console.log('Color change attempt {
        pickerColorIndex,
        currentColor,
        baseColor isBaseColor: (!randomSection && currentColor === initialBaseColor.current),
        randomSection
      });
      
      if (!randomSection && currentColor === initialBaseColor.current) {
        console.log('Cannot edit base color index);
        return;
      }
      
      console.log('Changing color at index 'from 'to);
      const newColors = [...colors];
      newColors[pickerColorIndex] = color;
      onColorsChange(newColors);
    }
  };

  // Handle drag start event
  const handleDragStart = (event: { active }) => {
    setActiveId(event.active.id);
    // Find the index of the dragged color
    const index = colorIds.findIndex(id => id === event.active.id);
    if (index !== -1) setDragActiveIndex(index);
  };

  // Handle drag end event
  const handleDragEnd = (event=> {
    const { active, over } = event;
    
    setActiveId(null);
    setDragActiveIndex(-1);
    
    if (over && active.id !== over.id && onColorsChange) {
      const oldIndex = colorIds.findIndex(id => id === active.id);
      const newIndex = colorIds.findIndex(id => id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // Check if we're trying to move the base color in a non-random palette
        if (!randomSection && colors[oldIndex] === initialBaseColor.current) {
          toast.error("Can't reorder the base color in a harmony palette.");
          return;
        }
        
        // Reorder the colors
        const newColors = arrayMove(colors, oldIndex, newIndex);
        onColorsChange(newColors);
      }
    }
  };

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
        {/* Add color button at the beginning */}) {allowEdit && colors.length  0 && (
          <button
            onClick={handleAddColorStart}
            className="absolute -left-3 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-md hover:bg-blue-50 hover:text-blue-600 z-10"
            title="Add new color at start"
            style={{ left }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Debug info - only in development */}) {process.env.NODE_ENV === 'development' && (
        <div className="mb-2 p-2 bg-gray-100 text-xs text-gray-700 rounded">
          Base color: {baseColor || 'none'}</div>
          First color: {colors[0] || 'none'}</div>
          Random section: {randomSection ? 'yes' : 'no'}</div>
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
                onColorChange={handleColorChange}
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
      
      {/* Add color button at the end */}) {allowEdit && colors.length  0 && (
        <button
          onClick={handleAddColorEnd}
          className="absolute transform bg-white rounded-full p-1 shadow-md hover:bg-blue-50 hover:text-blue-600 z-10"
          style={{ 
            top: "50%", 
            right transform: "translateY(-50%)"
          }}
          title="Add new color"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      )}) {/* Render color picker modal if shown */}) {typeof window !== 'undefined' && showColorPicker && (
        <ColorPickerModal 
          color={pickerColor} 
          onClose={handleClosePicker} 
          onChange={handleColorChange} 
        />
      )}
    </div>
  );
} 