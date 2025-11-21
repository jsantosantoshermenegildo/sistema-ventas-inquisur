import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDwNE0n10C6jAQRQfVWKAl9HnW0hJAH0oQ",
  authDomain: "davidnuevo-42c5a.firebaseapp.com",
  projectId: "davidnuevo-42c5a",
  storageBucket: "davidnuevo-42c5a.appspot.com",
  messagingSenderId: "710405705303",
  appId: "1:710405705303:web:6b19c69dd7844d7a61d3f1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function resetCounter() {
  try {
    const cRef = doc(db, "counters", "productos");
    await setDoc(cRef, { seq: 0, updatedAt: new Date() });
    console.log("✅ Contador reiniciado a 0. Próximo código será P000");
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

resetCounter();
