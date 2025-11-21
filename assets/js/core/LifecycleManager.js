// ========================================
// LIFECYCLE MANAGER - GESTIÓN DE LIMPIEZA
// ========================================

import { logger } from '../utils/logger.js';

/**
 * Gestor de ciclo de vida de páginas
 * Evita memory leaks al limpiar listeners y suscripciones
 */
export class PageLifecycle {
  constructor(pageName = 'unknown') {
    this.pageName = pageName;
    this.cleanupHandlers = [];
    this.eventListeners = [];
    this.firestoreUnsubscribers = [];
    this.intervals = [];
    this.timeouts = [];
    
    logger.debug(`[LIFECYCLE] ${pageName} inicializado`);
  }

  /**
   * Registra un handler de limpieza genérico
   */
  onCleanup(handler) {
    if (typeof handler === 'function') {
      this.cleanupHandlers.push(handler);
    }
  }

  /**
   * Registra un event listener para limpieza automática
   */
  addEventListener(element, event, handler, options) {
    if (!element || !event || !handler) {return;}
    
    element.addEventListener(event, handler, options);
    
    this.eventListeners.push({
      element,
      event,
      handler,
      options,
    });
  }

  /**
   * Registra un unsubscribe de Firestore
   */
  addFirestoreUnsubscriber(unsubscriber) {
    if (typeof unsubscriber === 'function') {
      this.firestoreUnsubscribers.push(unsubscriber);
    }
  }

  /**
   * Registra un interval para limpieza
   */
  setInterval(callback, ms) {
    const intervalId = setInterval(callback, ms);
    this.intervals.push(intervalId);
    return intervalId;
  }

  /**
   * Registra un timeout para limpieza
   */
  setTimeout(callback, ms) {
    const timeoutId = setTimeout(callback, ms);
    this.timeouts.push(timeoutId);
    return timeoutId;
  }

  /**
   * Limpia todos los recursos registrados
   */
  cleanup() {
    logger.debug(`[LIFECYCLE] Limpiando ${this.pageName}...`);

    // Limpiar event listeners
    this.eventListeners.forEach(({ element, event, handler, options }) => {
      try {
        element.removeEventListener(event, handler, options);
      } catch (error) {
        logger.error(`[LIFECYCLE] Error removiendo listener:`, error);
      }
    });

    // Limpiar Firestore unsubscribers
    this.firestoreUnsubscribers.forEach(unsubscriber => {
      try {
        unsubscriber();
      } catch (error) {
        logger.error(`[LIFECYCLE] Error en unsubscribe:`, error);
      }
    });

    // Limpiar intervals
    this.intervals.forEach(intervalId => {
      clearInterval(intervalId);
    });

    // Limpiar timeouts
    this.timeouts.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });

    // Ejecutar handlers de limpieza personalizados
    this.cleanupHandlers.forEach(handler => {
      try {
        handler();
      } catch (error) {
        logger.error(`[LIFECYCLE] Error en cleanup handler:`, error);
      }
    });

    // Limpiar arrays
    this.eventListeners = [];
    this.firestoreUnsubscribers = [];
    this.intervals = [];
    this.timeouts = [];
    this.cleanupHandlers = [];

    logger.success(`[LIFECYCLE] ${this.pageName} limpiado`);
  }

  /**
   * Destruye la instancia completamente
   */
  destroy() {
    this.cleanup();
    this.pageName = null;
  }
}

/**
 * Gestor global de lifecycles de todas las páginas
 */
class LifecycleManager {
  constructor() {
    this.currentLifecycle = null;
  }

  /**
   * Crea un nuevo lifecycle y limpia el anterior
   */
  create(pageName) {
    // Limpiar lifecycle anterior si existe
    if (this.currentLifecycle) {
      this.currentLifecycle.cleanup();
    }

    // Crear nuevo lifecycle
    this.currentLifecycle = new PageLifecycle(pageName);
    return this.currentLifecycle;
  }

  /**
   * Obtiene el lifecycle actual
   */
  getCurrent() {
    return this.currentLifecycle;
  }

  /**
   * Limpia el lifecycle actual
   */
  cleanup() {
    if (this.currentLifecycle) {
      this.currentLifecycle.cleanup();
      this.currentLifecycle = null;
    }
  }
}

// Instancia global
export const lifecycleManager = new LifecycleManager();

// Limpiar al salir de la página
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    lifecycleManager.cleanup();
  });
}
