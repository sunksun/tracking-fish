import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqDCZidQSSGzhZu0hS1bZtxD4pJLYvIgY", // คุณจะต้องใส่ apiKey และ appId จาก Firebase Console
  authDomain: "tracking-fish-app.firebaseapp.com",
  projectId: "tracking-fish-app",
  storageBucket: "tracking-fish-app.firebasestorage.app",
  messagingSenderId: "587580376587",
  appId: "1:587580376587:web:a35c9caf6acab6a110290e" // คุณจะต้องใส่ appId จาก Firebase Console
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const storage = getStorage(app);

// For development - connect to emulators if needed
// Uncomment these lines if using Firebase emulators
// if (__DEV__) {
//   connectFirestoreEmulator(db, 'localhost', 8080);
//   connectAuthEmulator(auth, 'http://localhost:9099');
// }

export default app;