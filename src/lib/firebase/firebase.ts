import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Check if Firebase configuration is available
const hasValidConfig = 
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Add debugging for environment variables
console.log("Firebase config available:", hasValidConfig);
console.log("Project ID available:", !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log("Auth Domain available:", !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
console.log("API Key available:", !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

// Default project ID to use if env var is not available
const DEFAULT_PROJECT_ID = "colorjogger";

// Use fallback config if environment variables are not set
const firebaseConfig = hasValidConfig ? {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} : {
  // Fallback config - using a fixed configuration since we know the values
  apiKey: "AIzaSyBHLhXaqLMY9gmtKYAUjsXdoMPvSoDvoQM",
  authDomain: "colorjogger.firebaseapp.com",
  projectId: DEFAULT_PROJECT_ID,
  storageBucket: "colorjogger.firebasestorage.app",
  messagingSenderId: "1033978676789",
  appId: "1:1033978676789:web:49fb21560ccb79bce4137c",
};

// Log the current config being used (without sensitive values)
console.log("Using Firebase project:", firebaseConfig.projectId);
console.log("Using Firebase auth domain:", firebaseConfig.authDomain);

// Initialize Firebase
let app;
let auth;
let db;
let storage;

try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Create empty mock objects if Firebase initialization fails
  app = null;
  auth = {
    onAuthStateChanged: (callback: any) => {
      console.log("Auth state change called with mock auth");
      callback(null);
      return () => {};
    },
    currentUser: null,
  } as any;
  db = {} as any;
  storage = {} as any;
}

export { app, auth, db, storage };
