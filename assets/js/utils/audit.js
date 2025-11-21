// assets/js/utils/audit.js — logger de auditoría
import { db, auth } from "../firebase.js";
import {
  addDoc, collection, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const col = collection(db, "audit");

/**
 * Registra un evento de auditoría.
 * @param {Object} p
 * @param {string} p.action  - ej: "venta.create", "cliente.update", "producto.delete"
 * @param {string} p.entity  - ej: "ventas", "clientes", "productos", "proformas"
 * @param {string} [p.entityId] - id afectado
 * @param {Object} [p.payload]  - datos útiles (totales, cambios, etc.)
 */
export async function logAudit({ action, entity, entityId = "", payload = {} }) {
  const u = auth.currentUser;
  const entry = {
    ts: serverTimestamp(),
    action, entity, entityId, payload,
    uid: u?.uid || null,
    email: u?.email || null,
    role: localStorage.getItem("rol") || null,
  };
  try { await addDoc(col, entry); } catch (e) { console.warn("audit fail", e); }
}
