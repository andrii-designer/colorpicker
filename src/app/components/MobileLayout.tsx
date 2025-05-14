import React from 'react';

interface MobileLayoutProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * MobileLayout component that properly handles mobile viewport height issues,
 * ensuring that content fits in the viewport without scrolling and footer stays fixed.
 */
export default function MobileLayout({ children, footer }: MobileLayoutProps) {
  return (
    <div className="mobile-layout flex flex-col h-full">
      <div className="mobile-content-area">
        <div className="color-palette-container">
          {children}
        </div>
      </div>
      
      {footer && (
        <div className="bottom-controls-container bg-white shadow-lg border-t border-gray-200 px-4 py-4">
          {footer}
        </div>
      )}
    </div>
  );
} 