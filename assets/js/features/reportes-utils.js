// ============================================================================
// REPORTES-UTILS.JS - Utilidades Compartidas para Reportes
// ============================================================================

/**
 * Convierte timestamp de Firebase a objeto Date
 */
export function toDate(timestamp) {
  if (!timestamp) {return null;}
  if (timestamp instanceof Date) {return timestamp;}
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return new Date(timestamp);
}

/**
 * Formatea número como moneda
 */
export function money(value) {
  if (!value) {return 'S/. 0.00';}
  return `S/. ${parseFloat(value).toFixed(2)}`;
}

/**
 * Agrupa datos por período (día, semana, mes)
 */
export function groupByPeriod(data, period) {
  const grouped = {};

  data.forEach(item => {
    const date = toDate(item.fechaVenta);
    if (!date) {return;}

    let key;
    if (period === 'día') {
      key = date.toLocaleDateString('es-PE');
    } else if (period === 'semana') {
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      key = `Semana ${startOfWeek.toLocaleDateString('es-PE')}`;
    } else if (period === 'mes') {
      key = date.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
    } else {
      key = date.toLocaleDateString('es-PE');
    }

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });

  return grouped;
}

/**
 * Obtiene top N clientes por ventas
 */
export function getTopClientes(ventas, limit = 5) {
  const clienteData = {};

  ventas.forEach(v => {
    const cliente = v.clienteNombre || 'Desconocido';
    clienteData[cliente] = (clienteData[cliente] || 0) + (v.total || 0);
  });

  return Object.entries(clienteData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, total]) => ({ name, total }));
}

/**
 * Crea configuración para gráfico Chart.js de ventas
 */
export function createChartConfig(data, period) {
  const grouped = groupByPeriod(data, period);
  const labels = Object.keys(grouped);
  const totales = Object.values(grouped).map(group =>
    group.reduce((sum, item) => sum + (item.total || 0), 0)
  );

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Total de Ventas',
          data: totales,
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Monto (S/.)',
          },
        },
      },
    },
  };
}

/**
 * Aplica tema oscuro/claro a opciones de Chart.js
 */
export function applyChartTheme(config) {
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  
  config.options = config.options || {};
  config.options.plugins = config.options.plugins || {};
  config.options.plugins.legend = {
    labels: { color: isDark ? '#e2e8f0' : '#374151' },
  };
  config.options.scales = config.options.scales || {};
  config.options.scales.y = config.options.scales.y || {};
  config.options.scales.y.ticks = {
    color: isDark ? '#cbd5e1' : '#6b7280',
    callback: (v) => money(v),
  };
  config.options.scales.x = config.options.scales.x || {};
  config.options.scales.x.ticks = {
    color: isDark ? '#cbd5e1' : '#6b7280',
  };

  return config;
}

/**
 * Formatea Timestamp de Firestore para mostrar
 */
export function formatDate(timestamp) {
  const date = toDate(timestamp);
  if (!date) {return 'N/A';}
  return date.toLocaleDateString('es-PE');
}

/**
 * Calcula estadísticas de ventas
 */
export function calcularEstadisticas(ventas) {
  const total = ventas.reduce((sum, v) => sum + (v.total || 0), 0);
  const cantidad = ventas.length;
  const promedio = cantidad > 0 ? total / cantidad : 0;

  return { total, cantidad, promedio };
}
