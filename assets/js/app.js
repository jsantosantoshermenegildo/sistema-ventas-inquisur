import { renderRoute } from "./router.js";
import { logout } from "./features/auth.js";
import { auth, db } from "./firebase.js";
import { toggleTheme } from "./utils/theme.js";
import { seedTestData } from "./utils/seed-data.js";
import { onAuthStateChanged, getIdTokenResult } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

async function resolveRole(user) {
  // 1) intenta claims
  try {
    const token = await getIdTokenResult(user, true);
    const claimRole = token?.claims?.role || "";
    if (claimRole) {return claimRole;}
  } catch {}

  // 2) intenta Firestore /usuarios/{uid}
  try {
    const snap = await getDoc(doc(db, "usuarios", user.uid));
    if (snap.exists()) {
      const fsRole = snap.data()?.role || "";
      if (fsRole) {return fsRole;}
    }
  } catch {}

  // 3) fallback
  return "viewer";
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const rol = await resolveRole(user);
    localStorage.setItem("rol", rol);
    
    // Cargar datos de prueba si es la primera vez
    console.log('🔄 Sincronizando datos...');
    await seedTestData();
    
    renderRoute();
  } else {
    localStorage.removeItem("rol");
    window.location.href = "login.html";
  }
});

// Manejar botón de logout - CENTRALIZADO CON DELEGACIÓN
document.addEventListener("click", async (e) => {
  if (e.target.id === "logoutBtn" || e.target.classList.contains("btnLogout")) {
    try {
      await logout();
      window.location.href = "login.html";
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  }
  
  // Manejar toggle de tema
  if (e.target.id === "btnToggleTheme") {
    toggleTheme();
    // Renderizar nuevamente para actualizar el icono
    setTimeout(() => renderRoute(), 100);
  }
});

window.addEventListener("DOMContentLoaded", () => {
  const user = auth.currentUser;
  if (user) {renderRoute();}
});
window.addEventListener("hashchange", () => {
  const user = auth.currentUser;
  if (user) {renderRoute();}
});
