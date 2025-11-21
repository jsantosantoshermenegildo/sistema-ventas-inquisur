/**
 * Sistema mejorado de alertas y notificaciones con SweetAlert2 y toast nativo
 */

// Posiciones permitidas para toasts
const TOAST_POSITIONS = {
  TOP_RIGHT: 'top-right',
  TOP_LEFT: 'top-left',
  TOP_CENTER: 'top-center',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_CENTER: 'bottom-center'
};

// Base de Toast con SweetAlert2
export const Toast = Swal.mixin({
  toast: true,
  position: TOAST_POSITIONS.TOP_RIGHT,
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

/**
 * Crea un toast con posición personalizada
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {Object} options - Opciones adicionales
 */
function createToast(message, type = 'info', options = {}) {
  const {
    position = TOAST_POSITIONS.TOP_RIGHT,
    duration = 3000,
    showIcon = true
  } = options;

  const toastConfig = Swal.mixin({
    toast: true,
    position: position,
    showConfirmButton: false,
    timer: duration,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  return toastConfig.fire({
    icon: showIcon ? type : undefined,
    title: message,
  });
}

/**
 * Toast de éxito con opciones personalizadas
 */
export const toastSuccess = (message, options = {}) => {
  return createToast(message, 'success', options);
};

/**
 * Toast de error con opciones personalizadas
 */
export const toastError = (message, options = {}) => {
  return createToast(message, 'error', options);
};

/**
 * Toast de información con opciones personalizadas
 */
export const toastInfo = (message, options = {}) => {
  return createToast(message, 'info', options);
};

/**
 * Toast de advertencia con opciones personalizadas
 */
export const toastWarning = (message, options = {}) => {
  return createToast(message, 'warning', options);
};

/**
 * Alerta bloqueante de error
 */
export const alertError = (message, title = "Error") => {
  return Swal.fire({
    icon: "error",
    title: title,
    text: message,
    confirmButtonColor: "#d33",
    backdrop: 'rgba(0, 0, 0, 0.4)',
  });
};

/**
 * Alerta bloqueante de éxito
 */
export const alertSuccess = (message, title = "¡Éxito!") => {
  return Swal.fire({
    icon: "success",
    title: title,
    text: message,
    confirmButtonColor: "#10b981",
    backdrop: 'rgba(0, 0, 0, 0.4)',
  });
};

/**
 * Alerta bloqueante de información
 */
export const alertInfo = (message, title = "Información") => {
  return Swal.fire({
    icon: "info",
    title: title,
    text: message,
    confirmButtonColor: "#3b82f6",
    backdrop: 'rgba(0, 0, 0, 0.4)',
  });
};

/**
 * Alerta de confirmación
 */
export const alertConfirm = async (title, text, options = {}) => {
  const {
    confirmText = "Sí, continuar",
    cancelText = "Cancelar",
    confirmColor = "#10b981",
    cancelColor = "#d33"
  } = options;

  return await Swal.fire({
    title: title,
    text: text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: confirmColor,
    cancelButtonColor: cancelColor,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    backdrop: 'rgba(0, 0, 0, 0.4)',
  });
};

/**
 * Alerta de carga (bloqueante sin botón)
 */
export const alertLoading = (message = "Procesando...") => {
  return Swal.fire({
    title: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: async () => {
      await Swal.showLoading();
    }
  });
};

/**
 * Cerrar alerta de carga
 */
export const closeLoading = () => {
  Swal.close();
};

/**
 * Sistema de notificaciones nativas mejorado (alternativa a SweetAlert2)
 */
export class NativeNotificationSystem {
  constructor() {
    this.container = this.createContainer();
  }

  createContainer() {
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'fixed z-50 pointer-events-none';
      document.body.appendChild(container);
    }
    return container;
  }

  show(message, type = 'info', options = {}) {
    const {
      position = TOAST_POSITIONS.TOP_RIGHT,
      duration = 3000,
      icon = this.getIcon(type)
    } = options;

    const notification = document.createElement('div');
    notification.className = `
      animate-slideUp p-4 rounded-lg shadow-lg mb-2 flex gap-3 items-center
      bg-white dark:bg-slate-800 border-l-4
      ${type === 'success' ? 'border-green-500' : ''}
      ${type === 'error' ? 'border-red-500' : ''}
      ${type === 'warning' ? 'border-yellow-500' : ''}
      ${type === 'info' ? 'border-blue-500' : ''}
    `;
    notification.innerHTML = `
      <span class="text-2xl">${icon}</span>
      <div>
        <p class="text-gray-800 dark:text-gray-200">${message}</p>
      </div>
    `;

    // Aplicar posición
    if (!this.container.style.position) {
      const [vertical, horizontal] = position.split('-');
      this.container.style[vertical] = '1rem';
      this.container.style[horizontal] = '1rem';
    }

    this.container.appendChild(notification);

    if (duration > 0) {
      setTimeout(() => {
        notification.classList.add('animate-slideDown');
        setTimeout(() => notification.remove(), 300);
      }, duration);
    }

    return notification;
  }

  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  }
}

// Instancia singleton
export const nativeNotifications = new NativeNotificationSystem();

export default {
  Toast,
  toastSuccess,
  toastError,
  toastInfo,
  toastWarning,
  alertError,
  alertSuccess,
  alertInfo,
  alertConfirm,
  alertLoading,
  closeLoading,
  NativeNotificationSystem,
  nativeNotifications,
  TOAST_POSITIONS
};
