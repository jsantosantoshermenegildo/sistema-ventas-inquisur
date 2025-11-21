/**
 * assets/js/utils/autoRefresh.js
 * Sistema de refresh automático e inteligente
 * Permite refresco manual y automático cada cierto tiempo
 */

class AutoRefreshManager {
  constructor(intervalMs = 30000) { // 30 segundos por defecto
    this.intervalMs = intervalMs;
    this.intervalId = null;
    this.isActive = false;
    this.callbacks = [];
    this.lastRefreshTime = null;
    this.refreshCount = 0;
  }

  /**
   * Registrar callback de refresh
   * @param {function} callback - Función a ejecutar en refresh
   * @returns {function} Función para desuscribirse
   */
  onRefresh(callback) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Iniciar refresh automático
   */
  start() {
    if (this.isActive) {
      console.warn('[AUTO-REFRESH] ⚠️ Auto-refresh ya está activo');
      return;
    }

    console.log('[AUTO-REFRESH] 🔄 Iniciando auto-refresh cada', this.intervalMs, 'ms');

    this.intervalId = setInterval(() => {
      this.executeRefresh('auto');
    }, this.intervalMs);

    this.isActive = true;
  }

  /**
   * Detener refresh automático
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isActive = false;
    console.log('[AUTO-REFRESH] ⏹️ Auto-refresh detenido');
  }

  /**
   * Refresh manual inmediato
   * @param {string} reason - Razón del refresh
   */
  async refreshNow(reason = 'manual') {
    console.log('[AUTO-REFRESH] 🔄 Refresh manual solicitado -', reason);
    await this.executeRefresh(reason);
  }

  /**
   * Ejecutar refresh
   * @private
   */
  async executeRefresh(type = 'auto') {
    try {
      this.lastRefreshTime = new Date();
      this.refreshCount++;

      console.log(`[AUTO-REFRESH] 🔄 Refresh #${this.refreshCount} (${type}) a las ${this.lastRefreshTime.toLocaleTimeString()}`);

      // Ejecutar todos los callbacks
      for (const callback of this.callbacks) {
        try {
          await callback();
        } catch (error) {
          console.error('[AUTO-REFRESH] ❌ Error en callback:', error);
        }
      }

      console.log(`[AUTO-REFRESH] ✅ Refresh completado en ${(Date.now() - this.lastRefreshTime) / 1000}s`);

    } catch (error) {
      console.error('[AUTO-REFRESH] ❌ Error durante refresh:', error);
    }
  }

  /**
   * Cambiar intervalo de refresh
   * @param {number} newIntervalMs - Nuevo intervalo en ms
   */
  setInterval(newIntervalMs) {
    this.intervalMs = newIntervalMs;

    if (this.isActive) {
      this.stop();
      this.start();
    }

    console.log('[AUTO-REFRESH] ⏱️ Intervalo cambiado a', newIntervalMs, 'ms');
  }

  /**
   * Obtener estado
   */
  getStatus() {
    return {
      isActive: this.isActive,
      intervalMs: this.intervalMs,
      lastRefreshTime: this.lastRefreshTime,
      totalRefreshes: this.refreshCount,
      callbacksRegistrados: this.callbacks.length
    };
  }

  /**
   * Reset de estadísticas
   */
  reset() {
    this.refreshCount = 0;
    this.lastRefreshTime = null;
    console.log('[AUTO-REFRESH] 🔄 Estadísticas reseteadas');
  }
}

// Instancia singleton
export const autoRefresh = new AutoRefreshManager(30000); // 30 segundos

export default autoRefresh;
