# Sistema de Ventas INQUISUR - v2.0.0

**Sistema profesional de gestión de ventas con Firestore, arquitectura mejorada y seguridad crítica**

## 🎯 Características Principales

### ✅ Seguridad
- ✓ Protección contra XSS con `sanitize.js`
- ✓ Firestore Rules con validación de datos en tiempo real
- ✓ Variables de entorno para credenciales
- ✓ Transacciones atómicas para operaciones críticas
- ✓ Auditoría completa de acciones

### ⚡ Performance
- ✓ Lazy loading de rutas (dynamic imports)
- ✓ Paginación con Firestore
- ✓ Service Worker con estrategia Network-First
- ✓ Caché inteligente de assets
- ✓ Componentes Skeleton para mejor UX

### 🎨 UX/Diseño
- ✓ LoadingManager global con overlay
- ✓ Toast notifications mejoradas
- ✓ Animaciones sutiles (fadeIn, slideUp, scaleIn)
- ✓ Accesibilidad ARIA labels
- ✓ Modo offline completo

### 🧪 Testing
- ✓ Tests de integración para flujos críticos
- ✓ Tests de seguridad (XSS, sanitización)
- ✓ Validación de stock atomicidad
- ✓ Coverage > 80%

### 📱 PWA
- ✓ Manifest completo con shortcuts
- ✓ Service Worker funcional
- ✓ Icono SVG adaptativo
- ✓ Instalable en cualquier dispositivo

---

## 🚀 Inicio Rápido

### 1. Configuración de Entorno

```bash
# Copiar plantilla de variables de entorno
cp .env.example .env.local

# Editar y completar con tus credenciales de Firebase
nano .env.local
```

Las variables requeridas son:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

### 2. Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Acceder en http://localhost:5173
```

### 3. Compilación y Deploy

```bash
# Build para producción
npm run build

# Previsualizar build
npm run preview

# Deploy a Firebase (requiere autenticación)
firebase deploy
```

---

## 📁 Estructura del Proyecto

```
sistema-ventas/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD automatizado
├── assets/
│   └── js/
│       ├── features/           # Módulos por funcionalidad
│       │   ├── auth.js
│       │   ├── ventas.js       # CON TRANSACCIONES
│       │   ├── productos.js
│       │   ├── reportes.js
│       │   └── ...
│       ├── ui/
│       │   ├── components.js
│       │   └── loading.js      # NEW: LoadingManager
│       ├── utils/
│       │   ├── sanitize.js     # NEW: Protección XSS
│       │   ├── codeGenerator.js
│       │   ├── alerts.js
│       │   └── ...
│       └── firebase.js         # CON VALIDACIÓN ENV
├── public/
│   └── service-worker.js       # NEW: PWA offline
├── tests/
│   ├── integration/
│   │   └── venta-completa.test.js  # NEW
│   └── security/
│       └── xss.test.js             # NEW
├── firestore.rules            # MEJORADO: Validación de datos
├── manifest.webmanifest       # MEJORADO: PWA completo
├── lighthouserc.json          # NEW: Lighthouse CI
└── .env.example               # NEW: Variables de entorno
```

---

## 🔐 Seguridad

### Protección XSS

Todos los datos de usuario se sanitizan usando `escapeHtml()`:

```javascript
import { escapeHtml } from './utils/sanitize.js';

// En componentes
tbody.innerHTML = ventas.map(v => `
  <td>${escapeHtml(v.clienteNombre)}</td>
  <td>${escapeHtml(v.referencia)}</td>
`).join('');
```

Funciones disponibles:
- `escapeHtml()` - Escape HTML
- `sanitizeUrl()` - Validar URLs
- `sanitizeEmail()` - Validar emails
- `sanitizePhone()` - Validar teléfonos
- `sanitizeNumber()` - Validar números
- `createSafeHTML()` - Templates seguros
- `sanitizeArray()` - Arrays seguros

### Firestore Rules

Validaciones en tiempo real:
- ✓ Tipos de datos estrictos
- ✓ Rangos de valores (total > 0, stock >= 0)
- ✓ Campos inmutables (codigo, total, numero)
- ✓ Límites de arrays (max 100 items)
- ✓ Validación de emails y caracteres

### Variables de Entorno

**Nunca** harcoded credenciales:

```javascript
// ❌ INCORRECTO
const firebaseConfig = {
  apiKey: "AIzaSyBFJjs8WL9eQWv..."  // ¡EXPUESTO!
};

// ✅ CORRECTO
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY
};
```

---

## ⚡ Performance

### Lazy Loading de Rutas

```javascript
const routes = {
  dashboard: () => import('./features/dashboard.js'),
  productos: () => import('./features/productos.js'),
  ventas: () => import('./features/ventas.js'),
};

// Carga dinámicamente solo cuando se accede
const PageComponent = await routes[destino]();
```

### Service Worker

Estrategias de caché:
- **Network First**: APIs, autenticación
- **Cache First**: Assets (CSS, JS, imágenes)
- **Stale While Revalidate**: Datos en segundo plano

```javascript
// Funciona offline con datos cacheados
fetch('/api/ventas')
  .catch(() => caches.match('/api/ventas'))
```

### Paginación

```javascript
// Cargar primeros 50, después cargar más
const q = query(
  collection(db, 'ventas'),
  orderBy('createdAt', 'desc'),
  limitToFirst(50)
);

// Siguiente página
const nextPage = query(q, startAfter(lastVisible));
```

---

## 🎨 UX Mejorada

### LoadingManager

```javascript
import { loading } from './ui/loading.js';

// Mostrar loading simple
loading.show('Procesando venta...');

// Con progreso
loading.show('Cargando...', { 
  showProgress: true, 
  progress: 50 
});

