import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Fallback mock to prevent local crashes since we aren't in the web canvas anymore
const mockConfig = { apiKey: "mock", authDomain: "mock", projectId: "mock", storageBucket: "mock", messagingSenderId: "mock", appId: "mock" };
const firebaseConfigString = typeof __firebase_config !== 'undefined' ? __firebase_config : JSON.stringify(mockConfig);
const firebaseConfig = JSON.parse(firebaseConfigString);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'wealth-planner-v5';

// Exporting the necessary Firebase functions so your main App can use them
export { 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  doc, 
  setDoc, 
  getDoc 
};