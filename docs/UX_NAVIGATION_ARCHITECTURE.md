# StockHub - Arquitectura de Navegación UX/UI

## Resumen Ejecutivo

Diseñamos una arquitectura de navegación profesional, escalable y adaptativa para la aplicación StockHub que prioriza:

- **Mobile**: Accesibilidad con bottom tabs y acciones rápidas (FAB)
- **Desktop**: Eficiencia con sidebar fija y header con buscador
- **Consistencia**: Misma estructura mental en ambas plataformas

---

## A. Estructura de Navegación

### Mobile (Pantalla < 768px)

```
┌─────────────────────────────────────┐
│           [HEADER]                 │  <- Solo para títulos de secciones
│                                     │
│                                     │
│         [CONTENIDO PRINCIPAL]       │  <- Pantalla activa
│                                     │
│                                     │
├─────────────────────────────────────┤
│  📦    🛒    📋    📊              │  <- Bottom Tab Navigation
│ Prod  Pedido Pref  Mov             │
└─────────────────────────────────────┘

Acceso secundario (Hamburguesa → Drawer):
┌────────────────┐
│ 📦 StockHub     │
│────────────────│
│ 🏠 Inicio       │  <- Navegación principal
│ 🎨 Colores      │
│ 📏 Talles       │
│────────────────│
│ v1.0.0          │  <- Footer
└────────────────┘

FAB (Floating Action Button):
                    ┌─────────┐
                    │  +      │  <- Siempre visible
                    └─────────┘
                    [+ Agregar]
                    [📷 Escanear]
```

### Desktop (Pantalla >= 1024px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📦 StockHub    │ Buscar productos...              │ [Agregar] [Escanear]       │  <- Header (64px)
├────────────────┴─────────────────────────────────────────────────────────────┤
│                │                                                              │
│  PRINCIPAL     │                                                              │
│  📦 Productos  │              [CONTENIDO PRINCIPAL]                           │
│  🛒 Pedido     │                                                              │
│  📋 Prefacturas│                                                              │
│  📊 Movimientos│                                                              │
│                │                                                              │
│────────────────│                                                              │
│  CONFIGURACIÓN │                                                              │
│  🎨 Colores    │                                                              │
│  📏 Talles     │                                                              │
│  ⚙️ Config     │                                                              │
│                │                                                              │
│────────────────│                                                              │
│  👤 Nicolas    │                                                              │  <- Footer del sidebar
│  Administrador │                                                              │
└────────────────┴─────────────────────────────────────────────────────────────┘
       260px                              (Resto del ancho)
```

---

## B. Jerarquía de Navegación

### Nivel 1: Navegación Principal

| Tab/Opción     | Prioridad | Descripción                    |
|----------------|-----------|--------------------------------|
| Productos      | ⭐⭐⭐⭐⭐  | Inventario principal           |
| Pedido         | ⭐⭐⭐⭐    | Armado de pedidos             |
| Prefacturas    | ⭐⭐⭐      | Historial de prefacturas      |
| Movimientos    | ⭐⭐⭐      | Registro de entradas/salidas   |

### Nivel 2: Acciones Rápidas

| Acción          | Ubicación          | Justificación UX              |
|-----------------|--------------------|-------------------------------|
| Agregar Producto | FAB (mobile)       | Accion mas frecuente          |
| Escanear QR     | FAB (mobile)       | Flujo rapido de inventario    |
| Agregar         | Header (desktop)   | Accion frecuente, siempre visible |
| Escanear        | Header (desktop)   | Accion frecuente, siempre visible |

### Nivel 3: Configuración

| Opción          | Ubicación       | Descripcion                    |
|-----------------|------------------|--------------------------------|
| Colores         | Drawer (mobile)  | Gestion de variantes           |
| Talles          | Drawer (mobile)  | Gestion de variantes           |
| Configuracion   | Drawer (mobile)  | Ajustes de la app              |

---

## C. Flujos de Usuario Optimizados

### Flujo 1: Agregar Producto (Mobile)
```
[Productos] → FAB (+) → [Agregar Producto] → Completar form → [Guardar] → [Productos]
   ↑                                                                              │
   └──────────────────────────────────────── Guardado exitoso ───────────────────┘
```

### Flujo 2: Agregar Producto (Desktop)
```
[Sidebar: Productos] → Header: [Agregar] → Modal "Agregar Producto" → Guardar → Feedback
```

### Flujo 3: Crear Pedido
```
[Tab: Pedido] → [Seleccionar Cliente] → [Buscar/Agregar Productos] → [Generar Prefactura]
                                                                                   ↓
                                                         [Confirmar] → [Productos] (stock actualizado)
