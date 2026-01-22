import { initializeApp, getApps, getApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 2. ROBUST INITIALIZATION
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (getApps().length > 0) {
  // Application already initialized (happens during hot-reloading)
  app = getApp();
  auth = getAuth(app);
  // We use the existing Firestore instance
  db = getFirestore(app);
} else {
  // First time initialization
  app = initializeApp(firebaseConfig);
  console.log("Firebase App Initialized:", firebaseConfig.projectId);
  
  auth = getAuth(app);
  
  // Initialize Firestore with settings to prevent "hanging" connections
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
}

export { app, auth, db };