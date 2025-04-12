'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HexColorPicker } from 'react-colorful';
import tinycolor from 'tinycolor2';

export interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClose?: () => void;
  showInput?: boolean;
  showPreview?: boolean;
  showReset?: boolean;
  modalMode?: boolean;
  className?: string;
}

export default function ColorPicker({
  color,
  onChange,
  onClose,
  showInput = true,
  showPreview = true,
  showReset = true,
  modalMode = false,
  className = ''
}: ColorPickerProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [hexValue, setHexValue] = useState(tinycolor(color).toHexString().toUpperCase());
  const [initialColor] = useState(hexValue);
  
  useEffect(() => {
    setHexValue(tinycolor(color).toHexString().toUpperCase());
  }, [color]);
  
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHexValue(value);
    
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      onChange(value);
    }
  };
  
  const handleHexBlur = () => {
    let validHex = hexValue;
    
    if (!validHex.startsWith('#')) {
      validHex = '#' + validHex;
    }
    
    // Pad with zeros if needed
    while (validHex.length < 7) {
      validHex += '0';
    }
    
    if (/^#[0-9A-Fa-f]{6}$/.test(validHex)) {
      setHexValue(validHex.toUpperCase());
      onChange(validHex);
    } else {
      // Invalid hex, revert to current color
      setHexValue(tinycolor(color).toHexString().toUpperCase());
    }
  };
  
  const handleReset = () => {
    setHexValue(initialColor);
    onChange(initialColor);
  };
  
  // Click outside handler for modal mode
  useEffect(() => {
    if (!modalMode || !onClose) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalMode, onClose]);
  
  // Extract RGB values for display
  const rgbColor = tinycolor(color).toRgb();
  const hslColor = tinycolor(color).toHsl();
  
  const pickerContent = (
    <div className={`bg-white rounded-lg shadow-md ${modalMode ? 'p-4 w-[420px] max-w-[95vw]' : ''} ${className}`}>
      <div className="relative w-full">
        <HexColorPicker 
          color={color} 
          onChange={onChange} 
          className="w-full mb-4" 
        />
        
        {showPreview && (
          <div className="flex items-center mt-4 mb-3 justify-center">
            <div className="w-12 h-12 relative flex-shrink-0">
              <div 
                className="w-10 h-10 rounded-full absolute top-1 left-1" 
                style={{ backgroundColor: color, border: '2px solid #e5e7eb' }}
              ></div>
            </div>
            
            {/* Color info */}
            <div className="ml-4 text-xs text-gray-600">
              <div>RGB: {rgbColor.r}, {rgbColor.g}, {rgbColor.b}</div>
              <div>HSL: {Math.round(hslColor.h)}°, {Math.round(hslColor.s * 100)}%, {Math.round(hslColor.l * 100)}%</div>
            </div>
          </div>
        )}
        
        {showInput && (
          <div className="flex justify-between items-center mb-2">
            <div className="flex-1 mr-3">
              <input 
                type="text" 
                className="w-full text-center p-2 border rounded font-mono text-lg"
                value={hexValue}
                onChange={handleHexChange}
                onBlur={handleHexBlur}
                maxLength={7}
                aria-label="Hex color value"
              />
            </div>
            
            <div className="flex space-x-2">
              {showReset && (
                <button
                  className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-md text-gray-700"
                  onClick={handleReset}
                  title="Reset to initial color"
                  aria-label="Reset color"
                >
                  Reset
                </button>
              )}
              
              {onClose && (
                <button
                  className="text-sm bg-blue-500 hover:bg-blue-600 px-3 py-2 rounded-md text-white"
                  onClick={onClose}
                  aria-label="Close color picker"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
  
  // Render as modal or inline based on modalMode prop
  if (modalMode && typeof window !== 'undefined') {
    return createPortal(
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div ref={modalRef}>
          {pickerContent}
        </div>
      </div>,
      document.body
    );
  }
  
  return pickerContent;
}

// Shorthand component for modal mode
export function ColorPickerModal({ 
  color, 
  onChange, 
  onClose 
}: { 
  color: string; 
  onChange: (color: string) => void; 
  onClose: () => void;
}) {
  return (
    <ColorPicker
      color={color}
      onChange={onChange}
      onClose={onClose}
      modalMode={true}
      showInput={true}
      showPreview={true}
      showReset={true}
    />
  );
} 