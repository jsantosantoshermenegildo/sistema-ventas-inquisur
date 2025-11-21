// utils/sunat.js
import { SUNAT_CONFIG } from "./sunat-config.js";

/**
 * Consulta DNI o RUC usando apiperu.dev
 */
export async function consultarSUNAT(dniRuc) {
  const cleaned = String(dniRuc || "").trim().replace(/\D/g, "");

  if (cleaned.length !== 8 && cleaned.length !== 11) {
    throw new Error("DNI debe tener 8 dígitos o RUC 11 dígitos");
  }

  let endpoint = "";
  let payload = {};

  if (cleaned.length === 8) {
    // 👉 Consulta DNI
    endpoint = "https://apiperu.dev/api/dni";        // o /api/dni-ruc si solo quieres ver si tiene RUC
    payload = { dni: cleaned };
  } else {
    // 👉 Consulta RUC
    endpoint = "https://apiperu.dev/api/ruc";        // o /api/ruc-domicilio-fiscal si quieres domicilio
    payload = { ruc: cleaned };
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Accept": "application/json",         // importante según docs
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUNAT_CONFIG.TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.text(); // primero leo como texto

  let datos;
  try {
    datos = JSON.parse(raw);    // intento parsear JSON
  } catch (e) {
    console.error("Respuesta NO es JSON, seguramente es HTML de error:\n", raw);
    throw new Error("Error en ApiPeruDev: la respuesta no fue JSON");
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${datos.message || res.statusText}`);
  }

  if (!datos.success) {
    throw new Error(datos.message || "Error en SUNAT / ApiPeruDev");
  }

  const data = datos.data || {};

  // Mapea a tu estructura de cliente
  return {
    nombre:
      data.nombre ||
      data.razon_social ||
      data.nombre_o_razon_social ||
      data.nombres ||
      "",
    email: data.email || "",
    telefono: data.telefono || data.celular || "",
    direccion:
      data.domicilio ||
      data.direccion ||
      data.direccion_completa ||
      "",
  };
}
