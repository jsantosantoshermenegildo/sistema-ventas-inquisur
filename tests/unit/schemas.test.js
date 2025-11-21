// ========================================
// TESTS PARA SCHEMAS
// ========================================

import { describe, it, expect } from 'vitest';
import { SCHEMAS } from '@/rules/schemas.js';

describe('Schemas - Validación', () => {
  describe('Producto', () => {
    it('valida producto correcto', () => {
      const data = {
        codigo: 'P001',
        nombre: 'Laptop Dell',
        precio: 3500,
        stock: 10,
        impuesto: 18,
        activo: true,
      };

      const errors = SCHEMAS.producto.validar(data);
      expect(errors).toHaveLength(0);
    });

    it('rechaza código vacío', () => {
      const data = {
        codigo: '',
        nombre: 'Test',
        precio: 100,
        stock: 5,
      };

      const errors = SCHEMAS.producto.validar(data);
      expect(errors).toContain('Código requerido');
    });

    it('rechaza nombre muy corto', () => {
      const data = {
        codigo: 'P001',
        nombre: 'X',
        precio: 100,
        stock: 5,
      };

      const errors = SCHEMAS.producto.validar(data);
      expect(errors).toContain('Nombre inválido (mín. 2 caracteres)');
    });

    it('rechaza precio negativo', () => {
      const data = {
        codigo: 'P001',
        nombre: 'Test',
        precio: -100,
        stock: 5,
      };

      const errors = SCHEMAS.producto.validar(data);
      expect(errors).toContain('Precio debe ser ≥ 0');
    });

    it('rechaza stock negativo', () => {
      const data = {
        codigo: 'P001',
        nombre: 'Test',
        precio: 100,
        stock: -5,
      };

      const errors = SCHEMAS.producto.validar(data);
      expect(errors).toContain('Stock debe ser ≥ 0');
    });
  });

  describe('Cliente', () => {
    it('valida cliente correcto', () => {
      const data = {
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        telefono: '987654321',
        dniRuc: '12345678',
      };

      const errors = SCHEMAS.cliente.validar(data);
      expect(errors).toHaveLength(0);
    });

    it('acepta email vacío (opcional)', () => {
      const data = {
        nombre: 'Juan Pérez',
        email: '',
        telefono: '987654321',
      };

      const errors = SCHEMAS.cliente.validar(data);
      expect(errors).toHaveLength(0);
    });

    it('rechaza email inválido si se proporciona', () => {
      const data = {
        nombre: 'Juan Pérez',
        email: 'email-invalido',
        telefono: '987654321',
      };

      const errors = SCHEMAS.cliente.validar(data);
      expect(errors).toContain('Email inválido');
    });

    it('rechaza nombre muy corto', () => {
      const data = {
        nombre: 'X',
        email: 'test@example.com',
      };

      const errors = SCHEMAS.cliente.validar(data);
      expect(errors).toContain('Nombre inválido (mín. 2 caracteres)');
    });
  });

  describe('Venta', () => {
    it('valida venta correcta', () => {
      const data = {
        numero: 'V-000001',
        items: [
          { codigo: 'P001', nombre: 'Test', precio: 100, cant: 2, subtotal: 200 }
        ],
        base: 169.49,
        igv: 30.51,
        total: 200,
        estado: 'confirmada',
      };

      const errors = SCHEMAS.venta.validar(data);
      expect(errors).toHaveLength(0);
    });

    it('rechaza venta sin items', () => {
      const data = {
        numero: 'V-000001',
        items: [],
        total: 0,
        estado: 'confirmada',
      };

      const errors = SCHEMAS.venta.validar(data);
      expect(errors).toContain('Debe contener al menos un producto');
    });

    it('rechaza estado inválido', () => {
      const data = {
        numero: 'V-000001',
        items: [{ codigo: 'P001', nombre: 'Test', precio: 100, cant: 1, subtotal: 100 }],
        total: 100,
        estado: 'estado-invalido',
      };

      const errors = SCHEMAS.venta.validar(data);
      expect(errors).toContain('Estado inválido');
    });
  });
});

describe('Schemas - Sanitización', () => {
  describe('Producto', () => {
    it('sanitiza datos correctamente', () => {
      const data = {
        codigo: '  p001  ',
        nombre: '  Laptop Dell  ',
        precio: '3500.50',
        stock: '10',
        impuesto: 18,
      };

      const sanitized = SCHEMAS.producto.sanitizar(data);

      expect(sanitized.codigo).toBe('P001'); // Uppercase y trimmed
      expect(sanitized.nombre).toBe('Laptop Dell'); // Trimmed
      expect(sanitized.precio).toBe(3500.50); // Number
      expect(sanitized.stock).toBe(10); // Number
      expect(sanitized.activo).toBe(true); // Default
    });

    it('limita impuesto a rango 0-100', () => {
      const data1 = { codigo: 'P001', nombre: 'Test', precio: 100, stock: 10, impuesto: -5 };
      const data2 = { codigo: 'P001', nombre: 'Test', precio: 100, stock: 10, impuesto: 150 };

      const sanitized1 = SCHEMAS.producto.sanitizar(data1);
      const sanitized2 = SCHEMAS.producto.sanitizar(data2);

      expect(sanitized1.impuesto).toBe(0);
      expect(sanitized2.impuesto).toBe(100);
    });
  });

  describe('Cliente', () => {
    it('sanitiza email a lowercase', () => {
      const data = {
        nombre: 'Juan',
        email: 'JUAN@EXAMPLE.COM',
      };

      const sanitized = SCHEMAS.cliente.sanitizar(data);
      expect(sanitized.email).toBe('juan@example.com');
    });

    it('limpia teléfono dejando solo dígitos', () => {
      const data = {
        nombre: 'Juan',
        telefono: '+51 (987) 654-321',
      };

      const sanitized = SCHEMAS.cliente.sanitizar(data);
      expect(sanitized.telefono).toBe('51987654321');
    });
  });
});
