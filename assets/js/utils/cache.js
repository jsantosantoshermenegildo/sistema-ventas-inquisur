// assets/js/utils/cache.js — Caché local con IndexedDB y TTL

const DB_NAME = "ventas_cache_db";
const DB_VERSION = 1;
const STORES = {
  ventas: "ventas",
  proformas: "proformas",
  clientes: "clientes",
  reportes: "reportes",
};

/**
 * Inicializar IndexedDB
 */
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Crear objectStores para cada entidad
      Object.values(STORES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: "id" });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
      });
    };
  });
}

/**
 * Guardar datos en caché con timestamp
 * @param {string} storeName - nombre del store (ventas, clientes, etc)
 * @param {Array} items - array de items a guardar
 * @param {number} ttlMs - tiempo de vida en ms (default: 5 min)
 */
export async function setCacheData(storeName, items, ttlMs = 5 * 60 * 1000) {
  try {
    const db = await initDB();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    // Limpiar store anterior
    await new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = resolve;
      req.onerror = () => reject(req.error);
    });

    // Insertar nuevos items con metadata
    const now = Date.now();
    const itemsWithMeta = items.map((item) => ({
      ...item,
      timestamp: now,
      expiresAt: now + ttlMs,
    }));

    itemsWithMeta.forEach((item) => {
      store.add(item);
    });

    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });

    console.log(`💾 Cache guardado: ${storeName} (${items.length} items, TTL: ${ttlMs / 1000}s)`);
    return true;
  } catch (error) {
    console.warn(`⚠️ Error al guardar cache ${storeName}:`, error);
    return false;
  }
}

/**
 * Obtener datos del caché si no están expirados
 * @param {string} storeName - nombre del store
 * @returns {Array|null} array de items o null si están expirados/no existen
 */
export async function getCacheData(storeName) {
  try {
    const db = await initDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result;

        // Verificar si alguno está expirado
        const now = Date.now();
        const validItems = items.filter((item) => {
          if (item.expiresAt && item.expiresAt < now) {
            return false; // Expirado
          }
          return true;
        });

        if (validItems.length === 0) {
          console.log(`⏰ Cache expirado: ${storeName}`);
          resolve(null);
        } else {
          const age = Math.round((now - validItems[0].timestamp) / 1000);
          console.log(`📦 Cache válido: ${storeName} (${validItems.length} items, edad: ${age}s)`);
          resolve(validItems);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn(`⚠️ Error al leer cache ${storeName}:`, error);
    return null;
  }
}

/**
 * Limpiar caché específico
 */
export async function clearCache(storeName) {
  try {
    const db = await initDB();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        console.log(`🗑️ Cache borrado: ${storeName}`);
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn(`⚠️ Error al limpiar cache ${storeName}:`, error);
    return false;
  }
}

/**
 * Limpiar TODO el caché
 */
export async function clearAllCache() {
  try {
    const db = await initDB();
    const tx = db.transaction(Object.values(STORES), "readwrite");

    Object.values(STORES).forEach((storeName) => {
      tx.objectStore(storeName).clear();
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        console.log("🗑️ Todo el cache fue borrado");
        resolve(true);
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.warn("⚠️ Error al limpiar todo el cache:", error);
    return false;
  }
}

/**
 * Obtener tamaño aproximado del caché (items)
 */
export async function getCacheSize() {
  try {
    const db = await initDB();
    const sizes = {};

    for (const storeName of Object.values(STORES)) {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);

      await new Promise((resolve, reject) => {
        const request = store.count();
        request.onsuccess = () => {
          sizes[storeName] = request.result;
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    }

    return sizes;
  } catch (error) {
    console.warn("⚠️ Error al obtener tamaño cache:", error);
    return {};
  }
}

/**
 * Wrapper para cargar datos con fallback a Firestore
 * @param {Function} fetchFunc - función que trae datos de Firestore
 * @param {string} storeName - donde guardar en cache
 * @param {number} ttlMs - TTL del cache
 * @returns {Array} datos del cache o Firestore
 */
export async function loadWithCache(fetchFunc, storeName, ttlMs = 5 * 60 * 1000) {
  // 1. Intentar obtener del cache
  let data = await getCacheData(storeName);
  if (data) {
    return data;
  }

  // 2. Cache no válido, traer de Firestore
  console.log(`🔄 Actualizando ${storeName} desde Firestore...`);
  try {
    data = await fetchFunc();

    // 3. Guardar en cache para próxima vez
    if (data && Array.isArray(data)) {
      await setCacheData(storeName, data, ttlMs);
    }

    return data;
  } catch (error) {
    // Si falla Firestore, retornar cache expirado si existe
    console.warn(`❌ Error al traer ${storeName} de Firestore:`, error);
    const staleData = await getCacheData(storeName); // Sin verificar expiración
    if (staleData) {
      console.log(`⚠️ Usando cache expirado: ${storeName}`);
      return staleData;
    }
    throw error;
  }
}

console.log("✅ Cache Manager inicializado");
