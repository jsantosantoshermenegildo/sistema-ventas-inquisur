# Guía de Accesibilidad - Sistema de Ventas v2.0.0

## 📋 Resumen Ejecutivo

El Sistema de Ventas v2.0.0 implementa accesibilidad WCAG 2.1 AA con:
- ✅ Atributos ARIA completos
- ✅ Navegación por teclado 100%
- ✅ Soporte para lectores de pantalla
- ✅ Contraste de colores mejorado
- ✅ Animaciones reducibles

---

## 🎯 Niveles de Conformidad WCAG

### Nivel A (Cumplido)
- Alternativas para contenido no textual ✅
- Sincronización multimedia ✅
- Adaptabilidad del contenido ✅
- Distinción del color ✅

### Nivel AA (Implementado)
- Contraste mínimo (4.5:1 para texto) ✅
- Redimensionamiento de texto ✅
- Imágenes de texto limitadas ✅
- Navegación consistente ✅

---

## 🔍 Componentes Accesibles Implementados

### 1. Navbar - Navegación Principal

```html
<nav class="..." role="navigation" aria-label="Menú principal">
  <a href="#dashboard" aria-label="Dashboard">📊 Dashboard</a>
  <button aria-label="Cambiar a modo oscuro" 
          aria-pressed="false" 
          role="switch">🌙</button>
</nav>
```

**Características:**
- `role="navigation"` para lectores de pantalla
- `aria-label` descriptivos sin emojis
- `aria-pressed` para botones toggle
- `aria-live="polite"` para cambios de estado

### 2. Formularios

```html
<label for="producto">Producto</label>
<input id="producto" 
       aria-required="true" 
       aria-describedby="producto-help"
       type="text">
<p id="producto-help">Ingrese el nombre del producto</p>
```

**Características:**
- Labels explícitos con `<label for="id">`
- `aria-required="true"` para campos obligatorios
- `aria-describedby` para instrucciones
- `aria-invalid="true"` para errores

### 3. Skeleton Loaders

```html
<div role="status" 
     aria-live="polite" 
     aria-label="Cargando tabla...">
  <!-- Contenido del skeleton -->
  <div class="sr-only">Cargando contenido de la tabla</div>
</div>
```

**Características:**
- `role="status"` para anunciar cambios
- `aria-live="polite"` para notificaciones no intrusivas
- `.sr-only` para texto solo para lectores

### 4. Alertas y Diálogos

```html
<!-- Alerta -->
<div role="alert" class="...">
  Error: No hay suficiente stock
</div>

<!-- Diálogo -->
<div role="dialog" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirmar acción</h2>
</div>
```

### 5. Tablas

```html
<table role="table">
  <thead>
    <tr>
      <th scope="col">Producto</th>
      <th scope="col">Cantidad</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Producto A</td>
      <td>10</td>
    </tr>
  </tbody>
</table>
```

### 6. Breadcrumbs

```html
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="#">Inicio</a></li>
    <li><a href="#ventas">Ventas</a></li>
    <li><a aria-current="page">Nueva venta</a></li>
  </ol>
</nav>
```

---

## ⌨️ Navegación por Teclado

### Atajos Soportados

| Atajo | Acción |
|-------|--------|
| `Tab` | Navegar entre elementos focusables |
| `Shift+Tab` | Navegar hacia atrás |
| `Enter` | Activar botón/enlace |
| `Space` | Toggle checkbox/switch |
| `Arrow Keys` | Navegar en menús/selectores |
| `Escape` | Cerrar diálogos/menús |

### Implementación

```javascript
// Todos los elementos focusables tienen:
element.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    element.click();
  }
});

// Focus visible para navegación visual
:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

---

## 🔤 Escritura Accesible

### Alt Text para Imágenes (cuando se use)
```html
<img src="gráfico.png" 
     alt="Gráfico de ventas mensuales: enero 5000, febrero 6200, marzo 7100">
```

### Descripciones Claras
```html
<button aria-label="Descargar reporte de ventas en PDF">
  ⬇️ Descargar
