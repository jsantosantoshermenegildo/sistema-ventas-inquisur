/**
 * Service Worker para PWA - Inquisur Sales System
 * Estrategia: Network First para APIs, Cache First para assets
 * Versión: 2.0.0
 */

const CACHE_NAME = 'inquisur-v2.0.0';
const RUNTIME_CACHE = 'inquisur-runtime-v1';
const IMAGE_CACHE = 'inquisur-images-v1';

// URLs a cachear en la instalación
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/login.html',
  '/manifest.webmanifest',
  '/assets/css/style.css'
];

// Patrones de URLs que siempre necesitan red
const NETWORK_ONLY_PATTERNS = [
  /\/api\//,
  /firestore/,
  /firebase/,
  /auth/
];

// Patrones de URLs que usan cache-first
const CACHE_FIRST_PATTERNS = [
  /\.(png|jpg|jpeg|svg|gif|webp)$/i,
  /\.(woff|woff2|ttf|eot)$/i,
  /\.(css|js)$/i
];

/**
 * Determina si una URL debe usar solo red
 */
function shouldUseNetworkOnly(url) {
  return NETWORK_ONLY_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Determina si una URL debe usar cache-first
 */
function shouldUseCacheFirst(url) {
  return CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * EVENT: INSTALL
 * Cachear archivos críticos para offline
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Install event - cacheando archivos críticos');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Agregando archivos al cache:', PRECACHE_URLS);
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Installation completado');
        return self.skipWaiting(); // Activar inmediatamente
      })
      .catch(error => {
        console.error('[SW] Error durante install:', error);
      })
  );
});

/**
 * EVENT: ACTIVATE
 * Limpiar caches antiguos
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event - limpiando caches antiguos');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        const cachesToDelete = cacheNames.filter(name => {
          return name !== CACHE_NAME && 
                 name !== RUNTIME_CACHE && 
                 name !== IMAGE_CACHE;
        });
        
        console.log('[SW] Eliminando caches:', cachesToDelete);
        return Promise.all(
          cachesToDelete.map(name => caches.delete(name))
        );
      })
      .then(() => {
        console.log('[SW] Tomando control de clientes');
        return self.clients.claim();
      })
      .catch(error => {
        console.error('[SW] Error durante activate:', error);
      })
  );
});

/**
 * EVENT: FETCH
 * Estrategias de caché:
 * - Network First: APIs, autenticación
 * - Cache First: Assets estáticos
 * - Stale While Revalidate: Datos en segundo plano
 */
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  const isNetworkOnly = shouldUseNetworkOnly(url);
  const isCacheFirst = shouldUseCacheFirst(url);

  // Ignorar solicitudes NO-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // 1️⃣ NETWORK ONLY - APIs y autenticación
  if (isNetworkOnly) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Retornar respuesta offline si está disponible
          return caches.match(event.request);
        })
    );
    return;
  }

  // 2️⃣ CACHE FIRST - Assets estáticos (imgs, fonts, css, js)
  if (isCacheFirst) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }

          return fetch(event.request)
            .then(response => {
              // No cachear respuestas no-OK
              if (!response || response.status !== 200 || response.type === 'error') {
                return response;
              }

              // Clonar y guardar en cache
              const responseToCache = response.clone();
              caches.open(IMAGE_CACHE)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });

              return response;
            })
            .catch(() => {
              // Retornar imagen placeholder si falla
              if (event.request.destination === 'image') {
                return new Response(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#ccc" width="200" height="200"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-family="sans-serif" font-size="14">Offline</text></svg>',
                  { headers: { 'Content-Type': 'image/svg+xml' } }
                );
              }
              return caches.match('/offline.html') || new Response('Offline');
            });
        })
    );
    return;
  }

  // 3️⃣ NETWORK FIRST (DEFAULT) - HTML y documentos
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // No cachear respuestas no-OK
        if (!response || response.status !== 200) {
          return response;
        }

        // Clonar respuesta para cachear
        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // Retornar del cache si falló la red
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // Página offline por defecto
            return caches.match('/offline.html') || new Response('Offline');
          });
      })
  );
});

/**
 * EVENT: MESSAGE
 * Permite comunicación con el cliente
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(RUNTIME_CACHE).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    caches.open(RUNTIME_CACHE).then(cache => {
      cache.addAll(urls);
    });
  }
});

/**
 * EVENT: BACKGROUND SYNC
 * Para sincronización en background (futuro)
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-ventas') {
    event.waitUntil(syncVentas());
  }
});

async function syncVentas() {
  // Implementar sincronización de ventas cuando hay conexión
  console.log('[SW] Sincronizando ventas...');
}

console.log('[SW] Service Worker cargado y registrado');
