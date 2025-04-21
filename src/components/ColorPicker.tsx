'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HexColorPicker } from 'react-colorful';
import tinycolor from 'tinycolor2';
import { FiDroplet } from 'react-icons/fi';

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

type ColorFormat = 'hex' | 'rgb' | 'hsl';

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
  const [colorFormat, setColorFormat] = useState<ColorFormat>('hex');
  const [isEyedropperSupported, setIsEyedropperSupported] = useState(false);
  
  // Check if EyeDropper API is supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsEyedropperSupported('EyeDropper' in window);
    }
  }, []);
  
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
  
  const handleEyedropper = async () => {
    if (!('EyeDropper' in window)) return;
    
    try {
      // @ts-ignore - EyeDropper API might not be in TypeScript defs yet
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      
      if (result.sRGBHex) {
        const hexColor = result.sRGBHex.toUpperCase();
        setHexValue(hexColor);
        onChange(hexColor);
      }
    } catch (error) {
      console.error('Error using eyedropper:', error);
    }
  };
  
  const handleFormatChange = (format: ColorFormat) => {
    setColorFormat(format);
  };
  
  // Format color based on selected format
  const getFormattedColorValue = () => {
    const tc = tinycolor(color);
    
    switch (colorFormat) {
      case 'rgb': {
        const rgb = tc.toRgb();
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      }
      case 'hsl': {
        const hsl = tc.toHsl();
        return `hsl(${Math.round(hsl.h)}°, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`;
      }
      default:
        return hexValue;
    }
  };
  
  // Handle RGB/HSL input changes
  const handleColorStringChange = (value: string) => {
    const tc = tinycolor(value);
    if (tc.isValid()) {
      const hexColor = tc.toHexString().toUpperCase();
      setHexValue(hexColor);
      onChange(hexColor);
    }
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
          <>
            {/* Format selector */}
            <div className="flex mb-2 border rounded overflow-hidden">
              <button 
                className={`flex-1 text-xs py-1 ${colorFormat === 'hex' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                onClick={() => handleFormatChange('hex')}
              >
                HEX
              </button>
              <button 
                className={`flex-1 text-xs py-1 ${colorFormat === 'rgb' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                onClick={() => handleFormatChange('rgb')}
              >
                RGB
              </button>
              <button 
                className={`flex-1 text-xs py-1 ${colorFormat === 'hsl' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                onClick={() => handleFormatChange('hsl')}
              >
                HSL
              </button>
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <div className="flex-1 mr-3 relative">
                <input 
                  type="text" 
                  className="w-full text-center p-2 border rounded font-mono text-lg"
                  value={getFormattedColorValue()}
                  onChange={(e) => {
                    if (colorFormat === 'hex') {
                      handleHexChange(e);
                    } else {
                      handleColorStringChange(e.target.value);
                    }
                  }}
                  onBlur={colorFormat === 'hex' ? handleHexBlur : undefined}
                  maxLength={colorFormat === 'hex' ? 7 : 30}
                  aria-label={`${colorFormat.toUpperCase()} color value`}
                />
                
                {isEyedropperSupported && (
                  <button 
                    onClick={handleEyedropper}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    title="Pick color from screen"
                    aria-label="Use eyedropper tool"
                  >
                    <FiDroplet className="w-5 h-5" />
                  </button>
                )}
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
          </>
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