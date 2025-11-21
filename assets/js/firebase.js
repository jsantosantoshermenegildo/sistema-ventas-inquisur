// firebase.js — Inicialización de Firebase (modular)

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

/**
 * Valida que todas las variables de entorno requeridas estén configuradas
 * @throws {Error} Si falta alguna variable de entorno crítica
 */
function validateFirebaseConfig() {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID'
  ];

  const missing = requiredVars.filter(v => !import.meta.env[v]);
  
  if (missing.length > 0) {
    const message = `❌ VARIABLES DE ENTORNO NO CONFIGURADAS:\n${missing.join('\n')}\n\n✅ Solución:\n1. Copia .env.example a .env.local\n2. Completa los valores reales de Firebase\n3. Recarga la página`;
    console.error(message);
    throw new Error(message);
  }
}

// Config de tu proyecto (davidnuevo) - usando variables de entorno
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validar configuración
validateFirebaseConfig();

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log("✅ Firebase inicializado correctamente");

export { app, db, auth };