</button>
```

### Evitar Dependencia de Color
```css
/* ❌ Mal -->
.error { color: red; }

<!-- ✅ Bien -->
.error { 
  color: red;
  border-left: 4px solid red; /* Indicador adicional */
}
```

---

## 🌙 Modo Oscuro Accesible

### Dark Mode Support
```css
@media (prefers-color-scheme: dark) {
  body {
    background-color: #1e293b;
    color: #e2e8f0;
  }
}
```

### Alto Contraste
```css
@media (prefers-contrast: more) {
  button {
    border: 1px solid currentColor;
    font-weight: 700;
  }
}
```

---

## 🎬 Animaciones Reducibles

### Respeto a Preferencias del Usuario
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Animaciones Accesibles
- ✅ Transiciones suaves de 0.3s
- ✅ Sin movimiento paralela
- ✅ Reducibles por preferencia
- ✅ No inician automáticamente

---

## 🧪 Pruebas de Accesibilidad

### 1. Validar con WAVE
```bash
# Escanear página en el navegador
# Extensión: WebAIM WAVE
# Verificar: Errores 0, Alerts mínimos
```

### 2. Pruebas Manuales con Teclado
```bash
# Navegar con Tab
# Verificar: Todos elementos focusables son accesibles
# Verificar: Orden lógico de tab

# Presionar Tab 100 veces
# Resultado: Debe mantener orden consistente
```

### 3. Pruebas con Lector de Pantalla
```bash
# Windows: NVDA (gratuito)
# Mac: VoiceOver (Cmd + F5)
# Linux: Orca

# Verificar que:
# - Todos los diálogos se anuncian
# - Botones tienen labels claros
# - Alertas se anuncian inmediatamente
```

### 4. Contraste de Colores
```bash
# Herramienta: WebAIM Contrast Checker
# Requisito WCAG AA:
#   - Texto: 4.5:1 mínimo
#   - Elementos UI: 3:1 mínimo
```

### 5. Lighthouse Audit
```bash
# DevTools > Lighthouse
# Categoría: Accessibility
# Target: Score 90+
```

---

## 📝 Checklist de Accesibilidad

### Estructura
- [ ] Página tiene `<title>` descriptivo
- [ ] Encabezados (`<h1>`, `<h2>`) en orden lógico
- [ ] Listas semánticas (`<ul>`, `<ol>`)
- [ ] Tablas tienen `<th scope="col/row">`

### Formularios
- [ ] Todos inputs tienen `<label>` asociado
- [ ] Campos requeridos tienen `aria-required="true"`
- [ ] Mensajes de error tienen `aria-describedby`
- [ ] Botones tienen texto descriptivo

### Imágenes y Multimedia
- [ ] Todas las imágenes tienen `alt` descriptivo
- [ ] Iconos decorativos tienen `aria-hidden="true"`
- [ ] Videos tienen subtítulos
- [ ] Audio tiene transcripción

### Navegación
- [ ] Menú principal tiene `role="navigation"`
- [ ] Links tienen texto descriptivo
- [ ] Skip links funcionan
- [ ] Breadcrumbs implementados

### Colores y Contraste
- [ ] Texto: ratio 4.5:1 mínimo
- [ ] Elementos UI: ratio 3:1 mínimo
- [ ] No depende solo del color
- [ ] Modo alto contraste funciona

### Animaciones
- [ ] Respeta `prefers-reduced-motion`
- [ ] No parpadean > 3 veces/seg
- [ ] No tienen autoplay
- [ ] Pueden pausarse

---

## 🛠️ Herramientas Recomendadas

### Validación Automática
- **WAVE**: webAIM.org/articles/screenreader_testing
- **Axe DevTools**: deque.com/axe/devtools/
- **Lighthouse**: DevTools nativo
- **NVDA**: nvaccess.org (Windows)

### Manual Testing
- **Teclado**: Navegar sin ratón
- **Zoom**: 200% en navegador
- **VoiceOver**: Cmd+F5 (Mac)
- **Extensiones**: Color Blindness Sim

---

## 📚 Referencias

### WCAG 2.1 Guidelines
https://www.w3.org/WAI/WCAG21/quickref/

### ARIA Practices
https://www.w3.org/WAI/ARIA/apg/

### WebAIM Articles
https://webaim.org/articles/

### MDN Accessibility
https://developer.mozilla.org/en-US/docs/Web/Accessibility/

---

## 🚀 Próximos Pasos

### Para Desarrolladores
1. Ejecutar tests de accesibilidad regularmente
2. Usar ARIA correctamente (no abusar)
3. Probar con teclado en cada feature
4. Validar contraste de nuevos colores

### Para Usuarios
1. Usar extensiones accesibles
2. Reportar problemas de accesibilidad
3. Usar atajos de teclado documentados
4. Ajustar preferencias del navegador

---

**Versión:** 2.0.0  
**Última actualización:** 2024  
**Cumplimiento:** WCAG 2.1 AA  
