// assets/js/features/proformas.js — IGV incluido + PDF + etiqueta limpia
import { db, auth } from "../firebase.js";
import { logAudit } from "../utils/audit.js";
import { PageTemplate } from "../ui/components.js";
import { SCHEMAS } from "../rules/schemas.js";
import { toastSuccess, toastError, toastWarning } from "../utils/alerts.js";
import { enviarProformaPorEmail, obtenerEmailCliente, validarEmail } from "../utils/email.js";
import {
  collection, getDocs, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

async function ensureJsPDF() {
  if (window.jspdf?.jsPDF) return;
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
    s.onload = res; s.onerror = () => rej(new Error("No se pudo cargar jsPDF"));
    document.head.appendChild(s);
  });
}

const IGV_RATE = 0.18;           // IGV
const IGV_INCLUIDO = true;       // viene en el precio unitario
const money = n => (Number(n)||0).toLocaleString("es-PE",{style:"currency",currency:"PEN"});
const toNum  = v => typeof v === "number" ? v : Number(String(v||"").replace(/[^\d.,-]/g,"").replace(",","."));

export async function ProformasPage(container) {
  container.innerHTML = PageTemplate(
    "Proformas",
    `
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
      <div class="grid md:grid-cols-[1fr,1fr,120px] gap-3 items-center">
        <select id="selCliente" class="border dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2 rounded"></select>
        <select id="selProducto" class="border dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2 rounded"></select>
        <input id="inpCant" type="number" min="1" value="1" class="border dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2 rounded">
      </div>

      <button id="btnAgregar" class="mt-3 w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 dark:hover:bg-indigo-700">Agregar producto</button>

      <div class="mt-4 overflow-x-auto">
        <table class="min-w-full text-sm dark:text-white">
          <thead>
            <tr class="bg-slate-100 dark:bg-slate-700">
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

      <div class="mt-4 grid md:grid-cols-[1fr,280px] gap-4 items-start">
        <div class="text-sm text-slate-500 dark:text-slate-400">
          <p>IGV incluido en el precio unitario.</p>
          <p>Para cambiar correo del cliente, edítalo en <a href="#clientes" class="underline">Clientes</a>.</p>
        </div>
        <div class="bg-slate-50 dark:bg-slate-700 rounded p-3 dark:text-white">
          <div class="flex justify-between"><span>Base imponible:</span><strong id="tBase">S/ 0.00</strong></div>
          <div class="flex justify-between"><span>IGV (18%):</span><strong id="tIGV">S/ 0.00</strong></div>
          <div class="flex justify-between text-lg mt-2"><span>Total:</span><strong id="tTot">S/ 0.00</strong></div>
        </div>
      </div>

      <div class="mt-4 flex gap-3">
        <button id="btnGuardar" class="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 dark:hover:bg-emerald-700">Guardar Proforma</button>
        <button id="btnPDF" class="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500">Exportar PDF</button>
        <button id="btnEmail" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-700">📧 Enviar Email</button>
      </div>
    </div>
    `
  );

  // Datos
  const [cliSnap, prodSnap] = await Promise.all([
    getDocs(collection(db, "clientes")),
    getDocs(collection(db, "productos")),
  ]);
  const clientes = cliSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const productos = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const selCliente = container.querySelector("#selCliente");
  const selProducto = container.querySelector("#selProducto");
  const inpCant = container.querySelector("#inpCant");
  const tbody = container.querySelector("#tbody");

  selCliente.innerHTML = clientes.length
    ? clientes.map(c => `<option value="${c.id}">${(c.nombre||c.displayName||"SIN NOMBRE")}</option>`).join("")
    : `<option value="">(Sin clientes)</option>`;

  selProducto.innerHTML = productos.length
    ? productos.map(p => {
        const precio = toNum(p.precio ?? p.price ?? 0);
        const codigo = p.codigo ?? (p.id || "").toString().slice(0,10);
        const nombre = p.nombre ?? p.name ?? "Producto";
        return `<option value="${p.id}" data-precio="${precio}" data-codigo="${codigo}" data-nombre="${nombre}">
          ${codigo} — ${nombre} (${money(precio)})
        </option>`;
      }).join("")
    : `<option value="">(Sin productos)</option>`;

  // Estado
  const items = [];
  const calc = () => {
    const total = items.reduce((a,b)=>a+b.subtotal,0);
    const base = total / (1 + IGV_RATE);
    const igv = total - base;
    return { base, igv, total };
  };
  const render = () => {
    tbody.innerHTML = "";
    items.forEach((it,i)=>{
      const tr = document.createElement("tr");
      tr.className = "border-b dark:border-slate-600";
      tr.innerHTML = `
        <td class="p-2">${it.codigo}</td>
        <td class="p-2">${it.nombre}</td>
        <td class="p-2 text-right">${it.cant}</td>
        <td class="p-2 text-right">
          <input type="number" class="inpPrecio w-24 border dark:border-slate-600 dark:bg-slate-700 dark:text-white p-1 rounded text-right" 
                 value="${it.precio}" data-i="${i}" step="0.01" min="0">
        </td>
        <td class="p-2 text-right precioSubtotal-${i}">${money(it.subtotal)}</td>
        <td class="p-2 text-center">
          <button class="btnQuitar text-rose-700 underline" data-i="${i}">🗑️ Quitar</button>
        </td>`;
      tbody.appendChild(tr);
    });

    // Event listeners para editar precios
    document.querySelectorAll(".inpPrecio").forEach(inp => {
      inp.addEventListener("change", (e) => {
        const i = Number(e.target.dataset.i);
        const nuevoP = Math.max(0, toNum(e.target.value));
        if (!isNaN(i) && items[i]) {
          items[i].precio = nuevoP;
          items[i].subtotal = items[i].cant * items[i].precio;
          render();
        }
      });

      inp.addEventListener("input", (e) => {
        const i = Number(e.target.dataset.i);
        if (!isNaN(i) && items[i]) {
          const nuevoP = Math.max(0, toNum(e.target.value || 0));
          items[i].precio = nuevoP;
          items[i].subtotal = items[i].cant * items[i].precio;
          const el = document.querySelector(`.precioSubtotal-${i}`);
          if (el) el.textContent = money(items[i].subtotal);
        }
      });
    });

    const { base, igv, total } = calc();
    container.querySelector("#tBase").textContent = money(base);
    container.querySelector("#tIGV").textContent = money(igv);
    container.querySelector("#tTot").textContent = money(total);
  };

  // Eventos
  const handleClick = async (e) => {
    if (e.target.id === "btnAgregar") {
      const opt = selProducto.selectedOptions[0];
      if (!opt) return toastWarning("⚠️ Selecciona un producto.");
      const precio = toNum(opt.dataset.precio);
      const codigo = opt.dataset.codigo || opt.value;
      const nombre = opt.dataset.nombre || "Producto";
      const cant = Math.max(1, Number(inpCant.value || 1));
      const ix = items.findIndex(x=>x.codigo===codigo);
      if (ix>=0) { items[ix].cant += cant; items[ix].subtotal = items[ix].cant * items[ix].precio; }
      else { items.push({ codigo, nombre, precio, cant, subtotal: precio*cant }); }
      render();
      return;
    }
    if (e.target.classList.contains("btnQuitar")) {
      const i = Number(e.target.dataset.i);
      if (!isNaN(i)) items.splice(i,1);
      render(); return;
    }
    if (e.target.id === "btnGuardar") {
      if (!selCliente.value) return toastWarning("⚠️ Selecciona un cliente.");
      if (!items.length) return toastWarning("⚠️ Agrega productos.");
      const { base, igv, total } = calc();
      
      // Obtener solo el nombre del cliente (sin email)
      const clienteObj = clientes.find(c => c.id === selCliente.value);
      const clienteNombre = clienteObj?.nombre || "Sin nombre";
      
      // Sanitizar items
      const itemsSanitized = items.map(i => ({
        codigo: String(i.codigo || "").trim(),
        nombre: String(i.nombre || "").trim(),
        precio: Number(i.precio || 0),
        cant: Math.max(1, Number(i.cant || 1)),
        subtotal: Number(i.subtotal || 0),
      }));
      
      const payload = {
        clienteId: selCliente.value,
        clienteNombre: clienteNombre,
        items: itemsSanitized, 
        base: Number(base), 
        igv: Number(igv), 
        total: Number(total),
        igvIncluido: IGV_INCLUIDO, 
        igvRate: IGV_RATE,
        estado: "borrador", 
        numero: `PRO-${Date.now()}`,
        createdBy: auth.currentUser?.uid || null,
        createdAt: serverTimestamp()
      };
      
      // Validar
      const errors = SCHEMAS.proforma.validar(payload);
      if (errors.length > 0) {
        return toastError("❌ " + errors.join(", "));
      }
      
      try {
        const ref = await addDoc(collection(db,"proformas"), payload);
        await logAudit({ action: "proforma.create", entity: "proformas", entityId: ref.id, payload: { clienteId: payload.clienteId, total: payload.total } });
        toastSuccess("✅ Proforma guardada: "+ref.id);
        items.length = 0; // Limpiar array
        render(); // Limpiar UI
      } catch (err) {
        toastError("❌ Error: " + err.message);
      }
      return;
    }
    if (e.target.id === "btnPDF") {
      if (!items.length) return toastWarning("⚠️ Agrega productos.");
      await ensureJsPDF(); const { jsPDF } = window.jspdf;
      const { base, igv, total } = calc();
      const doc = new jsPDF({ unit:"pt", format:"a4" });
      let y=40;
      doc.setFontSize(14); doc.text("Sistema de Ventas — Proforma", 40, y); y+=22;
      doc.setFontSize(10); doc.text("Cliente: " + (selCliente.selectedOptions[0]?.text||""), 40, y); y+=18;
      doc.text("Código",40,y); doc.text("Nombre",100,y);
      doc.text("Cant.",350,y,{align:"right"});
      doc.text("Precio",430,y,{align:"right"});
      doc.text("Subtotal",520,y,{align:"right"});
      y+=8; doc.line(40,y,555,y); y+=14;
      items.forEach(it=>{
        doc.text(String(it.codigo),40,y);
        doc.text(String(it.nombre).slice(0,40),100,y);
        doc.text(String(it.cant),350,y,{align:"right"});
        doc.text(money(it.precio),430,y,{align:"right"});
        doc.text(money(it.subtotal),520,y,{align:"right"});
        y+=16;
      });
      y+=10; doc.line(360,y,555,y); y+=16;
      doc.text("Base imponible:",430,y,{align:"right"}); doc.text(money(base),520,y,{align:"right"}); y+=14;
      doc.text("IGV (18%):",430,y,{align:"right"}); doc.text(money(igv),520,y,{align:"right"}); y+=14;
      doc.setFontSize(12);
      doc.text("Total:",430,y,{align:"right"}); doc.text(money(total),520,y,{align:"right"});
      doc.save("proforma.pdf");
      return;
    }
    if (e.target.id === "btnEmail") {
      if (!items.length) return toastWarning("⚠️ Agrega productos.");
      if (!selCliente.value) return toastWarning("⚠️ Selecciona un cliente.");
      
      const clienteObj = clientes.find(c => c.id === selCliente.value);
      
      // Obtener email del cliente
      (async () => {
        toastWarning("📧 Obteniendo email del cliente...");
        const emailCliente = await obtenerEmailCliente(db, clienteObj.nombre);
        
        if (!emailCliente || !validarEmail(emailCliente)) {
          return toastError("❌ El cliente no tiene email válido en el sistema.");
        }
        
        const { base, igv, total } = calc();
        const proformaData = {
          clienteNombre: clienteObj.nombre,
          items: items.map(i => ({
            codigo: String(i.codigo || "").trim(),
            nombre: String(i.nombre || "").trim(),
            precio: Number(i.precio || 0),
            cant: Math.max(1, Number(i.cant || 1)),
            subtotal: Number(i.subtotal || 0),
          })),
          base: Number(base),
          igv: Number(igv),
          total: Number(total),
          numero: `PRO-${Date.now()}`,
          createdAt: new Date(),
        };
        
        const result = await enviarProformaPorEmail(proformaData, emailCliente);
        if (result.success) {
          toastSuccess("✅ Proforma enviada a " + emailCliente);
        } else {
          toastError("❌ Error al enviar: " + result.error);
        }
      })();
      return;
    }
  };

  // Agregar listener con cleanup
  container.addEventListener("click", handleClick);
  if (window._proformasHandler) container.removeEventListener("click", window._proformasHandler);
  window._proformasHandler = handleClick;

  render();
}
