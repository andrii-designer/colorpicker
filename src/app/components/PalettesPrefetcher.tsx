'use client';

import { useEffect } from 'react';
import { getDocuments } from '../../lib/firebase/firebaseUtils';

/**
 * Invisible component that prefetches palettes data in the background
 * This helps with performance when navigating between pages
 */
export default function PalettesPrefetcher() {
  useEffect(() => {
    // Prefetch popular palettes in the background after a short delay
    // This delay ensures we don't compete with critical resources on page load
    const timer = setTimeout(() => {
      // Use low priority fetch to avoid blocking main thread
      const prefetch = async () => {
        try {
          console.log('Prefetching palettes data in background');
          await getDocuments('palettes');
          console.log('Successfully prefetched palettes data');
        } catch (error) {
          // Silently fail on prefetch errors - it's just an optimization
          console.log('Background prefetch failed:', error);
        }
      };
      
      prefetch();
    }, 2000); // Wait 2 seconds after page load to start prefetching
    
    return () => clearTimeout(timer);
  }, []);
  
  // This component doesn't render anything visible
  return null;
} 