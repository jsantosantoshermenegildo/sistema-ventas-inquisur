// ========================================
// GESTOR DE ESTADO CENTRALIZADO
// ========================================

import { logger } from './logger.js';

/**
 * State Manager centralizado para toda la aplicación
 * Implementa patrón Observer para reactividad
 */
class StateManager {
  constructor() {
    this.state = {
      // Usuario autenticado
      user: null,
      role: null,
      
      // Datos de colecciones
      productos: [],
      clientes: [],
      ventas: [],
      proformas: [],
      
      // UI State
      currentPage: null,
      loading: false,
      errors: [],
      
      // Filtros
      filters: {
        productos: {},
        clientes: {},
        ventas: {},
        proformas: {},
      },
      
      // Paginación
      pagination: {
        productos: { page: 1, pageSize: 50 },
        clientes: { page: 1, pageSize: 50 },
        ventas: { page: 1, pageSize: 50 },
        proformas: { page: 1, pageSize: 50 },
      },
      
      // Cache metadata
      cache: {
        lastUpdate: {},
      },
    };

    this.listeners = new Map();
    this.listenerIdCounter = 0;
  }

  /**
   * Obtiene el estado completo (inmutable)
   */
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Obtiene un valor específico del estado
   */
  get(path) {
    const keys = path.split('.');
    let value = this.state;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Actualiza el estado
   */
  setState(updates) {
    const oldState = this.getState();
    
    // Merge profundo
    this.state = this.deepMerge(this.state, updates);
    
    logger.debug('[STATE] Estado actualizado:', updates);
    
    // Notificar listeners
    this.notifyListeners(oldState, this.state, updates);
  }

  /**
   * Establece un valor específico del estado
   */
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    let target = this.state;
    for (const key of keys) {
      if (!(key in target)) {
        target[key] = {};
      }
      target = target[key];
    }
    
    target[lastKey] = value;
    
    logger.debug(`[STATE] Set ${path}:`, value);
    this.notifyListeners(this.state, this.state, { [path]: value });
  }

  /**
   * Resetea el estado a inicial
   */
  reset() {
    const initialState = {
      user: null,
      role: null,
      productos: [],
      clientes: [],
      ventas: [],
      proformas: [],
      currentPage: null,
      loading: false,
      errors: [],
      filters: {
        productos: {},
        clientes: {},
        ventas: {},
        proformas: {},
      },
      pagination: {
        productos: { page: 1, pageSize: 50 },
        clientes: { page: 1, pageSize: 50 },
        ventas: { page: 1, pageSize: 50 },
        proformas: { page: 1, pageSize: 50 },
      },
      cache: {
        lastUpdate: {},
      },
    };
    
    this.state = initialState;
    logger.info('[STATE] Estado reseteado');
    this.notifyListeners({}, this.state, {});
  }

  /**
   * Suscribe un listener a cambios de estado
   */
  subscribe(listener, filter = null) {
    const id = ++this.listenerIdCounter;
    
    this.listeners.set(id, { callback: listener, filter });
    
    logger.debug(`[STATE] Listener ${id} suscrito`);
    
    // Retorna función para desuscribir
    return () => {
      this.listeners.delete(id);
      logger.debug(`[STATE] Listener ${id} removido`);
    };
  }

  /**
   * Notifica a todos los listeners
   */
  notifyListeners(oldState, newState, changes) {
    this.listeners.forEach(({ callback, filter }) => {
      try {
        // Si hay filtro, solo notificar si cambió esa parte del estado
        if (filter) {
          const oldValue = this.getValueByPath(oldState, filter);
          const newValue = this.getValueByPath(newState, filter);
          
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            callback(newState, oldState, changes);
          }
        } else {
          callback(newState, oldState, changes);
        }
      } catch (error) {
        logger.error('[STATE] Error en listener:', error);
      }
    });
  }

  /**
   * Merge profundo de objetos
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Obtiene valor por ruta (helper)
   */
  getValueByPath(obj, path) {
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Helpers para setters comunes
   */
  setUser(user) {
    this.set('user', user);
  }

  setRole(role) {
    this.set('role', role);
  }

  setLoading(loading) {
    this.set('loading', loading);
  }

  addError(error) {
    const errors = this.get('errors') || [];
    this.set('errors', [...errors, { 
      message: error, 
      timestamp: Date.now() 
    }]);
  }

  clearErrors() {
    this.set('errors', []);
  }
}

// Instancia única global
export const appState = new StateManager();

// Exportar también como default
export default appState;
