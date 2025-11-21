// assets/js/features/auditoria.js — listado y filtros de bitácora
import { db } from "../firebase.js";
import { auth } from "../firebase.js";
import { PageTemplate } from "../ui/components.js";
import {
  collection, query, orderBy, limit, getDocs, onSnapshot, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { toastSuccess, toastError, toastWarning } from "../utils/alerts.js";

const col = collection(db, "audit");
const fmt = (d) => d?.seconds ? new Date(d.seconds*1000).toLocaleString("es-PE") : "-";
const esc = (s)=>String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

export async function AuditoriaPage(container) {
  container.innerHTML = PageTemplate(
    "Auditoría",
    `
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
      <div class="grid md:grid-cols-4 gap-3 mb-3 items-end">
        <input id="fUser" class="border dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2 rounded" placeholder="filtrar por correo">
        <input id="fEntity" class="border dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2 rounded" placeholder="entidad (ventas, clientes...)">
        <input id="fAction" class="border dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2 rounded" placeholder="acción (venta.create...)">
        <div class="flex gap-2">
          <select id="fLim" class="border dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2 rounded flex-1">
            <option value="50">Últimos 50</option>
            <option value="200">Últimos 200</option>
            <option value="1000">Últimos 1000</option>
          </select>
          <button id="btnLimpiar" class="bg-red-600 hover:bg-red-700 dark:hover:bg-red-700 text-white px-3 py-2 rounded font-semibold whitespace-nowrap">🗑️ Limpiar</button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm dark:text-white">
          <thead class="bg-slate-100 dark:bg-slate-700">
            <tr>
              <th class="p-2 text-left">Fecha</th>
              <th class="p-2 text-left">Usuario</th>
              <th class="p-2 text-left">Rol</th>
              <th class="p-2 text-left">Entidad</th>
              <th class="p-2 text-left">Acción</th>
              <th class="p-2 text-left">ID</th>
              <th class="p-2 text-left">Payload</th>
            </tr>
          </thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
    </div>`
  );

  const rows = container.querySelector("#rows");
  const fUser = container.querySelector("#fUser");
  const fEntity = container.querySelector("#fEntity");
  const fAction = container.querySelector("#fAction");
  const fLim = container.querySelector("#fLim");
  const btnLimpiar = container.querySelector("#btnLimpiar");

  let data = [];

  function render() {
    const u = fUser.value.trim().toLowerCase();
    const e = fEntity.value.trim().toLowerCase();
    const a = fAction.value.trim().toLowerCase();
    const filtered = data.filter(x =>
      (!u || (x.email||"").toLowerCase().includes(u)) &&
      (!e || (x.entity||"").toLowerCase().includes(e)) &&
      (!a || (x.action||"").toLowerCase().includes(a))
    );
    rows.innerHTML = filtered.map(x => `
      <tr class="border-b dark:border-slate-700 align-top hover:bg-slate-50 dark:hover:bg-slate-700">
        <td class="p-2 whitespace-nowrap">${fmt(x.ts)}</td>
        <td class="p-2">${x.email || "-"}</td>
        <td class="p-2">${x.role || "-"}</td>
        <td class="p-2">${x.entity || "-"}</td>
        <td class="p-2">${x.action || "-"}</td>
        <td class="p-2">${x.entityId || "-"}</td>
        <td class="p-2">${esc(JSON.stringify(x.payload || {}, null, 0))}</td>
      </tr>`).join("");
  }

  function subscribe() {
    // Solo escuchar si autenticado
    if (!auth.currentUser) {
      console.warn("⚠️  Usuario no autenticado");
      return () => {};
    }

    const lim = Number(fLim.value)||50;
    const q = query(col, orderBy("ts","desc"), limit(lim));
    
    // Listener en tiempo real (reemplaza polling)
    const unsub = onSnapshot(
      q,
      (snap) => {
        data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        render();
      },
      (err) => {
        console.error("❌ Error en listener de auditoría:", err);
        rows.innerHTML = `<tr><td colspan="7" class="p-2 text-red-500">Error: ${err.message}</td></tr>`;
      }
    );

    return unsub;
  }

  let unsubscribe = subscribe();
  [fLim,fUser,fEntity,fAction].forEach(el=>{
    el.addEventListener("input", ()=>{
      if (el===fLim) { 
        unsubscribe(); 
        unsubscribe = subscribe(); 
      } else { 
        render(); 
      }
    });
  });

  // Cleanup
  if (window._auditoriaUnsubscribe) {window._auditoriaUnsubscribe();}
  window._auditoriaUnsubscribe = unsubscribe;

  // Botón para limpiar auditoría
  btnLimpiar.addEventListener("click", async () => {
    if (!confirm("⚠️ ¿Eliminar TODO el historial de auditoría? Esta acción NO se puede deshacer.")) {
      return;
    }
    
    btnLimpiar.disabled = true;
    btnLimpiar.textContent = "🔄 Limpiando...";
    
    try {
      const q = query(col, orderBy("ts", "desc"));
      const snap = await getDocs(q);
      let count = 0;
      
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
        count++;
      }
      
      data = [];
      render();
      toastSuccess(`✅ Eliminados ${count} registros de auditoría`);
    } catch (err) {
      console.error("Error al limpiar auditoría:", err);
      toastError("❌ Error: " + err.message);
    } finally {
      btnLimpiar.disabled = false;
      btnLimpiar.textContent = "🗑️ Limpiar";
    }
  });
}
