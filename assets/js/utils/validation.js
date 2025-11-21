// assets/js/utils/validation.js — Validación mejorada de formularios
export const VALIDATION_RULES = {
  email: (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return { valid: regex.test(value), error: 'Email inválido' };
  },
  phone: (value) => {
    const regex = /^[0-9]{7,15}$/;
    return { valid: regex.test(value), error: 'Teléfono debe tener 7-15 dígitos' };
  },
  ruc: (value) => {
    const regex = /^[0-9]{11}$/;
    return { valid: regex.test(value), error: 'RUC debe tener 11 dígitos' };
  },
  dni: (value) => {
    const regex = /^[0-9]{8}$/;
    return { valid: regex.test(value), error: 'DNI debe tener 8 dígitos' };
  },
  number: (value, min = 0, max = Infinity) => {
    const num = Number(value);
    const valid = !isNaN(num) && num >= min && num <= max;
    return { 
      valid, 
      error: valid ? '' : `Número debe estar entre ${min} y ${max}` 
    };
  },
  required: (value) => {
    const valid = value && String(value).trim().length > 0;
    return { valid, error: 'Este campo es requerido' };
  },
  minLength: (value, min = 1) => {
    const valid = String(value).length >= min;
    return { valid, error: `Mínimo ${min} caracteres` };
  },
  maxLength: (value, max = 100) => {
    const valid = String(value).length <= max;
    return { valid, error: `Máximo ${max} caracteres` };
  },
  date: (value) => {
    const date = new Date(value);
    const valid = date instanceof Date && !isNaN(date);
    return { valid, error: 'Fecha inválida' };
  },
  futureDate: (value) => {
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const valid = date > today;
    return { valid, error: 'La fecha debe ser futura' };
  },
  url: (value) => {
    try {
      new URL(value);
      return { valid: true, error: '' };
    } catch {
      return { valid: false, error: 'URL inválida' };
    }
  }
};

export function validateField(value, rules = []) {
  for (const rule of rules) {
    const result = rule(value);
    if (!result.valid) {return result;}
  }
  return { valid: true, error: '' };
}

export function validateForm(data, schema = {}) {
  const errors = {};
  
  for (const [field, rules] of Object.entries(schema)) {
    if (!Array.isArray(rules)) {continue;}
    
    const value = data[field];
    const result = validateField(value, rules);
    
    if (!result.valid) {
      errors[field] = result.error;
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function sanitizeInput(value) {
  if (typeof value !== 'string') {return value;}
  
  return value
    .replace(/[<>]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&#x27;')
    .replace(/"/g, '&quot;')
    .trim();
}

export function createFormValidator(schema = {}) {
  return (formData) => {
    const sanitized = {};
    const errors = {};

    for (const [field, value] of Object.entries(formData)) {
      sanitized[field] = sanitizeInput(value);
    }

    const rules = schema[field];
    if (rules) {
      const result = validateField(sanitized[field], rules);
      if (!result.valid) {
        errors[field] = result.error;
      }
    }

    return { sanitized, errors, valid: Object.keys(errors).length === 0 };
  };
}
