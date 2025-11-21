import { PERMISOS } from "../rules/roles.js";
import { getCurrentTheme, toggleTheme } from "../utils/theme.js";

export function Navbar({ email = "", role = "" } = {}) {
  const permisos = PERMISOS[role] || [];
  const currentTheme = getCurrentTheme();
  const themeIcon = currentTheme === "dark" ? "☀️" : "🌙";
  const themeLabel = currentTheme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
  
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
    .map(l => `<a href="${l.href}" class="px-3 py-1 rounded hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-700 transition text-sm" aria-label="${l.label.replace(/[📊📦👥📄📈📋⚙️]/g, '').trim()}">${l.label}</a>`)
    .join("");
  
  return `
    <nav class="flex gap-2 items-center" role="navigation" aria-label="Menú principal">
      ${linksHTML}
      <div class="ml-auto flex items-center gap-3">
        <button id="btnToggleTheme" 
          class="text-lg hover:scale-110 transition" 
          title="${themeLabel}"
          aria-label="${themeLabel}"
          aria-pressed="${currentTheme === 'dark'}"
          role="switch">${themeIcon}</button>
        <div class="flex items-center gap-2 text-xs text-indigo-100" role="status" aria-live="polite">
          <span aria-label="Usuario">${email}</span>
          <span class="bg-indigo-500 px-2 py-1 rounded font-semibold" aria-label="Rol de usuario">${role.toUpperCase()}</span>
        </div>
      </div>
    </nav>
  `;
}

// Plantilla simple reutilizable para páginas
export function PageTemplate(title = "", inner = "") {
  return `
    <section class="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 mb-6" 
      role="main" 
      aria-label="${title ? `Sección: ${title}` : 'Contenido principal'}">
      <div class="border-b border-gray-200 dark:border-slate-700 pb-4 mb-4">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white" id="page-title">🔹 ${title}</h2>
      </div>
      <div class="dark:text-gray-100" aria-describedby="page-title">${inner}</div>
    </section>
  `;
}

/**
 * Skeleton Loader para tablas
 * Muestra un placeholder mientras carga la data
 * @param {number} rows - Número de filas a mostrar
 * @param {number} cols - Número de columnas a mostrar
 * @returns {string} HTML del skeleton loader
 */
export function TableSkeleton(rows = 5, cols = 5) {
  const skeletonRows = Array(rows)
    .fill(null)
    .map(
      () => `
        <tr class="border-b border-gray-200 dark:border-slate-700">
          ${Array(cols)
            .fill(null)
            .map(
              () => `
            <td class="p-3">
              <div class="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </td>
          `
            )
            .join("")}
        </tr>
      `
    )
    .join("");

  return `
    <div class="overflow-x-auto animate-pulse" role="status" aria-live="polite" aria-label="Cargando tabla...">
      <table class="min-w-full text-sm" aria-busy="true">
        <tbody>
          ${skeletonRows}
        </tbody>
      </table>
      <div class="sr-only">Cargando contenido de la tabla</div>
    </div>
  `;
}

/**
 * Skeleton Loader para tarjetas
 * @param {number} count - Número de tarjetas
 * @returns {string} HTML del skeleton loader
 */
export function CardSkeleton(count = 3) {
  const cards = Array(count)
    .fill(null)
    .map(
      () => `
        <div class="bg-white dark:bg-slate-800 rounded-lg p-4 shadow animate-pulse" role="img" aria-label="Cargando tarjeta...">
          <div class="h-6 bg-gray-200 dark:bg-slate-700 rounded mb-3 w-3/4"></div>
          <div class="h-4 bg-gray-200 dark:bg-slate-700 rounded mb-2 w-full"></div>
          <div class="h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6"></div>
        </div>
      `
    )
    .join("");

  return `
    <div class="grid gap-4 md:grid-cols-${count} animate-pulse" role="status" aria-live="polite" aria-label="Cargando tarjetas...">
      ${cards}
      <div class="sr-only">Cargando ${count} tarjetas</div>
    </div>
  `;
}

/**
 * Skeleton Loader para líneas de texto
 * @param {number} lines - Número de líneas
 * @param {number} maxWidth - Ancho máximo (%, default 100)
 * @returns {string} HTML del skeleton loader
 */
export function TextSkeleton(lines = 3, maxWidth = 100) {
  const skeletonLines = Array(lines)
    .fill(null)
    .map((_, idx) => {
      const isLastLine = idx === lines - 1;
      const width = isLastLine ? Math.random() * (maxWidth - 60) + 60 : maxWidth;
      return `<div class="h-4 bg-gray-200 dark:bg-slate-700 rounded mb-2 animate-pulse" style="width: ${width}%"></div>`;
    })
    .join("");

  return `<div class="space-y-2 animate-pulse" role="status" aria-live="polite" aria-label="Cargando texto...">
    ${skeletonLines}
    <div class="sr-only">Cargando ${lines} líneas de texto</div>
  </div>`;
}

/**
 * Skeleton Loader para gráficos
 * @returns {string} HTML del skeleton loader
 */
export function ChartSkeleton() {
  return `
    <div class="bg-white dark:bg-slate-800 rounded-lg p-6 shadow animate-pulse" role="status" aria-live="polite" aria-label="Cargando gráfico...">
      <div class="h-6 bg-gray-200 dark:bg-slate-700 rounded mb-4 w-1/3"></div>
      <div class="flex items-end gap-2 justify-between h-64">
        ${Array(8)
          .fill(null)
          .map(
            (_, i) => `
          <div class="flex-1 bg-gray-200 dark:bg-slate-700 rounded" style="height: ${Math.random() * 60 + 20}%"></div>
        `
          )
          .join("")}
      </div>
      <div class="sr-only">Cargando gráfico de datos</div>
    </div>
  `;
}

/**
 * Skeleton Loader para formularios
 * @param {number} fields - Número de campos
 * @returns {string} HTML del skeleton loader
 */
export function FormSkeleton(fields = 4) {
  const skeletonFields = Array(fields)
    .fill(null)
    .map(
      () => `
        <div class="mb-4 animate-pulse">
          <div class="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
          <div class="h-10 bg-gray-200 dark:bg-slate-700 rounded"></div>
        </div>
      `
    )
    .join("");

  return `
    <form class="space-y-4 animate-pulse" role="status" aria-live="polite" aria-label="Cargando formulario...">
      ${skeletonFields}
      <div class="h-10 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
      <div class="sr-only">Cargando ${fields} campos del formulario</div>
    </form>
  `;
}

/**
 * Skeleton Loader para avatar + info
 * @param {number} count - Número de items
 * @returns {string} HTML del skeleton loader
 */
export function AvatarSkeleton(count = 3) {
  const skeletonItems = Array(count)
    .fill(null)
    .map(
      () => `
        <div class="flex gap-4 mb-4 animate-pulse" role="img" aria-label="Cargando perfil...">
          <div class="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-full flex-shrink-0"></div>
          <div class="flex-1">
            <div class="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
            <div class="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
        </div>
      `
    )
    .join("");

  return `<div class="animate-pulse" role="status" aria-live="polite" aria-label="Cargando perfiles...">
    ${skeletonItems}
    <div class="sr-only">Cargando ${count} perfiles de usuario</div>
  </div>`;
}

export default {
  Navbar,
  PageTemplate,
  TableSkeleton,
  CardSkeleton,
  TextSkeleton,
  ChartSkeleton,
  FormSkeleton,
  AvatarSkeleton
};
