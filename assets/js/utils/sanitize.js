/**
 * Sanitización y prevención de ataques XSS
 * Proporciona funciones para escapar y sanitizar contenido HTML
 */

/**
 * Escapa caracteres HTML especiales para prevenir XSS
 * @param {string|number} text - Texto a escapar
 * @returns {string} Texto escapado y seguro
 * @example
 * escapeHtml('<img src=x onerror=alert(1)>')
 * // Retorna: '&lt;img src=x onerror=alert(1)&gt;'
 */
export function escapeHtml(text) {
  if (!text) return '';
  
  // Convertir a string si es number
  const str = String(text).trim();
  
  // Usar método seguro con textContent
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Sanitiza URLs para prevenir javascript: y data: URIs maliciosas
 * @param {string} url - URL a validar
 * @returns {string} URL sanitizada o string vacío si es maliciosa
 * @example
 * sanitizeUrl('javascript:alert(1)') // Retorna: ''
 * sanitizeUrl('https://example.com') // Retorna: 'https://example.com'
 */
export function sanitizeUrl(url) {
  if (!url) return '';
  
  const trimmed = String(url).trim().toLowerCase();
  
  // Whitelist de protocolos seguros
  const allowedProtocols = ['http://', 'https://', 'mailto:', 'tel:'];
  const isAllowed = allowedProtocols.some(proto => trimmed.startsWith(proto));
  
  return isAllowed ? String(url).trim() : '';
}

/**
 * Sanitiza email con validación básica
 * @param {string} email - Email a validar
 * @returns {string} Email sanitizado o string vacío si es inválido
 */
export function sanitizeEmail(email) {
  if (!email) return '';
  
  const trimmed = String(email).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Validar longitud máxima
  if (trimmed.length > 254) return '';
  
  return emailRegex.test(trimmed) ? trimmed : '';
}

/**
 * Sanitiza números de teléfono (solo dígitos y caracteres permitidos)
 * @param {string} phone - Teléfono a sanitizar
 * @returns {string} Teléfono sanitizado
 */
export function sanitizePhone(phone) {
  if (!phone) return '';
  
  // Permitir solo dígitos, +, -, espacio, paréntesis
  return String(phone).replace(/[^\d+\-() ]/g, '').trim();
}

/**
 * Sanitiza nombres de usuarios y campos de texto
 * Limita caracteres especiales potencialmente peligrosos
 * @param {string} text - Texto a sanitizar
 * @param {number} maxLength - Longitud máxima permitida
 * @returns {string} Texto sanitizado
 */
export function sanitizeName(text, maxLength = 200) {
  if (!text) return '';
  
  const str = String(text).trim();
  
  // Limitar longitud
  let sanitized = str.slice(0, maxLength);
  
  // Escapar HTML
  sanitized = escapeHtml(sanitized);
  
  return sanitized;
}

/**
 * Sanitiza números con validación de rango
 * @param {number|string} value - Valor a validar
 * @param {number} min - Valor mínimo permitido
 * @param {number} max - Valor máximo permitido
 * @returns {number} Número sanitizado
 * @throws {Error} Si no es un número válido
 */
export function sanitizeNumber(value, min = -Infinity, max = Infinity) {
  const num = Number(value);
  
  if (isNaN(num)) {
    throw new Error('Valor no es un número válido');
  }
  
  if (num < min || num > max) {
    throw new Error(`Número fuera del rango permitido [${min}, ${max}]`);
  }
  
  return num;
}

/**
 * Sanitiza arrays de objetos para renderizado seguro
 * @param {Array} items - Array de objetos
 * @param {Array} fields - Campos a preservar
 * @returns {Array} Array sanitizado
 */
export function sanitizeArray(items, fields = []) {
  if (!Array.isArray(items)) return [];
  
  return items.map(item => {
    if (typeof item !== 'object' || item === null) return {};
    
    const sanitized = {};
    
    // Si no hay campos específicos, sanitizar todos
    if (fields.length === 0) {
      for (const [key, value] of Object.entries(item)) {
        if (typeof value === 'string') {
          sanitized[key] = escapeHtml(value);
        } else {
          sanitized[key] = value;
        }
      }
    } else {
      // Solo incluir campos permitidos
      for (const field of fields) {
        const value = item[field];
        if (typeof value === 'string') {
          sanitized[field] = escapeHtml(value);
        } else {
          sanitized[field] = value;
        }
      }
    }
    
    return sanitized;
  });
}

/**
 * Crea un HTML seguro con contenido sanitizado
 * @param {string} template - Template HTML con placeholders: ${key}
 * @param {Object} data - Datos a interpolar
 * @returns {string} HTML sanitizado
 * @example
 * createSafeHTML('${nombre} - ${email}', { nombre: '<img src=x>', email: 'user@email.com' })
 * // Retorna: '&lt;img src=x&gt; - user@email.com'
 */
export function createSafeHTML(template, data = {}) {
  let result = template;
  
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
    const sanitized = typeof value === 'string' ? escapeHtml(value) : String(value);
    result = result.replace(regex, sanitized);
  }
  
  return result;
}

/**
 * Limpia y valida entrada de usuario antes de procesarla
 * @param {string} input - Entrada del usuario
 * @param {Object} options - Opciones de validación
 * @returns {string} Entrada sanitizada
 */
export function sanitizeUserInput(input, options = {}) {
  const {
    maxLength = 500,
    allowSpecialChars = false,
    allowNumbers = true,
    allowSpaces = true
  } = options;
  
  if (!input) return '';
  
  let sanitized = String(input).trim();
  
  // Limitar longitud
  sanitized = sanitized.slice(0, maxLength);
  
  // Escapar HTML
  sanitized = escapeHtml(sanitized);
  
  // Limpieza adicional si es necesario
  if (!allowSpecialChars) {
    sanitized = sanitized.replace(/[^a-z0-9áéíóúñ]/gi, allowSpaces ? ' ' : '');
  }
  
  if (!allowNumbers) {
    sanitized = sanitized.replace(/\d/g, '');
  }
  
  return sanitized;
}

export default {
  escapeHtml,
  sanitizeUrl,
  sanitizeEmail,
  sanitizePhone,
  sanitizeName,
  sanitizeNumber,
  sanitizeArray,
  createSafeHTML,
  sanitizeUserInput
};
