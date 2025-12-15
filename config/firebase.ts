import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyCapu_PKOa_MGstbvkYnrS5_GgeCSkx2VA",
  authDomain: "focus-tracker-app.firebaseapp.com",
  projectId: "focus-tracker-app",
  storageBucket: "focus-tracker-app.firebasestorage.app",
  messagingSenderId: "661382421866",
  appId: "1:661382421866:web:c38a1e76980c0fc9b4d913"
};

// Firebase'i başlat (duplicate kontrolü ile)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth'u React Native için yapılandır
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // Auth zaten başlatılmışsa mevcut olanı kullan
  auth = getAuth(app);
}

// Firestore
const db = getFirestore(app);

export { auth, db };
export default app;
