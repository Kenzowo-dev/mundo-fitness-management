# Mundo Fitness: identidad y experiencia digital

Mundo Fitness invita a las personas de Trujillo a empezar y sostener su entrenamiento. La marca combina energía en su portada con claridad y calma en las tareas de socios, recepción y administración. Smart Fit es una referencia de navegación y jerarquía cromática, no una plantilla ni una fuente de servicios o precios.

## Dirección visual

La portada adopta una dirección editorial: titulares amplios, espacio generoso y un llamado principal a conocer el gimnasio. Las áreas operativas usan una dirección compacta y tranquila: navegación estable, datos legibles y acciones agrupadas junto a su contexto. [El prototipo desechable](prototype.html) permite comparar ambas personalidades, alternar claro/oscuro y observar los tokens. No forma parte de las rutas de producción ni ejecuta operaciones reales.

## Cuatro pilares de Apple

| Pilar humano | Aplicación |
| --- | --- |
| Seguridad y predictibilidad | Navegación estable, estados explícitos, foco visible, opciones de salida y confirmaciones para acciones irreversibles. |
| Comprensión | Etiquetas concretas, agrupación por tarea y contraste entre información principal, apoyo y acciones. |
| Logro | Un próximo paso claro: conocer el gimnasio, crear la cuenta, consultar planes o completar una tarea operativa. |
| Alegría | Mensajes de ánimo sin promesas exageradas, respuesta inmediata y movimiento sutil que respeta las preferencias del usuario. |

## Paleta y jerarquía de color

| Función | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| Fondo de aplicación | `#f6f5f2` | `#131316` | Base cálida y base carbón. |
| Rojo de marca | `#db2637` | `#db2637` | Identidad y recursos gráficos. |
| Acción principal | `#c92332` | `#c92332` | Botón sólido con texto blanco. |
| Rojo como texto | `#ae1727` | `#ff929a` | Enlaces, selección y etiquetas sobre superficies suaves. |
| Texto sobre acción | `#ffffff` | `#ffffff` | Se mantiene legible sobre el rojo sólido. |

El rojo concentra energía y orienta la atención; no llena todas las tarjetas. Las superficies neutras permiten descansar la vista. Verde, ámbar, rojo de error y azul se reservan para estados semánticos, acompañados siempre por una etiqueta o icono: el color por sí solo no transmite el significado.

## Tipografía y tokens

Se emplea `system-ui`, con alternativas nativas de Apple, Windows y Android. Evita descargas adicionales y adapta su legibilidad al dispositivo. La jerarquía combina tamaño, peso, interlineado y espaciado entre letras.

| Nivel | Escala orientativa | Interlineado | Tracking |
| --- | --- | --- | --- |
| Display de portada | `clamp(3rem, 7vw, 6rem)` | `1.02` | `-0.05em` |
| Título de página | `clamp(1.75rem, 3.5vw, 2.5rem)` | `1.15` | `-0.04em` |
| Título de sección | `1.25–1.75rem` | `1.25` | `-0.02em` |
| Texto y controles | `1rem` | `1.5–1.6` | `0` |
| Apoyo y etiquetas | `0.8125–0.875rem` | `1.5` | `0–0.01em` |

Los componentes consumen tokens semánticos: `--bg-app`, `--bg-elevated-*`, `--text-*`, `--accent-primary`, `--accent-soft`, `--accent-ink`, `--border-*` y `--state-*`. Espaciado, radios, sombras, tipografía y tiempos tienen sus propios tokens. Los colores de marca no sustituyen los estados del sistema. Los layouts usan `rem`, medidas fluidas y límites de ancho; aumentar el texto no debe ocultar acciones.

## Navegación, cargas y accesibilidad

La ley de Hick se aborda agrupando las decisiones según intención y mostrando detalles cuando hacen falta. No prescribe un máximo universal de tres opciones. La portada reúne las rutas de conocer/contactar, crear cuenta y consultar membresías. Los formularios mantienen los datos esenciales visibles y revelan los opcionales en contexto. La navegación de cada rol muestra las tareas pertinentes.

Los skeletons representan la estructura de información que está cargando realmente. No se agregan demoras artificiales para exhibirlos. Deben reservar espacio, evitar anuncios repetidos a lectores de pantalla y dar paso a contenido, vacío o error. Con movimiento reducido, su brillo queda estático.

El objetivo es WCAG 2.2 AA; este documento no certifica cumplimiento. La verificación debe cubrir contraste en ambos temas, navegación completa por teclado, foco no oculto, nombres accesibles, errores asociados a sus campos, lectura con tecnologías de asistencia, reflow y zoom. Como criterio de interacción se favorecen controles de 44 × 44 CSS px; el mínimo AA de tamaño de objetivo y sus excepciones deben evaluarse por separado. Los materiales translúcidos se vuelven sólidos con transparencia reducida y el movimiento conserva información mediante cambios suaves de opacidad/color.

## Responsabilidad de cada skill

Esta tabla asigna tareas distintas y evita ejecutar varias revisiones sobre el mismo problema. Una asignación describe el uso previsto, no afirma que la auditoría ya ocurrió.

