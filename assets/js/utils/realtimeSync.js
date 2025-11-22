/**
 * assets/js/utils/realtimeSync.js
 * Sincronización en tiempo real con Firestore usando onSnapshot
 * Escucha cambios en colecciones y notifica a la aplicación
 */

import { db, collection, query, orderBy, limit, onSnapshot } from "../firebase.js";
import { eventBus, EVENTS } from "./eventBus.js";

class RealtimeSyncManager {
  constructor() {
    this.unsubscribers = new Map(); // Guardar unsubscribers por colección
    this.isActive = false;
    this.listeners = [];
  }

  /**
   * Inicia sincronización en tiempo real para ventas/proformas
   * @param {function} onDataChange - Callback cuando hay cambios
   */
  startVentasSync(onDataChange) {
    console.log('[SYNC] 🔄 Iniciando sincronización real-time de proformas...');

    if (this.unsubscribers.has('ventas')) {
      console.log('[SYNC] ⚠️ Sync de proformas ya activo, deteniendo anterior');
      this.stopVentasSync();
    }

    try {
      const q = query(
        collection(db, 'proformas'),
        orderBy('createdAt', 'desc'),
        limit(500) // Limitar a últimas 500
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          console.log('[SYNC] ✅ Snapshot de proformas recibido:', snapshot.size, 'docs');
          
          const ventas = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Callback con datos
          if (onDataChange) {onDataChange(ventas);}

          // Emitir evento
          eventBus.emit(EVENTS.DATOS_SINCRONIZADOS, {
            coleccion: 'proformas',
            cantidad: ventas.length,
            timestamp: new Date()
          });
        },
        (error) => {
          console.error('[SYNC] ❌ Error en onSnapshot de proformas:', error);
          eventBus.emit(EVENTS.SINCRONIZACION_ERROR, {
            coleccion: 'proformas',
            error: error.message
          });
        }
      );

      this.unsubscribers.set('ventas', unsubscribe);
      this.isActive = true;
      console.log('[SYNC] ✅ Sincronización de proformas activada');

    } catch (error) {
      console.error('[SYNC] ❌ Error al iniciar sync de proformas:', error);
      eventBus.emit(EVENTS.SINCRONIZACION_ERROR, {
        coleccion: 'proformas',
        error: error.message
      });
    }
  }

  /**
   * Detiene sincronización de ventas
   */
  stopVentasSync() {
    if (this.unsubscribers.has('ventas')) {
      this.unsubscribers.get('ventas')();
      this.unsubscribers.delete('ventas');
      console.log('[SYNC] ⏹️ Sincronización de ventas detenida');
    }
  }

  /**
   * Sincronizar múltiples colecciones
   */
  startMultipleSync(collections) {
    collections.forEach(({ name, onDataChange }) => {
      if (name === 'ventas') {
        this.startVentasSync(onDataChange);
      }
      // Agregar más colecciones según sea necesario
    });
  }

  /**
   * Detener todas las sincronizaciones
   */
  stopAllSync() {
    this.unsubscribers.forEach((unsubscribe, coleccion) => {
      unsubscribe();
      console.log(`[SYNC] ⏹️ Sync de ${coleccion} detenida`);
    });
    this.unsubscribers.clear();
    this.isActive = false;
  }

  /**
   * Verificar si hay sincronización activa
   */
  isListening(coleccion) {
    return this.unsubscribers.has(coleccion);
  }

  /**
   * Obtener estado de sincronización
   */
  getStatus() {
    return {
      isActive: this.isActive,
      activeCollections: Array.from(this.unsubscribers.keys()),
      timestamp: new Date()
    };
  }
}

// Instancia singleton
export const realtimeSync = new RealtimeSyncManager();

export default realtimeSync;
