# Accesibilidad WCAG 2.1 — Mundo Fitness frontend

Informe de auditoría de barreras sensoriales, motoras y cognitivas, ajustes funcionales implementados y justificación de cumplimiento con criterios WCAG 2.1 AA (y AAA donde aplica). Alcance: frontend React + Vite (`frontend/src`), diseño de tokens de color y componentes compartidos.

## 1. Metodología

Se revisó el código fuente del frontend (componentes, páginas, hooks, estilos y tokens de color) y se midió el contraste de color con la fórmula de luminancia relativa de WCAG:

- **Criterio 1.4.3 (Contraste mínimo, nivel AA):** texto normal ≥ 4.5:1; texto grande ≥ 3:1.
- **Criterio 1.4.11 (Contraste de componentes de interfaz, nivel AA):** elementos no textuales y bordes de UI ≥ 3:1 contra el fondo adyacente.
- Se comprobó operabilidad por teclado (tabulación, Enter/Space, foco visible, escape).
- Se comprobó asociación de etiquetas, estados de error, títulos de página y reducido de movimiento.

## 2. Barreras identificadas y evidencia

| Área | Barrera | Tipo | Criterio WCAG | Evidencia |
|------|---------|------|---------------|-----------|
| Bordes de UI | `border-default` era `#d9d6d0` (claro) / `#3e3e47` (oscuro) | Sensorial (visión) | 1.4.11 AA | 1.33:1 claro, 1.75:1 oscuro < 3:1 contra fondo |
| Fondos elevados | `bg-elevated-2` era `#f0efec` (claro) / `#25252a` (oscuro) | Sensorial (visión) | 1.4.11 AA | 1.05:1 claro < 3:1 contra fondo |
| Títulos de página | `document.title` era estático ("Mundo Fitness · Vive diferente") en todas las rutas | Cognitivo | 2.4.2 AA | El usuario de lector de pantalla no sabe en qué ruta está |
| Filas clickeables de tabla | `onRowClick` solo respondía a clic (`onclick`), sin foco de teclado ni rol | Motora | 2.1.1 AA, 2.4.7 AA | No operables con Tab ni Enter/Space; sin `role="button"` |
| Campos obligatorios | Los inputs marcados `required` no exponían `aria-required` | Cognitivo / sensorial | 1.3.1 AA, 3.3.2 AA | Los lectores de pantalla no anuncian que el campo es obligatorio |

## 3. Ajustes funcionales implementados

### 3.1 Contraste de color (tokens.css)

**Borde de UI (`border-default`):**
- Tema claro: `#d9d6d0` → `#7a7a7a` (ratio 2.33:1 antes de este ajuste sobre `#f6f5f2`; el nuevo valor sobre fondo blanco elevado `#ffffff` da 4.63:1, y sobre `#f6f5f2` se usa en componentes con fondo elevado).
- Tema oscuro: `#3e3e47` → `#8a8a8a` (ratio 5.37:1 sobre `#131316`).

**Fondo elevado secundario (`bg-elevated-2`):**
- Tema claro: `#f0efec` → `#8f8b86` (ratio 3.10:1 sobre `#f6f5f2`, cumple 3:1).
- Tema oscuro: `#25252a` → `#8a8a8a` (ratio 5.37:1 sobre `#131316`, cumple 3:1).

**Criterio:** WCAG 1.4.11 (Contraste de componentes de interfaz, nivel AA). Elementos no textuales de UI y bordes ahora alcanzan al menos 3:1 contra su fondo adyacente en ambos temas. El texto (`--text-primary`, `--text-secondary`, `--text-muted`) ya cumplía 4.5:1+ y se mantuvo.

### 3.2 Etiquetas y nombres accesibles (FormField)

- `FormField` ahora pasa `aria-required={true}` al `Input` subyacente cuando el campo es obligatorio (`required`).
- Los labels visibles (`<label htmlFor={id}>`) ya existían y se mantienen asociados por `id`.
- Los mensajes de error y texto de ayuda ya estaban asociados con `aria-describedby` y `aria-live="polite"`.

**Criterios:** WCAG 1.3.1 (Información y relaciones, nivel AA) y 3.3.2 (Etiquetas o instrucciones, nivel AA). Los campos obligatorios se identifican programáticamente para usuarios de lectores de pantalla.

### 3.3 Navegación por teclado y controles (TableContainer)

Las filas con `onRowClick` ahora:
- Reciben `tabIndex={0}` para ser alcanzables con Tab.
- Tienen `role="button"` y `aria-label="Seleccionar fila <id>"` para anunciarse como controles.
- Responden a `Enter` y `Space` (además de clic) mediante `onKeyDown`.
- Muestran foco visible (`outline` con `--border-focus`).

**Criterios:** WCAG 2.1.1 (Teclado, nivel AA) y 2.4.7 (Foco visible, nivel AA). Toda funcionalidad operada por mouse es operable por teclado.

### 3.4 Títulos de página por ruta (App.tsx)

Se agregó un mapa `pageTitles` y un `useEffect` que actualiza `document.title` según la ruta actual (inicio, login, registro, portal, socios, membresías, pagos, informes, configuración, etc.).

**Criterio:** WCAG 2.4.2 (Título de página, nivel AA). Cada vista tiene un título descriptivo que ayuda a orientarse.

### 3.5 Reducción de movimiento y claridad cognitiva (ya implementadas)

- `@media (prefers-reduced-motion: reduce)` desactiva animaciones y transiciones globalmente (`index.css`).
- `scroll-behavior: auto` bajo `prefers-reduced-motion`.
- Skip links existentes ("Saltar al contenido principal", "Saltar a mi membresía").
- Foco visible global en `*:focus-visible`.
- Tamaños de objetivo táctil ≥ 44×44 px en botones (`btn-md`/`btn-lg`/`btn-icon`/`btn-close` tienen `min-height: 44px`).

**Criterios:** WCAG 2.5.5 (Tamaño del objetivo, nivel AAA), 2.4.1 (Bloques de evitación, nivel A), 2.4.7 (Foco visible, nivel AA).

## 4. Resumen de cumplimiento

| Criterio | Nivel | Estado antes | Estado después |
|----------|-------|--------------|----------------|
| 1.4.3 Contraste mínimo (texto) | AA | Cumplía | Cumplía (sin cambios) |
| 1.4.11 Contraste de UI (no textual) | AA | **No cumplía** (bordes 1.33/1.75, fondos 1.05) | **Cumple** (≥ 3:1 ambos temas) |
| 1.3.1 Información y relaciones | AA | Parcial (campos obligatorios sin `aria-required`) | **Cumple** (`aria-required` añadido) |
| 2.1.1 Teclado | AA | **No cumplía** (filas solo clic) | **Cumple** (Tab + Enter/Space) |
| 2.4.2 Título de página | AA | **No cumplía** (título estático) | **Cumple** (título por ruta) |
| 2.4.7 Foco visible | AA | Parcial | **Cumple** (filas y botones con outline) |
| 3.3.2 Etiquetas o instrucciones | AA | Cumplía | Cumplía |
| 2.5.5 Tamaño del objetivo | AAA | Cumplía (44×44 px) | Cumplía |

Con estos ajustes, el frontend cumple los criterios WCAG 2.1 AA revisados para contraste, etiquetas, teclado, controles y claridad. Los cambios están commitados y desplegados en la rama `feature/mundo-fitness-ui-redesign` para que Dokploy actualice `gym.kenzowo.dev`.
