# 📋 GUÍA DE MIGRACIÓN v1 → v2

## ✅ Cambios Implementados

### 🔴 CRÍTICOS (YA APLICADOS)

#### 1. Firestore Security Rules ✅
**Antes:**
```javascript
allow read, write: if true; // ❌ Acceso total
```

**Ahora:**
```javascript
// ✅ Reglas por rol con autenticación
allow read: if isAuthenticated();
allow write: if isAdmin();
```

**Acción requerida:**
```bash
firebase deploy --only firestore:rules
```

#### 2. Variables de Entorno ✅
**Antes:**
```javascript
// firebase.js - credenciales expuestas
const firebaseConfig = {
  apiKey: "AIzaSy...", // ❌ Público en código
}
```

**Ahora:**
```javascript
// .env.local
VITE_FIREBASE_API_KEY=AIzaSy...
```

**Acción requerida:**
1. Copiar `.env.example` a `.env.local`
2. Configurar valores
3. Instalar dependencias: `npm install`

#### 3. Service Account Key ✅
**Acción URGENTE:**
```bash
# 1. Eliminar del repositorio
git rm davidnuevo-42c5a-firebase-adminsdk-*.json
git commit -m "chore: remove compromised service account"

# 2. Revocar en Firebase Console
# Settings > Service Accounts > Revoke key

# 3. Generar nueva key (solo para backend)
```

#### 4. Race Conditions en Códigos ✅
**Antes:**
```javascript
// ❌ Dos usuarios pueden obtener el mismo código
const next = await getNextCode();
await incrementCode();
```

**Ahora:**
```javascript
// ✅ Transacción atómica
import { getNextProductoCode } from '@utils/codeGenerator.js';
const codigo = await getNextProductoCode(); // Thread-safe
```

---

### 🟠 ALTA PRIORIDAD (YA APLICADOS)

#### 5. State Manager ✅
**Uso:**
```javascript
import { appState } from '@/core/StateManager.js';

// Set estado
appState.setState({ productos: [...] });

// Get estado
const productos = appState.get('productos');

// Suscribirse a cambios
const unsub = appState.subscribe((newState, oldState) => {
  console.log('Estado cambió:', newState);
});
```

#### 6. Lifecycle Manager ✅
**Uso en cada página:**
```javascript
import { lifecycleManager } from '@core/LifecycleManager.js';

export async function MiPage(container) {
  const lifecycle = lifecycleManager.create('mi-pagina');
  
  // Event listeners automáticos
  lifecycle.addEventListener(button, 'click', handleClick);
  
  // Firestore subscriptions
  const unsub = onSnapshot(query, callback);
  lifecycle.addFirestoreUnsubscriber(unsub);
  
  // La limpieza es automática al cambiar de página
}
```

#### 7. Logger Centralizado ✅
**Antes:**
```javascript
console.log('✅ Guardado'); // ❌ Se ve en producción
```

**Ahora:**
```javascript
import { logger } from '@utils/logger.js';

logger.log('Guardado'); // Solo en desarrollo
logger.error('Error'); // Siempre se muestra
logger.success('✅ OK'); // Solo en desarrollo
```

#### 8. Error Handler ✅
**Uso:**
```javascript
import { errorHandler, tryCatch } from '@utils/errorHandler.js';

// Opción 1: Manual
try {
  await operation();
} catch (error) {
  await errorHandler.handle(error, {
    entity: 'productos',
    action: 'create'
  });
}

// Opción 2: Helper
const { success, data, error } = await tryCatch(
  () => createProducto(data),
  { entity: 'productos', action: 'create' }
);
```

#### 9. Constantes Centralizadas ✅
**Antes:**
```javascript
const IGV_RATE = 0.18; // Duplicado en 5 archivos
if (estado === 'confirmada') // Magic string
```

**Ahora:**
```javascript
import { TAX, ESTADOS_VENTA } from '@constants/index.js';

const igv = total * TAX.IGV_RATE;
if (estado === ESTADOS_VENTA.CONFIRMADA)
```

#### 10. Formatters Unificados ✅
**Antes:**
```javascript
// Duplicado en múltiples archivos
const money = n => (Number(n)||0).toLocaleString("es-PE", {...});
```

**Ahora:**
```javascript
import { formatCurrency, formatDate, toNumber } from '@utils/formatters.js';

const formatted = formatCurrency(1500); // "S/ 1,500.00"
const date = formatDate(new Date(), 'long'); // "1 de enero de 2025"
```

---

### 🟡 MEDIA PRIORIDAD

#### 11. Vite Setup ✅
**Iniciar desarrollo:**
```bash
npm run dev
```

**Build para producción:**
```bash
npm run build
```

**Los console.log se eliminan automáticamente en build de producción.**

#### 12. ESLint + Prettier ✅
**Ejecutar:**
```bash
# Lint
npm run lint

# Formatear
npm run format
```

**Pre-commit hooks configurados con Husky.**

---

## 🔄 Migración por Módulos

### Productos
```javascript
// ❌ ANTES
window.deleteProducto = async (id) => { ... }
const codigo = await getNextCode();
console.log('Guardado');

// ✅ AHORA
import { getNextProductoCode } from '@utils/codeGenerator.js';
import { logger } from '@utils/logger.js';
import { lifecycleManager } from '@core/LifecycleManager.js';

export async function ProductosPage(container) {
  const lifecycle = lifecycleManager.create('productos');
  const codigo = await getNextProductoCode();
  logger.success('Guardado');
}
```

### Ventas
```javascript
// ❌ ANTES
const money = n => ...
const numero = await nextVentaNumber();

// ✅ AHORA
import { formatCurrency } from '@utils/formatters.js';
import { getNextVentaNumber } from '@utils/codeGenerator.js';

const total = formatCurrency(1500);
const numero = await getNextVentaNumber();
```

---

## ⚙️ Configuración de Desarrollo

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar entorno
```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales
```

### 3. Desplegar rules
```bash
firebase deploy --only firestore:rules
```

### 4. Iniciar dev
```bash
npm run dev
```

---

## 🧪 Testing (Próximo)

Estructura preparada para tests:

```javascript
// tests/unit/codeGenerator.test.js
import { describe, it, expect } from 'vitest';
import { getNextProductoCode } from '@utils/codeGenerator.js';

describe('Code Generator', () => {
  it('genera códigos únicos', async () => {
    const code1 = await getNextProductoCode();
    const code2 = await getNextProductoCode();
    expect(code1).not.toBe(code2);
  });
});
```

---

## 📊 Checklist de Migración

### Inmediato
- [x] Desplegar Firestore Rules
- [x] Configurar .env.local
- [x] Revocar service account key comprometida
- [x] Instalar dependencias (`npm install`)

### Esta semana
- [ ] Migrar todos los módulos a usar `codeGenerator.js`
- [ ] Reemplazar `console.log` por `logger`
- [ ] Eliminar todas las variables `window.*`
- [ ] Usar `lifecycleManager` en todas las páginas
- [ ] Aplicar `formatters` en todo el código

### Este mes
- [ ] Escribir tests unitarios
- [ ] Escribir tests de integración
- [ ] Configurar CI/CD
- [ ] Migrar gradualmente a TypeScript

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisar errores en consola
2. Verificar que las rules estén desplegadas
3. Comprobar que .env.local esté configurado
4. Limpiar caché del navegador

**Errores comunes:**

- `Permission denied` → Revisar Firestore Rules
- `Module not found` → Ejecutar `npm install`
- `Código duplicado` → Usar `codeGenerator.js`

---

**Fecha:** Noviembre 2025  
**Versión:** 2.0.0