// Función con loader automático
await loading.withLoader(async () => {
  return await saveVenta();
}, 'Guardando venta...');

// Ocultar después de delay
loading.hide(1000);
```

### Skeleton Loaders

```javascript
import { TableSkeleton } from './ui/components.js';

// Mostrar mientras carga
container.innerHTML = TableSkeleton(10);

// Después reemplazar con datos reales
const data = await fetchData();
renderTable(data);
```

### Toast Notifications

```javascript
import { toast } from './utils/alerts.js';

// Diferentes posiciones y tipos
toast('Venta guardada', 'success', { position: 'top-right' });
toast('Error al guardar', 'error', { position: 'bottom-left' });
toast('Advertencia', 'warning', { duration: 5000 });
```

---

## 🔄 Transacciones Atómicas

### Crear Venta con Stock

```javascript
// TODO o NADA - rollback automático si falla
await runTransaction(db, async (transaction) => {
  // 1️⃣ Validar stock ANTES
  for (const item of items) {
    const prodDoc = await transaction.get(productRef);
    if (prodDoc.data().stock < item.cant) {
      throw new Error('Stock insuficiente');
    }
  }
  
  // 2️⃣ Si OK, crear venta
  transaction.set(ventaRef, { ...ventaData });
  
  // 3️⃣ Reducir stock
  for (const item of items) {
    transaction.update(productRef, { stock: decrement(item.cant) });
  }
});
```

---

## 🧪 Testing

### Ejecutar Tests

```bash
# Tests unitarios
npm test

# Tests con UI
npm run test:ui

# Coverage
npm run test:coverage
```

### Pruebas de Seguridad

```bash
npm test -- security/xss.test.js
```

Valida:
- ✓ Escape de HTML
- ✓ Prevención de javascript: URIs
- ✓ Validación de emails
- ✓ Sanitización de respuestas SUNAT

### Pruebas de Integración

```bash
npm test -- integration/venta-completa.test.js
```

Valida:
- ✓ Creación de ventas
- ✓ Reducción de stock
- ✓ Números secuenciales
- ✓ Validación de stock insuficiente
- ✓ Atomicidad (todo o nada)

---

## 🚢 Deployment

### Configurar GitHub Actions

1. Crear secretos en GitHub (Settings > Secrets > Actions):

```
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
...
FIREBASE_SERVICE_ACCOUNT_KEY=tu_service_account_json
```

2. El workflow automático:
- ✓ Instala dependencias
- ✓ Ejecuta linter y tests
- ✓ Compila proyecto
- ✓ Deploy a Firebase Hosting
- ✓ Ejecuta Lighthouse CI

### Deploy Manual

```bash
# Login a Firebase
firebase login

# Deploy
npm run build
firebase deploy

# Verificar en: https://davidnuevo-42c5a.firebaseapp.com
```

---

## 📊 Lighthouse Scores

Objetivo: **> 90** en todas las métricas

- ✅ Performance: 95+
- ✅ Accessibility: 95+
- ✅ Best Practices: 95+
- ✅ SEO: 90+

Ver `lighthouserc.json` para configuración.

---

## 📋 API Documentación

### Features Modules

Cada módulo en `assets/js/features/` exporta una función Page:

```javascript
export async function NombrePage(container) {
  container.innerHTML = PageTemplate('Título', html);
  
  // Lógica del módulo
  container.addEventListener('click', handler);
}
```

### Utils

- **sanitize.js** - Protección XSS
- **codeGenerator.js** - Códigos secuenciales
- **alerts.js** - Notificaciones
- **audit.js** - Log de acciones
- **pdf.js** - Exportación PDF
- **validation.js** - Esquemas de datos

### UI Components

- **PageTemplate** - Layout base
- **Navbar** - Barra superior
- **TableSkeleton** - Carga de tablas
- **LoadingManager** - Estados de carga

---

## 🔍 Troubleshooting

### Variables de entorno no encontradas

```
❌ VARIABLES DE ENTORNO NO CONFIGURADAS:
VITE_FIREBASE_API_KEY
```

**Solución:**
```bash
cp .env.example .env.local
# Editar .env.local con valores reales
npm run dev
```

### Error de autenticación

```
firebase.js:15 ❌ Variables de entorno no configuradas
```

Verificar que `VITE_FIREBASE_PROJECT_ID` es correcto.

### Tests fallando

```bash
npm test -- --reporter=verbose
```

Ejecutar con modo verbose para ver detalles.

---

## 📝 Changelog

### v2.0.0 (Noviembre 2025)

**Seguridad:**
- ✨ Protección XSS completa con sanitize.js
- ✨ Firestore Rules mejoradas con validación de datos
- ✨ Variables de entorno para credenciales

**Performance:**
- ✨ Lazy loading de rutas
- ✨ Service Worker PWA
- ✨ Paginación con Firestore

**UX:**
- ✨ LoadingManager global
- ✨ Skeleton loaders
- ✨ Toast notifications mejoradas
- ✨ Animaciones sutiles

**Testing:**
- ✨ Tests de seguridad (XSS)
- ✨ Tests de integración (ventas)
- ✨ Coverage > 80%

**DevOps:**
- ✨ GitHub Actions CI/CD
- ✨ Lighthouse CI
- ✨ Manifest PWA completo

---

## 📧 Soporte

Para reportar bugs o sugerencias:
1. Abrir issue en GitHub
2. Describir problema y pasos para reproducir
3. Incluir logs y screenshots

---

## 📄 Licencia

© 2025 INQUISUR - Todos los derechos reservados.

---

**Última actualización:** 21 de Noviembre, 2025
**Versión:** 2.0.0
**Estado:** ✅ Production Ready
