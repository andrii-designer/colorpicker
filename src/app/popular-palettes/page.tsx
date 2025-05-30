'use client';

import React, { useState, useEffect } from 'react';
import { Logo } from '../components/ui/Logo';
import { Navigation } from '../components/ui/Navigation';
import { MobileNavigation } from '../components/ui/MobileNavigation';
import { ColorTags } from '../components/ui/ColorTags';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';
import { getDocuments, updateDocument } from '../../lib/firebase/firebaseUtils';
import { auth, db } from '../../lib/firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ColorCategory } from '../../lib/utils/colorDatabase';

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

interface PopularPalette {
  id: string;
  colors: string[];
  createdAt: string;
  likes: number;
  categories?: ColorCategory[]; // Added categories field
}

// Skeleton component for loading state
const PaletteSkeleton = () => (
  <div className="border border-gray-200 rounded-lg overflow-hidden animate-pulse">
    <div className="flex h-24">
      {[...Array(5)].map((_, index) => (
        <div 
          key={index} 
          className="flex-1"
          style={{ backgroundColor: `rgb(${220 + index * 8}, ${220 + index * 8}, ${220 + index * 8})` }}
        />
      ))}
    </div>
    <div className="p-4 flex justify-between items-center">
      <div className="bg-gray-200 h-4 w-24 rounded"></div>
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gray-200"></div>
        <div className="h-4 w-6 bg-gray-200 rounded"></div>
        <div className="h-8 w-8 rounded-full bg-gray-200"></div>
      </div>
    </div>
  </div>
);

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

