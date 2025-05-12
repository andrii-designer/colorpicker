import { addDocument, getDocuments, deleteDocument } from '../lib/firebase/firebaseUtils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/firebase';

interface FirestorePalette {
  id: string;
  colors?: string[];
  createdAt?: string;
  likes?: number;
  migrated?: boolean;
  originalId?: string;
  [key: string]: any; // Allow for any additional properties
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

export const migratePalettes = async () => {
  try {
    console.log('Starting palette migration...');
    
    // Get all current palettes from Firestore
    const existingPalettes = await getDocuments('palettes') as FirestorePalette[];
    console.log(`Found ${existingPalettes.length} palettes in Firestore`);
    
    // Map of old client IDs to new Firestore IDs
    const idMapping: Record<string, string> = {};
    
    // Migrate each palette
    for (const palette of existingPalettes) {
      // Skip palettes that don't have a timestamp-based ID or already have been migrated
      if (!palette.id.match(/^\d{13}$/) || palette.migrated) {
        continue;
      }
      
      console.log(`Migrating palette ${palette.id}...`);
      
      // Create a new palette with the same data
      const newPalette = {
        colors: palette.colors || [],
        createdAt: palette.createdAt || new Date().toISOString(),
        likes: palette.likes || 0,
        migrated: true,
        originalId: palette.id
      };
      
      // Add the new palette
      const result = await addDocument('palettes', newPalette);
      
      // Store the mapping
      idMapping[palette.id] = result.id;
      
      // Delete the old palette
      await deleteDocument('palettes', palette.id);
      
      console.log(`Migrated palette ${palette.id} to ${result.id}`);
    }
    
    console.log('Migration completed successfully');
    return idMapping;
  } catch (error) {
    console.error('Error during palette migration:', error);
    throw error;
  }
};

export const updateLocalStorage = (idMapping: Record<string, string>) => {
  try {
    // Update saved palettes
    const savedPalettes = JSON.parse(localStorage.getItem('savedPalettes') || '[]');
    const updatedSavedPalettes = savedPalettes.map((palette: any) => {
      if (idMapping[palette.id]) {
        return {
          ...palette,
          id: idMapping[palette.id]
        };
      }
      return palette;
    });
    localStorage.setItem('savedPalettes', JSON.stringify(updatedSavedPalettes));
    
    // Update liked palettes
    const likedPalettes = JSON.parse(localStorage.getItem('likedPalettes') || '[]');
    const updatedLikedPalettes = likedPalettes.map((id: string) => {
      return idMapping[id] || id;
    });
    localStorage.setItem('likedPalettes', JSON.stringify(updatedLikedPalettes));
    
    console.log('Local storage updated successfully');
  } catch (error) {
    console.error('Error updating local storage:', error);
  }
}; 