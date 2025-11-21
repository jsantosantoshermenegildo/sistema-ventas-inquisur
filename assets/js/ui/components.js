import { PERMISOS } from "../rules/roles.js";
import { getCurrentTheme, toggleTheme } from "../utils/theme.js";

export function Navbar({ email = "", role = "" } = {}) {
  const permisos = PERMISOS[role] || [];
  const currentTheme = getCurrentTheme();
  const themeIcon = currentTheme === "dark" ? "☀️" : "🌙";
  
  const links = [
    { href: "#dashboard", label: "📊 Dashboard", requiere: "dashboard" },
    { href: "#productos", label: "📦 Productos", requiere: "productos" },
    { href: "#clientes", label: "👥 Clientes", requiere: "clientes" },
    { href: "#proformas", label: "📄 Proformas", requiere: "proformas" },
    { href: "#reportes", label: "📈 Reportes", requiere: "reportes" },
    { href: "#auditoria", label: "📋 Auditoría", requiere: "auditoria" },
    { href: "#cuenta", label: "⚙️ Cuenta", requiere: "cuenta" },
  ];
  
  const linksHTML = links
    .filter(l => permisos.includes(l.requiere))
    .map(l => `<a href="${l.href}" class="px-3 py-1 rounded hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-700 transition text-sm">${l.label}</a>`)
    .join("");
  
  return `
    <div class="flex gap-2 items-center">
      ${linksHTML}
      <div class="ml-auto flex items-center gap-3">
        <button id="btnToggleTheme" class="text-lg hover:scale-110 transition" title="Cambiar tema">${themeIcon}</button>
        <div class="flex items-center gap-2 text-xs text-indigo-100">
          <span>${email}</span>
          <span class="bg-indigo-500 px-2 py-1 rounded font-semibold">${role.toUpperCase()}</span>
        </div>
      </div>
    </div>
  `;
}

// Plantilla simple reutilizable para páginas
export function PageTemplate(title = "", inner = "") {
  return `
    <section class="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 mb-6">
      <div class="border-b border-gray-200 dark:border-slate-700 pb-4 mb-4">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white">🔹 ${title}</h2>
      </div>
      <div class="dark:text-gray-100">${inner}</div>
    </section>
  `;
}
