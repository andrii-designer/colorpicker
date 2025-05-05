import React from 'react'
import { cn } from '../../../lib/utils'
import { FiCopy, FiEdit2, FiMove } from 'react-icons/fi'
import tinycolor from 'tinycolor2'
import { motion } from 'framer-motion'
import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'

interface ColorItemProps {
  id: string
  color: string
  index: number
  onColorClick: (color: string) => void
  onEditClick: (color: string, index: number, event: React.MouseEvent) => void
}

export function ColorItem({ id, color, index, onColorClick, onEditClick }: ColorItemProps) {
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
      className="h-36 flex items-end justify-between p-4 cursor-pointer transition-all hover:opacity-95 relative rounded-lg"
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

interface PaletteDisplayProps {
  className?: string
  colors: string[]
  onColorClick: (color: string) => void
  onEditClick: (color: string, index: number, event: React.MouseEvent) => void
}

export function PaletteDisplay({ className, colors, onColorClick, onEditClick }: PaletteDisplayProps) {
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