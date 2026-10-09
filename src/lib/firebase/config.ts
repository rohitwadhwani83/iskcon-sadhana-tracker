import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBP5gnBXJrL2HRh66elVXz9c5mAcxXDHtc',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'iskcon-sadhana-tracker-2d3c9.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'iskcon-sadhana-tracker-2d3c9',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'iskcon-sadhana-tracker-2d3c9.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '827137008890',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:827137008890:web:3d8624ab9e0b602a355543',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes('YOUR_') &&
  !firebaseConfig.projectId.includes('YOUR_')
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (typeof window !== 'undefined' || isFirebaseConfigured) {
  try {
    if (isFirebaseConfigured) {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
    }
  } catch (error) {
    console.warn('Firebase initialization skipped or failed:', error);
  }
}

export { app, auth, db };
