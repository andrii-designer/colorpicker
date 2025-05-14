'use client';

import React, { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import tinycolor from 'tinycolor2';

interface MobileColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
}

// Helper interface for TypeScript
interface TinyColorInstance {
  toHexString: () => string;
  toHsl: () => {h: number; s: number; l: number};
  toHsv: () => {h: number; s: number; v: number};
  toRgb: () => {r: number; g: number; b: number};
}

export default function MobileColorPicker({ color, onChange, onClose }: MobileColorPickerProps) {
  const [hexValue, setHexValue] = useState(color.toUpperCase());
  const initialColorRef = React.useRef(color);
  const [activeTab, setActiveTab] = useState<'hex' | 'hsl' | 'hsb'>('hex');

  // Parse color to HSL and HSB values
  const tc = tinycolor(hexValue) as unknown as TinyColorInstance;
  const [hslValues, setHslValues] = useState(tc.toHsl());
  const [hsbValues, setHsbValues] = useState(tc.toHsv());

  // Update HSL/HSB values when hex changes
  useEffect(() => {
    const color = tinycolor(hexValue) as unknown as TinyColorInstance;
    setHslValues(color.toHsl());
    setHsbValues(color.toHsv());
  }, [hexValue]);

  const handleColorChange = (newColor: string) => {
    setHexValue(newColor.toUpperCase());
    // Update HSL and HSB values
    const tc = tinycolor(newColor) as unknown as TinyColorInstance;
    setHslValues(tc.toHsl());
    setHsbValues(tc.toHsv());
    // Update the color in real-time
    onChange(newColor);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHexValue(e.target.value);
    // Update in real-time if it's a valid hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
      const tc = tinycolor(e.target.value) as unknown as TinyColorInstance;
      setHslValues(tc.toHsl());
      setHsbValues(tc.toHsv());
      onChange(e.target.value);
    }
  };

  const handleDone = () => {
    // Final update when Done is clicked
    onChange(hexValue);
    onClose();
  };

  const handleReset = () => {
    // Reset to initial color
    setHexValue(initialColorRef.current);
    const tc = tinycolor(initialColorRef.current) as unknown as TinyColorInstance;
    setHslValues(tc.toHsl());
    setHsbValues(tc.toHsv());
    onChange(initialColorRef.current);
  };

  // Get background styles for color sliders
  const getHueGradient = () => {
    return {
      background: `linear-gradient(to right, 
        rgb(255, 0, 0), 
        rgb(255, 255, 0), 
        rgb(0, 255, 0), 
        rgb(0, 255, 255), 
        rgb(0, 0, 255), 
        rgb(255, 0, 255), 
        rgb(255, 0, 0))`
    };
  };

  // HSL slider handlers
  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = parseInt(e.target.value);
    const newHsl = { ...hslValues, h: newHue };
    setHslValues(newHsl);
    const newColor = tinycolor(newHsl as any).toHexString().toUpperCase();
    setHexValue(newColor);
    setHsbValues((tinycolor(newColor) as unknown as TinyColorInstance).toHsv());
    onChange(newColor);
  };

  const handleSaturationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSaturation = parseFloat(e.target.value) / 100;
    const newHsl = { ...hslValues, s: newSaturation };
    setHslValues(newHsl);
    const newColor = tinycolor(newHsl as any).toHexString().toUpperCase();
    setHexValue(newColor);
    setHsbValues((tinycolor(newColor) as unknown as TinyColorInstance).toHsv());
    onChange(newColor);
  };

  const handleLightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLightness = parseFloat(e.target.value) / 100;
    const newHsl = { ...hslValues, l: newLightness };
    setHslValues(newHsl);
    const newColor = tinycolor(newHsl as any).toHexString().toUpperCase();
    setHexValue(newColor);
    setHsbValues((tinycolor(newColor) as unknown as TinyColorInstance).toHsv());
    onChange(newColor);
  };

  // HSB slider handlers
  const handleHsvHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = parseInt(e.target.value);
    const newHsv = { ...hsbValues, h: newHue };
    setHsbValues(newHsv);
    const newColor = tinycolor(newHsv as any).toHexString().toUpperCase();
    setHexValue(newColor);
    setHslValues((tinycolor(newColor) as unknown as TinyColorInstance).toHsl());
    onChange(newColor);
  };

  const handleSaturationBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSaturation = parseFloat(e.target.value) / 100;
    const newHsv = { ...hsbValues, s: newSaturation };
    setHsbValues(newHsv);
    const newColor = tinycolor(newHsv as any).toHexString().toUpperCase();
    setHexValue(newColor);
    setHslValues((tinycolor(newColor) as unknown as TinyColorInstance).toHsl());
    onChange(newColor);
  };

  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBrightness = parseFloat(e.target.value) / 100;
    const newHsv = { ...hsbValues, v: newBrightness };
    setHsbValues(newHsv);
    const newColor = tinycolor(newHsv as any).toHexString().toUpperCase();
    setHexValue(newColor);
    setHslValues((tinycolor(newColor) as unknown as TinyColorInstance).toHsl());
    onChange(newColor);
  };

  // Get styling for tab-specific sliders
  const getSaturationGradient = () => {
    // Fixed hue and lightness, varying saturation
    const hue = hslValues.h;
    const lightness = hslValues.l;
    return {
      background: `linear-gradient(to right, 
        ${tinycolor({h: hue, s: 0, l: lightness} as any).toHexString()}, 
        ${tinycolor({h: hue, s: 1, l: lightness} as any).toHexString()})`
    };
  };

  const getLightnessGradient = () => {
    // Fixed hue and saturation, varying lightness
    const hue = hslValues.h;
    const saturation = hslValues.s;
    return {
      background: `linear-gradient(to right, 
        ${tinycolor({h: hue, s: saturation, l: 0} as any).toHexString()}, 
        ${tinycolor({h: hue, s: saturation, l: 0.5} as any).toHexString()}, 
        ${tinycolor({h: hue, s: saturation, l: 1} as any).toHexString()})`
    };
  };

  const getHsvSaturationGradient = () => {
    // Fixed hue and value, varying saturation
    const hue = hsbValues.h;
    const value = hsbValues.v;
    return {
      background: `linear-gradient(to right, 
        ${tinycolor({h: hue, s: 0, v: value} as any).toHexString()}, 
        ${tinycolor({h: hue, s: 1, v: value} as any).toHexString()})`
    };
  };

  const getBrightnessGradient = () => {
    // Fixed hue and saturation, varying value (brightness)
    const hue = hsbValues.h;
    const saturation = hsbValues.s;
    return {
      background: `linear-gradient(to right, 
        ${tinycolor({h: hue, s: saturation, v: 0} as any).toHexString()}, 
        ${tinycolor({h: hue, s: saturation, v: 1} as any).toHexString()})`
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-[250px] rounded-lg shadow-lg overflow-hidden">
        {/* Tabs for switching between color models */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('hex')}
            className={`flex-1 py-2 text-xs font-medium ${activeTab === 'hex' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
          >
            Hex
          </button>
          <button
            onClick={() => setActiveTab('hsl')}
            className={`flex-1 py-2 text-xs font-medium ${activeTab === 'hsl' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
          >
            HSL
          </button>
          <button
            onClick={() => setActiveTab('hsb')}
            className={`flex-1 py-2 text-xs font-medium ${activeTab === 'hsb' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
          >
            HSB
          </button>
        </div>

        <div className="flex flex-col">
          {/* Hex input field */}
          {activeTab === 'hex' && (
            <div className="px-3 pt-3">
              <h3 className="text-base font-medium mb-2">Hex Color</h3>
              <input
                type="text"
                value={hexValue}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="#RRGGBB"
              />
            </div>
          )}

          {/* HSL sliders */}
          {activeTab === 'hsl' && (
            <div className="space-y-2 px-3 pt-3">
              <h3 className="text-base font-medium mb-2">HSL Color</h3>
              
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-gray-700">Hue: {Math.round(hslValues.h)}°</label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="359"
                  value={Math.round(hslValues.h)}
                  onChange={handleHueChange}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                  style={getHueGradient()}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-gray-700">Saturation: {Math.round(hslValues.s * 100)}%</label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(hslValues.s * 100)}
                  onChange={handleSaturationChange}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                  style={getSaturationGradient()}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-gray-700">Lightness: {Math.round(hslValues.l * 100)}%</label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(hslValues.l * 100)}
                  onChange={handleLightnessChange}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                  style={getLightnessGradient()}
                />
              </div>
            </div>
          )}

          {/* HSB sliders */}
          {activeTab === 'hsb' && (
            <div className="space-y-2 px-3 pt-3">
              <h3 className="text-base font-medium mb-2">HSB Color</h3>
              
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-gray-700">Hue: {Math.round(hsbValues.h)}°</label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="359"
                  value={Math.round(hsbValues.h)}
                  onChange={handleHsvHueChange}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                  style={getHueGradient()}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-gray-700">Saturation: {Math.round(hsbValues.s * 100)}%</label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(hsbValues.s * 100)}
                  onChange={handleSaturationBrightnessChange}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                  style={getHsvSaturationGradient()}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-gray-700">Brightness: {Math.round(hsbValues.v * 100)}%</label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(hsbValues.v * 100)}
                  onChange={handleBrightnessChange}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                  style={getBrightnessGradient()}
                />
              </div>
            </div>
          )}

          {/* Color picker (always shown) */}
          <div className="mt-3">
            <div className="react-colorful-wrapper">
              <HexColorPicker 
                color={hexValue} 
                onChange={handleColorChange}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 mt-3 px-3 pb-3">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none"
            >
              Reset
            </button>
            <button
              onClick={handleDone}
              className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 