| Skill | Responsabilidad exclusiva |
| --- | --- |
| `apple-design` | Dirección principal: cuatro pilares humanos, materiales, tipografía y respuesta física accesible. |
| `emil-design-eng` | Acabado de controles: estados de presión, alineación y consistencia de detalles. |
| `architect` | Separación de responsabilidades de páginas, layouts y componentes antes de cambiar código. |
| `codebase-design` | Evaluar interfaces de módulos y evitar acoplamiento innecesario. |
| `improve-codebase-architecture` | Identificar oportunidades estructurales existentes; aplicar solo si está disponible localmente y se justifica. |
| `vercel-composition-patterns` | Composición y reutilización de componentes React, evitando proliferación de props booleanas. |
| `typescript-best-practices` | Tipos de datos y estados durante cambios de TSX. |
| `domain-modeling` | Mantener significado de socio, membresía, solicitud y rol en los recorridos. |
| `principle-experience-first` | Priorizar la tarea que cada pantalla permite completar. |
| `prototype` (`prototype/`) | Pregunta de exploración y prueba desechable separada de producción. |
| `prototype` (`emil-prototype/`) | Divergencia visual real y selector para comparar personalidad y densidad. |
| `pick-ui-library` | Evaluar lo ya instalado; añadir una biblioteca solo si resuelve una necesidad concreta. |
| `web-design-guidelines` | Revisión específica de usabilidad y accesibilidad visual. |
| `deslop` | Limpieza cotidiana de redundancias introducidas durante la implementación. |
| `no-comments` | Revisar comentarios redundantes; conservar los que explican razones o límites. |
| `thermo-nuclear-code-quality-review` | Revisión final de complejidad y mantenibilidad; no rediseñar la marca. |
| `code-review` | Comprobar ajuste de los cambios al encargo y regresiones funcionales. |
| `blast-radius` | Identificar consumidores y vistas afectadas por componentes compartidos. |
| `vercel-react-best-practices` | Rendimiento de renderizado, carga y recursos de React. |
| `diagnosing-bugs` | Diagnóstico reproducible si aparecen errores durante verificación. |
| `animation-vocabulary` | Nombrar con precisión los efectos antes de implementarlos. |
| `find-animation-opportunities` | Proponer únicamente movimiento que aporte orientación o feedback. |
| `animate` | Implementar esas interacciones aprobadas; no agregar movimiento a cada superficie. |
| `improve-animations` | Plan de ajuste para movimiento existente que resulte problemático. |
| `review-animations` | Verificar interrupción, duración, preferencias y calidad del movimiento final. |
| `unslop` | Claridad del contenido y microcopy en español. |
| `control-ui` | Inspección interactiva de interfaz, teclado y tamaños de pantalla. |
| `run-smoke-tests` | Pruebas de recorridos principales y comportamiento real con Playwright. |
| `create-verification-skill` | Crear un procedimiento repetible específico si la infraestructura lo permite. |
| `build-figma` | No aplicable ahora: no se proporcionó un diseño Figma ni su conexión/plugin. |
| `animate-expo` | No aplicable: el proyecto actual es web, no React Native/Expo. |
| `ask-sonner` | Sin nueva dependencia: conservar `Alert` para feedback contextual existente; reevaluar solo si se requieren toasts. |

## Límites de la exploración

El prototipo utiliza contenido indicativo y evita inventar precios, horarios, promociones o equipamiento. Los botones revelan feedback local; no crean cuentas ni membresías. Abrir `docs/design/prototype.html` en un navegador permite comparar las direcciones con las teclas 1/2 y flechas. La selección queda en el parámetro `?v=`; el tema solo dura durante la sesión del prototipo.

## Personalizar el gimnasio

Editar `frontend/src/config/gym.ts` permite cambiar dirección, ciudad, mapa, horarios, fotografía y contacto. `whatsappNumber` recibe un número internacional real, solo dígitos; vacío o inválido oculta el enlace. Cuando se confirmen los horarios, cambiar `scheduleIsExample` a `false`. Al reemplazar la fotografía, actualizar `hero.src`, su descripción `hero.alt` y `hero.isReference`. Los planes y precios provienen del catálogo activo del servicio de membresías, no de este archivo.

Los colores, espacios, radios y tipografía se ajustan en `frontend/src/styles/tokens.css`. El logo original se conserva en `frontend/public/assets/Logo.png`; la interfaz usa `logo-transparent.png`, una adaptación generada con transparencia que puede variar ligeramente en sus bordes.

## Verificación realizada

Se aprobaron 405 pruebas del frontend, 23 del servicio de membresías y 12 recorridos de Chromium del rediseño. También se aprobaron TypeScript, ESLint y la compilación de producción. Los recorridos de interfaz utilizan respuestas de API aisladas: verifican navegación, presentación, intención de selección, roles, foco y errores, pero no demuestran una compra ni persistencia contra una base de datos real. El servicio verifica por separado el filtro y la proyección del catálogo público y la protección de sus rutas privadas.

Repetir los recorridos con el frontend en el puerto 5173: `rtk proxy ./node_modules/.bin/playwright test tests/e2e/redesign.spec.ts --project=chromium`. La configuración admite otra instancia mediante `E2E_BASE_URL`. Las capturas quedan en `test-results/`; una ejecución posterior puede reemplazarlas. No ejecutar dos procesos de Playwright simultáneos sobre esa misma carpeta.

El control de consultas se activa únicamente en desarrollo con `VITE_SHOW_QUERY_DEVTOOLS=true`; permanece oculto por defecto. La revisión de accesibilidad incluye teclado, foco, contraste de tokens, movimiento reducido y anchos de 320, 390, 900 y 1440 píxeles. Queda pendiente una evaluación completa con lector de pantalla; no se afirma certificación WCAG.
