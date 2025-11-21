// ========================================
// TESTS PARA FORMATTERS
// ========================================

import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  toNumber,
  cleanPhone,
  cleanEmail,
  formatPercentage,
  truncate,
  capitalize,
} from '@utils/formatters.js';

describe('Formatters', () => {
  describe('formatCurrency', () => {
    it('formatea números como moneda peruana', () => {
      expect(formatCurrency(1500)).toContain('1,500');
      expect(formatCurrency(1500)).toContain('S/');
    });

    it('maneja ceros correctamente', () => {
      expect(formatCurrency(0)).toContain('0.00');
    });

    it('maneja valores negativos', () => {
      const result = formatCurrency(-100);
      expect(result).toContain('100');
    });

    it('maneja valores nulos', () => {
      expect(formatCurrency(null)).toContain('0.00');
      expect(formatCurrency(undefined)).toContain('0.00');
    });
  });

  describe('formatNumber', () => {
    it('formatea números con decimales', () => {
      expect(formatNumber(1234.5678, 2)).toBe('1,234.57');
    });

    it('respeta cantidad de decimales', () => {
      expect(formatNumber(100, 0)).toBe('100');
      expect(formatNumber(100.123, 1)).toBe('100.1');
    });
  });

  describe('toNumber', () => {
    it('convierte strings a números', () => {
      expect(toNumber('123')).toBe(123);
      expect(toNumber('123.45')).toBe(123.45);
    });

    it('limpia caracteres no numéricos', () => {
      expect(toNumber('S/ 1,500.00')).toBe(1500);
    });

    it('maneja valores vacíos', () => {
      expect(toNumber('')).toBe(0);
      expect(toNumber(null)).toBe(0);
    });

    it('ya maneja números directamente', () => {
      expect(toNumber(123)).toBe(123);
    });
  });

  describe('cleanPhone', () => {
    it('elimina caracteres no numéricos', () => {
      expect(cleanPhone('+51 987-654-321')).toBe('51987654321');
      expect(cleanPhone('(01) 234-5678')).toBe('012345678');
    });

    it('maneja valores vacíos', () => {
      expect(cleanPhone('')).toBe('');
      expect(cleanPhone(null)).toBe('');
    });
  });

  describe('cleanEmail', () => {
    it('normaliza emails', () => {
      expect(cleanEmail('  USER@EXAMPLE.COM  ')).toBe('user@example.com');
    });

    it('maneja valores vacíos', () => {
      expect(cleanEmail('')).toBe('');
      expect(cleanEmail(null)).toBe('');
    });
  });

  describe('formatPercentage', () => {
    it('convierte decimales a porcentaje', () => {
      expect(formatPercentage(0.18)).toBe('18%');
      expect(formatPercentage(0.5)).toBe('50%');
    });

    it('respeta decimales especificados', () => {
      expect(formatPercentage(0.1234, 2)).toBe('12.34%');
    });
  });

  describe('truncate', () => {
    it('trunca textos largos', () => {
      const long = 'Este es un texto muy largo que debe ser truncado';
      expect(truncate(long, 20)).toBe('Este es un texto ...');
    });

    it('no trunca textos cortos', () => {
      expect(truncate('Corto', 20)).toBe('Corto');
    });
  });

  describe('capitalize', () => {
    it('capitaliza primera letra', () => {
      expect(capitalize('hola')).toBe('Hola');
      expect(capitalize('MUNDO')).toBe('Mundo');
    });

    it('maneja strings vacíos', () => {
      expect(capitalize('')).toBe('');
    });
  });
});
