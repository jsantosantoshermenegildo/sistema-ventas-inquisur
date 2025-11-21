// Utilidades de alertas y notificaciones modernas con SweetAlert2
export const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

// Solo Toast - Sin bloquear pantalla
export const toastSuccess = (message) => {
  Toast.fire({
    icon: "success",
    title: message,
  });
};

export const toastError = (message) => {
  Toast.fire({
    icon: "error",
    title: message,
  });
};

export const toastInfo = (message) => {
  Toast.fire({
    icon: "info",
    title: message,
  });
};

export const toastWarning = (message) => {
  Toast.fire({
    icon: "warning",
    title: message,
  });
};

// Alertas bloqueantes con SweetAlert2
export const alertError = (message) => {
  return Swal.fire({
    icon: "error",
    title: "Error",
    text: message,
    confirmButtonColor: "#d33",
  });
};

export const alertSuccess = (message) => {
  return Swal.fire({
    icon: "success",
    title: "¡Éxito!",
    text: message,
    confirmButtonColor: "#10b981",
  });
};

export const alertInfo = (message) => {
  return Swal.fire({
    icon: "info",
    title: "Información",
    text: message,
    confirmButtonColor: "#3b82f6",
  });
};

export const alertConfirm = async (title, text) => {
  return await Swal.fire({
    title: title,
    text: text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#10b981",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sí, continuar",
    cancelButtonText: "Cancelar",
  });
};
