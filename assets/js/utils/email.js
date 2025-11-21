// assets/js/utils/email.js - Utilidades para envío de email con EmailJS
// Referencia: https://www.emailjs.com/

const EMAILJS_SERVICE_ID = "service_ventas_inquisur";
const EMAILJS_TEMPLATE_ID = "template_proforma_inquisur";
const EMAILJS_PUBLIC_KEY = "L8rF9kP2mQ5xN3vY"; // Reemplazar con tu clave pública de EmailJS

// Carga EmailJS dinámicamente
async function ensureEmailJS() {
  if (window.emailjs) return;
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/index.min.js";
    s.onload = () => {
      window.emailjs.init(EMAILJS_PUBLIC_KEY);
      resolve();
    };
    s.onerror = () => reject(new Error("No se pudo cargar EmailJS"));
    document.head.appendChild(s);
  });
}

/**
 * Envía una proforma por email
 * @param {Object} proforma - Datos de la proforma
 * @param {string} emailDestino - Email del cliente
 * @returns {Promise<Object>} Respuesta de EmailJS
 */
export async function enviarProformaPorEmail(proforma, emailDestino) {
  try {
    await ensureEmailJS();

    // Formato de items para el email
    const itemsHTML = (proforma.items || [])
      .map(
        (item) =>
          `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.codigo || ""}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.nombre || ""}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.cant || 0}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">S/ ${Number(item.precio || 0).toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">S/ ${Number(item.subtotal || 0).toFixed(2)}</td>
      </tr>
    `
      )
      .join("");

    const templateParams = {
      to_email: emailDestino,
      cliente_nombre: proforma.clienteNombre || "Cliente",
      proforma_numero: proforma.numero || "SIN-NÚMERO",
      proforma_fecha: new Date(proforma.createdAt?.seconds ? proforma.createdAt.seconds * 1000 : proforma.createdAt).toLocaleDateString(
        "es-PE"
      ),
      proforma_base: Number(proforma.base || 0).toFixed(2),
      proforma_igv: Number(proforma.igv || 0).toFixed(2),
      proforma_total: Number(proforma.total || 0).toFixed(2),
      items_table: itemsHTML,
      empresa_nombre: "INQUISUR",
      empresa_email: "ventas@inquisur.pe",
    };

    const response = await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);

    return { success: true, messageId: response.status };
  } catch (error) {
    console.error("Error enviando email:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Valida si un email es válido
 * @param {string} email - Email a validar
 * @returns {boolean}
 */
export function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Obtiene el email del cliente desde Firestore
 * @param {Object} db - Referencia a Firestore
 * @param {string} clienteNombre - Nombre del cliente
 * @returns {Promise<string|null>}
 */
export async function obtenerEmailCliente(db, clienteNombre) {
  try {
    const { getDocs, collection, query, where } = await import(
      "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js"
    );

    const q = query(collection(db, "clientes"), where("nombre", "==", clienteNombre));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const clienteData = snapshot.docs[0].data();
      return clienteData.email || null;
    }
    return null;
  } catch (error) {
    console.error("Error obteniendo email del cliente:", error);
    return null;
  }
}
