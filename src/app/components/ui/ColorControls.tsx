import React, { useState } from 'react';
import { HarmonyType } from '../../../lib/utils/enhancedColorGeneration';

interface ColorControlsProps {
  onGenerateWithOptions: (options: {
    harmonyType: HarmonyType;
    temperature: 'warm' | 'cool' | 'mixed';
    contrastEnhance: boolean;
    randomize: number;
    highContrast?: boolean;
    usePastels?: boolean;
  }) => void;
}

export default function ColorControls({ onGenerateWithOptions }: ColorControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [harmonyType, setHarmonyType] = useState<HarmonyType>('vibrant');
  const [temperature, setTemperature] = useState<'warm' | 'cool' | 'mixed'>('mixed');
  const [contrastEnhance, setContrastEnhance] = useState(true);
  const [randomize, setRandomize] = useState(0.3);
  const [highContrast, setHighContrast] = useState(true);
  const [usePastels, setUsePastels] = useState(false);
  
  const handleApply = () => {
    onGenerateWithOptions({
      harmonyType,
      temperature,
      contrastEnhance,
      randomize,
      highContrast,
      usePastels
    });
    setIsOpen(false);
  };
  
  const quickGenerate = (type: HarmonyType) => {
    onGenerateWithOptions({
      harmonyType: type,
      temperature,
      contrastEnhance: true,
      randomize: 0.3,
      highContrast: true,
      usePastels: false
    });
  };
  
  const harmonyTypes: HarmonyType[] = [
    'vibrant',
    'analogous', 
    'monochromatic', 
    'triad', 
    'complementary', 
    'splitComplementary', 
    'tetrad', 
    'square',
    'doubleComplementary',
    'natural',
    'pastel',
    'jewel'
  ];
  
  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => quickGenerate('vibrant')}
          className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm"
        >
          Vibrant
        </button>
        <button
          onClick={() => quickGenerate('analogous')}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
        >
          Analogous
        </button>
        <button
          onClick={() => quickGenerate('complementary')}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
        >
          Complementary
        </button>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          Advanced
        </button>
      </div>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl z-20 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Color Palette Controls</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Harmony Type
            </label>
            <div className="relative">
              <select
                value={harmonyType}
                onChange={(e) => setHarmonyType(e.target.value as HarmonyType)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 rounded-md"
              >
                {harmonyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temperature
            </label>
            <div className="flex gap-2 mb-2">
              <button
                className={`flex-1 py-1 px-2 rounded-md text-sm ${
                  temperature === 'warm'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                onClick={() => setTemperature('warm')}
              >
                Warm
              </button>
              <button
                className={`flex-1 py-1 px-2 rounded-md text-sm ${
                  temperature === 'cool'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                onClick={() => setTemperature('cool')}
              >
                Cool
              </button>
              <button
                className={`flex-1 py-1 px-2 rounded-md text-sm ${
                  temperature === 'mixed'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                onClick={() => setTemperature('mixed')}
              >
                Mixed
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color Style
            </label>
            <div className="flex gap-2 mb-2">
              <button
                className={`flex-1 py-1 px-2 rounded-md text-sm ${
                  !highContrast && !usePastels
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                onClick={() => {
                  setHighContrast(false);
                  setUsePastels(false);
                }}
              >
                Standard
              </button>
              <button
                className={`flex-1 py-1 px-2 rounded-md text-sm ${
                  highContrast
                    ? 'bg-purple-800 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                onClick={() => {
                  setHighContrast(true);
                  setUsePastels(false);
                }}
              >
                Ultra Vibrant
              </button>
              <button
                className={`flex-1 py-1 px-2 rounded-md text-sm ${
                  usePastels
                    ? 'bg-pink-400 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                onClick={() => {
                  setHighContrast(false);
                  setUsePastels(true);
                }}
              >
                Pastel
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center">
              <input
                id="contrast-enhance"
                type="checkbox"
                checked={contrastEnhance}
                onChange={(e) => setContrastEnhance(e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="contrast-enhance" className="ml-2 block text-sm text-gray-700">
                Enhance Contrast
              </label>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Randomization: {Math.round(randomize * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={randomize}
              onChange={(e) => setRandomize(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleApply}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Apply & Generate
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 