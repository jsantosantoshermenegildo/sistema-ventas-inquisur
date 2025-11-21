// ============================================================================
// REPORTES-DATA.JS - Carga y Filtrado de Datos para Reportes
// ============================================================================

import { db } from '../firebase.js';
import { toastError } from '../utils/alerts.js';
import { loadWithCache } from '../utils/cache.js';
import { 
  collection, 
  getDocs 
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

/**
 * Carga todas las ventas desde Firestore
 */
export async function cargarVentas() {
  try {
    console.log('[DATA] Cargando ventas desde Firestore...');
    
    const cacheKey = 'ventas';
    let ventas = await loadWithCache(
      () => getDocs(collection(db, 'ventas')).then(s => s.docs.map(d => ({ id: d.id, ...d.data() }))),
      cacheKey,
      5 * 60 * 1000 // 5 minutos
    );

    if (!ventas) {
      console.log('[DATA] Recuperando directamente de Firestore (caché fallo)');
      const snap = await getDocs(collection(db, 'ventas'));
      ventas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    console.log(`[DATA] ✅ Ventas cargadas: ${ventas.length}`);
    return ventas || [];
  } catch (error) {
    console.error('[DATA] Error cargando ventas:', error);
    toastError('❌ Error cargando ventas: ' + error.message);
    return [];
  }
}

/**
 * Carga todos los clientes desde Firestore
 */
export async function cargarClientes() {
  try {
    console.log('[DATA] Cargando clientes desde Firestore...');
    
    const cacheKey = 'clientes';
    let clientes = await loadWithCache(
      () => getDocs(collection(db, 'clientes')).then(s => s.docs.map(d => ({ id: d.id, ...d.data() }))),
      cacheKey,
      10 * 60 * 1000 // 10 minutos
    );

    if (!clientes) {
      console.log('[DATA] Recuperando directamente de Firestore (caché fallo)');
      const snap = await getDocs(collection(db, 'clientes'));
      clientes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    console.log(`[DATA] ✅ Clientes cargados: ${clientes.length}`);
    return clientes || [];
  } catch (error) {
    console.error('[DATA] Error cargando clientes:', error);
    toastError('❌ Error cargando clientes: ' + error.message);
    return [];
  }
}

/**
 * Enriquece ventas con nombres de clientes
 */
export function enriquecerVentas(ventas, clientes) {
  return ventas.map(venta => ({
    ...venta,
    clienteNombre: clientes.find(c => c.id === venta.clienteId)?.nombre || 'Desconocido',
  }));
}

/**
 * Filtra ventas según criterios
 */
export function filtrarVentas(ventas, filtros = {}) {
  return ventas.filter(venta => {
    // Filtro por cliente
    if (filtros.clienteId && venta.clienteId !== filtros.clienteId) {
      return false;
    }

    // Filtro por estado
    if (filtros.estado && venta.estado !== filtros.estado) {
      return false;
    }

    // Filtro por búsqueda
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      const matchRef = venta.referencia?.toLowerCase().includes(busqueda);
      const matchCliente = venta.clienteNombre?.toLowerCase().includes(busqueda);
      if (!matchRef && !matchCliente) return false;
    }

    // Filtro por rango de fechas
    if (filtros.fechaDesde || filtros.fechaHasta) {
      const ventaDate = venta.fechaVenta && typeof venta.fechaVenta === 'object' && venta.fechaVenta.toDate
        ? venta.fechaVenta.toDate()
        : new Date(venta.fechaVenta || venta.createdAt);

      const desde = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
      const hasta = filtros.fechaHasta ? new Date(filtros.fechaHasta) : null;

      if (desde && ventaDate < desde) return false;
      if (hasta && ventaDate > hasta) return false;
    }

    return true;
  });
}

/**
 * Ordena ventas de más reciente a más antigua
 */
export function ordenarVentas(ventas) {
  return ventas.sort((a, b) => {
    const dateA = a.fechaVenta && typeof a.fechaVenta === 'object' && a.fechaVenta.toDate
      ? a.fechaVenta.toDate()
      : new Date(a.fechaVenta || a.createdAt);
    
    const dateB = b.fechaVenta && typeof b.fechaVenta === 'object' && b.fechaVenta.toDate
      ? b.fechaVenta.toDate()
      : new Date(b.fechaVenta || b.createdAt);

    return dateB - dateA;
  });
}

/**
 * Carga todos los datos de reportes (ventas + clientes)
 */
export async function cargarTodosDatos() {
  try {
    console.log('[DATA] Iniciando carga completa de datos...');
    
    const ventas = await cargarVentas();
    const clientes = await cargarClientes();

    // Enriquecer ventas con nombres de clientes
    const ventasEnriquecidas = enriquecerVentas(ventas, clientes);
    
    // Ordenar por fecha descendente
    const ventasOrdenadas = ordenarVentas(ventasEnriquecidas);

    console.log(`[DATA] ✅ Datos completos cargados: ${ventasOrdenadas.length} ventas`);

    return {
      ventas: ventasOrdenadas,
      clientes
    };
  } catch (error) {
    console.error('[DATA] Error cargando datos completos:', error);
    throw error;
  }
}
