'use client';

import React, { useState } from 'react';
import { migratePalettes, updateLocalStorage } from '../migration-helper';
import { Logo } from '../components/ui/Logo';
import { Navigation } from '../components/ui/Navigation';
import { MobileNavigation } from '../components/ui/MobileNavigation';
import { toast, Toaster } from 'react-hot-toast';
import { db } from '../../lib/firebase/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function AdminPage() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [migrationResult, setMigrationResult] = useState<null | Record<string, string>>(null);
  const [fixResult, setFixResult] = useState<null | string[]>(null);
  
  const handleMigration = async () => {
    if (window.confirm('Are you sure you want to migrate all palettes? This cannot be undone.')) {
      try {
        setIsMigrating(true);
        const mapping = await migratePalettes();
        setMigrationResult(mapping);
        updateLocalStorage(mapping);
        toast.success('Migration completed successfully');
      } catch (error) {
        console.error('Migration failed:', error);
        toast.error('Migration failed');
      } finally {
        setIsMigrating(false);
      }
    }
  };
  
  const handleQuickFix = async () => {
    if (window.confirm('This will recreate missing palettes in Firestore. Continue?')) {
      try {
        setIsFixing(true);
        const fixedIds: string[] = [];
        
        // Get saved palettes from localStorage
        const savedPalettes = JSON.parse(localStorage.getItem('savedPalettes') || '[]');
        const likedPalettes = JSON.parse(localStorage.getItem('likedPalettes') || '[]');
        
        // Check each palette if it exists in Firestore, if not create it
        for (const palette of savedPalettes) {
          // Check if document exists
          const docRef = doc(db, 'palettes', palette.id);
          const docSnap = await getDoc(docRef);
          
          if (!docSnap.exists()) {
            console.log('Palette not found in Firestore, creating it:', palette.id);
            
            // Create palette with the same ID
            const isLiked = likedPalettes.includes(palette.id);
            await setDoc(docRef, {
              colors: palette.colors,
              createdAt: palette.createdAt,
              likes: isLiked ? 1 : 0, // Set likes to 1 if user liked it
            });
            
            fixedIds.push(palette.id);
          }
        }
        
        setFixResult(fixedIds);
        toast.success(`Fixed ${fixedIds.length} palettes`);
      } catch (error) {
        console.error('Fix failed:', error);
        toast.error('Failed to fix palettes');
      } finally {
        setIsFixing(false);
      }
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
        </div>
      </header>

      <main className="flex-1 overflow-auto px-4 pb-4">
        <div className="flex justify-between items-center mb-8 mt-4">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>
        
        <div className="bg-gray-100 p-8 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Fix (Recommended First)</h2>
          <p className="mb-4">
            This will check for missing palettes in Firestore and recreate them.
            This is useful if you're seeing "Failed to like palette" errors.
          </p>
          
          <button
            onClick={handleQuickFix}
            disabled={isFixing}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isFixing ? 'Fixing...' : 'Quick Fix Palettes'}
          </button>
          
          {fixResult && (
            <div className="mt-4">
              <h3 className="font-medium">Fix Results:</h3>
              <p className="mt-2">Fixed {fixResult.length} palettes:</p>
              <pre className="bg-gray-800 text-green-400 p-4 rounded mt-2 overflow-auto max-h-64">
                {JSON.stringify(fixResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <div className="bg-gray-100 p-8 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Palette Migration</h2>
          <p className="mb-4">
            This will migrate all existing palettes to use Firestore's auto-generated IDs.
            This should only be run once. Make sure to back up your data first.
          </p>
          
          <button
            onClick={handleMigration}
            disabled={isMigrating}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isMigrating ? 'Migrating...' : 'Start Migration'}
          </button>
          
          {migrationResult && (
            <div className="mt-4">
              <h3 className="font-medium">Migration Results:</h3>
              <pre className="bg-gray-800 text-green-400 p-4 rounded mt-2 overflow-auto max-h-64">
                {JSON.stringify(migrationResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </main>
      <Toaster position="bottom-center" />
    </div>
  );
} 