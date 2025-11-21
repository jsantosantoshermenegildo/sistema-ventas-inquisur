// assets/js/rules/schemas.js — Validadores centralizados

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const phoneRegex = /^[0-9]{6,15}$/;

export const SCHEMAS = {
  producto: {
    validar: (data) => {
      const errors = [];
      if (!data.codigo || String(data.codigo).trim().length === 0) errors.push("Código requerido");
      if (!data.nombre || String(data.nombre).trim().length < 2) errors.push("Nombre inválido (mín. 2 caracteres)");
      if (data.precio === undefined || Number(data.precio) < 0) errors.push("Precio debe ser ≥ 0");
      if (data.stock === undefined || Number(data.stock) < 0) errors.push("Stock debe ser ≥ 0");
      return errors;
    },
    sanitizar: (data) => ({
      codigo: String(data.codigo || "").trim().toUpperCase(),
      nombre: String(data.nombre || "").trim(),
      precio: Math.max(0, Number(data.precio || 0)),
      stock: Math.max(0, Number(data.stock || 0)),
      impuesto: Math.max(0, Math.min(100, Number(data.impuesto || 0))),
      activo: Boolean(data.activo ?? true),
      createdAt: data.createdAt || Date.now(),
      updatedAt: Date.now(),
    })
  },

  cliente: {
    validar: (data) => {
      const errors = [];
      if (!data.nombre || String(data.nombre).trim().length < 2) 
        errors.push("Nombre inválido (mín. 2 caracteres)");
      
      // Email: opcional pero SI se proporciona, debe ser válido
      if (data.email && !emailRegex.test(String(data.email || "").trim())) 
        errors.push("Email inválido");
      
      // Teléfono: opcional pero SI se proporciona, debe ser válido (6-15 dígitos)
      const telLimpio = String(data.telefono || "").replace(/\D/g, "");
      if (data.telefono && telLimpio.length > 0 && !phoneRegex.test(telLimpio)) 
        errors.push("Teléfono inválido (6-15 dígitos)");
      
      return errors;
    },
    sanitizar: (data) => ({
      nombre: String(data.nombre || "").trim(),
      email: data.email ? String(data.email || "").trim().toLowerCase() : "",
      telefono: String(data.telefono || "").replace(/\D/g, ""),
      dniRuc: String(data.dniRuc || "").replace(/\D/g, ""),
      direccion: String(data.direccion || "").trim(),
      createdAt: data.createdAt || Date.now(),
      updatedAt: Date.now(),
    })
  },

  proforma: {
    validar: (data) => {
      const errors = [];
      if (!data.clienteId) errors.push("Cliente requerido");
      if (!Array.isArray(data.items) || data.items.length === 0) errors.push("Debe contener al menos un producto");
      if (Number(data.total || 0) < 0) errors.push("Total debe ser ≥ 0");
      if (!["borrador", "confirmada", "convertida"].includes(data.estado)) errors.push("Estado inválido");
      return errors;
    },
    sanitizar: (data) => ({
      clienteId: String(data.clienteId || ""),
      clienteNombre: String(data.clienteNombre || ""),
      items: Array.isArray(data.items) ? data.items.map(i => ({
        codigo: String(i.codigo || "").trim(),
        nombre: String(i.nombre || "").trim(),
        precio: Number(i.precio || 0),
        cant: Math.max(1, Number(i.cant || 1)),
        subtotal: Number(i.subtotal || 0),
      })) : [],
      base: Number(data.base || 0),
      igv: Number(data.igv || 0),
      total: Number(data.total || 0),
      igvIncluido: Boolean(data.igvIncluido ?? true),
      igvRate: Number(data.igvRate || 0.18),
      estado: String(data.estado || "borrador"),
      createdAt: data.createdAt || Date.now(),
      updatedAt: Date.now(),
    })
  },

  venta: {
    validar: (data) => {
      const errors = [];
      if (!Array.isArray(data.items) || data.items.length === 0) errors.push("Debe contener al menos un producto");
      if (Number(data.total || 0) < 0) errors.push("Total debe ser ≥ 0");
      if (!data.numero) errors.push("Número de venta requerido");
      if (!["confirmada", "pagada", "cancelada"].includes(data.estado)) errors.push("Estado inválido");
      return errors;
    },
    sanitizar: (data) => ({
      numero: String(data.numero || ""),
      items: Array.isArray(data.items) ? data.items.map(i => ({
        codigo: String(i.codigo || "").trim(),
        nombre: String(i.nombre || "").trim(),
        precio: Number(i.precio || 0),
        cant: Math.max(1, Number(i.cant || 1)),
        subtotal: Number(i.subtotal || 0),
      })) : [],
      base: Number(data.base || 0),
      igv: Number(data.igv || 0),
      total: Number(data.total || 0),
      igvIncluido: Boolean(data.igvIncluido ?? true),
      igvRate: Number(data.igvRate || 0.18),
      proformaId: data.proformaId || null,
      estado: String(data.estado || "registrada"),
      createdAt: data.createdAt || Date.now(),
      updatedAt: Date.now(),
    })
  },

  usuario: {
    validar: (data) => {
      const errors = [];
      if (!data.uid) errors.push("UID requerido");
      if (!["admin", "seller", "viewer"].includes(data.role)) errors.push("Role inválido");
      return errors;
    },
    sanitizar: (data) => ({
      uid: String(data.uid || ""),
      email: String(data.email || "").trim().toLowerCase(),
      role: String(data.role || "viewer"),
      updatedAt: Date.now(),
    })
  }
};

/**
 * Valida datos contra un schema
 * @param {string} schemaName - Nombre del schema (producto, cliente, proforma, venta, usuario)
 * @param {object} data - Datos a validar
 * @returns {object} { valid: boolean, errors: string[] }
 */
export function validar(schemaName, data) {
  const schema = SCHEMAS[schemaName];
  if (!schema) return { valid: false, errors: [`Schema "${schemaName}" no existe`] };
  const errors = schema.validar(data || {});
  return { valid: errors.length === 0, errors };
}

/**
 * Sanitiza y valida datos
 * @param {string} schemaName
 * @param {object} data
 * @returns {object} { valid: boolean, data?: object, errors: string[] }
 */
export function validarYSanitizar(schemaName, data) {
  const schema = SCHEMAS[schemaName];
  if (!schema) return { valid: false, errors: [`Schema "${schemaName}" no existe`] };
  
  const sanitized = schema.sanitizar(data || {});
  const errors = schema.validar(sanitized);
  
  return {
    valid: errors.length === 0,
    data: sanitized,
    errors
  };
}
