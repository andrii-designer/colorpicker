'use client';

import React, { useState } from 'react';
import { db } from '../../lib/firebase/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Logo } from '../components/ui/Logo';
import { Navigation } from '../components/ui/Navigation';
import Link from 'next/link';

interface Palette {
  id: string;
  colors: string[];
  createdAt: string;
  likes: number;
}

export default function CleanDuplicatesAdmin() {
  const [status, setStatus] = useState<string>('idle');
  const [duplicatesFound, setDuplicatesFound] = useState<number>(0);
  const [duplicatesRemoved, setDuplicatesRemoved] = useState<number>(0);
  const [likesConsolidated, setLikesConsolidated] = useState<number>(0);
  const [palettesProcessed, setPalettesProcessed] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  const addLogMessage = (message: string) => {
    setLogMessages(prev => [...prev, message]);
  };

  const findAndCleanDuplicates = async () => {
    try {
      setStatus('processing');
      setErrorMessage(null);
      setLogMessages([]);
      addLogMessage('Starting duplicate cleanup process...');

      // Fetch all palettes from Firestore
      const palettesSnapshot = await getDocs(collection(db, 'palettes'));
      const allPalettes: Palette[] = [];
      
      palettesSnapshot.forEach(doc => {
        allPalettes.push({
          id: doc.id,
          ...doc.data()
        } as Palette);
      });
      
      setPalettesProcessed(allPalettes.length);
      addLogMessage(`Fetched ${allPalettes.length} palettes from database`);
      
      // Group palettes by their colors
      const palettesByColors: { [colorKey: string]: Palette[] } = {};
      
      allPalettes.forEach(palette => {
        if (!palette.colors || !Array.isArray(palette.colors) || palette.colors.length === 0) {
          addLogMessage(`Skipping palette ${palette.id} with invalid colors`);
          return;
        }
        
        const colorKey = palette.colors.join(',').toLowerCase();
        if (!palettesByColors[colorKey]) {
          palettesByColors[colorKey] = [];
        }
        palettesByColors[colorKey].push(palette);
      });
      
      // Find duplicates and consolidate
      let duplicates = 0;
      let totalLikesConsolidated = 0;
      let totalRemoved = 0;
      
      for (const colorKey in palettesByColors) {
        const palettes = palettesByColors[colorKey];
        
        if (palettes.length > 1) {
          duplicates += palettes.length - 1;
          addLogMessage(`Found ${palettes.length} duplicates with colors: ${colorKey.substring(0, 50)}...`);
          
          // Sort by likes (descending)
          palettes.sort((a, b) => (b.likes || 0) - (a.likes || 0));
          
          // Keep the one with the most likes
          const mainPalette = palettes[0];
          let additionalLikes = 0;
          
          // Process duplicates (all except the first one)
          for (let i = 1; i < palettes.length; i++) {
            const duplicate = palettes[i];
            additionalLikes += duplicate.likes || 0;
            
            try {
              // Delete the duplicate
              await deleteDoc(doc(db, 'palettes', duplicate.id));
              totalRemoved++;
              addLogMessage(`Deleted duplicate ${duplicate.id}`);
            } catch (error) {
              addLogMessage(`Error deleting duplicate ${duplicate.id}: ${error}`);
            }
          }
          
          // Update the main palette with consolidated likes
          if (additionalLikes > 0) {
            try {
              const newLikes = (mainPalette.likes || 0) + additionalLikes;
              await updateDoc(doc(db, 'palettes', mainPalette.id), {
                likes: newLikes
              });
              totalLikesConsolidated += additionalLikes;
              addLogMessage(`Updated main palette ${mainPalette.id} with ${additionalLikes} additional likes (total: ${newLikes})`);
            } catch (error) {
              addLogMessage(`Error updating main palette ${mainPalette.id}: ${error}`);
            }
          }
        }
      }
      
      setDuplicatesFound(duplicates);
      setDuplicatesRemoved(totalRemoved);
      setLikesConsolidated(totalLikesConsolidated);
      
      addLogMessage(`Cleanup completed!`);
      addLogMessage(`Total palettes processed: ${allPalettes.length}`);
      addLogMessage(`Duplicates found: ${duplicates}`);
      addLogMessage(`Duplicates removed: ${totalRemoved}`);
      addLogMessage(`Likes consolidated: ${totalLikesConsolidated}`);
      
      setStatus('completed');
    } catch (error) {
      console.error('Error cleaning duplicates:', error);
      setErrorMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="bg-white py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Logo />
          <Navigation />
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin: Clean Duplicate Palettes</h1>
            <p className="text-gray-600">
              This utility will find palettes with identical colors, remove duplicates, and consolidate likes.
            </p>
          </div>
          
          <div className="mb-8">
            <button
              onClick={findAndCleanDuplicates}
              disabled={status === 'processing'}
              className={`px-6 py-3 rounded-md font-medium ${
                status === 'processing' 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {status === 'processing' ? 'Processing...' : 'Clean Duplicate Palettes'}
            </button>
          </div>
          
          {status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 text-green-800">Cleanup Completed</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-4 rounded-md border border-green-100">
                  <p className="text-sm text-gray-500">Palettes Processed</p>
                  <p className="text-2xl font-bold">{palettesProcessed}</p>
                </div>
                <div className="bg-white p-4 rounded-md border border-green-100">
                  <p className="text-sm text-gray-500">Duplicates Found</p>
                  <p className="text-2xl font-bold">{duplicatesFound}</p>
                </div>
                <div className="bg-white p-4 rounded-md border border-green-100">
                  <p className="text-sm text-gray-500">Duplicates Removed</p>
                  <p className="text-2xl font-bold">{duplicatesRemoved}</p>
                </div>
                <div className="bg-white p-4 rounded-md border border-green-100">
                  <p className="text-sm text-gray-500">Likes Consolidated</p>
                  <p className="text-2xl font-bold">{likesConsolidated}</p>
                </div>
              </div>
              <Link 
                href="/popular-palettes" 
                className="inline-flex items-center px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                View Popular Palettes
              </Link>
            </div>
          )}
          
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-2 text-red-800">Error</h2>
              <p className="text-red-700">{errorMessage}</p>
            </div>
          )}
          
          {logMessages.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Process Log</h2>
              <div className="bg-gray-800 text-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm">
                {logMessages.map((message, index) => (
                  <div key={index} className="mb-1">
                    <span className="text-gray-400">[{index + 1}]</span> {message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 