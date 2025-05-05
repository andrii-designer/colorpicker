import React from 'react'
import { cn } from '../../../lib/utils'
import { Button } from './Button'
import { FiRefreshCw, FiArrowLeft, FiArrowRight } from 'react-icons/fi'

interface PaletteToolbarProps {
  className?: string
  onGenerateRandom: () => void
  onUndo: () => void
  onRedo: () => void
  undoDisabled: boolean
  redoDisabled: boolean
}

export function PaletteToolbar({
  className,
  onGenerateRandom,
  onUndo,
  onRedo,
  undoDisabled,
  redoDisabled
}: PaletteToolbarProps) {
  return (
    <div className={cn("flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-neutral-200", className)}>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          disabled={undoDisabled}
          className="text-neutral-700"
        >
          <FiArrowLeft className="mr-1 h-4 w-4" />
          Undo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRedo}
          disabled={redoDisabled}
          className="text-neutral-700"
        >
          <FiArrowRight className="mr-1 h-4 w-4" />
          Redo
        </Button>
      </div>
      
      <Button
        variant="default"
        onClick={onGenerateRandom}
        className="bg-primary-600 hover:bg-primary-700"
      >
        <FiRefreshCw className="mr-2 h-4 w-4" />
        Generate Random
      </Button>
    </div>
  )
} 