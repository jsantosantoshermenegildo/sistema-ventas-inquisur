// firebase.js — Inicialización de Firebase (modular)

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Config de tu proyecto (davidnuevo) - usando variables de entorno
const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyBFJjs8WL9eQWv6O36ppEGxgCg_ccieMXo",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "davidnuevo-42c5a.firebaseapp.com",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "davidnuevo-42c5a",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "davidnuevo-42c5a.firebasestorage.app",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "797801793733",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || "1:797801793733:web:b106e0e7b7648c2b1a88ac",
  measurementId: import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID || "G-L8J1P34LBZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log("✅ Firebase inicializado correctamente");

export { app, db, auth };
