import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// BAOMS Firebase Live Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBaDv0toBJ08vU4q_l-ahx4AUtZhOm-s4Y",
  authDomain: "baoms-3dc26.firebaseapp.com",
  projectId: "baoms-3dc26",
  storageBucket: "baoms-3dc26.firebasestorage.app",
  messagingSenderId: "403394441757",
  appId: "1:403394441757:web:6369429bcb24bd5b2d0cf4",
  measurementId: "G-Q1QSZZZTY6"
};

// Check if Firebase is configured with active keys
export const isFirebaseConfigured = firebaseConfig.projectId && firebaseConfig.projectId !== "YOUR_PROJECT_ID";

// Re-use initialized app during Vite hot-reload cycles
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