export default function PopularPalettes() {
  const [popularPalettes, setPopularPalettes] = useState<PopularPalette[]>([]);
  const [filteredPalettes, setFilteredPalettes] = useState<PopularPalette[]>([]);
  const [selectedTag, setSelectedTag] = useState<ColorCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [likedPalettes, setLikedPalettes] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  
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
  
  // Initialize liked palettes from localStorage immediately
  useEffect(() => {
    try {
      const storedLikedPalettes = localStorage.getItem('likedPalettes');
      if (storedLikedPalettes) {
        setLikedPalettes(JSON.parse(storedLikedPalettes));
      } else {
        // Initialize liked palettes if not exists
        localStorage.setItem('likedPalettes', JSON.stringify([]));
      }
    } catch (e) {
      console.error('Error parsing liked palettes from localStorage:', e);
    }
  }, []);
  
  // Load popular palettes
  useEffect(() => {
    const fetchPalettes = async () => {
      if (!isLoading) return; // Prevent duplicate fetches
      
      try {
        // Fetch from Firestore
        const firestorePalettes = await getDocuments('palettes');
        
        if (firestorePalettes && firestorePalettes.length > 0) {
          // Deduplicate and process palettes
          const uniquePalettes: { [key: string]: PopularPalette } = {};
          
          firestorePalettes.forEach((palette: any) => {
            const colorKey = (palette.colors || []).join(',').toLowerCase();
            if (!colorKey.length) return; // Skip palettes with no colors
            
            if (!uniquePalettes[colorKey] || (uniquePalettes[colorKey].likes < palette.likes)) {
              // Determine categories for each color in the palette
              const colors = palette.colors || [];
              const categories = colors.map((color: string) => getColorCategory(color));
              
              // Debug: log color categories
              if (process.env.NODE_ENV === 'development') {
                console.group(`Palette ${palette.id} categories:`);
                colors.forEach((color: string) => {
                  console.log(`${color} → ${getColorCategory(color)}`);
                });
                console.groupEnd();
              }
              
              uniquePalettes[colorKey] = {
                id: palette.id,
                colors: colors,
                createdAt: palette.createdAt || new Date().toISOString(),
                likes: palette.likes || 0,
                categories: Array.from(new Set(categories)) // Fixed Set conversion
              };
            }
          });
          
          // Convert back to array and sort by likes in descending order
          const typedPalettes = Object.values(uniquePalettes) as PopularPalette[];
          typedPalettes.sort((a, b) => b.likes - a.likes);
          
          setPopularPalettes(typedPalettes);
          setFilteredPalettes(typedPalettes);
        } else {
          setLoadingError('No popular palettes found. Try saving some palettes first.');
        }
      } catch (error) {
        console.error('Error in fetchPalettes:', error);
        setLoadingError('Failed to load palettes. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Start fetching immediately
    fetchPalettes();
    
    // Set a timeout to hide the loading state even if fetch is slow
    const loadingTimeout = setTimeout(() => {
      if (isLoading) setIsLoading(false);
    }, 3000);
    
    return () => clearTimeout(loadingTimeout);
  }, [isLoading]);

  // Filter palettes when a tag is selected
  useEffect(() => {
    if (!selectedTag) {
      setFilteredPalettes(popularPalettes);
    } else {
      const filtered = popularPalettes.filter(palette => 
        palette.categories && palette.categories.includes(selectedTag)
      );
      setFilteredPalettes(filtered);
    }
  }, [selectedTag, popularPalettes]);

  // Check if palette is already liked
  const isPaletteLiked = (paletteId: string) => {
    return likedPalettes.includes(paletteId);
  };

  // Handle liking or unliking a palette
  const handleLikePalette = async (palette: PopularPalette) => {
    try {
      const alreadyLiked = isPaletteLiked(palette.id);
      const likedPalettes = JSON.parse(localStorage.getItem('likedPalettes') || '[]');
      
      if (alreadyLiked) {
        // Handle unlike - Update UI immediately
        const updatedLikes = Math.max(0, palette.likes - 1);
        
        // Update UI state first for immediate feedback
        const updatedPalettes = popularPalettes.map((p) => {
          if (p.id === palette.id) {
            return { ...p, likes: updatedLikes };
          }
          return p;
        });
        
        // Update liked palettes in localStorage
        const updatedLikedPalettes = likedPalettes.filter((id: string) => id !== palette.id);
        setLikedPalettes(updatedLikedPalettes);
        localStorage.setItem('likedPalettes', JSON.stringify(updatedLikedPalettes));
        
        // Update UI
        setPopularPalettes(updatedPalettes);
        
        // Now perform Firebase operations in the background
        (async () => {
          try {
            // Try to get the document first to verify it exists
            const existingPalette = await getDocumentById('palettes', palette.id);
            
            if (existingPalette) {
              console.log('Found palette in Firestore, updating likes to', updatedLikes);
              await updateDocument('palettes', palette.id, { likes: updatedLikes });
            } else {
              console.log('Palette not found in Firestore:', palette.id);
              // Document doesn't exist, nothing to update in Firebase
            }
          } catch (error) {
            console.error('Background error unliking palette in Firebase:', error);
            // Don't show error to user since local update succeeded
          }
        })();
      } else {
        // Handle like - Update UI immediately
        const updatedLikes = palette.likes + 1;
        
        // Update UI state first for immediate feedback
        const updatedPalettes = popularPalettes.map((p) => {
          if (p.id === palette.id) {
            return { ...p, likes: updatedLikes };
          }
          return p;
        });
        
        // Add to liked palettes locally
        const updatedLikedPalettes = [...likedPalettes, palette.id];
        setLikedPalettes(updatedLikedPalettes);
        localStorage.setItem('likedPalettes', JSON.stringify(updatedLikedPalettes));
        
        // Update UI
        setPopularPalettes(updatedPalettes);
        
        // Add to saved palettes too
        const savedPalettes = JSON.parse(localStorage.getItem('savedPalettes') || '[]');
        
        // Check if already saved
        const alreadySaved = savedPalettes.some((p: any) => p.id === palette.id);
        
        if (!alreadySaved) {
          // Add to saved palettes
          savedPalettes.push({
            id: palette.id,
            colors: palette.colors,
            createdAt: new Date().toISOString()
          });
          localStorage.setItem('savedPalettes', JSON.stringify(savedPalettes));
        } else {
          // Remove toast notification for like
        }
        
        // Now perform Firebase operations in the background
        (async () => {
          try {
            console.log('Liking palette with Firestore ID:', palette.id);
            
            // Check if document exists first
            try {
              const docRef = doc(db, 'palettes', palette.id);
              const docSnap = await getDoc(docRef);
              
              if (docSnap.exists()) {
                // Document exists, just update it
                console.log('Palette found in Firestore, updating likes to', updatedLikes);
                await updateDocument('palettes', palette.id, { likes: updatedLikes });
              } else {
                // Document doesn't exist - need to create it first
                console.log('Palette not found in Firestore, creating it first');
                
                // Create the palette document with the same ID
                const newPaletteData = {
                  id: palette.id, // Use the same ID
                  colors: palette.colors,
                  createdAt: palette.createdAt,
                  likes: updatedLikes
                };
                
                // Add document directly with the existing ID
                await setDoc(docRef, newPaletteData);
                console.log('Created palette with ID:', palette.id);
              }
            } catch (checkError) {
              console.error('Error checking if palette exists:', checkError);
              // Try to create a new document anyway as a fallback
              console.log('Falling back to creating a new palette document');
              
              const newPaletteData = {
                colors: palette.colors,
                createdAt: palette.createdAt || new Date().toISOString(),
                likes: updatedLikes
              };
              
              // Remove any potential id field from the data
              const docRef = doc(db, 'palettes', palette.id);
              await setDoc(docRef, newPaletteData);
              console.log('Created palette with ID:', palette.id);
            }
          } catch (error) {
            console.error('Background error liking palette in Firebase:', error);
            // Don't show error to user since local update succeeded
          }
        })();
      }
    } catch (error) {
      // This catch only triggers for errors in the main function scope
      console.error('Error updating palette:', error);
      // Remove toast error notification
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
  const handleExportPalette = (palette: PopularPalette) => {
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
          <div className="flex-shrink-0">
            <Logo />
          </div>
          
          <div className="flex-shrink-0">
            <Navigation />
            <div className="md:hidden">
              <MobileNavigation />
            </div>
          </div>
          
          <div className="hidden md:block w-[320px] flex-shrink-0">
            {/* Empty div to maintain consistent header layout */}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto px-4 pb-4">
        <div className="flex justify-between items-center mb-6 mt-4">
          <h1 className="text-3xl font-bold">Popular Palettes</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-gray-200">
              <span className="text-gray-400">🎨</span>
              <span className="text-lg font-medium">{!isLoading ? (selectedTag ? filteredPalettes.length : popularPalettes.length) : '-'}</span>
            </div>
          </div>
        </div>

        {/* Color Tag Filter */}
        {!isLoading && !loadingError && popularPalettes.length > 0 && (
          <ColorTags selectedTag={selectedTag} onSelectTag={setSelectedTag} />
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
            {/* Show skeleton loaders while loading */}
            {[...Array(6)].map((_, index) => (
              <PaletteSkeleton key={index} />
            ))}
          </div>
        ) : loadingError ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-700">{loadingError}</p>
            <Link 
              href="/" 
              className="mt-4 inline-flex items-center px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              Create a Palette
            </Link>
          </div>
        ) : filteredPalettes.length === 0 ? (
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <p className="text-gray-500 mb-4">
              {selectedTag 
                ? `No palettes found with the color "${selectedTag}". Try another color filter.` 
                : "No popular palettes yet. Be the first to save one!"}
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
                  <div className="flex items-center gap-3">
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
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-500">{palette.likes}</span>
                    </div>
                    <button
                      onClick={() => handleLikePalette(palette)}
                      className={`flex items-center justify-center h-8 w-8 rounded-full transition-colors
                        ${isPaletteLiked(palette.id) 
                          ? 'bg-red-50 text-red-500 hover:bg-red-100' 
                          : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-red-400'
                        }`}
                      title={isPaletteLiked(palette.id) ? "Unlike this palette" : "Like and save to your collection"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" 
                        width="16" height="16" 
                        viewBox="0 0 24 24" 
                        fill={isPaletteLiked(palette.id) ? "currentColor" : "none"} 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
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