'use client';

import React, { useState } from 'react';
import ColorPicker, { ColorPickerModal } from './ColorPicker';

export default function ColorPickerExample() {
  const [basicColor, setBasicColor] = useState('#3B82F6');
  const [advancedColor, setAdvancedColor] = useState('#10B981');
  const [modalColor, setModalColor] = useState('#EF4444');
  const [showModal, setShowModal] = useState(false);
  
  return (
    <div className="flex flex-col gap-8 p-6">
      <div>
        <h2 className="text-lg font-semibold mb-3">Basic Color Picker</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <ColorPicker 
            color={basicColor} 
            onChange={setBasicColor} 
            showPreview={false}
            showReset={false}
          />
          <div className="mt-4">
            <p>Selected color: <span className="font-mono">{basicColor}</span></p>
            <div 
              className="w-full h-16 mt-2 rounded-md" 
              style={{ backgroundColor: basicColor }}
            ></div>
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold mb-3">Advanced Color Picker</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <ColorPicker 
            color={advancedColor} 
            onChange={setAdvancedColor} 
            className="max-w-md mx-auto"
          />
          <div className="mt-4 flex justify-center">
            <div className="flex flex-col items-center">
              <p>Selected color: <span className="font-mono">{advancedColor}</span></p>
              <div 
                className="w-40 h-40 mt-2 rounded-full" 
                style={{ backgroundColor: advancedColor }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold mb-3">Modal Color Picker</h2>
        <div className="bg-gray-100 p-4 rounded-lg flex flex-col items-center">
          <div 
            className="w-32 h-32 rounded-md cursor-pointer" 
            style={{ backgroundColor: modalColor }}
            onClick={() => setShowModal(true)}
          ></div>
          <p className="mt-2">Click the color to open modal picker</p>
          <p>Selected color: <span className="font-mono">{modalColor}</span></p>
          
          {showModal && (
            <ColorPickerModal 
              color={modalColor} 
              onChange={setModalColor} 
              onClose={() => setShowModal(false)} 
            />
          )}
        </div>
      </div>
    </div>
  );
} 