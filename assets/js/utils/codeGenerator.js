// ========================================
// GENERADOR DE CÓDIGOS SEGUROS CON TRANSACCIONES
// ========================================

import { db } from '../firebase.js';
import { doc, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';
import { logger } from './logger.js';
import { COLLECTIONS } from '../constants/index.js';

/**
 * Genera el próximo código de producto usando transacciones (thread-safe)
 * @returns {Promise<string>} Código generado (ej: P001)
 */
export async function getNextProductoCode() {
  const counterRef = doc(db, COLLECTIONS.COUNTERS, 'productos');
  
  try {
    const codigo = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      let newSeq = 1;
      if (counterDoc.exists()) {
        newSeq = (counterDoc.data()?.seq || 0) + 1;
      }
      
      // Actualizar contador en la transacción
      transaction.set(counterRef, {
        seq: newSeq,
        updatedAt: serverTimestamp(),
        lastCode: `P${String(newSeq).padStart(3, '0')}`,
      }, { merge: true });
      
      return `P${String(newSeq).padStart(3, '0')}`;
    });
    
    logger.debug('[CODE GEN] Código de producto generado:', codigo);
    return codigo;
  } catch (error) {
    logger.error('[CODE GEN] Error generando código de producto:', error);
    throw new Error('No se pudo generar el código de producto');
  }
}

/**
 * Genera el próximo número de venta usando transacciones (thread-safe)
 * @returns {Promise<string>} Número generado (ej: V-000001)
 */
export async function getNextVentaNumber() {
  const counterRef = doc(db, COLLECTIONS.COUNTERS, 'ventas');
  
  try {
    const numero = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      let newSeq = 1;
      if (counterDoc.exists()) {
        newSeq = (counterDoc.data()?.seq || 0) + 1;
      }
      
      // Actualizar contador en la transacción
      transaction.set(counterRef, {
        seq: newSeq,
        updatedAt: serverTimestamp(),
        lastNumber: `V-${String(newSeq).padStart(6, '0')}`,
      }, { merge: true });
      
      return `V-${String(newSeq).padStart(6, '0')}`;
    });
    
    logger.debug('[CODE GEN] Número de venta generado:', numero);
    return numero;
  } catch (error) {
    logger.error('[CODE GEN] Error generando número de venta:', error);
    throw new Error('No se pudo generar el número de venta');
  }
}

/**
 * Genera el próximo número de proforma usando transacciones (thread-safe)
 * @returns {Promise<string>} Número generado (ej: PF-000001)
 */
export async function getNextProformaNumber() {
  const counterRef = doc(db, COLLECTIONS.COUNTERS, 'proformas');
  
  try {
    const numero = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      let newSeq = 1;
      if (counterDoc.exists()) {
        newSeq = (counterDoc.data()?.seq || 0) + 1;
      }
      
      // Actualizar contador en la transacción
      transaction.set(counterRef, {
        seq: newSeq,
        updatedAt: serverTimestamp(),
        lastNumber: `PF-${String(newSeq).padStart(6, '0')}`,
      }, { merge: true });
      
      return `PF-${String(newSeq).padStart(6, '0')}`;
    });
    
    logger.debug('[CODE GEN] Número de proforma generado:', numero);
    return numero;
  } catch (error) {
    logger.error('[CODE GEN] Error generando número de proforma:', error);
    throw new Error('No se pudo generar el número de proforma');
  }
}

/**
 * Reinicia un contador específico (solo para admin)
 * @param {string} type - Tipo de contador: 'productos', 'ventas', 'proformas'
 * @param {number} value - Valor inicial (default: 0)
 */
export async function resetCounter(type, value = 0) {
  const counterRef = doc(db, COLLECTIONS.COUNTERS, type);
  
  try {
    await runTransaction(db, async (transaction) => {
      transaction.set(counterRef, {
        seq: value,
        updatedAt: serverTimestamp(),
        resetAt: serverTimestamp(),
      }, { merge: true });
    });
    
    logger.warn(`[CODE GEN] Contador ${type} reiniciado a ${value}`);
  } catch (error) {
    logger.error('[CODE GEN] Error reiniciando contador:', error);
    throw new Error('No se pudo reiniciar el contador');
  }
}

/**
 * Obtiene el estado actual de un contador sin incrementar
 * @param {string} type - Tipo de contador
 * @returns {Promise<number>} Valor actual del contador
 */
export async function getCurrentCounter(type) {
  const counterRef = doc(db, COLLECTIONS.COUNTERS, type);
  
  try {
    const value = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      return counterDoc.exists() ? (counterDoc.data()?.seq || 0) : 0;
    });
    
    return value;
  } catch (error) {
    logger.error('[CODE GEN] Error obteniendo contador:', error);
    return 0;
  }
}
