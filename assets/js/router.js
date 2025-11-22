// assets/js/router.js
import { logout } from "./features/auth.js";
import { ProductosPage } from "./features/productos.js";
import { ClientesPage } from "./features/clientes.js";
import { ProformasPage } from "./features/proformas.js";
import { VentasPage } from "./features/ventas.js";
import { ReportesPage } from "./features/reportes-simple.js";
import { AuditoriaPage } from "./features/auditoria.js";
import { DashboardPage } from "./features/dashboard.js";
import { Navbar } from "./ui/components.js";
import { PERMISOS, HOME_BY_ROLE } from "./rules/roles.js";
import { auth } from "./firebase.js";
import { onAuthStateChanged, getIdTokenResult } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const ALWAYS_ALLOWED = new Set(["cuenta"]);

const routes = {
  dashboard: DashboardPage,
  productos: ProductosPage,
  clientes: ClientesPage,
  proformas: ProformasPage,
  ventas: VentasPage,
  reportes: ReportesPage,
  auditoria: AuditoriaPage,
  cuenta: CuentaPage,
};

// Asegura un contenedor para el navbar y lo pinta
function renderNavbar() {
  let nav = document.getElementById("main-navbar");
  if (!nav) {
    nav = document.createElement("div");
    nav.id = "main-navbar";
    const appEl = document.getElementById("app");
    document.body.insertBefore(nav, appEl); // navbar antes del <main id="app">
  }
  nav.innerHTML = Navbar({
    email: auth.currentUser?.email || "",
    role: safeRoleSync() || "",
  });

  const btn = document.getElementById("btnLogout");
  if (btn) {btn.onclick = async () => {
    try {
      await logout();
      window.location.href = "login.html";
    } catch {
      // sin ruido
    }
  };}
}

export async function renderRoute() {
  const container = document.getElementById("app");
  if (!container) {return;}

  // ⚠️ LIMPIEZA CRÍTICA DE CHART.JS - Destruir TODOS los gráficos antes de cambiar página
  console.log('[ROUTER] Iniciando limpieza de gráficos...');
  
  try {
    // Método 1: Limpiar array global de instancias
    if (window.Chart?.instances) {
      const instancias = Array.from(window.Chart.instances || []);
      console.log(`[ROUTER] Encontradas ${instancias.length} instancias de Chart`);
      instancias.forEach((inst, idx) => {
        try {
          if (inst?.destroy) {
            inst.destroy();
            console.log(`[ROUTER] Destruida instancia ${idx}`);
          }
        } catch (e) {
          console.warn(`[ROUTER] Error destruyendo instancia ${idx}:`, e.message);
        }
      });
      window.Chart.instances = [];
    }
    
    // Método 2: Destruir todos los canvas
    container.querySelectorAll('canvas').forEach(canvas => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = canvas.height = 0;
      }
    });

    console.log('[ROUTER] Limpieza completada');
  } catch (e) {
    console.error('[ROUTER] Error durante limpieza:', e);
  }

  renderNavbar();
  container.innerHTML = `
    <div class="p-6 text-center text-gray-500">Cargando...</div>
  `;

  const actualHash = location.hash ? location.hash.slice(1) : "";
  const rol = safeRole();
  const destino = (actualHash || HOME_BY_ROLE[rol] || "cuenta").toLowerCase();

  // Permisos
  if (!ALWAYS_ALLOWED.has(destino)) {
    const lista = PERMISOS?.[rol] || [];
    if (!Array.isArray(lista) || !lista.includes(destino)) {
      const home = HOME_BY_ROLE[rol] || "cuenta";
      location.hash = `#${home}`;
      container.innerHTML = `
        <p class="text-center text-red-500 mt-8">
          ⚠️ No tienes permiso para la sección <code>${destino}</code>.
        </p>
      `;
      return;
    }
  }

  const render = routes[destino];
  if (typeof render === "function") {
    await render(container);
  } else {
    container.innerHTML = `
      <div class="p-6 text-center">
        <h2 class="text-xl font-bold mb-2">Ruta no encontrada</h2>
        <p class="text-gray-500">La sección "${destino}" no existe.</p>
        <a href="#" class="text-blue-600 underline">Ir al inicio</a>
      </div>
    `;
  }
}

/* Helpers */
/**
 * ✅ SEGURO: Obtiene el rol del token JWT, NO de localStorage
 * @returns {Promise<string>} El rol del usuario o string vacío
 */
async function safeRole() {
  try {
    const user = auth.currentUser;
    if (!user) return "";
    
    // Force refresh cada 5 minutos para obtener claims actualizados
    const forceRefresh = Date.now() - (window._lastTokenRefresh || 0) > 300000;
    if (forceRefresh) window._lastTokenRefresh = Date.now();
    
    const token = await getIdTokenResult(user, forceRefresh);
    return token?.claims?.role || "";
  } catch (err) {
    console.error('❌ Error obteniendo rol del token:', err);
    return "";
  }
}

function safeRoleSync() {
  // ❌ REMOVIDO: const raw = localStorage.getItem("rol") ?? "";
  // ⚠️ Versión síncrona temporal (menos segura, usar safeRole() async cuando sea posible)
  const user = auth.currentUser;
  if (!user) return "";
  
  // Intentar obtener del cache del token actual (no forzar refresh)
  // Esto evita llamadas asíncronas en funciones síncronas
  return user.reloadUserInfo?.customAttributes?.role || "";
}

function CuentaPage(container) {
  const rol = safeRoleSync() || "sin rol"; // ✅ Usar versión síncrona
  container.innerHTML = `
    <section class="p-4">
      <h2 class="text-xl font-bold mb-4">Cuenta</h2>
      <p><strong>Correo:</strong> <span id="cuentaEmail">cargando…</span></p>
      <p><strong>Rol:</strong> ${rol ? `<span>${rol}</span>` : `<span class="text-gray-500">no asignado</span>`}</p>
      <button id="logoutBtn" class="mt-4 bg-red-600 text-white px-4 py-2 rounded">Cerrar sesión</button>
    </section>
  `;

  onAuthStateChanged(auth, (user) => {
    const span = container.querySelector("#cuentaEmail");
    if (span) {span.textContent = user?.email ?? "desconocido";}
  });

  container.querySelector("#logoutBtn")?.addEventListener("click", async () => {
    try {
      await logout();
      window.location.href = "login.html";
    } catch {
      // noop
    }
  });
}

// Eventos básicos del router (por si aún no estaban en app.js)
window.addEventListener("hashchange", renderRoute);
