// ========================================
// UTILIDADES DE FORMATEO CENTRALIZADAS
// ========================================

import { FORMAT } from '../constants/index.js';

/**
 * Formatea un número como moneda
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Código de moneda (default: PEN)
 * @returns {string} Cantidad formateada
 */
export function formatCurrency(amount, currency = FORMAT.CURRENCY) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat(FORMAT.LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formatea un número con decimales
 * @param {number} value - Valor a formatear
 * @param {number} decimals - Cantidad de decimales
 * @returns {string} Número formateado
 */
export function formatNumber(value, decimals = 2) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat(FORMAT.LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Formatea una fecha
 * @param {Date|string|number} date - Fecha a formatear
 * @param {string} format - Formato: 'short', 'long', 'full'
 * @returns {string} Fecha formateada
 */
export function formatDate(date, format = 'short') {
  if (!date) {return '-';}
  
  let dateObj;
  
  // Manejar Timestamp de Firestore
  if (date?.toDate && typeof date.toDate === 'function') {
    dateObj = date.toDate();
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    dateObj = new Date(date);
  }
  
  if (isNaN(dateObj.getTime())) {return '-';}
  
  const options = FORMAT.DATE_FORMAT[format.toUpperCase()] || FORMAT.DATE_FORMAT.SHORT;
  
  return new Intl.DateTimeFormat(FORMAT.LOCALE, options).format(dateObj);
}

/**
 * Convierte un valor a número limpio
 * @param {any} value - Valor a convertir
 * @returns {number} Número limpio
 */
export function toNumber(value) {
  if (typeof value === 'number') {return value;}
  
  const cleaned = String(value || '')
    .replace(/[^\d.,-]/g, '')
    .replace(',', '.');
  
  return Number(cleaned) || 0;
}

/**
 * Limpia un número de teléfono
 * @param {string} phone - Teléfono a limpiar
 * @returns {string} Solo dígitos
 */
export function cleanPhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

/**
 * Limpia y normaliza un email
 * @param {string} email - Email a limpiar
 * @returns {string} Email normalizado
 */
export function cleanEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/**
 * Formatea un porcentaje
 * @param {number} value - Valor decimal (ej: 0.18 = 18%)
 * @param {number} decimals - Decimales a mostrar
 * @returns {string} Porcentaje formateado
 */
export function formatPercentage(value, decimals = 0) {
  const percent = (Number(value) || 0) * 100;
  return `${percent.toFixed(decimals)}%`;
}

/**
 * Formatea un tamaño de archivo
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} Tamaño formateado (KB, MB, etc)
 */
export function formatFileSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) {return '0 Bytes';}
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  
  return `${size.toFixed(2)} ${sizes[i]}`;
}

/**
 * Trunca un texto con ellipsis
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
export function truncate(text, maxLength = 50) {
  const str = String(text || '');
  if (str.length <= maxLength) {return str;}
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Capitaliza la primera letra
 * @param {string} text - Texto a capitalizar
 * @returns {string} Texto capitalizado
 */
export function capitalize(text) {
  const str = String(text || '');
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Alias para compatibilidad con código existente
export const money = formatCurrency;
