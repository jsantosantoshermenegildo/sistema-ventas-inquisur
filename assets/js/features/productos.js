// features/productos.js — CRUD de productos con Firestore
import { db } from "../firebase.js";
import { logAudit } from "../utils/audit.js";
import { auth } from "../firebase.js";
import { toastSuccess, toastError, toastWarning } from "../utils/alerts.js";
import { importFromCSV } from "../utils/csv.js";
import { logger } from "../utils/logger.js";
import { getNextProductoCode } from "../utils/codeGenerator.js";
import { lifecycleManager } from "../core/LifecycleManager.js";
import { AUDIT_ACTIONS, COLLECTIONS } from "../constants/index.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { PageTemplate } from "../ui/components.js";

const colRef = collection(db, COLLECTIONS.PRODUCTOS);

// Render principal
export async function ProductosPage(container) {
  const lifecycle = lifecycleManager.create('productos');
  container.innerHTML = PageTemplate(
    "Productos",
    `
      <form id="formProducto" class="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg mb-6 grid gap-3 md:grid-cols-2">
        <input id="codigo" type="text" placeholder="Código (auto)" readonly class="border dark:border-slate-600 dark:bg-slate-800 dark:text-white p-2 rounded bg-slate-200 dark:bg-slate-700 cursor-not-allowed">
        <input id="nombre" type="text" placeholder="Nombre del producto" required class="border dark:border-slate-600 dark:bg-slate-800 dark:text-white p-2 rounded">
        <input id="precio" type="number" placeholder="Precio" min="0" step="0.01" required class="border dark:border-slate-600 dark:bg-slate-800 dark:text-white p-2 rounded">
        <input id="stock" type="number" placeholder="Stock" min="0" required class="border dark:border-slate-600 dark:bg-slate-800 dark:text-white p-2 rounded">
        <input id="impuesto" type="number" placeholder="Impuesto (%)" min="0" max="100" step="1" value="0" class="border dark:border-slate-600 dark:bg-slate-800 dark:text-white p-2 rounded">
        <label class="flex items-center gap-2 col-span-2 dark:text-white"><input id="activo" type="checkbox" checked> Activo</label>
        <button class="col-span-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">Guardar producto</button>
      </form>

      <div class="mb-4 flex gap-2">
        <label class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded cursor-pointer font-semibold">
          📥 Importar CSV
          <input id="importCSV" type="file" accept=".csv" style="display: none;">
        </label>
      </div>

      <div id="productosList" class="overflow-x-auto"></div>
    `
  );

  // Evento del formulario
  const form = document.getElementById("formProducto");
  const inputCodigo = document.getElementById("codigo");

  // Llenar código automáticamente SOLO la primera vez
  let codigoLlenado = false;
  async function llenarCodigoSiEsNecesario() {
    if (!codigoLlenado && !inputCodigo.value) {
      try {
        const nextCode = await getNextProductoCode();
        inputCodigo.value = nextCode;
        codigoLlenado = true;
      } catch (error) {
        logger.error('[PRODUCTOS] Error obteniendo código:', error);
      }
    }
  }

  lifecycle.addEventListener(form, "focus", llenarCodigoSiEsNecesario, true);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      codigo: String(form.codigo.value || "").trim(),
      nombre: String(form.nombre.value || "").trim(),
      precio: Math.max(0, Number(form.precio.value || 0)),
      stock: Math.max(0, Number(form.stock.value || 0)),
      impuesto: Math.max(0, Math.min(100, Number(form.impuesto.value || 0))),
      activo: form.activo?.checked ?? true,
      createdBy: auth.currentUser?.uid || null,
      createdAt: serverTimestamp(),
    };

    if (!data.codigo || !data.nombre || data.precio <= 0 || data.stock < 0) {
      toastWarning("⚠️ Verifica los datos. Precio > 0 y stock ≥ 0.");
      return;
    }

    try {
      // Generar código en la transacción
      const codigo = await getNextProductoCode();
      data.codigo = codigo;
      inputCodigo.value = codigo;
      
      await addDoc(colRef, data);
      
      await logAudit({ 
        action: AUDIT_ACTIONS.PRODUCTO_CREATE, 
        entity: COLLECTIONS.PRODUCTOS, 
        payload: { codigo: data.codigo, nombre: data.nombre } 
      });
      
      toastSuccess("✅ Producto guardado correctamente");
      logger.success('[PRODUCTOS] Producto creado:', data.codigo);
      
      form.reset();
      form.activo.checked = true;
      codigoLlenado = false;
    } catch (err) {
      logger.error('[PRODUCTOS] Error al guardar:', err);
      toastError("❌ Error al guardar: " + err.message);
    }
  });

  // Escucha en tiempo real
  // IMPORTANTE: Solo escuchar si el usuario está autenticado
  if (!auth.currentUser) {
    console.warn("⚠️  Usuario no autenticado. Esperando...");
    document.getElementById("productosList").innerHTML = `<p class="text-yellow-500">Cargando...</p>`;
    return;
  }

  // Listener en tiempo real
  const unsubscribe = onSnapshot(
    query(colRef, orderBy("codigo")),
    (snap) => {
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderTabla(list);
      logger.success("✅ Productos actualizados (listener)");
    },
    (err) => {
      logger.error("❌ Error en listener de productos:", err);
      document.getElementById("productosList").innerHTML = `<p class="text-red-500">Error al cargar: ${err.message}</p>`;
    }
  );

  // Registrar cleanup
  lifecycle.addFirestoreUnsubscriber(unsubscribe);

  // Importar desde CSV (input #importCSV)
  const importInput = container.querySelector("#importCSV");
  if (importInput) {
    importInput.addEventListener("change", async (ev) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      try {
        const rows = await importFromCSV(file);
        let created = 0;
        for (const r of rows) {
          const data = {
            codigo: String(r.codigo || r.Codigo || r.C\u00f3digo || r.CODIGO || "").trim(),
            nombre: String(r.nombre || r.Nombre || "").trim(),
            precio: Number(r.precio || r.Precio || 0) || 0,
            stock: Number(r.stock || r.Stock || 0) || 0,
            impuesto: Number(r.impuesto || r.Impuesto || 0) || 0,
            activo: String(r.activo || r.Activo || "true").toLowerCase() === "true",
            createdBy: auth.currentUser?.uid || null,
            createdAt: serverTimestamp(),
          };

          if (!data.codigo) {
            data.codigo = await getNextProductoCode();
            // incrementaremos el contador quando se guarde
            try {
              await addDoc(colRef, data);
              await incrementProductoCode();
              created++;
            } catch (err) {
              console.error("Error importando producto (auto-codigo):", err);
            }
          } else {
            try {
              await addDoc(colRef, data);
              created++;
            } catch (err) {
              console.error("Error importando producto:", err);
            }
          }
        }
        toastSuccess(`✅ Importados ${created} productos`);
      } catch (err) {
        toastError("❌ Error al importar CSV: " + err.message);
      } finally {
        importInput.value = "";
      }
    });
  }
}

