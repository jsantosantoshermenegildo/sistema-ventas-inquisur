// ========================================
// LOGGER INTELIGENTE CON MODO PRODUCCIÓN
// ========================================

/**
 * Sistema de logging que se desactiva en producción
 * pero siempre muestra errores críticos
 */
class Logger {
  constructor() {
    // Detectar si estamos en desarrollo
    this.isDev = this.detectDevMode();
    this.logHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Detecta si estamos en modo desarrollo
   */
  detectDevMode() {
    // Vite/Webpack env
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.DEV === true;
    }
    
    // Localhost o dominios de desarrollo
    const hostname = window.location.hostname;
    return hostname === 'localhost' || 
           hostname === '127.0.0.1' || 
           hostname.includes('local') ||
           hostname.includes('dev.');
  }

  /**
   * Agrega a historial (para debugging)
   */
  addToHistory(level, args) {
    if (this.logHistory.length >= this.maxHistorySize) {
      this.logHistory.shift();
    }
    
    this.logHistory.push({
      level,
      timestamp: new Date().toISOString(),
      args: args.map(arg => {
        try {
          return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
        } catch {
          return '[Circular]';
        }
      }),
    });
  }

  /**
   * Log general - Solo en desarrollo
   */
  log(...args) {
    if (this.isDev) {
      console.log(...args);
      this.addToHistory('log', args);
    }
  }

  /**
   * Info - Solo en desarrollo
   */
  info(...args) {
    if (this.isDev) {
      console.info('ℹ️', ...args);
      this.addToHistory('info', args);
    }
  }

  /**
   * Warning - Siempre se muestra
   */
  warn(...args) {
    console.warn('⚠️', ...args);
    this.addToHistory('warn', args);
  }

  /**
   * Error - Siempre se muestra
   */
  error(...args) {
    console.error('❌', ...args);
    this.addToHistory('error', args);
  }

  /**
   * Debug - Solo en desarrollo con timestamp
   */
  debug(...args) {
    if (this.isDev) {
      const timestamp = new Date().toISOString();
      console.debug(`[${timestamp}]`, ...args);
      this.addToHistory('debug', args);
    }
  }

  /**
   * Success - Solo en desarrollo
   */
  success(...args) {
    if (this.isDev) {
      console.log('✅', ...args);
      this.addToHistory('success', args);
    }
  }

  /**
   * Group - Solo en desarrollo
   */
  group(label) {
    if (this.isDev) {
      console.group(label);
    }
  }

  groupEnd() {
    if (this.isDev) {
      console.groupEnd();
    }
  }

  /**
   * Table - Solo en desarrollo
   */
  table(data) {
    if (this.isDev) {
      console.table(data);
    }
  }

  /**
   * Time - Solo en desarrollo
   */
  time(label) {
    if (this.isDev) {
      console.time(label);
    }
  }

  timeEnd(label) {
    if (this.isDev) {
      console.timeEnd(label);
    }
  }

  /**
   * Obtener historial de logs
   */
  getHistory() {
    return [...this.logHistory];
  }

  /**
   * Limpiar historial
   */
  clearHistory() {
    this.logHistory = [];
  }

  /**
   * Exportar logs (útil para debugging)
   */
  exportLogs() {
    const logs = this.getHistory();
    const blob = new Blob([JSON.stringify(logs, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Instancia única
export const logger = new Logger();

// Exportar también como default
export default logger;
