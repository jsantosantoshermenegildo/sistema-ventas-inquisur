// assets/js/features/dashboard.js — Dashboard analítico con KPIs
import { db, auth } from "../firebase.js";
import { PageTemplate } from "../ui/components.js";
import {
  collection, getDocs, Timestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const money = n => (Number(n)||0).toLocaleString("es-PE",{style:"currency",currency:"PEN"});
const toDate = (any) => {
  if (!any) return null;
  if (any instanceof Date) return any;
  if (any instanceof Timestamp) return any.toDate();
  if (any.seconds) return new Date(any.seconds * 1000);
  const d = new Date(any);
  return isNaN(d) ? null : d;
};

// Carga perezosa de Chart.js
async function ensureChart() {
  if (window.Chart) return;
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("No se pudo cargar Chart.js"));
    document.head.appendChild(s);
  });
}

export async function DashboardPage(container) {
  let chartIngresos = null;
  let chartProductos = null;

  const cleanup = () => {
    if (chartIngresos) { try { chartIngresos.destroy(); } catch (e) {} chartIngresos = null; }
    if (chartProductos) { try { chartProductos.destroy(); } catch (e) {} chartProductos = null; }
    if (window.Chart?.instances?.length > 0) {
      while (window.Chart.instances.length > 0) {
        try { window.Chart.instances[0].destroy(); } catch (e) {}
        window.Chart.instances.pop();
      }
    }
  };

  container.innerHTML = PageTemplate(
    "Dashboard",
    `
    <div class="space-y-6">
      <!-- KPIs Principales -->
      <div class="grid md:grid-cols-4 gap-4">
        <div class="bg-gradient-to-br from-indigo-400 to-indigo-600 text-white rounded-lg p-6 shadow-lg">
          <p class="text-sm opacity-90">Total Ingresos (Últimos 30 días)</p>
          <p class="text-3xl font-bold mt-2" id="kpiIngresos">S/ 0.00</p>
          <p class="text-xs mt-2 opacity-75" id="kpiIngresosPct">+0%</p>
        </div>
        
        <div class="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-lg p-6 shadow-lg">
          <p class="text-sm opacity-90">Total Clientes</p>
          <p class="text-3xl font-bold mt-2" id="kpiClientes">0</p>
          <p class="text-xs mt-2 opacity-75">Registrados en el sistema</p>
        </div>
        
        <div class="bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-lg p-6 shadow-lg">
          <p class="text-sm opacity-90">Productos Activos</p>
          <p class="text-3xl font-bold mt-2" id="kpiProductos">0</p>
          <p class="text-xs mt-2 opacity-75">En el catálogo</p>
        </div>
        
        <div class="bg-gradient-to-br from-pink-400 to-pink-600 text-white rounded-lg p-6 shadow-lg">
          <p class="text-sm opacity-90">Transacciones</p>
          <p class="text-3xl font-bold mt-2" id="kpiTransacciones">0</p>
          <p class="text-xs mt-2 opacity-75">Ventas + Proformas</p>
        </div>
      </div>

      <!-- Gráficos -->
      <div class="grid md:grid-cols-2 gap-4">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
          <h3 class="font-bold mb-3 dark:text-white">📈 Ingresos por Día (Últimos 30 días)</h3>
          <canvas id="chartIngresos" style="max-height: 300px;"></canvas>
        </div>
        
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
          <h3 class="font-bold mb-3 dark:text-white">🏆 Top 5 Productos Más Vendidos</h3>
          <canvas id="chartProductos" style="max-height: 300px;"></canvas>
        </div>
      </div>

      <!-- Tabla de Clientes Top -->
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <h3 class="font-bold mb-3 dark:text-white">👥 Top Clientes por Ingresos</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm dark:text-white">
            <thead class="bg-slate-100 dark:bg-slate-700">
              <tr>
                <th class="p-2 text-left">Cliente</th>
                <th class="p-2 text-center">Compras</th>
                <th class="p-2 text-right">Total Gastado</th>
                <th class="p-2 text-right">Promedio</th>
              </tr>
            </thead>
            <tbody id="tablaClientes"></tbody>
          </table>
        </div>
      </div>

      <!-- Resumen General -->
      <div class="grid md:grid-cols-3 gap-4">
        <div class="bg-blue-50 dark:bg-slate-700 p-4 rounded-lg dark:text-white">
          <p class="text-sm font-semibold">Vend Estado: Pagadas</p>
          <p class="text-2xl font-bold mt-1" id="ventasPagadas">S/ 0.00</p>
        </div>
        
        <div class="bg-yellow-50 dark:bg-slate-700 p-4 rounded-lg dark:text-white">
          <p class="text-sm font-semibold">Proformas: Confirmadas</p>
          <p class="text-2xl font-bold mt-1" id="proformasConfirmadas">0</p>
        </div>
        
        <div class="bg-red-50 dark:bg-slate-700 p-4 rounded-lg dark:text-white">
          <p class="text-sm font-semibold">Ventas: Canceladas</p>
          <p class="text-2xl font-bold mt-1" id="ventasCanceladas">S/ 0.00</p>
        </div>
      </div>
    </div>
    `
  );

  try {
    await ensureChart();

    // Cargar datos
    const [snapVentas, snapProformas, snapClientes, snapProductos] = await Promise.all([
      getDocs(collection(db, "ventas")),
      getDocs(collection(db, "proformas")),
      getDocs(collection(db, "clientes")),
      getDocs(collection(db, "productos"))
    ]);

    const ventas = snapVentas.docs.map(d => ({ id: d.id, ...d.data() }));
    const proformas = snapProformas.docs.map(d => ({ id: d.id, ...d.data() }));
    const clientes = snapClientes.docs.map(d => ({ id: d.id, ...d.data() }));
    const productos = snapProductos.docs.map(d => ({ id: d.id, ...d.data() }));

    const hace30dias = new Date();
    hace30dias.setDate(hace30dias.getDate() - 30);

    // Filtrar últimos 30 días
    const ventasRecientes = ventas.filter(v => toDate(v.createdAt) >= hace30dias && v.estado === "pagada");
    const proformasRecientes = proformas.filter(p => toDate(p.createdAt) >= hace30dias);

    // KPIs
    const totalIngresos = ventasRecientes.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
    const cantClientes = clientes.length;
    const cantProductos = productos.filter(p => p.activo !== false).length;
    const cantTransacciones = ventas.length + proformas.length;

    document.querySelector("#kpiIngresos").textContent = money(totalIngresos);
    document.querySelector("#kpiClientes").textContent = cantClientes;
    document.querySelector("#kpiProductos").textContent = cantProductos;
    document.querySelector("#kpiTransacciones").textContent = cantTransacciones;

    // Gráfico de ingresos diarios
    const ingresosPorDia = {};
    ventasRecientes.forEach(v => {
      const fecha = toDate(v.createdAt).toLocaleDateString("es-PE");
      ingresosPorDia[fecha] = (ingresosPorDia[fecha] || 0) + (Number(v.total) || 0);
    });

    const diasLabels = Object.keys(ingresosPorDia).sort();
    const diasData = diasLabels.map(d => ingresosPorDia[d]);

    const chartIngresos = new window.Chart(document.querySelector("#chartIngresos"), {
      type: "line",
      data: {
        labels: diasLabels,
        datasets: [{
          label: "Ingresos",
          data: diasData,
          borderColor: "rgba(99, 102, 241, 1)",
          backgroundColor: "rgba(99, 102, 241, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: { responsive: true, plugins: { legend: { display: true } } }
    });

    // Top productos vendidos
    const productoVentas = {};
    ventas.forEach(v => {
      if (Array.isArray(v.items)) {
        v.items.forEach(item => {
          const key = item.codigo;
          productoVentas[key] = (productoVentas[key] || 0) + item.cant;
        });
      }
    });

    const topProds = Object.entries(productoVentas)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const chartProductos = new window.Chart(document.querySelector("#chartProductos"), {
      type: "doughnut",
      data: {
        labels: topProds.map(p => p[0]),
        datasets: [{
          data: topProds.map(p => p[1]),
          backgroundColor: [
            "rgba(255, 99, 132, 0.8)",
            "rgba(54, 162, 235, 0.8)",
            "rgba(255, 206, 86, 0.8)",
            "rgba(75, 192, 192, 0.8)",
            "rgba(153, 102, 255, 0.8)"
          ]
        }]
      },
      options: { responsive: true }
    });

    // Top clientes
    const clienteGastos = {};
    ventas.forEach(v => {
      const cliente = v.clienteNombre || "Sin nombre";
      if (!clienteGastos[cliente]) {
        clienteGastos[cliente] = { compras: 0, total: 0 };
      }
      clienteGastos[cliente].compras += 1;
      clienteGastos[cliente].total += Number(v.total) || 0;
    });

    const topClientes = Object.entries(clienteGastos)
      .map(([nombre, data]) => ({
        nombre,
        ...data,
        promedio: data.total / data.compras
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const tablaHTML = topClientes.map(c => `
      <tr class="border-b dark:border-slate-600">
        <td class="p-2"><strong>${c.nombre}</strong></td>
        <td class="p-2 text-center">${c.compras}</td>
        <td class="p-2 text-right">${money(c.total)}</td>
        <td class="p-2 text-right">${money(c.promedio)}</td>
      </tr>
    `).join("");

    document.querySelector("#tablaClientes").innerHTML = tablaHTML;

    // Resumen adicional
    const ventasPagadas = ventas.filter(v => v.estado === "pagada")
      .reduce((sum, v) => sum + (Number(v.total) || 0), 0);
    const proformasConfirmadas = proformas.filter(p => p.estado === "confirmada").length;
    const ventasCanceladas = ventas.filter(v => v.estado === "cancelada")
      .reduce((sum, v) => sum + (Number(v.total) || 0), 0);

    document.querySelector("#ventasPagadas").textContent = money(ventasPagadas);
    document.querySelector("#proformasConfirmadas").textContent = proformasConfirmadas;
    document.querySelector("#ventasCanceladas").textContent = money(ventasCanceladas);

  } catch (err) {
    console.error("Error en dashboard:", err);
    container.innerHTML += `<p class="text-red-500">❌ Error: ${err.message}</p>`;
  }

  // Observer para limpiar al navegar
  const observer = new MutationObserver(() => cleanup());
  observer.observe(container, { childList: true, subtree: true });
}
