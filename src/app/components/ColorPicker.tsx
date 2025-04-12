'use client';

import React, { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

export default function ColorPicker({ color, onChange, className }: ColorPickerProps) {
  const [value, setValue] = useState(color);

  // Update local state when prop changes
  useEffect(() => {
    setValue(color);
  }, [color]);

  // Handle color change and update parent
  const handleChange = (newColor: string) => {
    setValue(newColor);
    onChange(newColor);
  };

  return (
    <div className={className}>
      <HexColorPicker color={value} onChange={handleChange} />
      <div className="mt-2">
        <input
          type="text"
          className="w-full px-3 py-2 border rounded font-mono text-sm"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>
    </div>
  );
} 