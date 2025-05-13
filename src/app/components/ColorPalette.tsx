import React from 'react'
import { Button } from './ui/Button'

interface ColorPaletteProps {
  colors: string[]
  onColorClick?: (color: string) => void
  onGenerateNew?: () => void
  onAddColor?: () => void
  onRemoveColor?: () => void
  maxColors?: number
}

export function ColorPalette({ colors, onColorClick, onGenerateNew, onAddColor, onRemoveColor, maxColors = 10 }: ColorPaletteProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {colors.map((color, index) => (
          <div
            key={index}
            className="group relative aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            onClick={() => onColorClick?.(color)}
          >
            <div
              className="w-full h-full"
              style={{ backgroundColor: color }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white bg-opacity-90 transform translate-y-full group-hover:translate-y-0 transition-transform">
              <p className="text-sm font-medium text-neutral-900">{color}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center">
        <Button
          variant="default"
          size="lg"
          onClick={onGenerateNew}
          className="font-semibold"
        >
          Generate New Palette
        </Button>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onRemoveColor}
            disabled={colors.length <= 1}
            title="Remove color"
            className="h-10 w-10 rounded-full"
          >
            −
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onAddColor}
            disabled={colors.length >= maxColors}
            title="Add color"
            className="h-10 w-10 rounded-full"
          >
            +
          </Button>
        </div>
      </div>
    </div>
  )
} 