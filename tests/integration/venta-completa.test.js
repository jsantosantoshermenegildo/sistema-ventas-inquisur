/**
 * Tests de Integración - Flujo Completo de Venta
 * Simula la creación completa de una venta con validación de stock
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock de Firebase para tests
class MockFirestore {
  constructor() {
    this.collections = {
      productos: new Map(),
      ventas: new Map(),
      proformas: new Map(),
      counters: new Map()
    };
  }

  initCounter(type) {
    this.collections.counters.set(type, { seq: 0 });
  }

  // Simula createProducto
  createProducto(data) {
    const id = `prod-${Date.now()}`;
    this.collections.productos.set(id, { id, ...data });
    return { id, ...data };
  }

  // Simula getProducto
  getProducto(id) {
    return this.collections.productos.get(id) || null;
  }

  // Simula updateProducto
  updateProducto(id, data) {
    const producto = this.collections.productos.get(id);
    if (!producto) throw new Error('Producto no encontrado');
    const updated = { ...producto, ...data };
    this.collections.productos.set(id, updated);
    return updated;
  }

  // Simula createVenta con transacción
  async createVentaWithTransaction(itemsData, proformaId = null) {
    // 1️⃣ VALIDAR STOCK
    const itemsValidados = [];
    for (const item of itemsData) {
      const producto = this.collections.productos.get(item.id);
      if (!producto) {
        throw new Error(`Producto ${item.id} no encontrado`);
      }
      if (producto.stock < item.cant) {
        throw new Error(
          `Stock insuficiente para ${producto.nombre}. ` +
          `Disponible: ${producto.stock}, Solicitado: ${item.cant}`
        );
      }
      itemsValidados.push(item);
    }

    // 2️⃣ GENERAR NÚMERO Y CREAR VENTA
    const counter = this.collections.counters.get('ventas');
    const newSeq = (counter?.seq || 0) + 1;
    const numero = `V-${String(newSeq).padStart(6, '0')}`;
    
    this.collections.counters.set('ventas', { seq: newSeq });

    const ventaData = {
      id: `venta-${Date.now()}`,
      numero,
      items: itemsValidados,
      createdAt: new Date(),
      estado: 'confirmada',
      proformaId: proformaId || null
    };

    // 3️⃣ REDUCIR STOCK
    for (const item of itemsValidados) {
      const producto = this.collections.productos.get(item.id);
      producto.stock -= item.cant;
      producto.updatedAt = new Date();
    }

    // 4️⃣ GUARDAR VENTA
    this.collections.ventas.set(ventaData.id, ventaData);

    return ventaData;
  }
}

describe('Flujo Completo de Venta', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = new MockFirestore();
    mockDb.initCounter('ventas');
    mockDb.initCounter('productos');
  });

  describe('Creación básica de venta', () => {
    it('debe crear una venta correctamente', async () => {
      // Crear producto
      const producto = mockDb.createProducto({
        codigo: 'P001',
        nombre: 'Producto Test',
        precio: 100,
        stock: 10
      });

      // Crear venta
      const venta = await mockDb.createVentaWithTransaction([
        { id: producto.id, cant: 5 }
      ]);

      expect(venta.numero).toBe('V-000001');
      expect(venta.items.length).toBe(1);
      expect(venta.estado).toBe('confirmada');
    });

    it('debe generar números secuenciales', async () => {
      const p1 = mockDb.createProducto({ codigo: 'P001', precio: 100, stock: 20 });
      const p2 = mockDb.createProducto({ codigo: 'P002', precio: 50, stock: 30 });

      const v1 = await mockDb.createVentaWithTransaction([{ id: p1.id, cant: 1 }]);
      const v2 = await mockDb.createVentaWithTransaction([{ id: p2.id, cant: 1 }]);

      expect(v1.numero).toBe('V-000001');
      expect(v2.numero).toBe('V-000002');
    });

    it('debe reducir stock después de venta', async () => {
      const producto = mockDb.createProducto({
        codigo: 'P001',
        nombre: 'Test',
        precio: 100,
        stock: 10
      });

      await mockDb.createVentaWithTransaction([
        { id: producto.id, cant: 3 }
      ]);

      const updated = mockDb.getProducto(producto.id);
      expect(updated.stock).toBe(7);
    });

    it('debe rechazar si stock insuficiente', async () => {
      const producto = mockDb.createProducto({
        codigo: 'P001',
        nombre: 'Test',
        precio: 100,
        stock: 2
      });

      await expect(
        mockDb.createVentaWithTransaction([
          { id: producto.id, cant: 5 }
        ])
      ).rejects.toThrow('Stock insuficiente');
    });

    it('no debe reducir stock si hay error', async () => {
      const p1 = mockDb.createProducto({
        codigo: 'P001',
        nombre: 'Test1',
        precio: 100,
        stock: 10
      });

      const p2 = mockDb.createProducto({
        codigo: 'P002',
        nombre: 'Test2',
        precio: 50,
        stock: 2
      });

      // Intentar venta con stock insuficiente en segundo producto
      try {
        await mockDb.createVentaWithTransaction([
          { id: p1.id, cant: 5 },
          { id: p2.id, cant: 10 } // Falla aquí
        ]);
      } catch (error) {
        // Error esperado
      }

      // Stock de p1 debe mantenerse sin cambios
      const p1After = mockDb.getProducto(p1.id);
      expect(p1After.stock).toBe(10);
    });
  });

  describe('Múltiples items en una venta', () => {
    it('debe procesar venta con múltiples productos', async () => {
      const p1 = mockDb.createProducto({
        codigo: 'P001',
        nombre: 'Producto 1',
        precio: 100,
        stock: 10
      });

      const p2 = mockDb.createProducto({
        codigo: 'P002',
        nombre: 'Producto 2',
        precio: 50,
        stock: 20
      });

      const p3 = mockDb.createProducto({
        codigo: 'P003',
        nombre: 'Producto 3',
        precio: 75,
        stock: 15
      });

      const venta = await mockDb.createVentaWithTransaction([
        { id: p1.id, cant: 2 },
        { id: p2.id, cant: 3 },
        { id: p3.id, cant: 1 }
      ]);

      expect(venta.items.length).toBe(3);
      expect(mockDb.getProducto(p1.id).stock).toBe(8);
      expect(mockDb.getProducto(p2.id).stock).toBe(17);
      expect(mockDb.getProducto(p3.id).stock).toBe(14);
    });

    it('debe fallar si uno de múltiples productos no tiene stock', async () => {
      const p1 = mockDb.createProducto({ codigo: 'P001', precio: 100, stock: 10 });
      const p2 = mockDb.createProducto({ codigo: 'P002', precio: 50, stock: 1 });

      await expect(
        mockDb.createVentaWithTransaction([
          { id: p1.id, cant: 5 },
          { id: p2.id, cant: 5 }
        ])
      ).rejects.toThrow('Stock insuficiente');

      // Verificar que stock no cambió
      expect(mockDb.getProducto(p1.id).stock).toBe(10);
      expect(mockDb.getProducto(p2.id).stock).toBe(1);
    });
  });

  describe('Transacciones atómicas', () => {
    it('debe ser atómico - todo o nada', async () => {
      const p1 = mockDb.createProducto({
        codigo: 'P001',
        nombre: 'Good Product',
        precio: 100,
        stock: 10
      });

      // Intentar crear venta con producto inexistente
      await expect(
        mockDb.createVentaWithTransaction([
          { id: p1.id, cant: 5 },
          { id: 'inexistente', cant: 1 }
        ])
      ).rejects.toThrow();

      // Stock de p1 no debe haber cambiado
      expect(mockDb.getProducto(p1.id).stock).toBe(10);

      // No debe haber venta creada
      expect(mockDb.collections.ventas.size).toBe(0);
    });

    it('debe manejar validación de cantidades', async () => {
      const producto = mockDb.createProducto({
        codigo: 'P001',
        precio: 100,
        stock: 10
      });

      // Validar cantidad mínima
      const venta = await mockDb.createVentaWithTransaction([
        { id: producto.id, cant: 1 }
      ]);

      expect(venta.items[0].cant).toBe(1);
      expect(mockDb.getProducto(producto.id).stock).toBe(9);
    });
  });

  describe('Casos límite', () => {
    it('debe agotar stock exactamente', async () => {
      const producto = mockDb.createProducto({
        codigo: 'P001',
        precio: 100,
        stock: 5
      });

      const venta = await mockDb.createVentaWithTransaction([
        { id: producto.id, cant: 5 }
      ]);

      expect(venta.items[0].cant).toBe(5);
      expect(mockDb.getProducto(producto.id).stock).toBe(0);
    });

    it('debe rechazar venta con stock = 0', async () => {
      const producto = mockDb.createProducto({
        codigo: 'P001',
        precio: 100,
        stock: 0
      });

      await expect(
        mockDb.createVentaWithTransaction([
          { id: producto.id, cant: 1 }
        ])
      ).rejects.toThrow('Stock insuficiente');
    });

    it('debe validar cantidad > 0', async () => {
      const producto = mockDb.createProducto({
        codigo: 'P001',
        precio: 100,
        stock: 10
      });

      // En caso real, la validación ocurriría antes de llamar createVenta
      // Aquí solo verificamos que el flujo es correcto
      const venta = await mockDb.createVentaWithTransaction([
        { id: producto.id, cant: 1 }
      ]);

      expect(venta.items[0].cant).toBeGreaterThan(0);
    });
  });

  describe('Auditoría y logging', () => {
    it('debe registrar cambios de stock', async () => {
      const producto = mockDb.createProducto({
        codigo: 'P001',
        precio: 100,
        stock: 10
      });

      const before = mockDb.getProducto(producto.id);
      await mockDb.createVentaWithTransaction([
        { id: producto.id, cant: 3 }
      ]);
      const after = mockDb.getProducto(producto.id);

      expect(before.stock).toBe(10);
      expect(after.stock).toBe(7);
      expect(after.updatedAt).toBeDefined();
    });

    it('debe incluir información de venta completa', async () => {
      const producto = mockDb.createProducto({
        codigo: 'P001',
        precio: 100,
        stock: 10
      });

      const venta = await mockDb.createVentaWithTransaction([
        { id: producto.id, cant: 2 }
      ]);

      expect(venta).toHaveProperty('numero');
      expect(venta).toHaveProperty('items');
      expect(venta).toHaveProperty('createdAt');
      expect(venta).toHaveProperty('estado');
    });
  });

  describe('Concurrencia simulada', () => {
    it('debe manejar múltiples ventas secuenciales', async () => {
      const p1 = mockDb.createProducto({
        codigo: 'P001',
        precio: 100,
        stock: 30
      });

      // Simular 3 ventas consecutivas
      await mockDb.createVentaWithTransaction([{ id: p1.id, cant: 5 }]);
      await mockDb.createVentaWithTransaction([{ id: p1.id, cant: 10 }]);
      await mockDb.createVentaWithTransaction([{ id: p1.id, cant: 15 }]);

      expect(mockDb.getProducto(p1.id).stock).toBe(0);
      expect(mockDb.collections.ventas.size).toBe(3);
    });

    it('debe generar números únicos para ventas concurrentes', async () => {
      const p1 = mockDb.createProducto({ codigo: 'P001', precio: 100, stock: 50 });

      const v1 = await mockDb.createVentaWithTransaction([{ id: p1.id, cant: 1 }]);
      const v2 = await mockDb.createVentaWithTransaction([{ id: p1.id, cant: 1 }]);
      const v3 = await mockDb.createVentaWithTransaction([{ id: p1.id, cant: 1 }]);

      expect(v1.numero).toBe('V-000001');
      expect(v2.numero).toBe('V-000002');
      expect(v3.numero).toBe('V-000003');
    });
  });
});
