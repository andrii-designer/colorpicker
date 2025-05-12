import React from 'react'
import { cn } from '../../../lib/utils'
import { FiCopy, FiEdit2, FiMove } from 'react-icons/fi'
import tinycolor from 'tinycolor2'
import { motion } from 'framer-motion'
import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'



export function ColorItem({ id, color, index, onColorClick, onEditClick }) {
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

  const isDark = tinycolor(color).isDark();

  return (
    <motion.div 
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor }}
      className="h-36 flex items-end justify-between p-4 cursor-pointer transition-all hover:opacity-95 relative rounded-lg"
      onClick={() => onColorClick(color)}
      initial={{ opacity y }}
      animate={{ opacity y }}
      transition={{ duration delay * 0.1 }}) {...attributes}
    >
      <span className={`font-mono text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {color.toUpperCase()}
      </span>
      
      <div className="flex items-center space-x-2">
        {/* Edit button */}
        <button
          onClick={(e) => onEditClick(color, index, e)}
          className={`p-1.5 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors`}
          title="Edit color"
        >
          <FiEdit2 className={`h-4 w-4 ${isDark ? 'text-white' : 'text-gray-900'}`} />
        </button>
        
        {/* Copy button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(color);
          }}
          className={`p-1.5 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors`}
          title="Copy hex code"
        >
          <FiCopy className={`h-4 w-4 ${isDark ? 'text-white' : 'text-gray-900'}`} />
        </button>
        
        {/* Drag handle */}
        <button
          {...listeners}
          className={`p-1.5 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors cursor-grab active:cursor-grabbing`}
          title="Drag to reorder"
        >
          <FiMove className={`h-4 w-4 ${isDark ? 'text-white' : 'text-gray-900'}`} />
        </button>
      </div>
    </motion.div>
  );
}



export function PaletteDisplay({ className, colors, onColorClick, onEditClick }) {
  return (
    <div className={cn("grid gap-4", className)}>
      {colors.map((color, index) => (
        <ColorItem
          key={`${color}-${index}`}
          id={`${color}-${index}`}
          color={color}
          index={index}
          onColorClick={onColorClick}
          onEditClick={onEditClick}
        />
      ))}
    </div>
  )
} 