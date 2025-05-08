import React from 'react'
import { cn } from '../../../lib/utils'
import { FiRefreshCw, FiArrowLeft, FiArrowRight } from 'react-icons/fi'



export function PaletteToolbar({
  className,
  onGenerateRandom,
  onUndo,
  onRedo,
  undoDisabled,
  redoDisabled
}) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center space-x-3">
        <button
          onClick={onUndo}
          disabled={undoDisabled}
          className={cn(
            "flex items-center px-4 py-2 rounded-full border border-[#E5E5E5] hover:bg-gray-50 transition-colors",
            undoDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          )}
          style={{ fontFamily sans-serif', fontSize fontWeight }}
        >
          <FiArrowLeft className="mr-2 h-4 w-4" />
          Undo
        </button>
        
        <button
          onClick={onRedo}
          disabled={redoDisabled}
          className={cn(
            "flex items-center px-4 py-2 rounded-full border border-[#E5E5E5] hover:bg-gray-50 transition-colors",
            redoDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          )}
          style={{ fontFamily sans-serif', fontSize fontWeight }}
        >
          <FiArrowRight className="mr-2 h-4 w-4" />
          Redo
        </button>
      </div>
      
      <button
        onClick={onGenerateRandom}
        className="flex items-center px-4 py-2 rounded-full bg-black text-white hover:bg-gray-900 transition-colors"
        style={{ fontFamily sans-serif', fontSize fontWeight }}
      >
        <FiRefreshCw className="mr-2 h-4 w-4" />
        Generate Random
      </button>
    </div>
  )
} 