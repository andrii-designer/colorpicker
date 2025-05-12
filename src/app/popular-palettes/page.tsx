'use client';

import React, { useState, useEffect } from 'react';
import { Logo } from '../components/ui/Logo';
import { Navigation } from '../components/ui/Navigation';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';
import { getDocuments, updateDocument } from '../../lib/firebase/firebaseUtils';
import { auth, db } from '../../lib/firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
}

export default function PopularPalettes() {
  const [popularPalettes, setPopularPalettes] = useState<PopularPalette[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  
  // Load popular palettes from Firestore and liked palettes from localStorage
  useEffect(() => {
    const fetchPalettes = async () => {
      try {
        setIsLoading(true);
        
        // Load popular palettes from Firestore
        const palettes = await getDocuments('palettes');
        
        // Sort by likes in descending order and ensure proper typing
        const typedPalettes = palettes.map((p: any) => ({
          id: p.id,
          colors: p.colors || [],
          createdAt: p.createdAt || new Date().toISOString(),
          likes: p.likes || 0
        })) as PopularPalette[];
        
        typedPalettes.sort((a, b) => b.likes - a.likes);
        setPopularPalettes(typedPalettes);
        
        // Load liked palettes from localStorage
        const storedLikedPalettes = localStorage.getItem('likedPalettes');
        if (storedLikedPalettes) {
          setLikedPalettes(JSON.parse(storedLikedPalettes));
        } else {
          // Initialize liked palettes if not exists
          localStorage.setItem('likedPalettes', JSON.stringify([]));
        }
      } catch (error) {
        console.error('Error loading palettes:', error);
        toast.error('Failed to load palettes');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPalettes();
  }, []);

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
        
        // Show immediate feedback
        toast.success('Palette unliked');
        
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
          
          // Show explicit notification that palette was saved
          toast.success('Palette saved to your collection');
        } else {
          // Just show like confirmation
          toast.success('Palette liked');
        }
        
        // Now perform Firebase operations in the background
        (async () => {
          try {
            console.log('Liking palette with Firestore ID:', palette.id);
            
            // Check if document exists first
            const docRef = doc(db, 'palettes', palette.id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
              // Document exists, just update it
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
          } catch (error) {
            console.error('Background error liking palette in Firebase:', error);
            // Don't show error to user since local update succeeded
          }
        })();
      }
    } catch (error) {
      // This catch only triggers for errors in the main function scope
      console.error('Error updating palette:', error);
      toast.error('Failed to update palette');
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
        <div className="flex justify-between items-center mb-8 mt-4">
          <h1 className="text-3xl font-bold">Popular Palettes</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-gray-200">
              <span className="text-gray-400">🎨</span>
              <span className="text-lg font-medium">{popularPalettes.length}</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-gray-400">Loading popular palettes...</div>
          </div>
        ) : popularPalettes.length === 0 ? (
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <p className="text-gray-500 mb-4">No popular palettes yet. Be the first to save one!</p>
            <Link 
              href="/" 
              className="inline-flex items-center px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              Create a Palette
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
            {popularPalettes.map(palette => (
              <div key={palette.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex h-24">
                  {palette.colors.map((color, index) => (
                    <div 
                      key={`${palette.id}-${index}`} 
                      className="flex-1 cursor-pointer hover:opacity-90 relative group"
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorClick(color)}
                      title={`Click to copy ${color}`}
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