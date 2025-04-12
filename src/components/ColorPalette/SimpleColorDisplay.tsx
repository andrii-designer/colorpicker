'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import tinycolor from 'tinycolor2';
import { HexColorPicker } from 'react-colorful';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ColorDisplayProps {
  colors: string[];
  onColorSelect?: (color: string) => void;
  onColorsChange?: (colors: string[]) => void;
  allowEdit?: boolean;
  maxColors?: number;
  randomSection?: boolean;
}

// Simplified Sortable Color Item
const SortableColorItem = ({ 
  id, 
  hexColor, 
  index, 
  totalColors,
  onColorClick,
  onEditClick,
  onDeleteClick,
  allowEdit,
  isBaseColor,
  randomSection = false
}: {
  id: string;
  hexColor: string;
  index: number;
  totalColors: number;
  onColorClick: (color: string) => void;
  onEditClick: (color: string, index: number) => void;
  onDeleteClick: (index: number) => void;
  allowEdit: boolean;
  isBaseColor: boolean;
  randomSection?: boolean;
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

  // Simplified UI
  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="relative group bg-white rounded-lg overflow-hidden shadow-sm"
      {...attributes}
    >
      <div 
        className="h-36 w-full cursor-pointer"
        style={{ backgroundColor: hexColor }}
        onClick={() => onColorClick(hexColor)}
      >
        {/* Drag handle */}
        {allowEdit && (
          <button
            {...listeners}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    bg-white/30 backdrop-blur-sm rounded-lg p-2.5
                    text-gray-800 hover:bg-white/70 opacity-0 group-hover:opacity-100 cursor-grab"
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
        
        {/* Edit button */}
        {allowEdit && (!isBaseColor || randomSection) && (
          <button
            onClick={() => onEditClick(hexColor, index)}
            className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-full p-1.5 
                      text-gray-700 hover:bg-white/40 opacity-0 group-hover:opacity-100"
            title="Edit color"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}
        
        {/* Delete button */}
        {allowEdit && totalColors > 1 && (!isBaseColor || randomSection) && (
          <button
            onClick={() => onDeleteClick(index)}
            className="absolute top-2 right-8 bg-white/20 backdrop-blur-sm rounded-full p-1.5 
                     text-red-500 hover:bg-white/40 opacity-0 group-hover:opacity-100"
            title="Delete color"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Color info section */}
      <div className="p-3 text-center bg-white">
        <div className="text-xs font-mono font-medium text-gray-700">{hexColor}</div>
        <button className="mt-2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md">
          Copy
        </button>
      </div>
    </div>
  );
};

// Simple color picker modal 
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
  
  return createPortal(
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl p-4 w-[420px] max-w-[95vw]"
      >
        <div className="relative w-full">
          <HexColorPicker 
            color={color} 
            onChange={(newColor) => {
              console.log("HexColorPicker onChange called with:", newColor);
              onChange(newColor);
            }} 
            className="w-full mb-4" 
          />
          <div className="mt-4 text-center text-md">
            Selected: <span className="font-mono">{color}</span>
          </div>
          <div className="flex justify-end mt-4">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default function SimpleColorDisplay({ 
  colors, 
  onColorSelect, 
  onColorsChange,
  allowEdit = false,
  maxColors = 5,
  randomSection = false
}: ColorDisplayProps) {
  // Main color display state
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [baseColor, setBaseColor] = useState<string | null>(null);
  
  // Used for drag & drop
  const [activeId, setActiveId] = useState<string | null>(null);
  const [colorIds] = useState<string[]>(() => 
    Array(maxColors * 2).fill(0).map(() => Math.random().toString(36).substring(2, 10))
  );
  
  // Color picker state
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editingColor, setEditingColor] = useState<string>("");
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  
  // DnD sensors setup
  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { distance: 5 } 
    }),
    useSensor(KeyboardSensor, { 
      coordinateGetter: sortableKeyboardCoordinates 
    })
  );

  // Set the base color on first render
  useEffect(() => {
    if (colors.length > 0 && !randomSection && baseColor === null) {
      console.log("Setting base color to:", colors[0]);
      setBaseColor(colors[0]);
    }
  }, [colors, randomSection, baseColor]);

  // Handle color selection
  const handleColorClick = (color: string) => {
    setSelectedColor(color);
    if (onColorSelect) {
      onColorSelect(color);
    }
  };
  
  // Handle opening the color picker
  const handleEditClick = (color: string, index: number) => {
    console.log("Edit click for color:", color, "at index:", index);
    // Don't allow editing the base color unless in random section
    if (!randomSection && color === baseColor) {
      console.log("Cannot edit base color");
      return;
    }
    
    setEditingColor(color);
    setEditingIndex(index);
    setShowColorPicker(true);
  };
  
  // Handle color change from picker
  const handleColorChange = (newColor: string) => {
    console.log("handleColorChange for index:", editingIndex, "new color:", newColor);
    if (editingIndex >= 0 && onColorsChange) {
      // Create a new array to trigger a re-render
      const newColors = [...colors];
      newColors[editingIndex] = newColor;
      onColorsChange(newColors);
    }
  };
  
  // Handle closing the color picker
  const handleCloseColorPicker = () => {
    setShowColorPicker(false);
    setEditingIndex(-1);
    setEditingColor("");
  };
  
  // Handle deleting a color
  const handleDeleteColor = (index: number) => {
    console.log("Delete color at index:", index);
    const currentColor = colors[index];
    
    // Don't allow deleting the base color unless in random section
    if (!randomSection && currentColor === baseColor) {
      console.log("Cannot delete base color");
      return;
    }
    
    if (onColorsChange && colors.length > 1) {
      const newColors = [...colors];
      newColors.splice(index, 1);
      onColorsChange(newColors);
    }
  };
  
  // Handle drag end for reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
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

  if (!colors.length) {
    return <div className="text-center p-8">No colors selected.</div>;
  }

  // Get items for drag and drop
  const items = colors.map((_, index) => colorIds[index]);

  return (
    <div className="space-y-4">
      {/* Debug info */}
      <div className="text-xs text-gray-400 mb-2">
        Base color: {baseColor}
      </div>
      
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="mb-2 text-center text-xs text-gray-500">
          Drag colors to reorder them
        </div>
        <SortableContext 
          items={items}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-5 gap-4">
            {colors.map((color, index) => (
              <SortableColorItem
                key={colorIds[index]}
                id={colorIds[index]}
                hexColor={color}
                index={index}
                totalColors={colors.length}
                onColorClick={handleColorClick}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteColor}
                allowEdit={allowEdit}
                isBaseColor={!randomSection && color === baseColor}
                randomSection={randomSection}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      {/* Color picker modal */}
      {typeof window !== 'undefined' && showColorPicker && (
        <ColorPickerModal 
          color={editingColor} 
          onClose={handleCloseColorPicker} 
          onChange={handleColorChange} 
        />
      )}
    </div>
  );
} 