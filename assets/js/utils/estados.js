// assets/js/utils/estados.js — Gestión de estados de documentos

export const ESTADOS_PROFORMA = {
  borrador: { label: "Borrador", color: "bg-gray-500", icon: "📝" },
  enviada: { label: "Enviada", color: "bg-blue-500", icon: "📧" },
  aprobada: { label: "Aprobada", color: "bg-green-500", icon: "✅" },
  rechazada: { label: "Rechazada", color: "bg-red-500", icon: "❌" },
  facturada: { label: "Facturada", color: "bg-yellow-500", icon: "💰" }
};

export const ESTADOS_VENTA = {
  confirmada: { label: "Confirmada", color: "bg-blue-600", icon: "✓" },
  pagada: { label: "Pagada", color: "bg-green-600", icon: "💰" },
  cancelada: { label: "Cancelada", color: "bg-red-600", icon: "✕" }
};

/**
 * Genera un badge HTML para un estado
 * @param {string} estado - El estado (o tipo si se pasan 2 parámetros)
 * @param {string} [estadoValue] - El valor del estado (opcional, para compatibilidad)
 */
export function getBadgeEstado(estado, estadoValue) {
  // Si se pasan 2 parámetros, el primero es el tipo
  if (estadoValue) {
    const tipo = estado;
    estado = estadoValue;
    const estados = tipo === "proforma" ? ESTADOS_PROFORMA : ESTADOS_VENTA;
    const info = estados[estado] || { label: estado, color: "bg-gray-400", icon: "?" };
    return `<span class="inline-flex items-center gap-1 px-3 py-1 rounded text-white text-xs font-semibold ${info.color}">${info.icon} ${info.label}</span>`;
  }
  
  // Si se pasa 1 parámetro, asumir que es proforma
  const info = ESTADOS_PROFORMA[estado] || { label: estado || "Sin estado", color: "bg-gray-400", icon: "?" };
  return `<span class="inline-flex items-center gap-1 px-3 py-1 rounded text-white text-xs font-semibold ${info.color}">${info.icon} ${info.label}</span>`;
}

export function getEstadoOptions(tipo) {
  const estados = tipo === "proforma" ? ESTADOS_PROFORMA : ESTADOS_VENTA;
  return Object.keys(estados);
}
