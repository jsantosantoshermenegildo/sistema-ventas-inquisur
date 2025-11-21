# ========================================
# SCRIPT DE SETUP AUTOMÁTICO
# ========================================

Write-Host "🚀 SISTEMA DE VENTAS - SETUP AUTOMÁTICO v2.0" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "📦 Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js NO encontrado" -ForegroundColor Red
    Write-Host "   Instala Node.js desde: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Verificar npm
Write-Host "📦 Verificando npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm instalado: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm NO encontrado" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Instalar dependencias
Write-Host "📥 Instalando dependencias..." -ForegroundColor Yellow
Write-Host "   (Esto puede tomar algunos minutos)" -ForegroundColor Gray
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencias instaladas correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Configurar .env.local
Write-Host "⚙️  Configurando variables de entorno..." -ForegroundColor Yellow

if (Test-Path ".env.local") {
    Write-Host "⚠️  .env.local ya existe" -ForegroundColor Yellow
    $overwrite = Read-Host "   ¿Sobrescribir? (s/N)"
    
    if ($overwrite -eq "s" -or $overwrite -eq "S") {
        Copy-Item .env.example .env.local -Force
        Write-Host "✅ .env.local sobrescrito desde .env.example" -ForegroundColor Green
        Write-Host "⚠️  RECUERDA: Editar .env.local con tus credenciales" -ForegroundColor Yellow
    } else {
        Write-Host "⏭️  Manteniendo .env.local existente" -ForegroundColor Gray
    }
} else {
    Copy-Item .env.example .env.local
    Write-Host "✅ .env.local creado desde .env.example" -ForegroundColor Green
    Write-Host "⚠️  IMPORTANTE: Debes editar .env.local con tus credenciales de Firebase" -ForegroundColor Yellow
}

Write-Host ""

# Verificar Firebase CLI
Write-Host "🔥 Verificando Firebase CLI..." -ForegroundColor Yellow
try {
    $firebaseVersion = firebase --version
    Write-Host "✅ Firebase CLI instalado: $firebaseVersion" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "🔐 ¿Desplegar Firestore Rules ahora? (s/N): " -ForegroundColor Yellow -NoNewline
    $deployRules = Read-Host
    
    if ($deployRules -eq "s" -or $deployRules -eq "S") {
        Write-Host "   Desplegando rules..." -ForegroundColor Gray
        firebase deploy --only firestore:rules
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Firestore Rules desplegadas correctamente" -ForegroundColor Green
        } else {
            Write-Host "❌ Error desplegando rules" -ForegroundColor Red
            Write-Host "   Ejecuta manualmente: firebase deploy --only firestore:rules" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⏭️  Recuerda desplegar las rules manualmente:" -ForegroundColor Yellow
        Write-Host "   firebase deploy --only firestore:rules" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Firebase CLI NO instalado" -ForegroundColor Yellow
    Write-Host "   Instalar con: npm install -g firebase-tools" -ForegroundColor Gray
    Write-Host "   Luego ejecutar: firebase deploy --only firestore:rules" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "✅ SETUP COMPLETADO" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Editar .env.local con tus credenciales de Firebase" -ForegroundColor White
Write-Host "   > notepad .env.local" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 🔴 CRÍTICO: Revocar service account key comprometida" -ForegroundColor Red
Write-Host "   - Ve a Firebase Console > Settings > Service Accounts" -ForegroundColor Gray
Write-Host "   - Revoca la key existente" -ForegroundColor Gray
Write-Host "   - Elimina el archivo: davidnuevo-42c5a-firebase-adminsdk-*.json" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Iniciar desarrollo:" -ForegroundColor White
Write-Host "   > npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Abrir en navegador: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentación:" -ForegroundColor Yellow
Write-Host "   - QUICK_START.md - Guía rápida" -ForegroundColor Gray
Write-Host "   - IMPLEMENTATION_SUMMARY.md - Resumen de cambios" -ForegroundColor Gray
Write-Host "   - MIGRATION_GUIDE.md - Guía de migración" -ForegroundColor Gray
Write-Host ""
Write-Host "¡Listo para empezar! 🚀" -ForegroundColor Green
Write-Host ""
