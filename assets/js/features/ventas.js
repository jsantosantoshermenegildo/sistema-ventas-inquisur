// assets/js/features/ventas.js — Ventas desde proformas + correlativo + stock + PDF
import { db, auth } from "../firebase.js";
import { PageTemplate } from "../ui/components.js";
import { logAudit } from "../utils/audit.js";
import { toastSuccess, toastError, toastInfo, toastWarning } from "../utils/alerts.js";
import { SCHEMAS } from "../rules/schemas.js";
import { escapeHtml } from "../utils/sanitize.js";
import {
  collection, getDocs, getDoc, doc, query, orderBy, limit, where,
  addDoc, updateDoc, serverTimestamp, setDoc, increment, runTransaction
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const IGV_RATE = 0.18;
const IGV_INCLUIDO = true;

const money = n => (Number(n)||0).toLocaleString("es-PE",{style:"currency",currency:"PEN"});
const toNum  = v => typeof v === "number" ? v : Number(String(v||"").replace(/[^\d.,-]/g,"").replace(",","."));

async function ensureJsPDF() {
  if (window.jspdf?.jsPDF) return;
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
    s.onload = res; s.onerror = () => rej(new Error("No se pudo cargar jsPDF"));
    document.head.appendChild(s);
  });
}

// Correlativo con incremento atómico
async function nextVentaNumber(db) {
  const cRef = doc(db, "counters", "ventas");
  try {
    await updateDoc(cRef, { seq: increment(1), updatedAt: serverTimestamp() });
  } catch {
    await setDoc(cRef, { seq: 1, updatedAt: serverTimestamp() }, { merge: true });
  }
  const snap = await getDoc(cRef);
  const curr = Number(snap.data()?.seq || 1);
  return `V-${String(curr).padStart(6, "0")}`;
}

function calcTotales(items) {
  const total = items.reduce((a,b)=> a + (Number(b.subtotal)||0), 0);
  const base = IGV_INCLUIDO ? (total / (1+IGV_RATE)) : total;
  const igv  = IGV_INCLUIDO ? (total - base) : (base * IGV_RATE);
  return { base, igv, total };
}

