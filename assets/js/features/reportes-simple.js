// ============================================================================
// REPORTES-SIMPLE.JS - Vista Simple de Proformas/Ventas
// ============================================================================

// Imports de Firebase
import { db } from '../firebase.js';
import { collection, getDocs, doc, updateDoc, query, orderBy, limit } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

// Imports de utilidades
import { PageTemplate } from '../ui/components.js';
import { toastError, toastSuccess } from '../utils/alerts.js';
import { getBadgeEstado } from '../utils/estados.js';
import { money } from '../utils/formatters.js';
import { escapeHtml } from '../utils/sanitize.js';
import { handleError } from '../utils/errorHandler.js';

/**
 * Formatea fecha de Firestore
 */
function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha';
  
  // Si es Timestamp de Firestore
  if (fecha.toDate && typeof fecha.toDate === 'function') {
    return fecha.toDate().toLocaleDateString('es-PE');
  }
  
  // Si es objeto Date
  if (fecha instanceof Date) {
    return fecha.toLocaleDateString('es-PE');
  }
  
  // Si es string o number
  return new Date(fecha).toLocaleDateString('es-PE');
}

/**
 * Página de Reportes Simple
 */
export async function ReportesPage(container) {
  console.log('[REPORTES] Inicializando vista simple');

  // Estado local
  let todasLasProformas = [];
  let proformasFiltradas = [];
  let proformaActual = null; // Para tracking de la proforma en el modal

  // ============================================================================
  // FUNCIONES
  // ============================================================================

  /**
   * Migración: Actualiza todas las proformas sin estado a "borrador"
   */
  async function migrarEstados() {
    try {
      console.log('[MIGRACIÓN] Iniciando...');
      const btn = /** @type {HTMLButtonElement} */ (document.getElementById('btnMigrar'));
      if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Migrando...';
      }
      
      let actualizadas = 0;
      
      // Revisar cada proforma cargada
      for (const proforma of todasLasProformas) {
        // Si no tiene estado en memoria, actualizar en Firebase
        if (!proforma.estado) {
          try {
            const docRef = doc(db, 'proformas', proforma.id);
            await updateDoc(docRef, { estado: 'borrador' });
            proforma.estado = 'borrador';
            actualizadas++;
            console.log(`[MIGRACIÓN] ✅ Actualizada: ${proforma.id}`);
          } catch (error) {
            // ✅ FIX #7: Error handling consistente
            await handleError(error, {
              action: 'proforma.update.estado',
              entity: 'proformas',
              entityId: proforma.id,
              silent: true // No mostrar toast individual
            });
          }
        }
      }
      
      // Actualizar también proformasFiltradas
      proformasFiltradas.forEach(p => {
        if (!p.estado) {
          p.estado = 'borrador';
        }
      });
      
      if (actualizadas > 0) {
        toastSuccess(`✅ ${actualizadas} proformas actualizadas con estado "borrador"`);
        // Refrescar vista
        renderTabla(proformasFiltradas);
      } else {
        toastSuccess('✅ Todas las proformas ya tienen estado asignado');
      }
      
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🔧 Migrar Estados';
      }
      
      console.log(`[MIGRACIÓN] ✅ Completada: ${actualizadas} actualizaciones`);
    } catch (error) {
      console.error('[MIGRACIÓN] Error:', error);
      toastError('Error en migración: ' + error.message);
      const btn = /** @type {HTMLButtonElement} */ (document.getElementById('btnMigrar'));
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🔧 Migrar Estados';
      }
    }
  }

  /**
   * Actualiza el estado de una proforma en Firestore
   */
  async function actualizarEstado(proformaId, nuevoEstado) {
    try {
      const docRef = doc(db, 'proformas', proformaId);
      await updateDoc(docRef, { estado: nuevoEstado });
      
      // Actualizar en memoria - AMBOS arrays
      const proformaEnTodas = todasLasProformas.find(p => p.id === proformaId);
      if (proformaEnTodas) {
        proformaEnTodas.estado = nuevoEstado;
      }
      
      const proformaEnFiltradas = proformasFiltradas.find(p => p.id === proformaId);
      if (proformaEnFiltradas) {
        proformaEnFiltradas.estado = nuevoEstado;
      }
      
      // Actualizar proforma actual
      if (proformaActual && proformaActual.id === proformaId) {
        proformaActual.estado = nuevoEstado;
      }
      
      // Actualizar badge en modal
      const detalleEstado = document.getElementById('detalleEstado');
      if (detalleEstado) {
        detalleEstado.innerHTML = getBadgeEstado(nuevoEstado);
      }
      
      // Re-renderizar tabla para actualizar badges
      renderTabla(proformasFiltradas);
      
      toastSuccess(`✅ Estado actualizado a: ${nuevoEstado}`);
    } catch (error) {
      // ✅ FIX #7: Error handling consistente
      await handleError(error, {
        action: 'proforma.update.estado',
        entity: 'proformas',
        entityId: proformaId,
        silent: false
      });
    }
  }

  /**
   * Carga proformas desde Firebase
   */
  async function cargarProformas() {
    try {
      console.log('[REPORTES] Cargando proformas...');
      // ✅ FIX #6: Agregar limit y orderBy para optimizar query
      const q = query(
        collection(db, 'proformas'),
        orderBy('createdAt', 'desc'),
        limit(500)
      );
      const snapshot = await getDocs(q);
      const proformas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`[REPORTES] ✅ ${proformas.length} proformas cargadas`);
      console.log('[REPORTES] Proformas sin estado:', proformas.filter(p => !p.estado).length);
      return proformas;
    } catch (error) {
      // ✅ FIX #7: Error handling consistente
      await handleError(error, {
        action: 'proforma.list',
        entity: 'proformas',
        entityId: null,
        silent: false
      });
      return [];
    }
  }

  /**
   * Calcula estadísticas
   */
  function calcularEstadisticas(proformas) {
    const total = proformas.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
    const cantidad = proformas.length;
    const promedio = cantidad > 0 ? total / cantidad : 0;
    
    return { total, cantidad, promedio };
  }

  /**
   * Renderiza estadísticas
   */
  function renderEstadisticas(proformas) {
    const stats = calcularEstadisticas(proformas);
    
    document.getElementById('statTotal').textContent = money(stats.total);
    document.getElementById('statCantidad').textContent = stats.cantidad;
    document.getElementById('statPromedio').textContent = money(stats.promedio);
  }

  /**
   * Muestra modal con detalles de la proforma
   */
  function mostrarDetalleProforma(proforma) {
    console.log('[DETALLE] Proforma completa:', proforma);
    proformaActual = proforma; // Guardar referencia
    const modal = document.getElementById('modalDetalle');
    const items = proforma.items || [];
    console.log('[DETALLE] Items array:', items);
    
    // Usar el total de la proforma directamente
    const total = Number(proforma.total) || 0;
    const subtotal = total / 1.18; // Total incluye IGV, calcular subtotal
    const igv = total - subtotal;
    
    document.getElementById('detalleNumero').textContent = escapeHtml(proforma.numero) || escapeHtml(proforma.id.slice(0, 8));
    document.getElementById('detalleFecha').textContent = formatearFecha(proforma.createdAt);
    document.getElementById('detalleCliente').textContent = escapeHtml(proforma.clienteNombre) || 'Sin cliente';
    document.getElementById('detalleEstado').innerHTML = getBadgeEstado(proforma.estado || 'borrador');
    
    // Establecer el valor del select
    const selectEstado = /** @type {HTMLSelectElement} */ (document.getElementById('selectEstado'));
    if (selectEstado) {
      selectEstado.value = proforma.estado || 'borrador';
    }
    
    // Renderizar items
    const tbodyItems = document.getElementById('tbodyDetalleItems');
    tbodyItems.innerHTML = items.map((item, idx) => {
      const cantidad = item.cant || item.cantidad || item.qty || item.unidades || 0;
      const precio = item.precio || item.price || item.precioUnitario || 0;
      const nombre = escapeHtml(item.nombre || item.name || item.descripcion || 'Producto');
      const subtotalItem = precio * cantidad;
      
      return `
      <tr class="border-b border-gray-200 dark:border-slate-600">
        <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">${idx + 1}</td>
        <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">${nombre}</td>
        <td class="px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300">${cantidad}</td>
        <td class="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">${money(precio)}</td>
        <td class="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white">${money(subtotalItem)}</td>
      </tr>
      `;
    }).join('');
    
    // Totales
    document.getElementById('detalleSubtotal').textContent = money(subtotal);
    document.getElementById('detalleIGV').textContent = money(igv);
    document.getElementById('detalleTotal').textContent = money(total);
    
    // Mostrar modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
  
  /**
   * Cierra el modal de detalle
   */
  function cerrarModalDetalle() {
    const modal = document.getElementById('modalDetalle');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  /**
   * Renderiza tabla de proformas
   */
  function renderTabla(proformas) {
    const tbody = document.getElementById('tbodyProformas');
    
    if (proformas.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            <div class="text-6xl mb-4">📭</div>
            <p class="text-lg font-semibold">No hay proformas para mostrar</p>
            <p class="text-sm mt-2">Crea tu primera proforma desde el menú Proformas</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = proformas.map((p, idx) => `
      <tr class="hover:bg-blue-50 dark:hover:bg-slate-600 transition border-b border-gray-200 dark:border-slate-600 cursor-pointer" 
          data-index="${idx}">
        <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
          ${escapeHtml(p.numero) || escapeHtml(p.id.slice(0, 8))}
        </td>
        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
          ${escapeHtml(p.clienteNombre) || 'Sin cliente'}
        </td>
        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
          ${formatearFecha(p.createdAt)}
        </td>
        <td class="px-6 py-4 text-sm">
          ${getBadgeEstado(p.estado || 'borrador')}
        </td>
        <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 text-center">
          ${(p.items || []).length}
        </td>
        <td class="px-6 py-4 text-sm text-right font-bold text-gray-900 dark:text-white">
          ${money(p.total || 0)} 👁️
        </td>
      </tr>
    `).join('');
    
    // Agregar event listeners a las filas
    tbody.querySelectorAll('tr[data-index]').forEach(row => {
      row.addEventListener('click', () => {
        const htmlRow = /** @type {HTMLElement} */ (row);
        const index = parseInt(htmlRow.dataset.index || '0');
        mostrarDetalleProforma(proformasFiltradas[index]);
      });
    });
  }

  /**
   * Filtra proformas por búsqueda, estado y fechas
   */
  function filtrarProformas(busqueda = '', estado = '', fechaDesde = '', fechaHasta = '') {
    proformasFiltradas = todasLasProformas.filter(p => {
      // Filtro por búsqueda
      if (busqueda) {
        const termino = busqueda.toLowerCase();
        const coincide = (p.numero || '').toLowerCase().includes(termino) ||
                        (p.clienteNombre || '').toLowerCase().includes(termino) ||
                        (p.estado || '').toLowerCase().includes(termino);
        if (!coincide) return false;
      }
      
      // Filtro por estado
      if (estado && (p.estado || 'borrador') !== estado) {
        return false;
      }
      
      // Filtro por fecha
      if (fechaDesde || fechaHasta) {
        const fechaProforma = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
        
        if (fechaDesde) {
          const desde = new Date(fechaDesde);
          desde.setHours(0, 0, 0, 0);
          if (fechaProforma < desde) return false;
        }
        
        if (fechaHasta) {
          const hasta = new Date(fechaHasta);
          hasta.setHours(23, 59, 59, 999);
          if (fechaProforma > hasta) return false;
        }
      }
      
      return true;
    });
    
    renderEstadisticas(proformasFiltradas);
    renderTabla(proformasFiltradas);
  }

  /**
   * Establece filtro rápido de fechas
   */
  function setFiltroRapido(tipo) {
    const fechaDesdeInput = /** @type {HTMLInputElement} */ (document.getElementById('fechaDesde'));
    const fechaHastaInput = /** @type {HTMLInputElement} */ (document.getElementById('fechaHasta'));
    const searchInput = /** @type {HTMLInputElement} */ (document.getElementById('searchInput'));
    
    const hoy = new Date();
    let desde = new Date();
    
    switch(tipo) {
      case 'hoy':
        desde = new Date();
        break;
      case 'semana':
        desde.setDate(hoy.getDate() - 7);
        break;
      case 'mes':
        desde.setMonth(hoy.getMonth() - 1);
        break;
      case 'todo':
        fechaDesdeInput.value = '';
        fechaHastaInput.value = '';
        filtrarProformas(searchInput?.value || '');
        return;
    }
    
    fechaDesdeInput.value = desde.toISOString().split('T')[0];
    fechaHastaInput.value = hoy.toISOString().split('T')[0];
    
    filtrarProformas(searchInput?.value || '', fechaDesdeInput.value, fechaHastaInput.value);
  }

  // ============================================================================
  // HTML
  // ============================================================================

  const htmlContent = `
    <div class="space-y-6">
      <!-- Estadísticas -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-90 font-medium">💰 Total de Ventas</p>
              <p id="statTotal" class="text-3xl font-bold mt-2">S/. 0.00</p>
            </div>
            <div class="text-5xl opacity-20">💵</div>
          </div>
        </div>
        
        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-90 font-medium">📊 Cantidad</p>
              <p id="statCantidad" class="text-3xl font-bold mt-2">0</p>
            </div>
            <div class="text-5xl opacity-20">📈</div>
          </div>
        </div>
        
        <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-90 font-medium">🎯 Promedio</p>
              <p id="statPromedio" class="text-3xl font-bold mt-2">S/. 0.00</p>
            </div>
            <div class="text-5xl opacity-20">💎</div>
          </div>
        </div>
      </div>

      <!-- Búsqueda y Filtros -->
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div class="relative">
            <span class="absolute left-3 top-3 text-gray-400">🔍</span>
            <input 
              type="text" 
              id="searchInput" 
              placeholder="Buscar..." 
              class="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-slate-700 dark:text-white transition"
            >
          </div>
          
          <div class="relative">
            <span class="absolute left-3 top-3 text-gray-400">🏷️</span>
            <select id="filtroEstado" class="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-slate-700 dark:text-white transition">
              <option value="">Todos los estados</option>
              <option value="borrador">📝 Borrador</option>
              <option value="enviada">📧 Enviada</option>
              <option value="aprobada">✅ Aprobada</option>
              <option value="rechazada">❌ Rechazada</option>
              <option value="facturada">💰 Facturada</option>
            </select>
          </div>
          
          <div class="relative">
            <span class="absolute left-3 top-3 text-gray-400">📅</span>
            <input 
              type="date" 
              id="fechaDesde" 
              placeholder="Desde..." 
              class="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-slate-700 dark:text-white transition"
            >
          </div>
          
          <div class="relative">
            <span class="absolute left-3 top-3 text-gray-400">📅</span>
            <input 
              type="date" 
              id="fechaHasta" 
              placeholder="Hasta..." 
              class="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-slate-700 dark:text-white transition"
            >
          </div>
          
          <button 
            id="btnRefresh" 
            class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold shadow-md transition transform hover:scale-105"
          >
            🔄 Actualizar
          </button>
        </div>
        
        <div class="mt-3 flex gap-2">
          <button id="btnHoy" class="px-3 py-1 text-sm bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-lg transition">
            Hoy
          </button>
          <button id="btnSemana" class="px-3 py-1 text-sm bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-lg transition">
            Esta Semana
          </button>
          <button id="btnMes" class="px-3 py-1 text-sm bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-lg transition">
            Este Mes
          </button>
          <button id="btnTodo" class="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition">
            Todo
          </button>
          <button id="btnMigrar" class="ml-auto px-3 py-1 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition" title="Actualizar proformas antiguas sin estado">
            🔧 Migrar Estados
          </button>
        </div>
      </div>

      <!-- Tabla de Proformas -->
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600">
              <tr>
                <th class="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-200">
                  Número
                </th>
                <th class="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-200">
                  Cliente
                </th>
                <th class="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-200">
                  Fecha
                </th>
                <th class="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-200">
                  Estado
                </th>
                <th class="px-6 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-200">
                  Items
                </th>
                <th class="px-6 py-4 text-right text-sm font-bold text-gray-700 dark:text-gray-200">
                  Total
                </th>
              </tr>
            </thead>
            <tbody id="tbodyProformas">
              <tr>
                <td colspan="6" class="px-6 py-12 text-center">
                  <div class="text-gray-500 dark:text-gray-400">
                    <div class="text-4xl mb-2">⏳</div>
                    <p>Cargando proformas...</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal de Detalle -->
    <div id="modalDetalle" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <!-- Header del Modal -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-3xl">📄</span>
            <div>
              <h3 class="text-xl font-bold text-white">Detalle de Proforma</h3>
              <p class="text-sm text-blue-100" id="detalleNumero">PRO-000</p>
            </div>
          </div>
          <button id="btnCerrarModal" class="text-white hover:bg-blue-800 rounded-lg p-2 transition">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Contenido del Modal -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <!-- Información General -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">📅 Fecha</p>
              <p id="detalleFecha" class="text-sm font-semibold text-gray-900 dark:text-white">--/--/----</p>
            </div>
            <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">👤 Cliente</p>
              <p id="detalleCliente" class="text-sm font-semibold text-gray-900 dark:text-white">Sin cliente</p>
            </div>
            <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">🏷️ Estado</p>
              <div class="flex items-center gap-2">
                <div id="detalleEstado"></div>
                <select id="selectEstado" class="text-xs border-2 border-gray-300 dark:border-slate-500 dark:bg-slate-600 rounded px-2 py-1 font-semibold">
                  <option value="borrador">📝 Borrador</option>
                  <option value="enviada">📧 Enviada</option>
                  <option value="aprobada">✅ Aprobada</option>
                  <option value="rechazada">❌ Rechazada</option>
                  <option value="facturada">💰 Facturada</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Productos -->
          <div class="mb-6">
            <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🛒</span> Productos Vendidos
            </h4>
            <div class="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
              <table class="w-full">
                <thead class="bg-gray-100 dark:bg-slate-700">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200">#</th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200">Producto</th>
                    <th class="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-200">Cantidad</th>
                    <th class="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-200">Precio Unit.</th>
                    <th class="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-200">Subtotal</th>
                  </tr>
                </thead>
                <tbody id="tbodyDetalleItems" class="bg-white dark:bg-slate-800">
                  <!-- Items dinámicos -->
                </tbody>
              </table>
            </div>
          </div>

          <!-- Totales -->
          <div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 rounded-lg p-6">
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-300">Subtotal:</span>
                <span id="detalleSubtotal" class="text-lg font-semibold text-gray-900 dark:text-white">S/. 0.00</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-300">IGV (18%):</span>
                <span id="detalleIGV" class="text-lg font-semibold text-gray-900 dark:text-white">S/. 0.00</span>
              </div>
              <div class="border-t-2 border-gray-300 dark:border-slate-500 pt-3 flex justify-between items-center">
                <span class="text-lg font-bold text-gray-900 dark:text-white">💰 Total:</span>
                <span id="detalleTotal" class="text-2xl font-bold text-blue-600 dark:text-blue-400">S/. 0.00</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer del Modal -->
        <div class="bg-gray-50 dark:bg-slate-700 px-6 py-4 flex justify-end gap-3">
          <button id="btnCerrarModal2" class="px-6 py-2 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 text-gray-900 dark:text-white rounded-lg font-semibold transition">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `;

  // ============================================================================
  // RENDER
  // ============================================================================

  container.innerHTML = PageTemplate('📊 Reportes de Ventas', htmlContent);

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  const searchInput = document.getElementById('searchInput');
  const filtroEstado = document.getElementById('filtroEstado');
  const fechaDesde = document.getElementById('fechaDesde');
  const fechaHasta = document.getElementById('fechaHasta');
  const btnRefresh = document.getElementById('btnRefresh');
  const btnCerrarModal = document.getElementById('btnCerrarModal');
  const btnCerrarModal2 = document.getElementById('btnCerrarModal2');
  const btnHoy = document.getElementById('btnHoy');
  const btnSemana = document.getElementById('btnSemana');
  const btnMes = document.getElementById('btnMes');
  const btnTodo = document.getElementById('btnTodo');
  const btnMigrar = document.getElementById('btnMigrar');
  const selectEstado = document.getElementById('selectEstado');

  // ✅ FIX #5: Array para almacenar funciones de cleanup
  const eventListeners = [];

  // Helper para agregar event listener con tracking
  function addTrackedListener(element, event, handler) {
    if (!element) return;
    element.addEventListener(event, handler);
    eventListeners.push({ element, event, handler });
  }

  // Búsqueda en tiempo real
  const handleSearch = (e) => {
    const input = /** @type {HTMLInputElement} */ (e.target);
    const estado = /** @type {HTMLSelectElement} */ (filtroEstado);
    const desde = /** @type {HTMLInputElement} */ (fechaDesde);
    const hasta = /** @type {HTMLInputElement} */ (fechaHasta);
    filtrarProformas(input.value, estado?.value || '', desde?.value || '', hasta?.value || '');
  };

  // Filtro de estado
  filtroEstado?.addEventListener('change', (e) => {
    const input = /** @type {HTMLInputElement} */ (searchInput);
    const estado = /** @type {HTMLSelectElement} */ (e.target);
    const desde = /** @type {HTMLInputElement} */ (fechaDesde);
    const hasta = /** @type {HTMLInputElement} */ (fechaHasta);
    filtrarProformas(input?.value || '', estado.value, desde?.value || '', hasta?.value || '');
  });

  // Filtros de fecha
  fechaDesde?.addEventListener('change', () => {
    const input = /** @type {HTMLInputElement} */ (searchInput);
    const estado = /** @type {HTMLSelectElement} */ (filtroEstado);
    const desde = /** @type {HTMLInputElement} */ (fechaDesde);
    const hasta = /** @type {HTMLInputElement} */ (fechaHasta);
    filtrarProformas(input?.value || '', estado?.value || '', desde.value, hasta?.value || '');
  });

  fechaHasta?.addEventListener('change', () => {
    const input = /** @type {HTMLInputElement} */ (searchInput);
    const estado = /** @type {HTMLSelectElement} */ (filtroEstado);
    const desde = /** @type {HTMLInputElement} */ (fechaDesde);
    const hasta = /** @type {HTMLInputElement} */ (fechaHasta);
    filtrarProformas(input?.value || '', estado?.value || '', desde?.value || '', hasta.value);
  });

  // Cambio de estado en el modal
  selectEstado?.addEventListener('change', async (e) => {
    if (!proformaActual) return;
    const select = /** @type {HTMLSelectElement} */ (e.target);
    await actualizarEstado(proformaActual.id, select.value);
  });

  // Botón actualizar
  btnRefresh?.addEventListener('click', async () => {
    const btn = /** @type {HTMLButtonElement} */ (btnRefresh);
    const input = /** @type {HTMLInputElement} */ (searchInput);
    const estado = /** @type {HTMLSelectElement} */ (filtroEstado);
    const desde = /** @type {HTMLInputElement} */ (fechaDesde);
    const hasta = /** @type {HTMLInputElement} */ (fechaHasta);
    
    btn.disabled = true;
    btn.textContent = '⏳ Cargando...';
    
    todasLasProformas = await cargarProformas();
    filtrarProformas(input?.value || '', estado?.value || '', desde?.value || '', hasta?.value || '');
    
    btn.disabled = false;
    btn.textContent = '🔄 Actualizar';
  });

  // Filtros rápidos
  btnHoy?.addEventListener('click', () => setFiltroRapido('hoy'));
  btnSemana?.addEventListener('click', () => setFiltroRapido('semana'));
  btnMes?.addEventListener('click', () => setFiltroRapido('mes'));
  btnTodo?.addEventListener('click', () => setFiltroRapido('todo'));

  // Migración de estados
  btnMigrar?.addEventListener('click', migrarEstados);

  // Cerrar modal
  btnCerrarModal?.addEventListener('click', cerrarModalDetalle);
  btnCerrarModal2?.addEventListener('click', cerrarModalDetalle);

  // Cerrar modal al hacer clic fuera
  document.getElementById('modalDetalle')?.addEventListener('click', (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    if (target.id === 'modalDetalle') {
      cerrarModalDetalle();
    }
  });

  // ============================================================================
  // CARGA INICIAL
  // ============================================================================

  try {
    todasLasProformas = await cargarProformas();
    proformasFiltradas = [...todasLasProformas];
    
    renderEstadisticas(proformasFiltradas);
    renderTabla(proformasFiltradas);
    
    console.log('[REPORTES] ✅ Vista cargada correctamente');
  } catch (error) {
    // ✅ FIX #7: Error handling consistente
    await handleError(error, {
      action: 'reportes.init',
      entity: 'reportes',
      entityId: null,
      silent: false
    });
  }

  // ✅ FIX #5: Retornar función de cleanup para memory leak prevention
  return () => {
    console.log('[REPORTES] 🧹 Limpiando event listeners...');
    eventListeners.forEach(({ element, event, handler }) => {
      element?.removeEventListener(event, handler);
    });
    eventListeners.length = 0; // Vaciar array
  };
}

export default ReportesPage;
