// assets/js/utils/rateLimiter.js — Rate Limiting y Debounce

/**
 * Throttle: ejecuta la función como máximo cada N ms
 * Ideal para: scroll, resize, filtros rápidos
 */
export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounce: espera N ms sin llamadas antes de ejecutar
 * Ideal para: búsqueda, filtros, cambios de texto
 */
export function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Rate Limiter con "cooldown": máximo X operaciones por minuto
 * Ideal para: crear ventas, eliminar registros, operaciones costosas
 */
export class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = [];
  }

  /**
   * Verifica si puede ejecutar la acción
   * @param {string} key - identificador único (ej: "venta.create")
   * @returns {Object} { allowed: boolean, retryAfter: number (ms) }
   */
  check(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Limpiar intentos viejos
    this.attempts = this.attempts.filter((a) => a.key === key && a.time > windowStart);

    const recentAttempts = this.attempts.filter((a) => a.key === key);

    if (recentAttempts.length < this.maxAttempts) {
      this.attempts.push({ key, time: now });
      return { allowed: true, retryAfter: 0 };
    }

    // Retornar cuánto tiempo debe esperar
    const oldestAttempt = recentAttempts[0].time;
    const retryAfter = oldestAttempt + this.windowMs - now;

    return { allowed: false, retryAfter: Math.max(0, retryAfter) };
  }

  /**
   * Ejecutar función con rate limit
   * Retorna { success, data, error, retryAfter }
   */
  async execute(key, asyncFunc) {
    const check = this.check(key);

    if (!check.allowed) {
      const seconds = Math.ceil(check.retryAfter / 1000);
      return {
        success: false,
        data: null,
        error: `⏱️ Demasiados intentos. Espera ${seconds}s.`,
        retryAfter: check.retryAfter,
      };
    }

    try {
      const data = await asyncFunc();
      return { success: true, data, error: null, retryAfter: 0 };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.message || "Error desconocido",
        retryAfter: 0,
      };
    }
  }

  /**
   * Limpiar historial de un key específico
   */
  reset(key) {
    this.attempts = this.attempts.filter((a) => a.key !== key);
  }

  /**
   * Limpiar todo el historial
   */
  resetAll() {
    this.attempts = [];
  }
}

// Instancia global para operaciones críticas
export const globalRateLimiter = new RateLimiter(5, 60000); // 5 intentos por minuto

// Presets para diferentes tipos de operaciones
export const rateLimiters = {
  // Operaciones de creación/eliminación: 5 por minuto
  crud: new RateLimiter(5, 60000),
  
  // Operaciones de lectura: 30 por minuto (más permisivo)
  read: new RateLimiter(30, 60000),
  
  // Búsqueda/filtrado: throttle más fuerte (100ms)
  search: { throttle: throttle(() => {}, 100) },
  
  // Export: 2 por minuto (costoso)
  export: new RateLimiter(2, 60000),
};

console.log("✅ Rate Limiter inicializado");
