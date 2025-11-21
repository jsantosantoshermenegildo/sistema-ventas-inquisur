// assets/js/utils/estados.js — Gestión de estados de documentos

export const ESTADOS_PROFORMA = {
  borrador: { label: "Borrador", color: "bg-gray-500", icon: "📝" },
  confirmada: { label: "Confirmada", color: "bg-blue-600", icon: "✓" },
  convertida: { label: "Convertida a Venta", color: "bg-green-600", icon: "🧾" }
};

export const ESTADOS_VENTA = {
  confirmada: { label: "Confirmada", color: "bg-blue-600", icon: "✓" },
  pagada: { label: "Pagada", color: "bg-green-600", icon: "💰" },
  cancelada: { label: "Cancelada", color: "bg-red-600", icon: "✕" }
};

export function getBadgeEstado(tipo, estado) {
  const estados = tipo === "proforma" ? ESTADOS_PROFORMA : ESTADOS_VENTA;
  const info = estados[estado] || { label: estado, color: "bg-gray-400", icon: "?" };
  return `<span class="inline-flex items-center gap-1 px-3 py-1 rounded text-white text-xs font-semibold ${info.color}">${info.icon} ${info.label}</span>`;
}

export function getEstadoOptions(tipo) {
  const estados = tipo === "proforma" ? ESTADOS_PROFORMA : ESTADOS_VENTA;
  return Object.keys(estados);
}
