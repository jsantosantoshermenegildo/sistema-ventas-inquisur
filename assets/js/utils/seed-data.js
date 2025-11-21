// assets/js/utils/seed-data.js — Script para cargar datos de prueba
import { db } from '../firebase.js';
import { collection, addDoc, getDocs, Timestamp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

export async function seedTestData() {
  try {
    console.log('📝 Cargando datos de prueba...');

    // Datos de clientes
    const clientes = [
      { nombre: 'Acme Corp', ruc: '12345678901', email: 'contact@acme.com', activo: true },
      { nombre: 'TechSolutions', ruc: '12345678902', email: 'info@tech.com', activo: true },
      { nombre: 'Global Trade', ruc: '12345678903', email: 'sales@global.com', activo: true },
      { nombre: 'Innovation Ltd', ruc: '12345678904', email: 'hello@innovation.com', activo: true },
      { nombre: 'Premium Group', ruc: '12345678905', email: 'contact@premium.com', activo: true },
    ];

    // Datos de productos
    const productos = [
      { nombre: 'Laptop Dell', codigo: 'DEL-001', precio: 3500, stock: 15, activo: true },
      { nombre: 'Mouse Logitech', codigo: 'LOG-001', precio: 150, stock: 50, activo: true },
      { nombre: 'Teclado Mecánico', codigo: 'KEY-001', precio: 450, stock: 30, activo: true },
      { nombre: 'Monitor LG 24"', codigo: 'MON-001', precio: 1200, stock: 20, activo: true },
      { nombre: 'Webcam HD', codigo: 'WEB-001', precio: 280, stock: 40, activo: true },
    ];

    // Verificar si ya existen datos
    const clientesRef = collection(db, 'clientes');
    const existentes = await getDocs(clientesRef);
    
    if (existentes.docs.length > 0) {
      console.log('✅ Ya existen datos de prueba');
      return;
    }

    // Agregar clientes
    console.log('👥 Agregando clientes...');
    const clienteIds = [];
    for (const cliente of clientes) {
      const docRef = await addDoc(clientesRef, {
        ...cliente,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      clienteIds.push({ id: docRef.id, ...cliente });
      console.log(`  ✓ ${cliente.nombre}`);
    }

    // Agregar productos
    console.log('📦 Agregando productos...');
    const productosRef = collection(db, 'productos');
    for (const producto of productos) {
      await addDoc(productosRef, {
        ...producto,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`  ✓ ${producto.nombre}`);
    }

    // Agregar ventas de ejemplo
    console.log('🛍️ Agregando ventas...');
    const ventasRef = collection(db, 'ventas');
    const estados = ['borrada', 'confirmada', 'pagada'];
    
    for (let i = 0; i < 15; i++) {
      const cliente = clienteIds[i % clienteIds.length];
      const producto = productos[i % productos.length];
      const cantidad = Math.floor(Math.random() * 5) + 1;
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 30));

      await addDoc(ventasRef, {
        numero: `V-${String(1000 + i).padStart(4, '0')}`,
        clienteId: cliente.id,
        clienteNombre: cliente.nombre,
        estado: estados[Math.floor(Math.random() * estados.length)],
        fecha: Timestamp.fromDate(fecha),
        createdAt: Timestamp.fromDate(fecha),
        items: [
          {
            codigo: producto.codigo,
            nombre: producto.nombre,
            cantidad,
            precio: producto.precio,
            subtotal: producto.precio * cantidad
          }
        ],
        total: producto.precio * cantidad,
        activo: true
      });
      console.log(`  ✓ Venta ${i + 1}/15`);
    }

    // Agregar proformas
    console.log('📄 Agregando proformas...');
    const proformasRef = collection(db, 'proformas');
    
    for (let i = 0; i < 8; i++) {
      const cliente = clienteIds[i % clienteIds.length];
      const producto = productos[i % productos.length];
      const cantidad = Math.floor(Math.random() * 3) + 1;

      await addDoc(proformasRef, {
        numero: `PF-${String(500 + i).padStart(4, '0')}`,
        clienteId: cliente.id,
        clienteNombre: cliente.nombre,
        estado: ['borrador', 'confirmada'][Math.floor(Math.random() * 2)],
        createdAt: Timestamp.now(),
        items: [
          {
            codigo: producto.codigo,
            nombre: producto.nombre,
            cantidad,
            precio: producto.precio,
            subtotal: producto.precio * cantidad
          }
        ],
        total: producto.precio * cantidad,
        activo: true
      });
      console.log(`  ✓ Proforma ${i + 1}/8`);
    }

    console.log('✅ Datos de prueba cargados exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error cargando datos:', error);
    return false;
  }
}

// Exportar función para usar en app.js
export default seedTestData;
