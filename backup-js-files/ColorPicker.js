'use client';

import React, { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';



export default function ColorPicker({ color, onChange, className }) {
  const [value, setValue] = useState(color);

  // Update local state when prop changes
  useEffect(() => {
    setValue(color);
  }, [color]);

  // Handle color change and update parent
  const handleChange = (newColor=> {
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