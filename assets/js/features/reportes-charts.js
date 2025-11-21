// ============================================================================
// REPORTES-CHARTS.JS - Lógica de Gráficos para Reportes
// ============================================================================

import { 
  createChartConfig, 
  applyChartTheme, 
  groupByPeriod,
  getTopClientes,
  money 
} from './reportes-utils.js';

/**
 * Carga dinámicamente Chart.js
 */
export async function ensureChart() {
  if (window.Chart) return;
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Error cargando Chart.js'));
    document.head.appendChild(script);
  });
}

/**
 * Limpia todas las instancias de Chart.js
 */
export function cleanupCharts() {
  console.log('[CHARTS] Limpiando gráficos');
  
  // Limpiar ventana global
  if (window.chartInstance) {
    try { window.chartInstance.destroy(); window.chartInstance = null; } catch (e) {}
  }
  if (window.chartEstadoInstance) {
    try { window.chartEstadoInstance.destroy(); window.chartEstadoInstance = null; } catch (e) {}
  }
  if (window.chartClientesInstance) {
    try { window.chartClientesInstance.destroy(); window.chartClientesInstance = null; } catch (e) {}
  }

  // Limpiar arrays de Chart.js
  if (window.Chart?.instances) {
    const instancias = Array.from(window.Chart.instances || []);
    instancias.forEach(inst => {
      try { if (inst?.destroy) inst.destroy(); } catch (e) {}
    });
  }
}

/**
 * Renderiza gráfico de ventas por período
 */
export async function renderChartVentas(ventas, period = 'día') {
  try {
    await ensureChart();
    cleanupCharts();

    const canvas = document.getElementById('chartVentas');
    if (!canvas || ventas.length === 0) {
      console.log('[CHARTS] Canvas no disponible o sin datos');
      return;
    }

    const ctx = canvas.getContext('2d');
    let config = createChartConfig(ventas, period);
    config = applyChartTheme(config);

    if (window.chartInstance) {
      try { window.chartInstance.destroy(); } catch (e) {}
    }
    
    window.chartInstance = new window.Chart(ctx, config);
    console.log('[CHARTS] Gráfico de ventas creado');
  } catch (error) {
    console.error('[CHARTS] Error creando gráfico de ventas:', error);
  }
}

/**
 * Renderiza gráfico de distribución por estado
 */
export async function renderChartEstado(ventas) {
  try {
    await ensureChart();

    if (window.chartEstadoInstance) {
      try { window.chartEstadoInstance.destroy(); } catch (e) {}
    }

    const estadoData = {};
    ventas.forEach(v => {
      const estado = v.estado || 'borrador';
      estadoData[estado] = (estadoData[estado] || 0) + 1;
    });

    const canvas = document.getElementById('chartEstado');
    if (!canvas) return;

    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const ctx = canvas.getContext('2d');

    window.chartEstadoInstance = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(estadoData),
        datasets: [{
          data: Object.values(estadoData),
          backgroundColor: [
            'rgba(59, 130, 246, 0.7)',
            'rgba(34, 197, 94, 0.7)',
            'rgba(251, 146, 60, 0.7)',
            'rgba(239, 68, 68, 0.7)'
          ],
          borderColor: isDark ? '#1e293b' : '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: isDark ? '#e2e8f0' : '#374151' },
            position: 'bottom'
          }
        }
      }
    });

    console.log('[CHARTS] Gráfico de estado creado');
  } catch (error) {
    console.error('[CHARTS] Error creando gráfico de estado:', error);
  }
}

/**
 * Renderiza gráfico de top clientes
 */
export async function renderChartClientes(ventas) {
  try {
    await ensureChart();

    if (window.chartClientesInstance) {
      try { window.chartClientesInstance.destroy(); } catch (e) {}
    }

    const topClientes = getTopClientes(ventas, 5);
    if (topClientes.length === 0) return;

    const canvas = document.getElementById('chartClientes');
    if (!canvas) return;

    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const ctx = canvas.getContext('2d');

    window.chartClientesInstance = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: topClientes.map(c => c.name),
        datasets: [{
          label: 'Total Vendido',
          data: topClientes.map(c => c.total),
          backgroundColor: 'rgba(168, 85, 247, 0.7)',
          borderColor: 'rgb(168, 85, 247)',
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: isDark ? '#e2e8f0' : '#374151' }
          }
        },
        scales: {
          x: {
            ticks: {
              color: isDark ? '#cbd5e1' : '#6b7280',
              callback: (v) => money(v)
            }
          },
          y: {
            ticks: {
              color: isDark ? '#cbd5e1' : '#6b7280'
            }
          }
        }
      }
    });

    console.log('[CHARTS] Gráfico de clientes creado');
  } catch (error) {
    console.error('[CHARTS] Error creando gráfico de clientes:', error);
  }
}

/**
 * Renderiza todos los gráficos
 */
export async function renderAllCharts(ventas, period = 'día') {
  if (ventas.length === 0) {
    cleanupCharts();
    return;
  }

  await Promise.all([
    renderChartVentas(ventas, period),
    renderChartEstado(ventas),
    renderChartClientes(ventas)
  ]);
}