```

---

## D. Componentes Implementados

### Mobile

1. **BottomTabNavigator** (`MainTabNavigator.tsx`)
   - 4 tabs principales con iconos y etiquetas
   - Indicador visual del tab activo
   - Safe area handling para notch

2. **FloatingActionButton** (`FloatingActionButton.tsx`)
   - Expandible con animacion
   - 2 acciones rapidas (agregar, escanear)
   - Backdrop semitransparente

3. **SettingsDrawer** (integrado en AppNavigator)
   - Acceso a configuracion
   - Header con logo
   - Footer con version

### Desktop

1. **DesktopSidebar** (`DesktopSidebar.tsx`)
   - Seccion principal y configuracion
   - Quick actions integradas
   - User info footer
   - Active state highlighting

2. **DesktopHeader** (`DesktopHeader.tsx`)
   - Buscador global
   - Acciones rapidas (Agregar, Escanear)
   - Titulo de seccion

3. **DesktopLayout** (`DesktopLayout.tsx`)
   - Wrapper responsive
   - Muestra sidebar+header en desktop
   - FAB en mobile

---

## E. Breakpoints y Responsividad

```typescript
const BREAKPOINTS = {
  MOBILE: 768,    // Mobile behavior
  TABLET: 1024,    // Tablet: sidebar compacta
  DESKTOP: 1280,   // Desktop: sidebar completa
};
```

### Adaptaciones por breakpoint:

| Elemento         | Mobile (<768)      | Tablet (768-1023)   | Desktop (>=1024)    |
|------------------|--------------------|---------------------|---------------------|
| Navegacion       | Bottom Tabs        | Bottom Tabs         | Sidebar             |
| Header           | Solo titulo        | Titulo + acciones   | Full con buscador    |
| Acciones rapidas | FAB                | FAB                 | En header           |
| Configuracion    | Drawer             | Drawer              | En sidebar          |
| FAB              | Visible            | Visible             | No necesario        |

---

## F. Recomendaciones UX Especificas

### 1. Visibilidad de Acciones
**Problema**: Las acciones secundarias estan ocultas.
**Solucion**: 
- FAB visible con 2 acciones maximo
- Quick actions en header desktop
- Badge counters en tabs (ej: 3 prefacturas pendientes)

### 2. Reduccion de Clics
**Problema**: Agregar producto requiere 3+ taps.
**Solucion**:
- FAB accesible desde cualquier screen
- Shortcuts de teclado en desktop (Ctrl+N para agregar)
- Deep linking desde notificaciones

### 3. Feedback Visual
**Recomendaciones**:
- Loading states con skeleton screens
- Toast notifications para confirmaciones
- Pull-to-refresh en listas
- Animaciones sutiles de transicion

### 4. Estados de Error
**Manejo recomendado**:
- Lista vacia con illustacion y CTA claro
- Errores de red con retry automatico
- Validacion inline en formularios

### 5. Empty States
**Ejemplos**:
```
Productos: "No hay productos. ¡Agrega tu primero!"
Pedido: "Arma tu primer pedido selecionando un cliente"
Prefacturas: "Las prefacturas apareceran aqui"
```

### 6. Accesibilidad
- Contraste WCAG AA minimo
- Tamanos de touch target >= 44px
- Labels de accesibilidad en iconos
- Soporte para lectores de pantalla

---

## G. Roadmap de Mejoras Futuras

### Corto Plazo (1-2 semanas)
- [ ] Implementar badges en tabs
- [ ] Agregar animaciones de transicion
- [ ] Estados de loading skeleton
- [ ] Pull-to-refresh

### Mediano Plazo (1 mes)
- [ ] Shortcuts de teclado para desktop
- [ ] Busqueda global con shortcuts (Ctrl+K)
- [ ] Notificaciones push
- [ ] Exportar datos (CSV, PDF)

### Largo Plazo (3+ meses)
- [ ] Modo offline con sync
- [ ] Multi-usuario con roles
- [ ] Dashboard con estadisticas
- [ ] App de escritorio Electron

---

## H. Metricas de Exito UX

| Metrica                    | Objetivo    | Metodo de medicion        |
|----------------------------|-------------|---------------------------|
| Tiempo para agregar producto| < 15 seg    | User testing              |
| Taps para accion frecuente | <= 2 taps   | Analisis de flujos        |
| Tasa de tareas completadas | > 90%       | Analytics                 |
| NPS (Net Promoter Score)   | > 40        | Encuestas periodicas      |
| Error rate                 | < 2%        | Tracking de errores        |

---

## I. Glosario

- **FAB**: Floating Action Button - Boton de accion rapida
- **Breakpoint**: Punto de quiebre para cambios de layout
- **Drawer**: Menu lateral deslizable (mobile)
- **Sidebar**: Menu lateral fijo (desktop)
- **Deep linking**: Navegacion directa a pantallas via URL

---

*Documento creado para StockHub v1.0.0*
*Ultima actualizacion: 2026*
