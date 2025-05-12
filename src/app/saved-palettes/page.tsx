'use client';

import React, { useState, useEffect } from 'react';
import { Logo } from '../components/ui/Logo';
import { Navigation } from '../components/ui/Navigation';
import { ColorTags } from '../components/ui/ColorTags';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';
import { auth, db } from '../../lib/firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getDocuments, deleteDocument, updateDocument } from '../../lib/firebase/firebaseUtils';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ColorCategory } from '../../lib/utils/colorDatabase';

interface SavedPalette {
  id: string;
  colors: string[];
  createdAt: string;
  categories?: ColorCategory[];
}

// A helper function to get document by ID since the import is having issues
const getDocumentById = async (collectionName: string, id: string) => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      console.log(`No document found with ID: ${id}`);
      return null;
    }
  } catch (error) {
    console.error(`Error getting document ${id} from ${collectionName}:`, error);
    throw error;
  }
};

// Helper function to sort palettes by createdAt date (newest first)
const sortPalettesByDate = (palettes: SavedPalette[]) => {
  return [...palettes].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

// Helper function to determine the category of a color based on its hex value
const getColorCategory = (hex: string): ColorCategory => {
  if (!hex || !hex.startsWith('#') || hex.length !== 7) {
    console.warn('Invalid hex color format:', hex);
    return 'gray'; // Default fallback
  }

  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  // Convert RGB to HSL
  const r1 = r / 255;
  const g1 = g / 255;
  const b1 = b / 255;
  
  const max = Math.max(r1, g1, b1);
  const min = Math.min(r1, g1, b1);
  const l = (max + min) / 2;
  
  let h = 0;
  let s = 0;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    if (max === r1) {
      h = (g1 - b1) / d + (g1 < b1 ? 6 : 0);
    } else if (max === g1) {
      h = (b1 - r1) / d + 2;
    } else {
      h = (r1 - g1) / d + 4;
    }
    
    h *= 60;
  }
  
  // Achromatic colors detection (black, white, gray)
  if (s < 0.1) {
    if (l < 0.2) return 'black';
    if (l > 0.8) return 'white';
    return 'gray';
  }
  
  // Determine the color's intensity/saturation
  const intensity = s * (l < 0.5 ? l : 1 - l);
  
  // Check for very dark colors (close to black)
  if (l < 0.15) return 'black';
  
  // Check for metallic colors (usually muted with medium lightness)
  if (s < 0.3 && l > 0.4 && l < 0.8) return 'metallic';
  
  // Check for browns - usually low saturation, warm hue, and lower lightness
  if (((h >= 0 && h <= 35) || (h >= 325 && h <= 360)) && s < 0.5 && l < 0.5) return 'brown';
  
  // Classify main colors based on hue
  if ((h >= 355 || h < 10) && s > 0.35) return 'red';
  if (h >= 10 && h < 45) return 'orange';
  if (h >= 45 && h < 65) return 'yellow';
  if (h >= 65 && h < 170) return 'green';
  if (h >= 170 && h < 250) return 'blue';
  if (h >= 250 && h < 325) return 'purple';
  if (h >= 325 && h < 355) return 'pink';
  
  // Fallback for edge cases
  return 'gray';
};

