// assets/js/features/auth.js
import { auth } from "../firebase.js";
import { PageTemplate } from "../ui/components.js";
import { HOME_BY_ROLE } from "../rules/roles.js";
import { RateLimiter } from "../utils/rateLimiter.js";

import {
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  getIdTokenResult,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// ✅ FIX #4: Rate limiter (5 intentos por minuto por email)
const loginLimiter = new RateLimiter(5, 60000);

/** Observa el estado de autenticación y ejecuta callback(user|null) */
export function observeAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

/** Cerrar sesión */
export async function logout() {
  try { await signOut(auth); } catch {}
  // ❌ Ya NO usar localStorage para rol
  // localStorage.removeItem("rol");
  location.hash = "#auth";
}

/** Página de login */
export function AuthPage(container) {
  container.innerHTML = PageTemplate(
    "Iniciar sesión",
    `
    <form id="loginForm" class="grid gap-3 max-w-sm mx-auto">
      <input id="email" type="email" placeholder="Correo" required class="border p-2 rounded">
      <input id="password" type="password" placeholder="Contraseña" required class="border p-2 rounded">
      <button class="bg-indigo-600 text-white rounded px-3 py-2">Entrar</button>
      <button id="forgotBtn" type="button" class="text-sm underline text-blue-700">Olvidé mi contraseña</button>
    </form>
    `
  );

  const form = container.querySelector("#loginForm");
  const forgotBtn = container.querySelector("#forgotBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const password = form.password.value;

    // ✅ FIX #4: Verificar rate limit
    const limitCheck = loginLimiter.check(`login:${email}`);
    if (!limitCheck.allowed) {
      const segundos = Math.ceil(limitCheck.retryAfter / 1000);
      alert(`⏱️ Demasiados intentos. Espere ${segundos} segundos antes de reintentar.`);
      return;
    }

    try {
      await setPersistence(auth, browserLocalPersistence);
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // ✅ Ya NO guardar rol en localStorage (se obtiene del token)
      // const token = await getIdTokenResult(cred.user, true);
      // const rol = token?.claims?.role || "";
      // localStorage.setItem("rol", rol); // ❌ REMOVIDO

      // Obtener rol del token para redirección
      const token = await getIdTokenResult(cred.user, true);
      const rol = token?.claims?.role || "";

      // Redirige al home del rol
      const destino = HOME_BY_ROLE[rol] || "cuenta";
      location.hash = "#" + destino;
    } catch (err) {
      alert("Error al iniciar sesión: " + (err.message || err));
    }
  });

  forgotBtn.addEventListener("click", async () => {
    const email = (container.querySelector("#email")?.value || "").trim();
    if (!email) { alert("Escribe tu correo primero."); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Te enviamos un correo para restablecer la contraseña.");
    } catch (err) {
      alert("No se pudo enviar el correo: " + (err.message || err));
    }
  });
}

/** Helper para enviar al home del rol actual (lo usa auth internamente) */
export function goHomeByRole(rol) {
  const destino = HOME_BY_ROLE[rol] || "cuenta";
  location.hash = "#" + destino;
}
