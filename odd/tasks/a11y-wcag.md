# Accessibility WCAG — Mundo Fitness frontend

Audit sensory, motor, and cognitive barriers against WCAG 2.1 AA, implement functional fixes
(contrast, labels, keyboard, controls, clarity), justify each fix with WCAG criteria, then commit
and push to the cloud branch so Dokploy redeploys gym.kenzowo.dev.

## Specs

S1 — User request: "Identifica barreras sensoriales, motoras y cognitivas, con evidencia y criterios WCAG pertinentes." (Identify sensory, motor, and cognitive barriers with evidence and relevant WCAG criteria.)
S2 — User request: "Implementa ajustes funcionales de contraste, etiquetas, teclado, controles y claridad, según corresponda." (Implement functional adjustments for contrast, labels, keyboard, controls, and clarity, as appropriate.)
S3 — User request: "Justifica las mejoras con criterios WCAG adecuados y explica su cumplimiento." (Justify improvements with appropriate WCAG criteria and explain compliance.)
S4 — User request: "Si identificas que no cumplke con alguno de estos criterios haz que lo cumpla." (If any criterion is not met, make it comply.)
S5 — User request: "despues todos los cambios reazlizados comitealos siguiendo el formato establecido de comits del proyecto y subelos a la rama del repo en la nube para que se actualize el despligue en el servidor." (Then commit all changes following the project's commit format and push them to the cloud repo branch so the server deployment updates.)

## Tasks

T1 — WCAG audit report (evidence per barrier, WCAG criteria) — S1 — docs/ACCESIBILIDAD_WCAG.md — commit docs
T2 — Contrast fixes for text and non-text elements (tokens.css) — S2, S4 — frontend/src/styles/tokens.css — commit style
T3 — Accessible labels and names (aria-required, required indicator, document.title per route) — S2, S4 — frontend/src/pages/*, frontend/src/App.tsx — commit a11y
T4 — Keyboard navigation and controls (TableContainer onRowClick, skip links, target size 44x44) — S2, S4 — frontend/src/components/TableContainer.tsx, frontend/src/components/Brand.tsx — commit a11y
T5 — Cognitive clarity (page titles, error instructions, help association) — S2, S4 — frontend/src/components/FormField.tsx, frontend/src/pages/* — commit a11y
T6 — Justify improvements with WCAG criteria and explain compliance — S3 — docs/ACCESIBILIDAD_WCAG.md — commit docs
T7 — Tests, lint, and build verification — S4 — frontend/src/test/* — commit test
T8 — Commit all changes (conventional commits) and push to cloud branch — S5 — git — commit build/chore

## Log

L1 — User request (verbatim): "identifica si es proyecto actual cumple con estos criterios: Identifica barreras sensoriales, motoras y cognitivas, con evidencia y criterios WCAG pertinentes. Implementa ajustes funcionales de contraste, etiquetas, teclado, controles y claridad, según corresponda. Justifica las mejoras con criterios WCAG adecuados y explica su cumplimiento. Si identificas que no cumplke con alguno de estos criterios haz que lo cumpla, despues todos los cambios reazlizados comitealos siguiendo el formato establecido de comits del proyecto y subelos a la rama del repo en la nube para que se actualize el despligue en el servidor"
