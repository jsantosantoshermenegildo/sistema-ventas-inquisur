# Instrucciones para Agentes de IA - Sistema de Ventas

## Arquitectura General

Este es un sistema de ventas SPA (Single Page Application) construido con:
- HTML + JavaScript vanilla (sin frameworks)
- Tailwind CSS (vía CDN)
- Firebase para autenticación y base de datos
- Arquitectura modular basada en características (features)

### Estructura de Archivos Clave

```
assets/js/
├── features/      # Módulos por funcionalidad
│   ├── auth.js    # Autenticación
│   ├── ventas.js  # Gestión de ventas
│   └── ...
├── rules/         # Reglas de negocio
│   ├── roles.js   # Permisos por rol
│   └── schemas.js # Validación de datos
├── ui/           # Componentes de interfaz
└── utils/        # Utilidades generales
```

## Patrones y Convenciones

### Enrutamiento
- Sistema de rutas basado en hash (#) en `router.js`
- Cada ruta corresponde a una función que renderiza la página
- Control de acceso basado en roles mediante `PERMISOS` en `roles.js`

### Autenticación
- Firebase Auth con persistencia local
- 3 roles: admin, seller, viewer
- Páginas iniciales por rol definidas en `HOME_BY_ROLE`

### UI Components
- Componentes definidos como funciones puras que retornan HTML
- Uso consistente de clases Tailwind para estilos
- Template base común con `PageTemplate` en `components.js`

## Flujos de Desarrollo

### Agregar Nueva Funcionalidad
1. Crear módulo en `features/`
2. Actualizar permisos en `roles.js` si es necesario
3. Registrar ruta en `router.js`

### Mejores Prácticas
- Mantener la lógica de negocio en módulos de `features/`
- Validar datos según schemas definidos en `schemas.js`
- Auditar acciones importantes usando `audit.js`

## Integraciones

### Firebase
- Autenticación: `firebase-auth.js` v11.0.1
- Base de datos: Firestore
- Reglas de seguridad en `firebase.rules`