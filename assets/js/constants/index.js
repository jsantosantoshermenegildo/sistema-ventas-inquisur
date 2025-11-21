// ========================================
// CONSTANTES GLOBALES DEL SISTEMA
// ========================================

// IMPUESTOS
export const TAX = {
  IGV_RATE: 0.18,
  IGV_INCLUIDO: true,
};

// ESTADOS DE VENTAS
export const ESTADOS_VENTA = {
  BORRADOR: 'borrador',
  CONFIRMADA: 'confirmada',
  PAGADA: 'pagada',
  CANCELADA: 'cancelada',
  REGISTRADA: 'registrada',
};

// ESTADOS DE PROFORMAS
export const ESTADOS_PROFORMA = {
  BORRADOR: 'borrador',
  CONFIRMADA: 'confirmada',
  CONVERTIDA: 'convertida',
  CERRADA: 'cerrada',
};

// ROLES DE USUARIO
export const ROLES = {
  ADMIN: 'admin',
  SELLER: 'seller',
  VIEWER: 'viewer',
};

// VALIDACIÓN
export const VALIDATION = {
  MIN_STOCK: 0,
  MIN_PRECIO: 0,
  MIN_NOMBRE_LENGTH: 2,
  DNI_LENGTH: 8,
  RUC_LENGTH: 11,
  MIN_PHONE_LENGTH: 6,
  MAX_PHONE_LENGTH: 15,
};

// PAGINACIÓN
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
};

// CACHE
export const CACHE = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutos
  VENTAS_TTL: 3 * 60 * 1000,   // 3 minutos
  REPORTES_TTL: 10 * 60 * 1000, // 10 minutos
};

// COLECCIONES FIRESTORE
export const COLLECTIONS = {
  PRODUCTOS: 'productos',
  CLIENTES: 'clientes',
  VENTAS: 'ventas',
  PROFORMAS: 'proformas',
  USUARIOS: 'usuarios',
  AUDIT: 'audit',
  COUNTERS: 'counters',
};

// ACCIONES DE AUDITORÍA
export const AUDIT_ACTIONS = {
  // Productos
  PRODUCTO_CREATE: 'producto.create',
  PRODUCTO_UPDATE: 'producto.update',
  PRODUCTO_DELETE: 'producto.delete',
  PRODUCTO_STOCK_REDUCTION: 'producto.stock-reduction',
  
  // Clientes
  CLIENTE_CREATE: 'cliente.create',
  CLIENTE_UPDATE: 'cliente.update',
  CLIENTE_DELETE: 'cliente.delete',
  
  // Ventas
  VENTA_CREATE: 'venta.create',
  VENTA_UPDATE: 'venta.update',
  VENTA_DELETE: 'venta.delete',
  
  // Proformas
  PROFORMA_CREATE: 'proforma.create',
  PROFORMA_UPDATE: 'proforma.update',
  PROFORMA_CLOSE: 'proforma.close',
  
  // Sistema
  ERROR: 'error',
  LOGIN: 'login',
  LOGOUT: 'logout',
};

// MENSAJES DE ERROR AMIGABLES
export const ERROR_MESSAGES = {
  'permission-denied': 'No tienes permisos para realizar esta acción',
  'not-found': 'El recurso solicitado no fue encontrado',
  'network-request-failed': 'Error de conexión. Verifica tu internet',
  'unauthenticated': 'Debes iniciar sesión para continuar',
  'invalid-argument': 'Los datos proporcionados son inválidos',
  'already-exists': 'El recurso ya existe',
  'resource-exhausted': 'Se superó el límite de operaciones',
};

// CONFIGURACIÓN DE FORMATO
export const FORMAT = {
  CURRENCY: 'PEN',
  LOCALE: 'es-PE',
  DATE_FORMAT: {
    SHORT: { year: 'numeric', month: '2-digit', day: '2-digit' },
    LONG: { year: 'numeric', month: 'long', day: 'numeric' },
    FULL: { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    },
  },
};
