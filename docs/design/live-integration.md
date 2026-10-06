# Verificación de integración real

## Alcance

El frontend de Mundo Fitness debe consultar el backend local a través del API Gateway, presentar su catálogo activo y mantener protegidas las rutas operativas. Registro, login, solicitudes, socios, asignaciones, ingresos, cobros manuales e informes deben funcionar con servicios y PostgreSQL reales. Las pruebas visuales de `redesign.spec.ts` usan respuestas aisladas y no cuentan como evidencia de esta integración.

## Fallo reproducido

El 6 de octubre de 2026, todos los servicios indicaban salud correcta, pero el catálogo público del gateway respondía `401`. Los archivos fuente de la rama contenían la nueva ruta; las imágenes ejecutadas no la incluían. Los contenedores no montaban los artefactos locales, por lo que recompilar en el host y reiniciar no actualizaba su código.

La regresión `tests/e2e/live-integration.spec.ts` falló antes del arreglo con `Expected: 200, Received: 401`. La corrección del entorno consiste en reconstruir únicamente las imágenes afectadas:

```bash
rtk proxy docker compose --env-file .env.docker up -d --build --no-deps api-gateway membership-service
```

Esto conserva los volúmenes de datos. Cuando se utilice `compose.local.yaml`, los servicios montan `dist` del host; en ese modo se deben compilar los artefactos y reiniciar los servicios. No mezclar ambos modos sin comprobar qué configuración está activa.

## Repetir las pruebas

Con el stack local activo y las cuentas de prueba iniciales disponibles:

```bash
rtk proxy ./node_modules/.bin/playwright test tests/e2e/auth.spec.ts tests/e2e/clients.spec.ts tests/e2e/dashboard.spec.ts tests/e2e/memberships.spec.ts tests/e2e/payments.spec.ts tests/e2e/smoke.spec.ts tests/e2e/live-integration.spec.ts --project=chromium
```

Estas pruebas crean registros identificados como E2E en la base local. No usarlas contra datos de producción. Comprobar la salud del stack no sustituye estos recorridos: una imagen anterior puede estar saludable y no implementar el contrato actual.

Repetir varias suites en pocos minutos puede agotar los límites HTTP de `compose.yaml` y producir `429`. No confundirlo con credenciales incorrectas ni desactivar la protección. Esperar la ventana o reiniciar únicamente los servicios HTTP locales reinicia los contadores en memoria. `compose.local.yaml` ya define un límite de desarrollo mayor para ejecuciones frecuentes; su uso también cambia los montajes de artefactos y requiere compilar todos los servicios primero.

La nueva regresión comprueba la respuesta real del catálogo, sus campos permitidos, el rechazo de solicitudes anónimas a rutas privadas, el plan presentado en la portada y su traslado al registro. Los errores de login se prueban contra el servicio real. La prueba de ingreso selecciona el campo del diálogo activo para evitar ambigüedad durante la animación de salida de otro diálogo.

## Resultado del 6 de octubre de 2026

VERIFIED para los recorridos cubiertos. La ejecución final aprobó **9 de 9 pruebas en 38,6 segundos**, sin interceptaciones de API. El catálogo cambió de `401` a `200`; planes privados, estadísticas, solicitudes, socios y pagos siguieron devolviendo `401` sin autenticación. Socios y cobros manuales conservaron sus cambios después de recargar. Registro, solicitud de renovación, atención por recepción, creación de planes por administración, asignación, ingreso e informes funcionaron contra el stack real.

La captura pública queda en `test-results/live-verified/live-integration-live-publ-5d681-rivate-plans-stay-protected-chromium/public-live-catalog.png`. El reporte adjunta únicamente método, ruta y estado de las respuestas observadas. Los artefactos de Playwright son temporales; una nueva ejecución puede reemplazarlos. Estándares y cumplimiento del encargo fueron revisados por separado, sin hallazgos bloqueantes. No se cambiaron contratos productivos ni el esquema de datos en esta verificación.
