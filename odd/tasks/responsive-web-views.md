# Vistas responsivas y optimización multiplataforma — Mundo Fitness frontend

Hacer responsivas todas las vistas del sistema web (tablas, imágenes, textos, etc.) y optimizarlas para todos los navegadores (Chrome, Edge, Firefox, etc.). Al terminar, avisar al humano y entregarle los comandos de commit y push a la rama del repo en la nube.

## Specs

S1 — User request (verbatim): "crea una nueva rama, en esta quiero que hagas responsive todas la vistas de sistema web tablas, imagenes, textos, etc. para esto analiza por completo el proyecto, aparte de ser responsive quiero que lo optimices a todos los navegadopres, crome, edge, firefox, etc. cunado termines con todos estos cambios me lo dices y me des los comandos para hacer el comit y el push a repo en la nube"

S2 — Rama creada: `feature/vistas-responsive-web` a partir de `main`.

S3 — Todas las vistas del sistema web deben ser responsivas: tablas, imágenes, textos, formularios, modales, navegación, layouts de dashboard y portal de socio.

S4 — Optimización para todos los navegadores: Chrome, Edge, Firefox (prefijos vendor, unidades de viewport, targets táctiles, tap highlight, focus-visible, modo reducido, contraste más alto).

S5 — Al terminar, avisar al humano y entregar los comandos de commit y push al repo en la nube (no se ejecuta commit/push a menos que el humano lo pida).

## Tasks

T1 — Auditoría base de responsividad y compatibilidad multiplataforma (estados actuales de cada vista y componente compartido) — S1 — frontend/src/styles/*, frontend/src/pages/*, frontend/src/components/* — commit docs
T2 — Normalización multiplataforma y tokens base (prefijos vendor, unidades viewport svh/dvh/lvh, targets táctiles 44px, tap highlight, focus-visible, reduced-motion/contrast/transparency) — S4 — frontend/src/styles/tokens.css, frontend/src/index.css, frontend/src/App.css — commit style
T3 — Componentes compartidos responsivos (Button, Input, Select, Textarea, FormField, TableContainer, Modal, Pagination, Tabs, SearchPicker, Alert, StatusBadge) — S3, S4 — frontend/src/styles/components/* — commit style
T4 — Layouts responsivos (DashboardLayout con sidebar-drawer móvil, MemberLayout con sidebar-drawer móvil y cabecera) — S3, S4 — frontend/src/components/DashboardLayout.tsx + CSS, frontend/src/components/member/MemberLayout.tsx + CSS — commit style
T5 — Vistas públicas responsivas (LandingPage, auth: Login, Register, ForgotPassword, ResetPassword) — S3 — frontend/src/pages/LandingPage.tsx + CSS, frontend/src/pages/auth/* — commit style
T6 — Vistas de personal/responsión responsivas (DashboardOverview, ClientsPage, MembershipsPage, PaymentsPage, ReportsPage, SettingsPage) — S3 — frontend/src/pages/{dashboard,clients,memberships,payments,reports,settings}/* — commit style
T7 — Vistas del portal de socio responsivas (MemberPortal, MemberMembershipPage, MemberPaymentsPage, MemberFitnessPage, MemberProfilePage) — S3 — frontend/src/pages/member/* + frontend/src/styles/member/* — commit style
T8 — Build, lint, tests y verificación funcional de responsividad — S3, S4 — frontend/src/test/*, pnpm build/lint/test — commit test
T9 — Avisar al humano y entregar comandos de commit y push a repo en la nube — S5 — git — (pendiente de autorización humana)

## Log

L1 — User request (verbatim): "crea una nueva rama, en esta quiero que hagas responsive todas la vistas de sistema web tablas, imagenes, textos, etc. para esto analiza por completo el proyecto, aparte de ser responsive quiero que lo optimices a todos los navegadopres, crome, edge, firefox, etc. cunado termines con todos estos cambios me lo dices y me des los comandos para hacer el comit y el push a repo en la nube"
