// ============================================================================
// REPORTES.JS - Módulo de Reportes y Análisis de Ventas (REFACTORIZADO)
// ============================================================================

import { PageTemplate } from '../ui/components.js';
import { toastSuccess, toastError, toastWarning } from '../utils/alerts.js';
import { getBadgeEstado } from '../utils/estados.js';
import { exportToCSV } from '../utils/csv.js';
import { paginate, renderFullPagination } from '../utils/pagination.js';
import { clearCache } from '../utils/cache.js';
import { debounce } from '../utils/rateLimiter.js';
import { exportReportToPDF } from '../utils/pdf-export.js';
import { toDate, money, calcularEstadisticas, formatDate } from './reportes-utils.js';
import { cleanupCharts, renderAllCharts } from './reportes-charts.js';
import { cargarTodosDatos, filtrarVentas } from './reportes-data.js';

/**
 * Página de Reportes - Versión Modular
 */
export async function ReportesPage(container) {
  console.log('[REPORTES] 🚀 Inicializando página de reportes');

  // Limpiar gráficos previos
  cleanupCharts();

  // Estado local
  const state = {
    allVentas: [],
    allClientes: [],
    filteredVentas: [],
    currentPage: 1,
    pageSize: 50,
  };

  // ============================================================================
  // FUNCIONES INTERNAS
  // ============================================================================

  /**
   * Renderiza estadísticas
   */
  function renderEstadisticas() {
    const stats = calcularEstadisticas(state.filteredVentas);
    document.getElementById('statTotal').textContent = money(stats.total);
    document.getElementById('statCantidad').textContent = stats.cantidad;
    document.getElementById('statPromedio').textContent = money(stats.promedio);
    console.log(`[REPORTES] 📊 Estadísticas: Total=${money(stats.total)}, Cantidad=${stats.cantidad}`);
  }

  /**
   * Renderiza tabla de ventas
   */
  function renderTabla() {
    const tbody = document.getElementById('tbodyReportes');
    
    if (state.filteredVentas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No hay datos disponibles</td></tr>';
      return;
    }

    // Paginar
    const paginacion = paginate(state.filteredVentas, state.currentPage, state.pageSize);
    
    tbody.innerHTML = paginacion.data.map(venta => `
      <tr class="hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer row-venta transition" data-id="${venta.id}">
        <td class="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">${venta.referencia || venta.id.slice(0, 8)}</td>
        <td class="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">${venta.clienteNombre || 'N/A'}</td>
        <td class="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">${formatDate(venta.fechaVenta || venta.createdAt)}</td>
        <td class="px-6 py-3 text-sm">${getBadgeEstado(venta.estado || 'borrador')}</td>
        <td class="px-6 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white">${money(venta.total || 0)}</td>
      </tr>
    `).join('');

    console.log(`[REPORTES] 📋 Tabla renderizada con ${paginacion.data.length} items`);
  }

  /**
   * Renderiza controles de paginación
   */
  function renderPaginationControls() {
    const container = document.getElementById('paginationContainer');
    const paginacion = paginate(state.filteredVentas, state.currentPage, state.pageSize);
    
    if (paginacion.totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = renderFullPagination(
      paginacion.currentPage,
      paginacion.totalPages,
      (page) => {
        state.currentPage = page;
        renderTabla();
        renderPaginationControls();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    );
  }

  /**
   * Abre modal con detalles de venta
   */
  function abrirModalDetalles(venta) {
    const modal = document.getElementById('modalDetalles');
    document.getElementById('modalTitulo').textContent = `Venta #${venta.referencia || venta.id.slice(0, 8)}`;
    document.getElementById('modalContenido').innerHTML = `
      <div class="grid grid-cols-2 gap-4">
        <div class="text-gray-700 dark:text-gray-300"><strong>Cliente:</strong> ${venta.clienteNombre || 'N/A'}</div>
        <div class="text-gray-700 dark:text-gray-300"><strong>Fecha:</strong> ${formatDate(venta.fechaVenta || venta.createdAt)}</div>
        <div class="text-gray-700 dark:text-gray-300"><strong>Estado:</strong> ${getBadgeEstado(venta.estado || 'borrador')}</div>
        <div class="text-gray-700 dark:text-gray-300"><strong>Total:</strong> ${money(venta.total || 0)}</div>
        ${venta.descripcion ? `<div class="col-span-2 text-gray-700 dark:text-gray-300"><strong>Descripción:</strong> ${venta.descripcion}</div>` : ''}
      </div>
    `;
    modal.classList.remove('hidden');
  }

  function cerrarModal() {
    document.getElementById('modalDetalles').classList.add('hidden');
  }

  /**
   * Aplica filtros y renderiza
   */
  async function renderConFiltros() {
    try {
      console.log('[REPORTES] 🔍 Aplicando filtros...');

      const clienteFilter = document.getElementById('filterCliente')?.value;
      const estadoFilter = document.getElementById('filterEstado')?.value;
      const agrupacionFilter = document.getElementById('filterAgrupacion')?.value || 'día';
      const fechaDesdeValue = document.getElementById('filterFechaDesde')?.value;
      const fechaHastaValue = document.getElementById('filterFechaHasta')?.value;
      const busquedaFilter = document.getElementById('filterBusqueda')?.value?.toLowerCase();

      // Filtrar ventas
      state.filteredVentas = filtrarVentas(state.allVentas, {
        clienteId: clienteFilter || undefined,
        estado: estadoFilter || undefined,
        busqueda: busquedaFilter || undefined,
        fechaDesde: fechaDesdeValue,
        fechaHasta: fechaHastaValue
      });

      console.log(`[REPORTES] ✅ Filtradas ${state.filteredVentas.length} ventas`);

      // Resetear página
      state.currentPage = 1;

      // Renderizar gráficos
      await renderAllCharts(state.filteredVentas, agrupacionFilter);

      // Renderizar estadísticas
      renderEstadisticas();

      // Renderizar tabla
      renderTabla();

      // Renderizar paginación
      renderPaginationControls();
    } catch (error) {
      console.error('[REPORTES] ❌ Error en renderConFiltros:', error);
      toastError('❌ Error: ' + error.message);
    }
  }

  /**
   * Exporta a PDF
   */
  async function exportarPDF() {
    try {
      if (state.filteredVentas.length === 0) {
        toastWarning('⚠️ No hay datos para exportar');
        return;
      }

      const fechaDesde = document.getElementById('filterFechaDesde')?.value;
      const fechaHasta = document.getElementById('filterFechaHasta')?.value;
      const stats = calcularEstadisticas(state.filteredVentas);

      await exportReportToPDF({
        title: 'Reporte de Ventas',
        ventas: state.filteredVentas.map(v => ({
          numero: v.referencia || v.id.slice(0, 8),
          clienteNombre: v.clienteNombre || 'Sin cliente',
          fecha: toDate(v.fechaVenta || v.createdAt) || new Date(),
          estado: v.estado || 'borrador',
          total: v.total || 0
        })),
        estadisticas: stats,
        fechaDesde,
        fechaHasta
      });
      
      toastSuccess('✅ PDF descargado exitosamente');
      console.log('[REPORTES] 📄 PDF exportado');
    } catch (error) {
      console.error('[REPORTES] Error exportando PDF:', error);
      toastError('❌ Error exportando PDF: ' + error.message);
    }
  }

  /**
   * Exporta a CSV
   */
  function exportarCSV() {
    try {
      if (state.filteredVentas.length === 0) {
        toastWarning('⚠️ No hay datos para exportar');
        return;
      }

      const data = state.filteredVentas.map(v => ({
        Referencia: v.referencia || v.id.slice(0, 8),
        Cliente: v.clienteNombre || 'N/A',
        Fecha: formatDate(v.fechaVenta || v.createdAt),
        Estado: v.estado || 'borrador',
        Total: v.total || 0
      }));

      exportToCSV(data, 'reportes-ventas');
      toastSuccess('✅ CSV exportado exitosamente');
      console.log('[REPORTES] 📊 CSV exportado');
    } catch (error) {
      console.error('[REPORTES] Error exportando CSV:', error);
      toastError('❌ Error exportando CSV: ' + error.message);
    }
  }

  /**
   * Limpia el caché
   */
  function limpiarCache() {
    clearCache('ventas');
    clearCache('clientes');
    toastSuccess('✅ Caché limpiado. Recargando datos...');
    location.reload();
  }

  // ============================================================================
  // HTML TEMPLATE
  // ============================================================================

  const htmlContent = `
    <div class="space-y-6">
      <!-- Botones de Acciones -->
      <div class="flex gap-2 flex-wrap">
        <button id="btnReportePDF" class="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg flex items-center gap-2 shadow-md transition transform hover:scale-105">
          <span>📄</span> Descargar PDF
        </button>
        <button id="btnExportarCSV" class="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg flex items-center gap-2 shadow-md transition transform hover:scale-105">
          <span>📊</span> Exportar CSV
        </button>
        <button id="btnLimpiarCache" class="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg flex items-center gap-2 shadow-md transition transform hover:scale-105">
          <span>🗑️</span> Limpiar Caché
        </button>
      </div>

      <!-- Filtros -->
      <div class="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-md p-6 space-y-4 border-l-4 border-blue-500">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-2xl">🔎</span>
          <h3 class="text-lg font-bold text-gray-800 dark:text-white">Filtros Avanzados</h3>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">👥 Cliente</label>
            <select id="filterCliente" class="w-full px-3 py-2.5 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-slate-700 dark:text-white transition">
              <option value="">Todos los clientes</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📊 Estado</label>
            <select id="filterEstado" class="w-full px-3 py-2.5 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-slate-700 dark:text-white transition">
              <option value="">Todos los estados</option>
              <option value="borrador">Borrador</option>
              <option value="confirmada">Confirmada</option>
              <option value="pagada">Pagada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📅 Agrupar por</label>
            <select id="filterAgrupacion" class="w-full px-3 py-2.5 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-slate-700 dark:text-white transition">
              <option value="día">Día</option>
              <option value="semana">Semana</option>
              <option value="mes">Mes</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📆 Desde</label>
            <input type="date" id="filterFechaDesde" class="w-full px-3 py-2.5 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-slate-700 dark:text-white transition">
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📆 Hasta</label>
            <input type="date" id="filterFechaHasta" class="w-full px-3 py-2.5 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-slate-700 dark:text-white transition">
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">🔍 Búsqueda</label>
            <input type="text" id="filterBusqueda" placeholder="Referencia o cliente..." class="w-full px-3 py-2.5 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-slate-700 dark:text-white transition">
          </div>
        </div>

        <button id="btnAplicarFiltros" class="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-bold shadow-md transition transform hover:scale-105">
          ✅ Aplicar Filtros
        </button>
      </div>

      <!-- Gráfico Principal -->
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">📈 Ventas por Período</h3>
        <div class="relative" style="height: 300px;">
          <canvas id="chartVentas"></canvas>
        </div>
      </div>

      <!-- Gráficos Secundarios -->
      <div class="grid md:grid-cols-2 gap-4">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">📊 Distribución por Estado</h3>
          <div class="relative" style="height: 250px;">
            <canvas id="chartEstado"></canvas>
          </div>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">🏆 Top 5 Clientes</h3>
          <div class="relative" style="height: 250px;">
            <canvas id="chartClientes"></canvas>
          </div>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900 dark:to-indigo-800 rounded-lg shadow-md p-6 border-t-4 border-indigo-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-indigo-600 dark:text-indigo-300 font-semibold">💰 Total de Ventas</p>
              <p id="statTotal" class="text-3xl font-bold text-indigo-700 dark:text-indigo-200 mt-2">S/. 0.00</p>
            </div>
            <span class="text-5xl opacity-20">💵</span>
          </div>
        </div>
        <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900 dark:to-emerald-800 rounded-lg shadow-md p-6 border-t-4 border-emerald-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-emerald-600 dark:text-emerald-300 font-semibold">📊 Cantidad</p>
              <p id="statCantidad" class="text-3xl font-bold text-emerald-700 dark:text-emerald-200 mt-2">0</p>
            </div>
            <span class="text-5xl opacity-20">📈</span>
          </div>
        </div>
        <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg shadow-md p-6 border-t-4 border-purple-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-purple-600 dark:text-purple-300 font-semibold">🎯 Promedio</p>
              <p id="statPromedio" class="text-3xl font-bold text-purple-700 dark:text-purple-200 mt-2">S/. 0.00</p>
            </div>
            <span class="text-5xl opacity-20">🎯</span>
          </div>
        </div>
      </div>

      <!-- Tabla -->
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
              <tr>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Referencia</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Cliente</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Fecha</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Estado</th>
                <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Total</th>
              </tr>
            </thead>
            <tbody id="tbodyReportes" class="divide-y divide-gray-200 dark:divide-slate-700">
              <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">⏳ Cargando datos...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Paginación -->
      <div id="paginationContainer" class="flex justify-center mt-6"></div>
    </div>

    <!-- Modal de Detalles -->
    <div id="modalDetalles" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <h3 id="modalTitulo" class="text-2xl font-bold text-gray-800 dark:text-white mb-4">Detalles</h3>
        <div id="modalContenido" class="space-y-3"></div>
        <button id="btnCerrarModal" class="mt-6 px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg w-full">
          Cerrar
        </button>
      </div>
    </div>
  `;

  // ============================================================================
  // RENDER Y SETUP
  // ============================================================================

  const page = PageTemplate('Reportes', htmlContent);
  container.innerHTML = page;

  // Observer para limpiar al navegar
  const observer = new MutationObserver(() => cleanupCharts());
  observer.observe(container, { childList: true, subtree: true });

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  document.getElementById('btnAplicarFiltros')?.addEventListener('click', renderConFiltros);

  const debouncedRender = debounce(renderConFiltros, 300);
  document.getElementById('filterEstado')?.addEventListener('change', debouncedRender);
  document.getElementById('filterAgrupacion')?.addEventListener('change', debouncedRender);
  document.getElementById('filterCliente')?.addEventListener('change', debouncedRender);
  document.getElementById('filterFechaDesde')?.addEventListener('change', debouncedRender);
  document.getElementById('filterFechaHasta')?.addEventListener('change', debouncedRender);
  document.getElementById('filterBusqueda')?.addEventListener('input', debouncedRender);

  document.addEventListener('click', (e) => {
    const row = e.target.closest('.row-venta');
    if (row) {
      const ventaId = row.dataset.id;
      const venta = state.allVentas.find(v => v.id === ventaId);
      if (venta) abrirModalDetalles(venta);
    }
  });

  document.getElementById('btnCerrarModal')?.addEventListener('click', cerrarModal);
  document.getElementById('modalDetalles')?.addEventListener('click', (e) => {
    if (e.target.id === 'modalDetalles') cerrarModal();
  });

  document.getElementById('btnLimpiarCache')?.addEventListener('click', limpiarCache);
  document.getElementById('btnReportePDF')?.addEventListener('click', exportarPDF);
  document.getElementById('btnExportarCSV')?.addEventListener('click', exportarCSV);

  // ============================================================================
  // CARGA INICIAL
  // ============================================================================

  try {
    console.log('[REPORTES] 📥 Cargando datos iniciales...');
    const datos = await cargarTodosDatos();
    
    state.allVentas = datos.ventas;
    state.allClientes = datos.clientes;

    const selectCliente = document.getElementById('filterCliente');
    if (selectCliente && state.allClientes.length > 0) {
      selectCliente.innerHTML = '<option value="">Todos los clientes</option>' +
        state.allClientes.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    }

    // Renderizar con datos iniciales
    await renderConFiltros();
    
    console.log('[REPORTES] ✅ Página lista');
  } catch (error) {
    console.error('[REPORTES] ❌ Error:', error);
    toastError('❌ Error cargando reportes');
  }
}

export default ReportesPage;
