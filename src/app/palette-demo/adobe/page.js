'use client';

import React, { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { generateColorPalette } from '@/lib/utils/generateColors';
import { Color } from '@/lib/utils/generateColors';

export default function AdobePaletteDemo() {
  const [baseColor, setBaseColor] = useState('#1E90FF');
  const [paletteType, setPaletteType] = useState('analogous');
  const [colorPalette, setColorPalette] = useState([]);
  const [useAdobeAlgorithm, setUseAdobeAlgorithm] = useState(true);
  
  // Generate palette on component mount and when dependencies change
  useEffect(() => {
    generatePalette();
  }, [baseColor, paletteType, useAdobeAlgorithm]);
  
  // Function to generate the palette
  const generatePalette = () => {
    const palette = generateColorPalette(baseColor, {
      paletteType,
      useAdobeAlgorithm,
      // Add a random seed to ensure different results each time
      seed + Math.random()
    });
    setColorPalette(palette);
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Adobe-Style Color Palette Generator</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Color picker and controls */}
        <div className="w-full md:w-1/3 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Base Color</h2>
          <HexColorPicker
            color={baseColor}
            onChange={setBaseColor}
            className="w-full mb-4"
          />
          
          <div className="flex items-center mb-2">
            <div 
              className="w-10 h-10 mr-2 rounded" 
              style={{ backgroundColor }}
            />
            <input
              type="text"
              value={baseColor}
              onChange={(e) => setBaseColor(e.target.value)}
              className="px-3 py-2 border rounded w-full"
            />
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium mb-1">Palette Type</label>
            <select
              value={paletteType}
              onChange={(e) => setPaletteType(e.target.value}
              className="w-full border rounded px-3 py-2"
            >
              <option value="monochromatic">Monochromatic</option>
              <option value="complementary">Complementary</option>
              <option value="analogous">Analogous</option>
              <option value="triadic">Triadic</option>
              <option value="tetradic">Tetradic</option>
              <option value="splitComplementary">Split Complementary</option>
            </select>
          </div>
          
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={useAdobeAlgorithm}
                onChange={() => setUseAdobeAlgorithm(!useAdobeAlgorithm)}
                className="mr-2"
              />
              Use Adobe-Style Algorithm</span>
            </label>
          </div>
          
          <button
            onClick={generatePalette}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mt-4 w-full"
          >
            Generate New Palette
          </button>
           
          <p className="text-xs text-gray-600 mt-2 text-center">
            Click to generate a new palette variation, even with the same settings.
          </p>
        </div>
        
        {/* Generated palette */}
        <div className="w-full md:w-2/3">
          <h2 className="text-xl font-semibold mb-4">Generated Palette</h2>
          
          <div className="grid grid-cols-1 gap-4">
            {colorPalette.map((color, index) => (
              <div key={index} className="flex">
                <div 
                  className="w-24 h-24 mr-4 rounded-md shadow-md" 
                  style={{ backgroundColor }}
                />
                <div className="flex flex-col justify-center">
                  <p className="font-semibold">{color.name || `Color ${index + 1}`}</p>
                  <p className="text-sm mb-1">{color.hex.toUpperCase()}</p>
                  <p className="text-xs text-gray-600">
                    RGB: {color.rgb.r}, {color.rgb.g}, {color.rgb.b}
                  </p>
                  <p className="text-xs text-gray-600">
                    HSL: {Math.round(color.hsl.h)}°, {Math.round(color.hsl.s)}%, {Math.round(color.hsl.l)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Palette preview */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Palette Preview</h3>
            <div className="flex h-16 rounded-md overflow-hidden">
              {colorPalette.map((color, index) => (
                <div 
                  key={index}
                  className="flex-1"
                  style={{ backgroundColor }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 