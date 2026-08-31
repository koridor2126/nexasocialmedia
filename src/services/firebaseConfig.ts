import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, isSupported, getToken, onMessage } from 'firebase/messaging';

// Firebase Client Configuration
const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || 'AIzaSyDemoNexaAppKeySafeConfig12345',
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || 'nexa-social-app.firebaseapp.com',
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || 'nexa-social-app',
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || 'nexa-social-app.appspot.com',
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '1029384756',
  appId: metaEnv.VITE_FIREBASE_APP_ID || '1:1029384756:web:abcd1234efgh5678',
};

// Initialize Firebase App instance safely
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export async function getFirebaseMessaging() {
  try {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      const supported = await isSupported();
      if (supported) {
        return getMessaging(firebaseApp);
      }
    }
  } catch (err) {
    console.warn('[Firebase] Messaging not directly supported in this browser context:', err);
  }
  return null;
}
