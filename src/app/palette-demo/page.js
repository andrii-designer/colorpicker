'use client';

import { useState, useEffect } from 'react';
import *@/lib/utils';
import { STATIC_COLOR_DATA } from '@/lib/utils/colorDataStatic';

export default function PaletteDemo() {
  const [baseColor, setBaseColor] = useState('#1E90FF');
  const [palette, setPalette] = useState([]);
  const [numColors, setNumColors] = useState(5);
  const [useNamedColors, setUseNamedColors] = useState(true);
  const [namedColorRatio, setNamedColorRatio] = useState(0.5);
  const [paletteType, setPaletteType] = useState('analogous');
  
  useEffect(() => {
    generatePalette();
  }, []);
  
  const generatePalette = () => {
    try {
      const colors = colorUtils.generateColorPalette(baseColor, {
        numColors,
        useNamedColors,
        namedColorRatio,
        paletteType,
        colorData });
      
      setPalette(colors);
    } catch (error) {
      console.error('Error generating palette);
      setPalette([]);
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Color Palette Generator</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          
            <label className="block text-sm font-medium mb-1">Base Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={baseColor}
                onChange={(e) => setBaseColor(e.target.value)}
                className="h-10 w-20"
              />
              <input
                type="text"
                value={baseColor}
                onChange={(e) => setBaseColor(e.target.value)}
                className="border rounded px-3 py-2"
              />
            </div>
          </div>
          
          
            <label className="block text-sm font-medium mb-1">Number of Colors</label>
            <input
              type="range"
              min="3"
              max="10"
              value={numColors}
              onChange={(e) => setNumColors(parseInt(e.target.value))}
              className="w-full"
            />
            <span className="text-sm">{numColors} colors</span>
          </div>
          
          
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useNamedColors}
                onChange={(e) => setUseNamedColors(e.target.checked)}
              />
              Use Named Colors</span>
            </label>
          </div>
          
          {useNamedColors && (
            
              <label className="block text-sm font-medium mb-1">Named Color Ratio</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={namedColorRatio}
                onChange={(e) => setNamedColorRatio(parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-sm">{Math.round(namedColorRatio * 100)}% named colors</span>
            </div>
          )}
          
          
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
            </select>
          </div>
          
          <button
            onClick={generatePalette}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Generate Palette
          </button>
        </div>
        
        
          <h2 className="text-xl font-semibold mb-4">Generated Palette</h2>
          <div className="space-y-4">
            {palette.length > 0 ? (
              palette.map((color, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className="h-12 w-24 rounded mr-4"
                    style={{ backgroundColor }}
                  ></div>
                  
                    <div className="font-medium">{color.name || 'Unnamed'}</div>
                    <div className="text-sm text-gray-600">{color.hex}</div>
                    <div className="text-xs text-gray-500">
                      RGB: {color.rgb.r}, {color.rgb.g}, {color.rgb.b}
                    </div>
                  </div>
                </div>
              ))
            )  yet</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Preview</h2>
        <div className="h-32 w-full rounded overflow-hidden flex">
          {palette.map((color, index) => (
            <div
              key={index}
              className="h-full flex-1"
              style={{ backgroundColor }}
              title={color.name || color.hex}
            ></div>
          ))}
        </div>
      </div>
      
      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        <p className="mb-3">
          Our enhanced color palette generator combines algorithmic color generation with a database of {STATIC_COLOR_DATA.length.toLocaleString()} named colors.
        </p>
        <ul className="list-disc ml-6 space-y-2">
          Start with a base color - either pick one or enter a hex code</li>
          Adjust the number of colors in your palette (3-10)</li>
          Choose whether to include named colors from our database</li>
          Set the ratio of named to algorithmically generated colors</li>
          Select a palette type (monochromatic, complementary, etc.)</li>
        </ul>
        <p className="mt-3">
          The algorithm will intelligently mix generated colors with similarly named colors from our extensive database, 
          prioritizing visually pleasing combinations while maintaining the characteristics of your chosen palette type.
        </p>
      </div>
    </div>
  );
} 