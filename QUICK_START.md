# 🚀 GUÍA DE INICIO RÁPIDO - v2.0

## ⚡ 5 PASOS PARA EMPEZAR

---

## PASO 1: Instalar Dependencias (2 minutos)

Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
npm install
```

**Qué hace:** Instala todas las dependencias modernas (Vite, ESLint, Vitest, etc.)

---

## PASO 2: Configurar Variables de Entorno (3 minutos)

```powershell
# Copiar template
Copy-Item .env.example .env.local

# Editar con tu editor favorito
notepad .env.local
```

**Contenido de `.env.local`:**
```env
VITE_FIREBASE_API_KEY=tu-api-key-aqui
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123
```

**Los valores están en:** Firebase Console > Project Settings > General

---

## PASO 3: 🔴 CRÍTICO - Desplegar Security Rules (5 minutos)

### 3.1 Login en Firebase
```powershell
firebase login
```

### 3.2 Seleccionar proyecto
```powershell
firebase use tu-proyecto-id
```

### 3.3 Desplegar rules
```powershell
firebase deploy --only firestore:rules
```

**Verificar:**
```powershell
firebase firestore:rules:list
```

Deberías ver las nuevas reglas con roles y autenticación.

---

## PASO 4: 🔐 URGENTE - Revocar Service Account Key (10 minutos)

### 4.1 En Firebase Console:
1. Ve a **Settings** > **Service Accounts**
2. Encuentra la key que está en el archivo:  
   `davidnuevo-42c5a-firebase-adminsdk-fbsvc-171a94f6f9.json`
3. Click en **Revoke** (tres puntos)
4. Confirmar

### 4.2 Eliminar del repositorio:
```powershell
# Si ya fue commiteado:
git rm davidnuevo-42c5a-firebase-adminsdk-fbsvc-171a94f6f9.json
git commit -m "chore: remove compromised service account key"
git push

# Verificar que esté en .gitignore
cat .gitignore | Select-String "firebase-adminsdk"
```

**⚠️ IMPORTANTE:** Esta key daba acceso TOTAL a tu base de datos. Debe ser revocada INMEDIATAMENTE.

---

## PASO 5: Iniciar Desarrollo (1 minuto)

```powershell
npm run dev
```

Abre tu navegador en: **http://localhost:3000**

---

## ✅ VERIFICACIÓN

### Checklist de seguridad:

- [ ] Dependencies instaladas (`node_modules` existe)
- [ ] `.env.local` configurado con credenciales correctas
- [ ] Firestore Rules desplegadas (verificar en console)
- [ ] Service account key revocada
- [ ] Archivo `*-firebase-adminsdk-*.json` eliminado del repo
- [ ] Aplicación corriendo en localhost:3000

---

## 🎯 COMANDOS ÚTILES

```powershell
# Desarrollo
npm run dev              # Iniciar servidor dev
npm run build            # Build producción
npm run preview          # Preview del build

# Calidad
npm run lint             # Revisar código
npm run format           # Formatear código
npm run type-check       # Verificar tipos

# Testing
npm run test             # Ejecutar tests
npm run test:ui          # UI de tests
npm run test:coverage    # Cobertura

# Firebase
firebase deploy                        # Deploy completo
firebase deploy --only hosting         # Solo hosting
firebase deploy --only firestore:rules # Solo rules
```

---

## 🆘 PROBLEMAS COMUNES

### "npm: command not found"
**Solución:** Instala Node.js desde https://nodejs.org (versión LTS)

### "firebase: command not found"
```powershell
npm install -g firebase-tools
```

### "Permission denied" en Firestore
**Solución:** 
1. Verificar que las rules estén desplegadas
2. Verificar que el usuario tenga rol asignado en `usuarios/{uid}`

### "VITE_FIREBASE_API_KEY is not defined"
**Solución:** 
1. Verificar que `.env.local` exista
2. Verificar que las variables empiecen con `VITE_`
3. Reiniciar servidor dev (`Ctrl+C` y `npm run dev`)

### Error de compilación
```powershell
# Limpiar y reinstalar
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json
npm install
```

---

## 📚 PRÓXIMOS PASOS (OPCIONAL)

### 1. Crear usuario admin (Firebase Console)
```
Authentication > Users > Add User
Email: admin@tuempresa.com
Password: [genera uno seguro]
```

Luego en Firestore, crear documento:
```
Collection: usuarios
Document ID: [el UID del usuario]
Data:
  email: "admin@tuempresa.com"
  role: "admin"
```

### 2. Probar funcionalidades básicas
1. Login con usuario admin
2. Crear un producto
3. Crear un cliente
4. Crear una venta
5. Ver reportes

### 3. Revisar documentación
- `IMPLEMENTATION_SUMMARY.md` - Resumen de cambios
- `MIGRATION_GUIDE.md` - Guía de migración
- `README.md` - Documentación general

---

## 🎉 ¡LISTO!

Tu sistema ahora está configurado con:
- ✅ Seguridad robusta
- ✅ Arquitectura moderna
- ✅ Tooling profesional
- ✅ Best practices

**Disfruta desarrollando! 🚀**

---

**Soporte:** Revisa `IMPLEMENTATION_SUMMARY.md` para más detalles  
**Versión:** 2.0.0  
**Fecha:** Noviembre 2025