export default function SavedPalettes() {
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([]);
  const [filteredPalettes, setFilteredPalettes] = useState<SavedPalette[]>([]);
  const [selectedTag, setSelectedTag] = useState<ColorCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [likedPalettes, setLikedPalettes] = useState<string[]>([]);

  // Check for authenticated user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Load saved palettes from localStorage and ensure they match with Firestore data
    const loadPalettes = async () => {
      try {
        setIsLoading(true);
        setLoadingError(null);
        
        // Load local saved palettes first to ensure we have something to show
        const storedPalettes = localStorage.getItem('savedPalettes');
        let localPalettes: SavedPalette[] = [];
        
        if (storedPalettes) {
          try {
            localPalettes = JSON.parse(storedPalettes);
            console.log('Loaded local palettes:', localPalettes.length);
            
            // Process palettes to add categories
            localPalettes = localPalettes.map(palette => {
              // Determine categories for each color in the palette
              const colors = palette.colors || [];
              const categories = colors.map(color => getColorCategory(color));
              
              // Debug: log color categories
              if (process.env.NODE_ENV === 'development') {
                console.group(`Saved palette ${palette.id} categories:`);
                colors.forEach((color) => {
                  console.log(`${color} → ${getColorCategory(color)}`);
                });
                console.groupEnd();
              }
              
              return {
                ...palette,
                categories: Array.from(new Set(categories)) // Remove duplicates
              };
            });
            
            // Update UI immediately with local data, already sorted
            if (localPalettes.length > 0) {
              // Sort by date and set to state
              const sortedPalettes = sortPalettesByDate(localPalettes);
              setSavedPalettes(sortedPalettes);
              setFilteredPalettes(sortedPalettes);
              setIsLoading(false);
            }
          } catch (e) {
            console.error('Error parsing local palettes:', e);
            // Continue with empty local palettes
          }
        }
        
        // Get liked palettes
        const storedLikedPalettes = localStorage.getItem('likedPalettes');
        if (storedLikedPalettes) {
          try {
            setLikedPalettes(JSON.parse(storedLikedPalettes));
          } catch (e) {
            console.error('Error parsing liked palettes:', e);
          }
        }
        
        // Fetch palettes from Firestore to merge with local data
        console.log('Fetching Firestore palettes');
        try {
          // Add debug logs for Firebase connection
          console.log('Firebase DB instance:', db);
          console.log('Firebase collection name: palettes');
          
          const firestorePalettes = await getDocuments('palettes');
          console.log('Fetched Firestore palettes:', firestorePalettes.length);
          
          // If we have Firestore data, merge it
          if (firestorePalettes && firestorePalettes.length > 0) {
            // Combine local and Firestore palettes, giving priority to Firestore data
            // but only keeping palettes the user has saved
            const allPalettes = localPalettes.map(localPalette => {
              // Check if this palette exists in Firestore
              const matchingFirestorePalette = firestorePalettes.find(
                (p: any) => p.id === localPalette.id
              ) as { id: string; colors?: string[]; createdAt?: string } | undefined;
              
              if (matchingFirestorePalette) {
                const colors = matchingFirestorePalette.colors || localPalette.colors;
                const categories = colors.map(color => getColorCategory(color));
                
                // Use Firestore data but keep as a saved palette format
                return {
                  id: matchingFirestorePalette.id,
                  colors: colors,
                  createdAt: matchingFirestorePalette.createdAt || localPalette.createdAt,
                  categories: Array.from(new Set(categories)) // Remove duplicates
                };
              }
              
              // Keep local palettes that aren't in Firestore
              return localPalette;
            });
            
            // Sort by creation date (newest first) and store in state
            const sortedPalettes = sortPalettesByDate(allPalettes);
            setSavedPalettes(sortedPalettes);
            setFilteredPalettes(sortedPalettes);
            
            // Also update localStorage with sorted palettes (including categories)
            localStorage.setItem('savedPalettes', JSON.stringify(sortedPalettes));
          }
        } catch (firestoreError) {
          console.error('Error fetching from Firestore:', firestoreError);
          // Just keep using local data, don't show error to user
          if (localPalettes.length === 0) {
            setLoadingError('Error loading palettes from server. Using local data only.');
          }
        }
      } catch (error) {
        console.error('Error loading saved palettes:', error);
        setLoadingError('Failed to load palettes. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPalettes();
  }, []);

  // Filter palettes when a tag is selected
  useEffect(() => {
    if (!selectedTag) {
      setFilteredPalettes(savedPalettes);
    } else {
      const filtered = savedPalettes.filter(palette => 
        palette.categories && palette.categories.includes(selectedTag)
      );
      setFilteredPalettes(filtered);
    }
  }, [selectedTag, savedPalettes]);

  const handleDeletePalette = async (id: string) => {
    try {
      console.log('Deleting palette with ID:', id);
      
      // Update UI first for immediate response
      const updatedPalettes = savedPalettes.filter(palette => palette.id !== id);
      const likedPalettes = JSON.parse(localStorage.getItem('likedPalettes') || '[]');
      const updatedLikedPalettes = likedPalettes.filter((paletteId: string) => paletteId !== id);
      
      // Update localStorage immediately with already-sorted palettes
      localStorage.setItem('savedPalettes', JSON.stringify(updatedPalettes));
      localStorage.setItem('likedPalettes', JSON.stringify(updatedLikedPalettes));
      
      // Update state
      setSavedPalettes(updatedPalettes);
      setLikedPalettes(updatedLikedPalettes);
      
      // Show immediate feedback
      toast.success('Palette removed from your collection');
      
      // Now update Firestore in the background
      (async () => {
        try {
          // Get current palette data
          const paletteDoc = await getDocumentById('palettes', id) as { 
            id: string; 
            likes?: number; 
            colors?: string[]; 
            createdAt?: string; 
          } | null;
          
          if (paletteDoc) {
            // If the palette exists in Firestore and has more than 1 like,
            // just decrement the likes count instead of deleting
            if (paletteDoc.likes && paletteDoc.likes > 1) {
              console.log('Palette has multiple likes, decreasing like count instead of deleting');
              await updateDocument('palettes', id, { 
                likes: Math.max(0, paletteDoc.likes - 1) 
              });
            } else {
              // If this is the only like, delete the palette
              console.log('Palette has only one like, deleting completely');
              await deleteDocument('palettes', id);
            }
          } else {
            console.log('Palette not found in Firestore, only removing locally');
          }
        } catch (firestoreError) {
          console.error('Background error updating Firestore:', firestoreError);
          // Don't show error to user since local deletion succeeded
        }
      })();
    } catch (error) {
      console.error('Error deleting palette:', error);
      toast.error('Failed to delete palette');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Add function to handle color click/copy
  const handleColorClick = (color: string) => {
    try {
      navigator.clipboard.writeText(color);
      toast.success(`Copied ${color.toUpperCase()} to clipboard`);
    } catch (error) {
      console.error('Failed to copy color:', error);
      toast.error('Failed to copy color to clipboard');
    }
  };

  // Add function to export/download palette as PNG
  const handleExportPalette = (palette: SavedPalette) => {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      toast.error('Your browser does not support canvas export');
      return;
    }
    
    // Get device pixel ratio for high-resolution export
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas dimensions - vertical layout with higher resolution
    const colorCount = palette.colors.length;
    const baseWidth = 800; // Width
    const baseHeight = colorCount * 200; // Height per color
    
    // Set display size (css pixels)
    canvas.style.width = baseWidth + 'px';
    canvas.style.height = baseHeight + 'px';
    
    // Set actual size in memory (scaled for higher resolution)
    canvas.width = baseWidth * dpr;
    canvas.height = baseHeight * dpr;
    
    // Scale all drawing operations by the dpr
    ctx.scale(dpr, dpr);
    
    // Draw color boxes in a column (vertical) layout
    palette.colors.forEach((color, index) => {
      const y = index * (baseHeight / colorCount);
      const colorHeight = baseHeight / colorCount;
      
      // Draw color box
      ctx.fillStyle = color;
      ctx.fillRect(0, y, baseWidth, colorHeight);
      
      // Draw color code with white text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Inter, monospace'; // Larger font
      ctx.textAlign = 'left';
      
      // Add shadow to text for better visibility on any background
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      // Draw text with more padding from the edge
      ctx.fillText(color.toUpperCase(), 40, y + colorHeight - 40);
      
      // Reset shadow for next operations
      ctx.shadowColor = 'transparent';
    });
    
    // Convert canvas to data URL with maximum quality
    try {
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      
      // Create download link
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `color-palette-${timestamp}.png`;
      link.href = dataUrl;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Palette downloaded!');
    } catch (err) {
      console.error('Error exporting palette:', err);
      toast.error('Failed to export palette');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white max-w-full overflow-hidden">
      <header className="bg-white py-4 flex-shrink-0">
        <div className="flex items-center justify-between w-full px-4">
          <div className="w-[200px] flex-shrink-0">
            <Logo />
          </div>
          
          <div className="flex-shrink-0">
            <Navigation />
          </div>
          
          <div className="w-[320px] flex-shrink-0">
            {/* Empty div to maintain consistent header layout */}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto px-4 pb-4">
        <div className="flex justify-between items-center mb-6 mt-4">
          <h1 className="text-3xl font-bold">Saved Palettes</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-gray-200">
              <span className="text-gray-400">❤️</span>
              <span className="text-lg font-medium">{!isLoading ? (selectedTag ? filteredPalettes.length : savedPalettes.length) : '-'}</span>
            </div>
          </div>
        </div>
        
        {/* Color Tag Filter */}
        {!isLoading && !loadingError && savedPalettes.length > 0 && (
          <ColorTags selectedTag={selectedTag} onSelectTag={setSelectedTag} />
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-gray-400">Loading saved palettes...</div>
          </div>
        ) : loadingError ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-700">{loadingError}</p>
          </div>
        ) : filteredPalettes.length === 0 ? (
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <p className="text-gray-500 mb-4">
              {selectedTag 
                ? `No palettes found with the color "${selectedTag}". Try another color filter.` 
                : "You don't have any saved palettes yet"}
            </p>
            {selectedTag ? (
              <button
                onClick={() => setSelectedTag(null)}
                className="inline-flex items-center px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
              >
                Show All Palettes
              </button>
            ) : (
              <Link 
                href="/" 
                className="inline-flex items-center px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
              >
                Create a Palette
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
            {filteredPalettes.map(palette => (
                <div key={palette.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex h-24">
                    {palette.colors.map((color, index) => (
                      <div 
                        key={`${palette.id}-${index}`} 
                        className="flex-1 cursor-pointer hover:opacity-90 relative group"
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorClick(color)}
                        title={`${color.toUpperCase()} - Category: ${getColorCategory(color)}`}
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity">
                          <span className="bg-white/80 text-xs font-mono px-2 py-1 rounded shadow">{color.toUpperCase()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {formatDate(palette.createdAt)}
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleExportPalette(palette)}
                        className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        title="Download palette"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeletePalette(palette.id)}
                        className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors"
                        title="Delete palette"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"></path>
                          <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>
      <Toaster position="bottom-center" />
    </div>
  );
} 