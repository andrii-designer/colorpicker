'use client';

import React, { ReactNode, useEffect } from 'react';

interface MobileStackLayoutProps {
  header: ReactNode;
  content: ReactNode;
  bottomControls: ReactNode;
  variant?: 'default' | 'empty';
}

/**
 * MobileStackLayout component that implements a three-row stack layout for mobile:
 * 1. Header row (fixed height)
 * 2. Content row (flexible height - fills available space)
 * 3. Bottom controls row (min-height with ability to expand based on content)
 */
export function MobileStackLayout({
  header,
  content,
  bottomControls,
  variant = 'default'
}: MobileStackLayoutProps) {
  // Effect to ensure the viewport height calculation is correct for mobile 
  useEffect(() => {
    const handleResize = () => {
      // Set CSS variable for viewport height for mobile devices
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };

    // Initialize on component mount
    handleResize();
    
    // Add resize event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="mobile-stack-layout">
      {/* Header row */}
      <div className="mobile-header-row">
        {header}
      </div>
      
      {/* Content row (color palette) */}
      <div className={`mobile-palette-row ${variant === 'empty' ? 'flex items-center justify-center' : ''}`}>
        {content}
      </div>
      
      {/* Bottom controls row */}
      <div className="mobile-bottom-row">
        {bottomControls}
      </div>
    </div>
  );
} 