async function loadProformas() {
  const qRef = query(collection(db, "proformas"), orderBy("createdAt","desc"), limit(50));
  const snap = await getDocs(qRef);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function VentasPage(container) {
  let items = [];
  let proformas = [];
  let proformaId = null;
  let ultimoPDF = null;

  proformas = await loadProformas();

  container.innerHTML = PageTemplate(
    "Ventas",
    `
    <section class="bg-white/90 rounded-xl shadow p-4 grid gap-4">
      <div class="grid md:grid-cols-[1fr,140px] gap-3 items-center">
        <select id="selProforma" class="border-2 border-slate-300 p-2 rounded-lg focus:border-indigo-600 focus:outline-none">
          <option value="">📋 Selecciona una proforma...</option>
          ${proformas.map(p => `<option value="${p.id}">📋 ${p.clienteNombre} - ${money(p.total)} (${p.estado})</option>`).join("")}
        </select>
        <button id="btnCargar" class="bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold">Cargar</button>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="bg-slate-100">
              <th class="p-2 text-left">Código</th>
              <th class="p-2 text-left">Nombre</th>
              <th class="p-2 text-right">Cant.</th>
              <th class="p-2 text-right">Precio</th>
              <th class="p-2 text-right">Subtotal</th>
              <th class="p-2 text-center">Acción</th>
            </tr>
          </thead>
          <tbody id="tbody"></tbody>
        </table>
      </div>

      <div class="grid md:grid-cols-[1fr,280px] gap-4 items-start">
        <div class="text-sm text-slate-500">
          <p>IGV ${IGV_INCLUIDO ? "incluido" : "no incluido"} en el precio unitario.</p>
        </div>
        <div class="bg-slate-50 rounded p-3">
          <div class="flex justify-between"><span>Base imponible:</span><strong id="tBase">S/ 0.00</strong></div>
          <div class="flex justify-between"><span>IGV (18%):</span><strong id="tIGV">S/ 0.00</strong></div>
          <div class="flex justify-between text-lg mt-2"><span>Total:</span><strong id="tTot">S/ 0.00</strong></div>
        </div>
      </div>

      <div class="mt-2 flex gap-2">
        <button id="btnGuardar" class="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 font-semibold">💾 Guardar Venta</button>
        <button id="btnDescargarPDF" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 hidden">📥 Descargar PDF</button>
      </div>
    </section>
    `
  );

  const tbody = container.querySelector("#tbody");
  const selProforma = container.querySelector("#selProforma");
  const btnCargar = container.querySelector("#btnCargar");

  function renderTabla() {
    if (!tbody) return;
    tbody.innerHTML = "";
    items.forEach((it, i) => {
      const codigo = it?.codigo ?? "";
      const nombre = it?.nombre ?? "(sin nombre)";
      const cant = Math.max(1, Number(it?.cant || 0));
      const precio = toNum(it?.precio || 0);
      const subtotal = cant * precio;
      it.cant = cant;
      it.precio = precio;
      it.subtotal = subtotal;

      const tr = document.createElement("tr");
      tr.className = "border-b";
      tr.innerHTML = `
        <td class="p-2">${codigo}</td>
        <td class="p-2">${nombre}</td>
        <td class="p-2 text-right">${cant}</td>
        <td class="p-2 text-right">${money(precio)}</td>
        <td class="p-2 text-right">${money(subtotal)}</td>
        <td class="p-2 text-center"><button class="btnQuitar text-rose-700 underline" data-i="${i}">Quitar</button></td>
      `;
      tbody.appendChild(tr);
    });

    const { base, igv, total } = calcTotales(items);
    const elBase = container.querySelector("#tBase");
    const elIGV = container.querySelector("#tIGV");
    const elTot = container.querySelector("#tTot");
    if (elBase) elBase.textContent = money(base);
    if (elIGV) elIGV.textContent = money(igv);
    if (elTot) elTot.textContent = money(total);
  }

  renderTabla();

  btnCargar.addEventListener("click", async () => {
    const id = selProforma?.value;
    if (!id) return toastWarning("⚠️ Selecciona una proforma");
    const snap = await getDoc(doc(db, "proformas", id));
    if (!snap.exists()) return toastError("❌ Proforma no encontrada");
    const p = { id: snap.id, ...snap.data() };
    const arr = Array.isArray(p.items) ? p.items : [];
    items = arr.map(it => ({ codigo: it.codigo, nombre: it.nombre, precio: it.precio, cant: it.cant, subtotal: it.cant * it.precio }));
    proformaId = id;
    renderTabla();
    toastSuccess("✅ Proforma cargada: " + p.clienteNombre);
  });

  // Handler para clicks (delegado)
  const handleClick = async (e) => {
    if (e.target.classList.contains("btnQuitar")) {
      const i = Number(e.target.dataset.i);
      if (!isNaN(i)) items.splice(i, 1);
      renderTabla();
      return;
    }

    if (e.target.id === "btnGuardar") {
      if (!items.length) return toastWarning("⚠️ Carga una proforma primero");
      try {
        const { base, igv, total } = calcTotales(items);

        const itemsSanitized = items.map(i => ({
          codigo: String(i.codigo || "").trim(),
          nombre: String(i.nombre || "").trim(),
          precio: Number(i.precio || 0),
          cant: Math.max(1, Number(i.cant || 1)),
          subtotal: Number(i.subtotal || 0),
        }));

        const payload = {
          items: itemsSanitized, base, igv, total,
          igvIncluido: IGV_INCLUIDO, igvRate: IGV_RATE,
          proformaId: proformaId || null,
          createdBy: auth.currentUser?.uid || null,
          createdAt: serverTimestamp(), estado: "registrada",
        };

        const errors = SCHEMAS.venta.validar(payload);
        if (errors.length > 0) return toastError("❌ " + errors.join(", "));

        // ========================================
        // TRANSACCIÓN COMPLETA CON VALIDACIÓN DE STOCK
        // ========================================
        const result = await runTransaction(db, async (transaction) => {
          // 1️⃣ VALIDAR STOCK DE TODOS LOS ITEMS PRIMERO
          const productoIds = new Map(); // Guardar refs para actualizar después
          
          for (const item of itemsSanitized) {
            if (!item.codigo) continue;
            
            const qRef = query(collection(db, "productos"), where("codigo", "==", item.codigo), limit(1));
            const snap = await getDocs(qRef);
            
            if (snap.empty) {
              throw new Error(`❌ Producto con código ${item.codigo} no encontrado`);
            }
            
            const prodDoc = snap.docs[0];
            const prodData = prodDoc.data();
            const stockActual = Number(prodData?.stock || 0);
            
            if (stockActual < item.cant) {
              throw new Error(
                `❌ Stock insuficiente para ${item.nombre}.\n` +
                `Disponible: ${stockActual}, Solicitado: ${item.cant}`
              );
            }
            
            // Guardar para actualizar después
            productoIds.set(item.codigo, { id: prodDoc.id, actual: stockActual, cant: item.cant });
          }
          
          // 2️⃣ SI TODO OK, GENERAR NÚMERO Y CREAR VENTA
          const cRef = doc(db, "counters", "ventas");
          const counterDoc = await transaction.get(cRef);
          let newSeq = 1;
          if (counterDoc.exists()) {
            newSeq = (counterDoc.data()?.seq || 0) + 1;
          }
          const numero = `V-${String(newSeq).padStart(6, "0")}`;
          
          // Actualizar contador
          transaction.set(cRef, {
            seq: newSeq,
            updatedAt: serverTimestamp(),
            lastNumber: numero,
          }, { merge: true });
          
          // Crear venta
          const ventaRef = doc(collection(db, "ventas"));
          transaction.set(ventaRef, {
            ...payload,
            numero
          });
          
          // 3️⃣ REDUCIR STOCK DE TODOS LOS PRODUCTOS
          for (const [codigo, info] of productoIds.entries()) {
            const prodRef = doc(db, "productos", info.id);
            const nuevoStock = info.actual - info.cant;
            transaction.update(prodRef, {
              stock: nuevoStock,
              updatedAt: serverTimestamp()
            });
          }
          
          // 4️⃣ MARCAR PROFORMA COMO CERRADA (si aplica)
          if (proformaId) {
            const proformaRef = doc(db, "proformas", proformaId);
            transaction.update(proformaRef, {
              estado: "cerrada",
              cerradaEn: serverTimestamp(),
              ventaId: ventaRef.id
            });
          }
          
          return {
            id: ventaRef.id,
            numero,
            base,
            igv,
            total,
            items: itemsSanitized
          };
        });

        // 5️⃣ REGISTRAR AUDITORÍA (fuera de transacción)
        try {
          await logAudit({
            action: "venta.create",
            entity: "ventas",
            entityId: result.id,
            payload: {
              numero: result.numero,
              total: result.total,
              items: result.items.length,
              stockReductions: Array.from(productoIds.keys()).join(", ")
            }
          });
        } catch (auditError) {
          console.warn("⚠️ Error en auditoría, pero venta se guardó:", auditError);
        }

        // 6️⃣ GENERAR PDF
        await ensureJsPDF();
        const { jsPDF } = window.jspdf;
        const docpdf = new jsPDF({ unit: "pt", format: "a4" });
        let y = 40;
        docpdf.setFontSize(14);
        docpdf.text(`Venta ${result.numero}`, 40, y);
        y += 20;
        docpdf.setFontSize(10);
        docpdf.text(`Fecha: ${new Date().toLocaleString("es-PE")}`, 40, y);
        y += 16;
        docpdf.text("Código", 40, y);
        docpdf.text("Nombre", 100, y);
        docpdf.text("Cant.", 350, y, { align: "right" });
        docpdf.text("Precio", 430, y, { align: "right" });
        docpdf.text("Subtotal", 520, y, { align: "right" });
        y += 8;
        docpdf.line(40, y, 555, y);
        y += 14;
        itemsSanitized.forEach(it => {
          docpdf.text(escapeHtml(String(it.codigo || "")), 40, y);
          docpdf.text(escapeHtml(String(it.nombre || "").slice(0, 40)), 100, y);
          docpdf.text(String(it.cant || 0), 350, y, { align: "right" });
          docpdf.text(money(it.precio || 0), 430, y, { align: "right" });
          docpdf.text(money(it.subtotal || 0), 520, y, { align: "right" });
          y += 16;
        });
        y += 10;
        docpdf.line(360, y, 555, y);
        y += 16;
        docpdf.text("Base:", 430, y, { align: "right" });
        docpdf.text(money(result.base), 520, y, { align: "right" });
        y += 14;
        docpdf.text("IGV:", 430, y, { align: "right" });
        docpdf.text(money(result.igv), 520, y, { align: "right" });
        y += 14;
        docpdf.setFontSize(12);
        docpdf.text("Total:", 430, y, { align: "right" });
        docpdf.text(money(result.total), 520, y, { align: "right" });

        ultimoPDF = { doc: docpdf, nombre: `Venta_${result.numero}.pdf` };
        toastSuccess("✅ Venta guardada: " + result.numero);

        items = [];
        selProforma.value = "";
        proformaId = null;
        renderTabla();

        const btnPDF = container.querySelector("#btnDescargarPDF");
        if (btnPDF) btnPDF.classList.remove("hidden");
      } catch (err) {
        console.error(err);
        toastError("❌ Error: " + (err?.message || err));
      }
    }
  };

  // Agregar listener una sola vez
  container.addEventListener("click", handleClick);

  const btnDescargarPDF = container.querySelector("#btnDescargarPDF");
  if (btnDescargarPDF) {
    btnDescargarPDF.addEventListener("click", () => {
      if (ultimoPDF) {
        ultimoPDF.doc.save(ultimoPDF.nombre);
        toastSuccess("📥 PDF descargado");
      }
    });
  }

  // Cleanup: guardar el handler para poder removerlo después
  if (window._ventasHandler) container.removeEventListener("click", window._ventasHandler);
  window._ventasHandler = handleClick;
}
