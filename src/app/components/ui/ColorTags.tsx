import React from 'react';
import { ColorCategory } from '../../../lib/utils/colorDatabase';

interface ColorTagsProps {
  selectedTag: ColorCategory | null;
  onSelectTag: (tag: ColorCategory | null) => void;
}

const COLOR_CATEGORIES: { name: ColorCategory; color: string }[] = [
  { name: 'red', color: '#FF5252' },
  { name: 'orange', color: '#FF9800' },
  { name: 'yellow', color: '#FFEB3B' },
  { name: 'green', color: '#4CAF50' },
  { name: 'blue', color: '#2196F3' },
  { name: 'purple', color: '#9C27B0' },
  { name: 'pink', color: '#FF80AB' },
  { name: 'brown', color: '#795548' },
  { name: 'gray', color: '#9E9E9E' },
  { name: 'black', color: '#212121' },
  { name: 'white', color: '#FAFAFA' },
  { name: 'metallic', color: '#B0BEC5' }
];

export const ColorTags: React.FC<ColorTagsProps> = ({ selectedTag, onSelectTag }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {/* All/Reset button */}
      <button
        onClick={() => onSelectTag(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          selectedTag === null
            ? 'bg-black text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        All Palettes
      </button>

      {/* Color category tags */}
      {COLOR_CATEGORIES.slice(0, 7).map((category) => (
        <button
          key={category.name}
          onClick={() => onSelectTag(category.name)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
            selectedTag === category.name
              ? 'bg-black text-white'
              : 'bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <span 
            className="w-3 h-3 rounded-full inline-block" 
            style={{ backgroundColor: category.color }}
          />
          {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
        </button>
      ))}
    </div>
  );
}; 