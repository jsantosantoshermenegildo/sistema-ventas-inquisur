// assets/js/login.js
import { auth } from "./firebase.js";
import { db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { toastSuccess, toastError, alertError } from "./utils/alerts.js";

const form = document.getElementById("loginForm");
const forgotBtn = document.getElementById("forgotBtn");
const messageEl = document.getElementById("message");

// Resolver el rol del usuario
async function resolveRole(user) {
  try {
    const snap = await getDoc(doc(db, "usuarios", user.uid));
    if (snap.exists()) {
      return snap.data()?.role || "viewer";
    }
  } catch {}
  return "viewer";
}

// Limpiar datos de sesión anterior
function clearSession() {
  localStorage.removeItem("rol");
  localStorage.removeItem("uid");
  localStorage.removeItem("userEmail");
}

// Manejar envío del formulario
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    clearSession();  // Limpiar sesión anterior
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const rol = await resolveRole(userCred.user);
    localStorage.setItem("rol", rol);
    localStorage.setItem("uid", userCred.user.uid);
    localStorage.setItem("userEmail", userCred.user.email);
    toastSuccess(`✅ Bienvenido ${email}!`);
    setTimeout(() => window.location.href = "index.html", 500);
  } catch (error) {
    toastError("❌ Correo o contraseña incorrectos");
    console.error(error);
  }
});

// Manejar "Olvide mi contraseña"
forgotBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  if (!email) {
    showMessage("Ingresa tu correo primero", true);
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showMessage("Correo de recuperación enviado", false);
  } catch (error) {
    showMessage("Error al enviar correo", true);
    console.error(error);
  }
});

// Redirigir si ya está autenticado
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "index.html";
  }
});
