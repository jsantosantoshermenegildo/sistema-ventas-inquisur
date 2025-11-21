/**
 * Tests de Seguridad - Sanitización XSS
 * Validar que la función escapeHtml y otras protejan contra ataques XSS
 */

import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  sanitizeUrl,
  sanitizeEmail,
  sanitizePhone,
  sanitizeName,
  sanitizeNumber,
  createSafeHTML,
  sanitizeUserInput,
  sanitizeArray
} from '../../assets/js/utils/sanitize.js';

describe('Protección XSS - sanitize.js', () => {
  describe('escapeHtml', () => {
    it('debe escapar etiquetas HTML', () => {
      const malicious = '<img src=x onerror="alert(1)">';
      const result = escapeHtml(malicious);
      expect(result).not.toContain('<img');
      expect(result).toContain('&lt;');
    });

    it('debe escapar scripts inline', () => {
      const script = '<script>alert("xss")</script>';
      const result = escapeHtml(script);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script');
    });

    it('debe manejar null y undefined', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });

    it('debe convertir números a string escapado', () => {
      const num = 12345;
      const result = escapeHtml(num);
      expect(result).toBe('12345');
    });

    it('debe escapar atributos de evento', () => {
      const html = '<div onclick="alert(1)">Click</div>';
      const result = escapeHtml(html);
      expect(result).toContain('&lt;div');
      expect(result).toContain('onclick');
    });
  });

  describe('sanitizeUrl', () => {
    it('debe permitir URLs https válidas', () => {
      const url = 'https://example.com/page';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('debe permitir URLs http válidas', () => {
      const url = 'http://example.com';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('debe rechazar javascript: URIs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
      expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('');
    });

    it('debe rechazar data: URIs', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('debe permitir mailto:', () => {
      const url = 'mailto:user@example.com';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('debe permitir tel:', () => {
      const url = 'tel:+1234567890';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('debe manejar null y undefined', () => {
      expect(sanitizeUrl(null)).toBe('');
      expect(sanitizeUrl(undefined)).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    it('debe validar emails correctos', () => {
      const email = 'user@example.com';
      expect(sanitizeEmail(email)).toBe(email);
    });

    it('debe rechazar emails sin @', () => {
      expect(sanitizeEmail('userexample.com')).toBe('');
    });

    it('debe rechazar emails sin dominio', () => {
      expect(sanitizeEmail('user@')).toBe('');
    });

    it('debe rechazar emails muy largos', () => {
      const long = 'a'.repeat(300) + '@example.com';
      expect(sanitizeEmail(long)).toBe('');
    });

    it('debe normalizar a minúsculas', () => {
      const email = 'User@EXAMPLE.COM';
      expect(sanitizeEmail(email)).toBe('user@example.com');
    });
  });

  describe('sanitizePhone', () => {
    it('debe preservar dígitos', () => {
      expect(sanitizePhone('123-456-7890')).toContain('1234567890');
    });

    it('debe permitir +', () => {
      const phone = '+1-234-567-8900';
      expect(sanitizePhone(phone)).toContain('+');
    });

    it('debe eliminar caracteres inválidos', () => {
      const phone = '+1-234-567-8900<script>';
      const result = sanitizePhone(phone);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });
  });

  describe('sanitizeName', () => {
    it('debe limitar longitud máxima', () => {
      const long = 'a'.repeat(300);
      const result = sanitizeName(long, 200);
      expect(result.length).toBeLessThanOrEqual(200);
    });

    it('debe escapar HTML en nombres', () => {
      const name = 'John<script>alert(1)</script>';
      const result = sanitizeName(name);
      expect(result).not.toContain('<script>');
    });

    it('debe permitir acentos', () => {
      const name = 'José García';
      const result = sanitizeName(name);
      expect(result).toContain('José');
    });
  });

  describe('sanitizeNumber', () => {
    it('debe validar números enteros', () => {
      expect(sanitizeNumber(42)).toBe(42);
      expect(sanitizeNumber('42')).toBe(42);
    });

    it('debe validar números decimales', () => {
      expect(sanitizeNumber(42.5)).toBe(42.5);
      expect(sanitizeNumber('42.5')).toBe(42.5);
    });

    it('debe rechazar NaN', () => {
      expect(() => sanitizeNumber('abc')).toThrow();
    });

    it('debe validar rango mínimo', () => {
      expect(() => sanitizeNumber(5, 10, 20)).toThrow();
    });

    it('debe validar rango máximo', () => {
      expect(() => sanitizeNumber(25, 10, 20)).toThrow();
    });
  });

  describe('createSafeHTML', () => {
    it('debe escapar valores en template', () => {
      const template = '${nombre} - ${email}';
      const data = {
        nombre: '<img src=x>',
        email: 'user@example.com'
      };
      const result = createSafeHTML(template, data);
      expect(result).not.toContain('<img');
      expect(result).toContain('&lt;img');
      expect(result).toContain('user@example.com');
    });

    it('debe manejar múltiples placeholders', () => {
      const template = '${a} | ${b} | ${a}';
      const data = { a: '1', b: '2' };
      const result = createSafeHTML(template, data);
      expect(result).toBe('1 | 2 | 1');
    });
  });

  describe('sanitizeUserInput', () => {
    it('debe limitar longitud de entrada', () => {
      const input = 'a'.repeat(600);
      const result = sanitizeUserInput(input, { maxLength: 500 });
      expect(result.length).toBeLessThanOrEqual(500);
    });

    it('debe escapar HTML por defecto', () => {
      const input = '<script>alert(1)</script>';
      const result = sanitizeUserInput(input);
      expect(result).not.toContain('<script>');
    });

    it('debe permitir números si allowNumbers=true', () => {
      const input = 'Test123';
      const result = sanitizeUserInput(input, { allowNumbers: true });
      expect(result).toContain('123');
    });

    it('debe eliminar números si allowNumbers=false', () => {
      const input = 'Test123';
      const result = sanitizeUserInput(input, { allowNumbers: false });
      expect(result).not.toContain('1');
    });
  });

  describe('sanitizeArray', () => {
    it('debe sanitizar strings en array', () => {
      const items = [
        { nombre: '<img src=x>', precio: 100 },
        { nombre: 'Producto2', precio: 50 }
      ];
      const result = sanitizeArray(items);
      expect(result[0].nombre).not.toContain('<img');
      expect(result[0].precio).toBe(100);
    });

    it('debe permitir seleccionar campos específicos', () => {
      const items = [
        { nombre: '<img src=x>', precio: 100, secreto: 'data' }
      ];
      const result = sanitizeArray(items, ['nombre', 'precio']);
      expect(result[0].nombre).toBeDefined();
      expect(result[0].precio).toBeDefined();
      expect(result[0].secreto).toBeUndefined();
    });

    it('debe manejar arrays vacíos', () => {
      const result = sanitizeArray([]);
      expect(result).toEqual([]);
    });

    it('debe manejar no-arrays', () => {
      const result = sanitizeArray('not-array');
      expect(result).toEqual([]);
    });
  });
});

describe('Validación de respuestas SUNAT', () => {
  it('debe sanitizar nombre de respuesta SUNAT', () => {
    const mockResponse = {
      nombre: '<script>alert("xss")</script>EMPRESA',
      email: 'valid@email.com'
    };
    
    const nombre = escapeHtml(mockResponse.nombre).slice(0, 200);
    expect(nombre).not.toContain('<script>');
    expect(nombre.length).toBeLessThanOrEqual(200);
  });

  it('debe validar email de SUNAT', () => {
    const mockResponse = {
      nombre: 'Empresa',
      email: 'invalid<script>email'
    };
    
    const result = sanitizeEmail(mockResponse.email);
    expect(result).toBe('');
  });
});

describe('Inyección en reportes', () => {
  it('debe prevenir inyección en tabla de ventas', () => {
    const ventas = [
      {
        clienteNombre: '<img src=x onerror="alert(1)">',
        referencia: 'REF-001'
      }
    ];
    
    const html = ventas.map(v => `
      <td>${escapeHtml(v.clienteNombre)}</td>
      <td>${escapeHtml(v.referencia)}</td>
    `).join('');
    
    expect(html).not.toContain('onerror');
    expect(html).toContain('&lt;img');
  });

  it('debe prevenir inyección en gráficos de reportes', () => {
    const reportData = {
      title: '"><script>alert(1)</script><"',
      value: 100
    };
    
    const safeTitle = escapeHtml(reportData.title);
    expect(safeTitle).not.toContain('<script>');
  });
});