// Render de la tabla
function renderTabla(data) {
  const div = document.getElementById("productosList");

  if (!div) return; // Protección si el contenedor no existe
  if (data.length === 0) {
    div.innerHTML = `<p class="text-slate-500">Sin productos registrados.</p>`;
    return;
  }

  const rows = data
    .map(
      (p) => `
      <tr class="border-b dark:border-slate-700 dark:hover:bg-slate-700 hover:bg-slate-100">
        <td class="p-2">${p.codigo}</td>
        <td class="p-2">${p.nombre}</td>
        <td class="p-2 text-right">$${p.precio.toFixed(2)}</td>
        <td class="p-2 text-right">${p.stock}</td>
        <td class="p-2 text-right">${p.impuesto}%</td>
        <td class="p-2 text-center">${p.activo ? "✅" : "❌"}</td>
        <td class="p-2 flex gap-2">
          <button class="text-blue-600 underline" onclick="editProducto('${p.id}')">Editar</button>
          <button class="text-red-600 underline" onclick="deleteProducto('${p.id}')">Eliminar</button>
        </td>
      </tr>`
    )
    .join("");

  div.innerHTML = `
    <table class="w-full bg-white dark:bg-slate-800 rounded-lg shadow border dark:border-slate-700">
      <thead class="bg-slate-200 dark:bg-slate-700 dark:text-white text-left">
        <tr>
          <th class="p-2">Código</th>
          <th class="p-2">Nombre</th>
          <th class="p-2">Precio</th>
          <th class="p-2">Stock</th>
          <th class="p-2">Impuesto</th>
          <th class="p-2">Activo</th>
          <th class="p-2">Acciones</th>
        </tr>
      </thead>
      <tbody class="dark:text-white">${rows}</tbody>
    </table>
  `;
}

// Funciones globales (para botones editar/eliminar)
window.deleteProducto = async (id) => {
  if (!confirm("¿Eliminar este producto?")) return;
  try {
    await deleteDoc(doc(db, "productos", id));
    await logAudit({ action: "producto.delete", entity: "productos", entityId: id });
    toastSuccess("🗑️ Producto eliminado");
  } catch (err) {
    toastError("❌ Error al eliminar: " + err.message);
  }
};

window.editProducto = async (id) => {
  const ref = doc(db, "productos", id);
  const nombre = prompt("Nuevo nombre del producto:");
  const precio = prompt("Nuevo precio:");
  if (!nombre || isNaN(precio)) {
    toastWarning("❌ Datos inválidos.");
    return;
  }
  try {
    await updateDoc(ref, { nombre, precio: parseFloat(precio), updatedAt: serverTimestamp() });
    await logAudit({ action: "producto.update", entity: "productos", entityId: id, payload: { nombre, precio } });
    toastSuccess("✏️ Producto actualizado");
  } catch (err) {
    toastError("❌ Error al actualizar: " + err.message);
  }
};
