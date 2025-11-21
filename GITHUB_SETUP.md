# 🔧 GitHub Actions Setup Guide

Guía para configurar CI/CD automático con GitHub Actions

## 1️⃣ Crear Secretos en GitHub

### Paso 1: Acceder a Secretos del Repositorio

```
https://github.com/jsantosantoshermenegildo/sistema-ventas-inquisur/settings/secrets/actions
```

O desde el repo:
- Ir a **Settings**
- Sidebar: **Secrets and variables** → **Actions**
- Botón: **New repository secret**

### Paso 2: Agregar Secretos de Firebase

Crear cada uno de estos secretos con sus valores reales:

#### `VITE_FIREBASE_API_KEY`
```
Valor: AIzaSy... (tu API key de Firebase)
```

#### `VITE_FIREBASE_AUTH_DOMAIN`
```
Valor: proyecto.firebaseapp.com
```

#### `VITE_FIREBASE_PROJECT_ID`
```
Valor: proyecto-xxxxx
```

#### `VITE_FIREBASE_STORAGE_BUCKET`
```
Valor: proyecto.appspot.com
```

#### `VITE_FIREBASE_MESSAGING_SENDER_ID`
```
Valor: 123456789
```

#### `VITE_FIREBASE_APP_ID`
```
Valor: 1:123456789:web:abcd1234...
```

#### `VITE_FIREBASE_MEASUREMENT_ID`
```
Valor: G-XXXXXXXXXX
```

#### `FIREBASE_SERVICE_ACCOUNT_KEY`
```
Valor: (JSON completo de la cuenta de servicio)
```

## 2️⃣ Configurar Cuenta de Servicio

### Obtener Firebase Service Account

1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Seleccionar proyecto
3. Configuración (engranaje) → **Configuración del proyecto**
4. Pestaña: **Cuentas de servicio**
5. Botón: **Generar nueva clave privada**
6. Se descarga archivo JSON

### Copiar JSON a Secreto

```bash
# En tu máquina local
cat ~/Downloads/davidnuevo-42c5a-firebase-adminsdk-*.json

# Copiar TODO el contenido JSON y pegarlo en el secreto
# FIREBASE_SERVICE_ACCOUNT_KEY
```

**⚠️ IMPORTANTE:** Nunca commitear archivo .json directamente

## 3️⃣ Verificar Workflow

### Ver estado del workflow

```
https://github.com/jsantosantoshermenegildo/sistema-ventas-inquisur/actions
```

### Trigger automático

El workflow se ejecuta cuando:
- ✅ Push a rama `main`
- ✅ Pull Request a rama `main`

### Ejemplo de ejecución

```
✅ Build & Test
  ├── Checkout code
  ├── Setup Node.js 18.x
  ├── Install dependencies
  ├── Type check
  ├── Lint code
  ├── Run tests
  └── Build project

✅ Deploy to Firebase (si es push a main)
  ├── Download build artifacts
  └── Deploy to Firebase Hosting

✅ Lighthouse CI (si es PR)
  ├── Build project
  └── Run Lighthouse tests
```

## 4️⃣ Monitorear Builds

### Ver logs detallados

1. Ir a Actions
2. Hacer clic en workflow execution
3. Expandir pasos para ver output

### Troubleshooting

#### ❌ Build failed: "Cannot find module"

```
npm install
npm run build
```

Ejecutar localmente para verificar.

#### ❌ Firebase deployment unauthorized

Verificar que `FIREBASE_SERVICE_ACCOUNT_KEY` es válido:

```bash
# Generar nueva clave
firebase login
firebase deploy
```

#### ❌ Tests failing

```bash
npm test -- --reporter=verbose
```

Ver qué test falla y corregir localmente.

## 5️⃣ .env.local No Se Commitea

Crear archivo `.gitignore`:

```
.env.local
.env.*.local
.firebase/
dist/
node_modules/
```

Verificar que los secretos están en GitHub Actions, no en el repo.

## 6️⃣ Configuración Lighthouse (Opcional)

Si deseas ejecutar Lighthouse localmente:

```bash
npm install -g @lhci/cli@latest
npm install --save-dev @lhci/cli

# Configurar
lhci autorun
```

## 📋 Checklist Final

- ✅ Secretos agregados en GitHub
- ✅ Firebase Service Account configurado
- ✅ Workflow `.github/workflows/deploy.yml` presente
- ✅ `.env.local` agregado a `.gitignore`
- ✅ Primer push a `main` ejecuta automáticamente
- ✅ Verificar logs en Actions tab

## 🎯 Resultado

Después de cada push:

```
✅ Tests: PASSED
✅ Build: SUCCESS
✅ Deploy: COMPLETED
🌐 App URL: https://davidnuevo-42c5a.firebaseapp.com
```

---

**Documentación relacionada:**
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Firebase Deploy](https://firebase.google.com/docs/hosting/github-integration)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
