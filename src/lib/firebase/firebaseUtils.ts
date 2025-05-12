// src/lib/firebase/firebaseUtils.ts

import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Add a simple cache for document collections
const cache = {
  collections: new Map<string, {data: any[], timestamp: number}>(),
  maxAge: 60000, // Cache expiration in ms (1 minute)
  
  get: function(collectionName: string) {
    const entry = this.collections.get(collectionName);
    if (!entry) return null;
    
    // Check if cache is still valid
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.collections.delete(collectionName);
      return null;
    }
    
    return entry.data;
  },
  
  set: function(collectionName: string, data: any[]) {
    this.collections.set(collectionName, {
      data,
      timestamp: Date.now()
    });
  }
};

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// Firestore functions
export const addDocument = async (collectionName: string, data: any) => {
  try {
    // Remove any custom id field before saving to Firestore
    const { id, ...dataWithoutId } = data;
    
    // Add document and get the Firestore-generated ID
    const docRef = await addDoc(collection(db, collectionName), dataWithoutId);
    console.log(`Document added with Firestore ID: ${docRef.id}`);
    
    // Invalidate cache for this collection
    cache.collections.delete(collectionName);
    
    // Return both the document reference and the data with the new ID
    return {
      id: docRef.id,
      ref: docRef,
      ...dataWithoutId
    };
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

// Helper function for timeout promise
const timeout = (ms: number) => {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
  );
};

// Main function with retry logic and caching
export const getDocuments = async (collectionName: string, maxRetries = 1, timeoutMs = 3000) => {
  // Check cache first
  const cachedData = cache.get(collectionName);
  if (cachedData) {
    console.log(`Using cached data for '${collectionName}' (${cachedData.length} items)`);
    return cachedData;
  }
  
  let retries = 0;
  
  // Add debug info
  console.log(`Fetching documents from '${collectionName}'`);
  
  const fetchWithRetry = async (): Promise<any[]> => {
    try {
      console.log(`Fetching documents from '${collectionName}' (attempt ${retries + 1}/${maxRetries + 1})`);
      
      // Validate db is properly initialized
      if (!db || !db.type) {
        console.warn('Firebase DB not properly initialized, returning empty array');
        return [];
      }
      
      // Use Promise.race to implement timeout with proper typing
      const result = await Promise.race([
        getDocs(collection(db, collectionName)),
        timeout(timeoutMs)
      ]) as QuerySnapshot<DocumentData>;
      
      // If we get here, the operation succeeded
      console.log(`Successfully fetched ${result.docs.length} documents from '${collectionName}'`);
      
      const documents = result.docs.map(doc => ({
        id: doc.id, // This is the Firestore ID
        ...doc.data()
      }));
      
      // Store in cache
      cache.set(collectionName, documents);
      
      return documents;
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error);
      
      // If we have retries left, try again
      if (retries < maxRetries) {
        retries++;
        console.log(`Retrying fetch (${retries}/${maxRetries})...`);
        return fetchWithRetry();
      }
      
      // If this was deployed and we still failed after retries, 
      // return an empty array instead of throwing to prevent UI from breaking
      console.warn(`All ${maxRetries + 1} attempts failed. Returning empty array to prevent UI break.`);
      return [];
    }
  };
  
  const result = await fetchWithRetry();
  
  if (result.length === 0) {
    console.log(`No documents found in '${collectionName}'`);
  }
  
  return result;
};

export const getDocumentById = async (collectionName: string, id: string) => {
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

export const updateDocument = async (collectionName: string, id: string, data: any) => {
  try {
    console.log(`Updating document in ${collectionName} with ID: ${id}`);
    const docRef = doc(db, collectionName, id);
    
    // Check if document exists first
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error(`Document does not exist: ${collectionName}/${id}`);
    }
    
    await updateDoc(docRef, data);
    
    // Invalidate cache for this collection
    cache.collections.delete(collectionName);
    
    console.log(`Document updated successfully: ${id}`);
    return true;
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

export const deleteDocument = async (collectionName: string, id: string) => {
  try {
    console.log(`Deleting document from ${collectionName} with ID: ${id}`);
    await deleteDoc(doc(db, collectionName, id));
    
    // Invalidate cache for this collection
    cache.collections.delete(collectionName);
    
    console.log(`Document deleted successfully: ${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};