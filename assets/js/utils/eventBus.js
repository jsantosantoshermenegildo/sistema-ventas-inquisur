/**
 * assets/js/utils/eventBus.js
 * Sistema de eventos para comunicación entre módulos
 * Permite que ventas.js notifique a reportes.js de cambios sin acoplamiento
 */

class EventBus {
  constructor() {
    this.events = {};
  }

  /**
   * Suscribirse a un evento
   * @param {string} event - Nombre del evento
   * @param {function} callback - Función a ejecutar
   * @returns {function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);

    // Retornar función para desuscribirse
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }

  /**
   * Suscribirse solo una vez
   */
  once(event, callback) {
    const unsubscribe = this.on(event, (...args) => {
      callback(...args);
      unsubscribe();
    });
    return unsubscribe;
  }

  /**
   * Emitir un evento
   * @param {string} event - Nombre del evento
   * @param {...any} args - Argumentos a pasar
   */
  emit(event, ...args) {
    if (!this.events[event]) {return;}
    this.events[event].forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error en evento ${event}:`, error);
      }
    });
  }

  /**
   * Remover todos los listeners de un evento
   */
  off(event) {
    if (this.events[event]) {
      this.events[event] = [];
    }
  }

  /**
   * Remover todos los eventos
   */
  clear() {
    this.events = {};
  }
}

// Instancia singleton global
export const eventBus = new EventBus();

// Eventos disponibles
export const EVENTS = {
  // Ventas
  VENTA_CREADA: 'venta:creada',
  VENTA_ACTUALIZADA: 'venta:actualizada',
  VENTA_ELIMINADA: 'venta:eliminada',
  
  // Reportes
  REPORTES_ACTUALIZAR: 'reportes:actualizar',
  REPORTES_ACTUALIZADO: 'reportes:actualizado',
  
  // Sincronización
  DATOS_SINCRONIZADOS: 'datos:sincronizados',
  SINCRONIZACION_ERROR: 'sincronizacion:error'
};

export default eventBus;
