/**
 * Loading Manager - Componente global de loading
 * Proporciona overlay y estados de carga consistentes en toda la aplicación
 */

export class LoadingManager {
  constructor() {
    this.overlay = this.createOverlay();
    this.isVisible = false;
    document.body.appendChild(this.overlay);
  }

  /**
   * Crea el overlay de loading
   * @returns {HTMLElement} Elemento del overlay
   */
  createOverlay() {
    const div = document.createElement('div');
    div.id = 'global-loading-overlay';
    div.className = `
      fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden 
      flex items-center justify-center animate-fadeIn
    `;
    div.setAttribute('role', 'status');
    div.setAttribute('aria-live', 'polite');
    div.setAttribute('aria-label', 'Cargando...');
    
    div.innerHTML = `
      <div class="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-2xl animate-scaleIn">
        <div class="flex flex-col items-center gap-4">
          <div class="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
          <p 
            id="loading-text" 
            class="text-center text-gray-700 dark:text-gray-300 font-medium"
          >
            Cargando...
          </p>
          <p 
            id="loading-subtext"
            class="text-center text-sm text-gray-500 dark:text-gray-400"
            style="display: none;"
          ></p>
          <div 
            id="loading-progress"
            class="w-48 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
            style="display: none;"
          >
            <div 
              class="h-full bg-indigo-600 w-0 transition-all duration-300"
              id="progress-bar"
            ></div>
          </div>
        </div>
      </div>
    `;
    
    return div;
  }

  /**
   * Muestra el overlay de loading
   * @param {string} text - Texto principal
   * @param {Object} options - Opciones adicionales
   * @param {string} options.subtext - Subtexto descriptivo
   * @param {boolean} options.showProgress - Mostrar barra de progreso
   * @param {number} options.progress - Porcentaje de progreso (0-100)
   */
  show(text = 'Cargando...', options = {}) {
    const {
      subtext = null,
      showProgress = false,
      progress = 0
    } = options;

    // Actualizar texto principal
    const textEl = document.getElementById('loading-text');
    if (textEl) {textEl.textContent = text;}

    // Actualizar subtexto
    const subtextEl = document.getElementById('loading-subtext');
    if (subtextEl) {
      if (subtext) {
        subtextEl.textContent = subtext;
        subtextEl.style.display = 'block';
      } else {
        subtextEl.style.display = 'none';
      }
    }

    // Mostrar/ocultar barra de progreso
    const progressEl = document.getElementById('loading-progress');
    if (progressEl) {
      if (showProgress) {
        progressEl.style.display = 'block';
        this.setProgress(progress);
      } else {
        progressEl.style.display = 'none';
      }
    }

    // Mostrar overlay
    this.overlay.classList.remove('hidden');
    this.overlay.classList.add('flex');
    this.isVisible = true;

    // Evitar scroll
    document.body.style.overflow = 'hidden';
  }

  /**
   * Actualiza el texto del loading
   * @param {string} text - Nuevo texto
   * @param {string} subtext - Nuevo subtexto (opcional)
   */
  setText(text, subtext = null) {
    const textEl = document.getElementById('loading-text');
    if (textEl) {textEl.textContent = text;}

    if (subtext !== null) {
      const subtextEl = document.getElementById('loading-subtext');
      if (subtextEl) {
        subtextEl.textContent = subtext;
        subtextEl.style.display = 'block';
      }
    }
  }

  /**
   * Actualiza el progreso (0-100)
   * @param {number} percent - Porcentaje
   */
  setProgress(percent) {
    const percent_ = Math.max(0, Math.min(100, percent));
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
      progressBar.style.width = `${percent_}%`;
    }
  }

  /**
   * Oculta el overlay de loading con transición suave
   * @param {number} delayMs - Delay antes de ocultar (milisegundos)
   */
  hide(delayMs = 0) {
    if (delayMs > 0) {
      setTimeout(() => this.hide(), delayMs);
      return;
    }

    this.overlay.classList.add('hidden');
    this.overlay.classList.remove('flex');
    this.isVisible = false;

    // Restaurar scroll
    document.body.style.overflow = '';

    // Resetear valores
    setTimeout(() => {
      const textEl = document.getElementById('loading-text');
      if (textEl) {textEl.textContent = 'Cargando...';}

      const subtextEl = document.getElementById('loading-subtext');
      if (subtextEl) {subtextEl.style.display = 'none';}

      const progressEl = document.getElementById('loading-progress');
      if (progressEl) {progressEl.style.display = 'none';}
    }, 300);
  }

  /**
   * Muestra el loading por una duración específica
   * @param {string} text - Texto a mostrar
   * @param {number} durationMs - Duración en milisegundos
   * @param {Object} options - Opciones adicionales
   */
  showFor(text, durationMs = 2000, options = {}) {
    this.show(text, options);
    this.hide(durationMs);
  }

  /**
   * Ejecuta una función con loading visible
   * @param {Function} fn - Función a ejecutar (puede ser async)
   * @param {string} text - Texto de loading
   * @param {Object} options - Opciones adicionales
   * @returns {Promise} Resultado de la función
   */
  async withLoader(fn, text = 'Procesando...', options = {}) {
    try {
      this.show(text, options);
      const result = await Promise.resolve(fn());
      this.hide(300);
      return result;
    } catch (error) {
      this.hide();
      throw error;
    }
  }

  /**
   * Ejecuta múltiples funciones con progreso indicado
   * @param {Array<Function>} tasks - Array de funciones
   * @param {string} text - Texto inicial
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Array>} Resultados de las funciones
   */
  async withProgress(tasks, text = 'Procesando...', options = {}) {
    try {
      this.show(text, { ...options, showProgress: true, progress: 0 });

      const results = [];
      const totalTasks = tasks.length;

      for (let i = 0; i < totalTasks; i++) {
        const task = tasks[i];
        const progress = Math.round((i / totalTasks) * 100);
        
        this.setProgress(progress);
        const subtext = `${i + 1} de ${totalTasks}`;
        this.setText(text, subtext);

        const result = await Promise.resolve(task());
        results.push(result);
      }

      this.setProgress(100);
      this.hide(300);
      return results;
    } catch (error) {
      this.hide();
      throw error;
    }
  }

  /**
   * Obtiene el estado del loading
   * @returns {boolean} True si está visible
   */
  isShowing() {
    return this.isVisible;
  }

  /**
   * Destruye el componente
   */
  destroy() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}

// Instancia singleton
export const loading = new LoadingManager();

/**
 * Hook para usar el loading en funciones
 * @param {Function} fn - Función async
 * @param {string} text - Texto a mostrar
 * @returns {Function} Función wrapeada
 */
export function withLoading(fn, text = 'Cargando...') {
  return async (...args) => {
    return loading.withLoader(() => fn(...args), text);
  };
}

export default {
  loading,
  LoadingManager,
  withLoading
};
