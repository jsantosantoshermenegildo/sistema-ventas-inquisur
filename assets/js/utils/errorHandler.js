// ========================================
// ERROR HANDLER CENTRALIZADO Y MEJORADO
// ========================================

import { logAudit } from "./audit.js";
import { toastError } from "./alerts.js";
import { logger } from "./logger.js";
import { ERROR_MESSAGES } from "../constants/index.js";

/**
 * Categorías de errores
 */
export const ERROR_TYPES = {
  NETWORK: "NETWORK_ERROR",
  VALIDATION: "VALIDATION_ERROR",
  PERMISSION: "PERMISSION_ERROR",
  NOT_FOUND: "NOT_FOUND_ERROR",
  CONFLICT: "CONFLICT_ERROR",
  INTERNAL: "INTERNAL_ERROR",
  UNKNOWN: "UNKNOWN_ERROR",
};

/**
 * Mensajes amigables al usuario por tipo de error
 */
const USER_MESSAGES = {
  [ERROR_TYPES.NETWORK]: "❌ Problema de conexión. Verifica tu internet.",
  [ERROR_TYPES.VALIDATION]: "⚠️ Los datos no son válidos. Revisa los campos.",
  [ERROR_TYPES.PERMISSION]: "🔒 No tienes permiso para realizar esta acción.",
  [ERROR_TYPES.NOT_FOUND]: "🔍 El registro no fue encontrado.",
  [ERROR_TYPES.CONFLICT]: "⚠️ Conflicto: Este registro ya existe.",
  [ERROR_TYPES.INTERNAL]: "❌ Error interno del servidor. Intenta más tarde.",
  [ERROR_TYPES.UNKNOWN]: "❌ Ocurrió un error inesperado.",
};

/**
 * Clasificar error por tipo
 */
function classifyError(error) {
  if (!error) {return ERROR_TYPES.UNKNOWN;}

  const message = error.message?.toLowerCase() || "";
  const code = error.code || "";

  if (message.includes("network") || message.includes("offline")) {
    return ERROR_TYPES.NETWORK;
  }
  if (code === "permission-denied" || message.includes("permission")) {
    return ERROR_TYPES.PERMISSION;
  }
  if (code === "not-found" || message.includes("not found")) {
    return ERROR_TYPES.NOT_FOUND;
  }
  if (message.includes("validation") || message.includes("invalid")) {
    return ERROR_TYPES.VALIDATION;
  }
  if (message.includes("conflict") || message.includes("already exists")) {
    return ERROR_TYPES.CONFLICT;
  }

  return ERROR_TYPES.UNKNOWN;
}

/**
 * Manejador centralizado de errores
 * @param {Error} error - El error capturado
 * @param {Object} context - Contexto adicional
 * @param {string} context.action - Acción que se intentaba (ej: "venta.create")
 * @param {string} context.entity - Entidad afectada (ej: "ventas")
 * @param {string} context.entityId - ID del registro (opcional)
 * @param {boolean} context.silent - Si true, no mostrar toast al usuario
 * @returns {Object} Información del error procesado
 */
export async function handleError(error, context = {}) {
  const {
    action = "unknown",
    entity = "unknown",
    entityId = null,
    silent = false,
  } = context;

  const errorType = classifyError(error);
  const userMessage = USER_MESSAGES[errorType] || USER_MESSAGES[ERROR_TYPES.UNKNOWN];

  // Log en consola con contexto
  console.error(`🔴 ERROR [${action}]`, {
    type: errorType,
    message: error.message,
    code: error.code,
    stack: error.stack,
    context,
  });

  // Auditoría del error
  try {
    await logAudit({
      action: `${action}.error`,
      entity,
      entityId,
      payload: {
        errorType,
        errorMessage: error.message,
        errorCode: error.code,
      },
    });
  } catch (auditError) {
    console.warn("No se pudo registrar error en auditoría:", auditError);
  }

  // Mostrar toast al usuario (si no es silent)
  if (!silent) {
    toastError(userMessage);
  }

  return {
    errorType,
    userMessage,
    technicalMessage: error.message,
    action,
    entity,
  };
}

/**
 * Envolver función async con manejo de errores automático
 * @param {Function} asyncFunc - Función async a ejecutar
 * @param {Object} context - Contexto del error
 * @returns {Function} Función envuelta
 */
export function withErrorHandling(asyncFunc, context = {}) {
  return async (...args) => {
    try {
      return await asyncFunc(...args);
    } catch (error) {
      await handleError(error, context);
      throw error; // Re-lanzar para que el caller pueda manejar si quiere
    }
  };
}

/**
 * Validar datos antes de operación
 * Retorna { valid, errors }
 */
export function validateData(data, schema) {
  if (!schema || !schema.validar) {
    return { valid: true, errors: [] };
  }

  const errors = schema.validar(data);
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizar datos según esquema
 */
export function sanitizeData(data, schema) {
  if (!schema || !schema.sanitizar) {
    return data;
  }

  try {
    return schema.sanitizar(data);
  } catch (error) {
    console.warn("Error en sanitización:", error);
    return data; // Retornar sin modificar si falla
  }
}

/**
 * Wrapper para operaciones CRUD con validación completa
 */
export async function safeOperation(config) {
  const {
    asyncFunc,           // Función a ejecutar
    data = null,         // Datos a validar (opcional)
    schema = null,       // Schema de validación (opcional)
    action = "unknown",
    entity = "unknown",
    entityId = null,
  } = config;

  try {
    // 1. Validar si hay schema
    if (data && schema) {
      const { valid, errors } = validateData(data, schema);
      if (!valid) {
        await handleError(
          new Error(`Validación fallida: ${errors.join(", ")}`),
          { action, entity, entityId, silent: false }
        );
        return { success: false, data: null };
      }
    }

    // 2. Sanitizar datos
    const sanitized = data && schema ? sanitizeData(data, schema) : data;

    // 3. Ejecutar operación
    const result = await asyncFunc(sanitized);

    // 4. Log de éxito
    console.log(`✅ ${action} exitosa`, { entity, entityId, result });
    await logAudit({ action, entity, entityId, payload: { success: true } });

    return { success: true, data: result };
  } catch (error) {
    // Manejo de error
    await handleError(error, { action, entity, entityId });
    return { success: false, data: null };
  }
}

console.log("✅ Error Handler inicializado");
