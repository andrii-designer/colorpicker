'use client';

import { useEffect } from 'react';

/**
 * MobileViewportFix component that addresses the mobile 100vh issue
 * without affecting the desktop layout. Only runs on mobile devices.
 */
export default function MobileViewportFix() {
  useEffect(() => {
    // Function to check if device is mobile
    const isMobileDevice = () => {
      return typeof window !== 'undefined' && window.innerWidth < 768;
    };
    
    // Only apply to mobile devices - check at beginning 
    if (!isMobileDevice()) {
      return;
    }
    
    // Determine if running on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Function to fix viewport height
    const fixViewportHeight = () => {
      try {
        // Double-check it's still mobile (could have resized to desktop)
        if (!isMobileDevice()) {
          return;
        }
        
        // Get reliable window height
        let windowHeight = window.innerHeight;
        
        // For iOS Safari, use visualViewport when available
        if (isIOS && window.visualViewport) {
          windowHeight = window.visualViewport.height;
        }
        
        // Set CSS variable for app height
        document.documentElement.style.setProperty('--app-height', `${windowHeight}px`);
        
        // Force a reflow to ensure immediate application
        void document.documentElement.offsetHeight;
      } catch (error) {
        console.error('Error fixing viewport height:', error);
      }
    };
    
    // Call immediately
    fixViewportHeight();
    
    // Set up event listeners
    const events = ['resize', 'orientationchange', 'load'];
    events.forEach(eventName => {
      window.addEventListener(eventName, fixViewportHeight, { passive: true });
    });
    
    // iOS-specific extra handlers for toolbar show/hide
    if (isIOS) {
      window.addEventListener('touchend', () => {
        setTimeout(fixViewportHeight, 100);
      }, { passive: true });
      
      window.addEventListener('scroll', () => {
        requestAnimationFrame(fixViewportHeight);
      }, { passive: true });
    }
    
    // Check if window resizes to desktop size and remove height constraint
    const checkForDesktopSize = () => {
      if (!isMobileDevice()) {
        // Remove CSS properties to restore desktop layout
        document.documentElement.style.removeProperty('--app-height');
        document.documentElement.style.height = '';
        document.body.style.height = '';
      }
    };
    
    // Add resize listener specifically for switching to desktop
    window.addEventListener('resize', checkForDesktopSize, { passive: true });
    
    // Cleanup on component unmount
    return () => {
      events.forEach(eventName => {
        window.removeEventListener(eventName, fixViewportHeight);
      });
      
      window.removeEventListener('resize', checkForDesktopSize);
      
      if (isIOS) {
        window.removeEventListener('touchend', () => {
          setTimeout(fixViewportHeight, 100);
        });
        window.removeEventListener('scroll', () => {
          requestAnimationFrame(fixViewportHeight);
        });
      }
      
      // Restore normal layout when component unmounts
      document.documentElement.style.removeProperty('--app-height');
      document.documentElement.style.height = '';
      document.body.style.height = '';
    };
  }, []);
  
  // This component doesn't render anything
  return null;
} 