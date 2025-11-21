import { db } from "../firebase.js";
import { auth } from "../firebase.js";
import { PageTemplate } from "../ui/components.js";
import { logAudit } from "../utils/audit.js";
import { toastSuccess, toastError, toastWarning } from "../utils/alerts.js";
import { consultarSUNAT } from "../utils/sunat.js";
import {
  collection, addDoc, deleteDoc, doc, updateDoc, 
  query, where, limit, getDocs, orderBy, serverTimestamp, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const colRef = collection(db, "clientes");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const phoneRegex = /^[0-9]{6,15}$/;
const dniRucRegex = /^[0-9]{8,11}$/; // DNI: 8 dígitos, RUC: 11 dígitos
const cleanPhone = (s) => String(s || "").replace(/\D/g, "");
const cleanEmail = (s) => String(s || "").trim().toLowerCase();

function validCliente({ nombre }) {
  return String(nombre||"").trim().length >= 2;
}

function highlight(text, term) {
  if (!term) return text;
  const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")})`, "ig");
  return text.replace(re, `<mark class="bg-yellow-200">$1</mark>`);
}

export async function ClientesPage(container) {
  container.innerHTML = PageTemplate("Clientes", `
    <div class="space-y-4">
      <!-- Búsqueda por DNI/RUC -->
      <div class="bg-indigo-50 dark:bg-indigo-900 rounded-lg p-4">
        <h3 class="font-semibold mb-3 dark:text-white">🔍 Buscar por DNI/RUC</h3>
        <div class="flex gap-2">
          <input id="searchDniRuc" type="text" placeholder="Ingresa DNI (8) o RUC (11)" maxlength="11" class="border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2 rounded-lg flex-1 focus:border-indigo-600 focus:outline-none">
          <button id="btnConsultarSUNAT" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-700 font-semibold">Consultar SUNAT</button>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">💡 Automáticamente completará los datos del cliente</p>
      </div>

      <!-- Formulario de cliente -->
      <form id="formCliente" class="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg grid gap-3 md:grid-cols-4">
        <input id="nombre" type="text" placeholder="Nombre completo" required class="border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white p-2 rounded-lg md:col-span-2 focus:border-indigo-600 focus:outline-none">
        <input id="dniRuc" type="text" placeholder="DNI/RUC" maxlength="11" class="border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white p-2 rounded-lg focus:border-indigo-600 focus:outline-none">
        <input id="email" type="email" placeholder="Correo (opcional)" class="border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white p-2 rounded-lg focus:border-indigo-600 focus:outline-none">
        <input id="telefono" type="tel" placeholder="Teléfono (opcional)" class="border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white p-2 rounded-lg focus:border-indigo-600 focus:outline-none">
        <input id="direccion" type="text" placeholder="Dirección" class="border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white p-2 rounded-lg md:col-span-2 focus:border-indigo-600 focus:outline-none">
        <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 font-semibold md:col-span-2">💾 Guardar Cliente</button>
      </form>
    </div>

    <div class="flex items-center justify-between mb-2 mt-4">
      <input id="search" class="border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2 w-full max-w-sm focus:border-indigo-600 focus:outline-none" placeholder="🔎 Buscar por nombre, email o teléfono">
      <span id="count" class="text-sm text-slate-500 dark:text-slate-400 ml-3"></span>
    </div>
    <div id="clientesList" class="overflow-x-auto"></div>
  `);

  const form = container.querySelector("#formCliente");
  const btnConsultarSUNAT = container.querySelector("#btnConsultarSUNAT");
  const searchDniRuc = container.querySelector("#searchDniRuc");

  // Consultar SUNAT
  btnConsultarSUNAT.addEventListener("click", async () => {
    const dniRuc = searchDniRuc.value.trim();
    if (!dniRucRegex.test(dniRuc)) {
      return toastWarning("⚠️ Ingresa un DNI (8 dígitos) o RUC (11 dígitos)");
    }

    toastWarning("⏳ Consultando SUNAT...");
    try {
      const datos = await consultarSUNAT(dniRuc);
      
      if (datos) {
        form.nombre.value = datos.nombre || "";
        form.email.value = datos.email || "";
        form.telefono.value = datos.telefono || "";
        form.direccion.value = datos.direccion || "";
        form.dniRuc.value = dniRuc;
        toastSuccess("✅ Datos traídos de SUNAT");
        form.nombre.focus();
      } else {
        toastError("❌ No se encontraron datos en SUNAT");
      }
    } catch (err) {
      console.error("Error consultando SUNAT:", err);
      toastError("❌ Error: " + err.message);
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      nombre: form.nombre.value.trim(),
      dniRuc: form.dniRuc.value.trim(),
      email: form.email.value ? cleanEmail(form.email.value) : "",
      telefono: cleanPhone(form.telefono.value),
      direccion: String(form.direccion.value || "").trim(),
      createdBy: auth.currentUser?.uid || null,
      createdAt: serverTimestamp(), 
      updatedAt: serverTimestamp(),
    };
    
    if (!validCliente(data)) return toastWarning("⚠️ Verifica: nombre requerido");

    try {
      // Verificar duplicados por DNI/RUC si existe
      if (data.dniRuc) {
        const dupQ = query(colRef, where("dniRuc","==",data.dniRuc), limit(1));
        const dupSnap = await getDocs(dupQ);
        if (!dupSnap.empty) return toastWarning("⚠️ Ya existe un cliente con ese DNI/RUC.");
      }

      // Verificar duplicados por email si existe
      if (data.email) {
        const dupQ = query(colRef, where("email","==",data.email), limit(1));
        const dupSnap = await getDocs(dupQ);
        if (!dupSnap.empty) return toastWarning("⚠️ Ya existe un cliente con ese correo.");
      }

      const ref = await addDoc(colRef, data);
      await logAudit({ action:"cliente.create", entity:"clientes", entityId: ref.id, payload:{ dniRuc: data.dniRuc, nombre: data.nombre }});
      toastSuccess("✅ Cliente guardado correctamente");
      form.reset(); 
      searchDniRuc.value = "";
      form.nombre.focus();
    } catch (err) {
      toastError("❌ Error al guardar: " + (err?.message || err));
    }
  });

  const listDiv = container.querySelector("#clientesList");
  const search = container.querySelector("#search");
  const count = container.querySelector("#count");
  let data = [];
  let unsubscribe = () => {};

  // Solo escuchar si autenticado
  if (!auth.currentUser) {
    console.warn("⚠️  Usuario no autenticado");
    listDiv.innerHTML = `<p class="text-yellow-500">Cargando...</p>`;
    return;
  }

  // Listener en tiempo real (reemplaza polling)
  unsubscribe = onSnapshot(
    query(colRef, orderBy("nombre")),
    (snap) => {
      data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderTabla();
      console.log("✅ Clientes actualizados (listener)");
    },
    (err) => {
      console.error("❌ Error en listener de clientes:", err);
      listDiv.innerHTML = `<p class="text-red-500">Error: ${err.message}</p>`;
    }
  );

  // Cleanup al navegar
  window.addEventListener("beforeunload", () => unsubscribe());
  if (window._clientesUnsubscribe) window._clientesUnsubscribe();
  window._clientesUnsubscribe = unsubscribe;

  search.addEventListener("input", renderTabla);

  function renderTabla() {
    const term = search.value.trim().toLowerCase();
    const filtered = term ? data.filter(c =>
      [c.nombre,c.email,c.telefono,c.direccion].map(x=>String(x||"").toLowerCase()).some(s=>s.includes(term))
    ) : data;

    count.textContent = `${filtered.length} de ${data.length}`;
    if (!filtered.length) { listDiv.innerHTML = `<p class="text-slate-500">Sin clientes registrados.</p>`; return; }

    const rows = filtered.map(c => `
      <tr class="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700" data-id="${c.id}">
        <td class="p-2"><span class="view dark:text-white">${highlight(c.nombre||"-",term)}</span><input class="edit border dark:border-slate-600 dark:bg-slate-700 dark:text-white p-1 rounded w-full hidden" value="${c.nombre||""}"></td>
        <td class="p-2"><span class="view dark:text-white">${highlight(c.email||"-",term)}</span><input class="edit border dark:border-slate-600 dark:bg-slate-700 dark:text-white p-1 rounded w-full hidden" value="${c.email||""}"></td>
        <td class="p-2"><span class="view dark:text-white">${highlight(c.telefono||"-",term)}</span><input class="edit border dark:border-slate-600 dark:bg-slate-700 dark:text-white p-1 rounded w-full hidden" value="${c.telefono||""}"></td>
        <td class="p-2"><span class="view dark:text-white">${highlight(c.direccion||"-",term)}</span><input class="edit border dark:border-slate-600 dark:bg-slate-700 dark:text-white p-1 rounded w-full hidden" value="${c.direccion||""}"></td>
        <td class="p-2 flex gap-2">
          <button class="btnEditar text-blue-600 dark:text-blue-400 underline">Editar</button>
          <button class="btnGuardar hidden bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700 dark:hover:bg-emerald-700">Guardar</button>
          <button class="btnCancelar hidden text-slate-600 dark:text-slate-400 underline">Cancelar</button>
          <button class="btnEliminar text-red-600 dark:text-red-400 underline">Eliminar</button>
        </td>
      </tr>`).join("");

    listDiv.innerHTML = `<table class="w-full bg-white dark:bg-slate-800 rounded-lg shadow border dark:border-slate-700">
      <thead class="bg-slate-200 dark:bg-slate-700 dark:text-white text-left"><tr>
        <th class="p-2">Nombre</th><th class="p-2">Email</th><th class="p-2">Teléfono</th><th class="p-2">Dirección</th><th class="p-2">Acciones</th>
      </tr></thead><tbody>${rows}</tbody></table>`;
  }

  listDiv.addEventListener("click", async (e) => {
    const tr = e.target.closest("tr[data-id]"); if (!tr) return;
    const id = tr.dataset.id;
    const setEditMode = (on) => {
      tr.querySelectorAll(".view").forEach(el=>el.classList.toggle("hidden",on));
      tr.querySelectorAll(".edit").forEach(el=>el.classList.toggle("hidden",!on));
      tr.querySelector(".btnEditar")?.classList.toggle("hidden",on);
      tr.querySelector(".btnEliminar")?.classList.toggle("hidden",on);
      tr.querySelector(".btnGuardar")?.classList.toggle("hidden",!on);
      tr.querySelector(".btnCancelar")?.classList.toggle("hidden",!on);
    };

    if (e.target.classList.contains("btnEditar")) { setEditMode(true); tr.querySelector(".edit")?.focus(); return; }
    if (e.target.classList.contains("btnCancelar")) { setEditMode(false); renderTabla(); return; }

    if (e.target.classList.contains("btnGuardar")) {
      const inputs = tr.querySelectorAll(".edit");
      const payload = {
        nombre: String(inputs[0].value||"").trim(),
        email: cleanEmail(inputs[1].value),
        telefono: cleanPhone(inputs[2].value),
        direccion: String(inputs[3].value||"").trim(),
        updatedAt: serverTimestamp(),
      };
      if (!validCliente(payload)) return alert("❌ Datos inválidos.");

      const originalEmail = tr.querySelectorAll(".view")[1]?.textContent || "";
      if (cleanEmail(originalEmail) !== payload.email) {
        const dupQ = query(colRef, where("email","==",payload.email), limit(1));
        const dupSnap = await getDocs(dupQ);
        if (!dupSnap.empty) return alert("⚠️ Ya existe otro cliente con ese correo.");
      }
      try {
        await updateDoc(doc(db,"clientes",id), payload);
        await logAudit({ action:"cliente.update", entity:"clientes", entityId:id, payload });
        setEditMode(false);
      } catch (err) {
        alert("❌ Error al actualizar: " + (err?.message || err));
      }
      return;
    }

    if (e.target.classList.contains("btnEliminar")) {
      if (!confirm("¿Eliminar este cliente?")) return;
      try {
        await deleteDoc(doc(db,"clientes",id));
        await logAudit({ action:"cliente.delete", entity:"clientes", entityId:id });
      } catch (err) {
        alert("❌ Error al eliminar: " + (err?.message || err));
      }
    }
  });
}
