# Mundo Fitness - Sistema de gestión de gimnasios

Una plataforma integral de gestión de gimnasios construida con una arquitectura de microservicios, que incluye un frontend en React + TypeScript y servicios backend en Node.js/Express con PostgreSQL y Redis.

## Descripción general de la arquitectura

El sistema local se compone de una aplicación web, una puerta de enlace y cuatro servicios: autenticación, clientes, membresías y pagos. PostgreSQL conserva la información y Redis presta soporte de infraestructura.

```text
Navegador → Frontend (:5173) → API Gateway (:3000)
                                  ├── Auth Service (:3001)
                                  ├── Client Service (:3002)
                                  ├── Membership Service (:3003)
                                  └── Payment Service (:3004)
                                      PostgreSQL + Redis
```

### Servicios

| Servicio | Puerto | Descripción |
|---------|------|-------------|
| **Puerta de enlace de API** | 3000 | Enrutamiento, autenticación y comprobación de estado de servicios |
| **Servicio de autenticación** | 3001 | Inicio de sesión, tokens y control de acceso por rol |
| **Servicio de clientes** | 3002 | Datos de clientes y perfiles de socios |
| **Servicio de membresías** | 3003 | Planes de membresía, suscripciones, visitas y vencimientos |
| **Servicio de pagos** | 3004 | Pagos, facturas y resúmenes por cliente |

### Infraestructura compartida (`@gym/shared`)

- **Config** - Configuración centralizada basada en el entorno con validación
- **Logger** - Registro estructurado con Pino, IDs de solicitud compartidos entre gateway y microservicios, y censura de credenciales y datos personales
- **Database** - Gestión de grupos de conexiones de PostgreSQL
- **Messaging** - Pub/sub de Redis para comunicación entre servicios
- **Errors** - Clases de error estandarizadas (AppError, ValidationError, AuthenticationError, etc.)
- **Validation** - Esquemas Zod para validación de solicitudes
- **JWT Utils** - Generación, verificación y extracción de tokens

## Pila tecnológica

### Backend
- **Entorno de ejecución**: Node.js 22 con módulos ES
- **Framework**: Express.js
- **Lenguaje**: TypeScript 6.0.x (modo estricto)
- **Base de datos**: PostgreSQL 17 (en Docker) con grupo de conexiones pg
- **Caché/cola**: Redis 7+ (redis@5, no ioredis)
- **Validación**: Zod
- **Autenticación**: JWT (jsonwebtoken), bcryptjs
- **Documentación de API**: ejemplos curl en este README (OpenAPI/Swagger aún no está implementada)

### Frontend
- **Framework**: React 19.2.x con TypeScript
- **Herramienta de compilación**: Vite 8.2.x
- **Enrutamiento**: React Router 7.18.x
- **Gestión de estado**: **TanStack Query (React Query) v5** para estado del servidor + React Context para autenticación
- **Formularios**: Validación con **Zod** (esquemas compartidos en `@gym/shared`), manejo manual de estado (sin React Hook Form)
- **Estilos**: CSS modular propio (sin TailwindCSS ni shadcn/ui)
- **Iconos y motion**: Morphicons y Motion; Howler.js está disponible para audio
- **Gráficos**: visualizaciones SVG y CSS para tendencias, barras, distribución y mapas de calor

### DevOps
- **Gestor de paquetes**: pnpm 11.24.0 (espacios de trabajo)
- **Contenedorización**: Docker + Docker Compose v2
- **CI/CD**: GitHub Actions
- **Linting**: ESLint 10.9.0 + TypeScript ESLint
- **Comprobación de tipos**: TypeScript 6.0.x

## Requisitos previos

- Node.js 22 (usado por las imágenes Docker del proyecto).
- Corepack y pnpm 11.24.0, versión fijada en `package.json`.
- Docker Engine con Docker Compose v2, para ejecutar la configuración local recomendada.
- Git para clonar el repositorio.

No necesitas instalar PostgreSQL ni Redis en el host para el flujo con Docker.

## Instalación local con Docker

Desde la raíz del repositorio, crea los archivos de configuración locales y descarga las dependencias:

```bash
corepack enable
pnpm install
cp .env.docker.example .env.docker
cp .env.local.example .env.local
```

Los `.env` son ignorados por Git y las plantillas son exclusivamente para desarrollo local. No publiques el stack en una red: Compose enlaza los puertos a `127.0.0.1`. Cambia `JWT_SECRET` y las credenciales antes de manejar datos reales.

Construye y arranca la aplicación:

```bash
docker compose --env-file .env.docker build
docker compose --env-file .env.docker up -d
docker compose --env-file .env.docker ps
```

Compose inicia PostgreSQL, Redis, los cuatro servicios, el gateway y el frontend. En un volumen de PostgreSQL nuevo, los scripts montados aplican el esquema, la migración local de solicitudes de renovación y los datos iniciales. El arranque puede tardar mientras Docker descarga las imágenes. Espera a que los contenedores indiquen `healthy`.

Abre http://localhost:5173. El API Gateway escucha en http://localhost:3000; `http://localhost:3000/health` presenta la salud de los servicios y `/services` su configuración.

### Variables de entorno

- `.env.docker` configura credenciales para PostgreSQL/Redis, `JWT_SECRET` y el origen CORS. En la red Compose, los nombres de host y URLs de los servicios se inyectan desde `compose.yaml`.
- `.env.local` configura las conexiones desde procesos ejecutados en el host (`localhost`), el gateway y `VITE_API_URL`. La configuración de backend busca `.env.local` en los directorios padres; también acepta `ENV_FILE`.
- Mantén los valores de ejemplo en uso local solamente. La configuración de producción requiere secretos robustos y orígenes HTTPS.

### Base de datos, seed y usuarios de prueba

El esquema compartido está en `shared/database/schema.sql`; las cuentas y datos iniciales están en `shared/database/seed.sql`. PostgreSQL solo ejecuta los scripts de inicialización de Compose automáticamente cuando el volumen se crea por primera vez; en ese caso Compose también aplica `003-membership-renewal-requests.sql`. `pnpm db:init` aplica el esquema y, por defecto, el seed; el seed es idempotente y puede restablecer las contraseñas demo conservando las demás filas.

Las cuentas son **solo para pruebas locales** y usan la contraseña `Admin1234!`:

| Rol | Correo |
|---|---|
| Administración | `admin@mundofitness.com` |
| Recepción | `recepcion@mundofitness.com` |
| Socio | `socio@mundofitness.com` |

Las cuentas solo existen después de inicializar el esquema con el seed. Para reiniciar toda la base local, lo que elimina sus datos, usa `docker compose --env-file .env.docker down -v` y vuelve a ejecutar los comandos de arranque.

### Ejecutar procesos Node en el host

Como alternativa para depurar, deja PostgreSQL y Redis en Docker y ejecuta estos comandos desde la raíz:

```bash
docker compose --env-file .env.docker up -d postgres redis
pnpm db:init
pnpm dev
```

Asegúrate de que `.env.local` exista. No ejecutes `pnpm dev` al mismo tiempo que los contenedores de aplicación completos: comparten los puertos 3000–3004 y 5173.

Para actualizar los contenedores de aplicación luego de editar el código, usa `pnpm docker:dev`; compila en el host y reinicia los servicios de aplicación sin borrar los datos de PostgreSQL/Redis.

### Comprobación manual

1. Inicia sesión como recepción y revisa clientes, membresías, planes y pagos.
2. Inicia sesión como socio y comprueba su portal y su información de membresía.
3. Inicia sesión como administrador y revisa el panel y Configuración.

Los cambios confirmados por los formularios persisten en la base local. El sistema registra pagos manuales; no procesa pagos electrónicos.

### Solución de problemas

- **Contenedor no saludable:** consulta `docker compose --env-file .env.docker ps` y los logs con `docker compose --env-file .env.docker logs --tail=100 <servicio>`.
- **No existe `.env.docker`:** copia `.env.docker.example` a `.env.docker` antes de los comandos Compose.
- **Error de conexión desde Node local:** confirma que `.env.local` esté presente y que PostgreSQL/Redis publiquen los puertos 5432/6379.
- **Puerto ocupado:** detén el proceso anterior o el otro modo de ejecución (Docker completo o `pnpm dev`).
- **Cuenta demo no puede iniciar sesión:** verifica que el volumen inicializó `shared/database/seed.sql`; ejecuta `pnpm db:init` desde el host con `.env.local` para reaplicar esquema y seed.

## Ejemplos de uso

> **Nota:** Todos los endpoints usan el prefijo `/api` a través del API Gateway (puerto 3000). Los ejemplos requieren un token Bearer válido excepto registro y login.

### Flujo de autenticación

```bash
# Registra un usuario nuevo (público)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo.socio@mundofitness.com",
    "password": "securePassword123",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Inicia sesión (público)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "nuevo.socio@mundofitness.com", "password": "securePassword123"}'

# Refresca access token (público)
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<refresh_token>"}'

# Cierra sesión
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <access_token>"

# Obtiene perfil del usuario autenticado
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <access_token>"

# Actualiza perfil propio
curl -X PATCH http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "John Updated"}'

# Cambia contraseña
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword": "old123", "newPassword": "newSecure456"}'

# Solicita reset de contraseña (público)
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "nuevo.socio@mundofitness.com"}'

# Resetea contraseña con token (público)
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "<reset_token>", "newPassword": "newSecure456"}'
```

### Gestión de usuarios (solo admin)

```bash
# Lista usuarios (paginación: ?page=1&limit=10)
curl -X GET "http://localhost:3000/api/auth/users?page=1&limit=10" \
  -H "Authorization: Bearer <access_token>"

# Obtiene usuario por ID
curl -X GET http://localhost:3000/api/auth/users/<user_id> \
  -H "Authorization: Bearer <access_token>"

# Actualiza usuario (admin)
curl -X PATCH http://localhost:3000/api/auth/users/<user_id> \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "receptionist", "isActive": true}'

# Elimina usuario (admin)
curl -X DELETE http://localhost:3000/api/auth/users/<user_id> \
  -H "Authorization: Bearer <access_token>"

# Obtiene roles disponibles
curl -X GET http://localhost:3000/api/auth/roles \
  -H "Authorization: Bearer <access_token>"
```

### Gestión de clientes

```bash
# Crea un cliente (admin o recepción)
curl -X POST http://localhost:3000/api/clients \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "dateOfBirth": "1990-05-15",
    "gender": "female",
    "dni": "12345678"
  }'

# Lista clientes con paginación y filtros
curl -X GET "http://localhost:3000/api/clients?page=1&limit=10&search=jane" \
  -H "Authorization: Bearer <access_token>"

# Busca cliente por DNI
curl -X GET http://localhost:3000/api/clients/dni/12345678 \
  -H "Authorization: Bearer <access_token>"

# Obtiene cliente por ID
curl -X GET http://localhost:3000/api/clients/<client_id> \
  -H "Authorization: Bearer <access_token>"

# Actualiza cliente
curl -X PATCH http://localhost:3000/api/clients/<client_id> \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1987654321", "emergencyContact": "John Doe"}'

# Elimina cliente (admin)
curl -X DELETE http://localhost:3000/api/clients/<client_id> \
  -H "Authorization: Bearer <access_token>"
```

### Mediciones corporales

```bash
# Agrega medición a cliente
curl -X POST http://localhost:3000/api/clients/<client_id>/measurements \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "weight": 70.5,
    "height": 175,
    "bodyFatPercentage": 18.5,
    "muscleMass": 55.2,
    "waistCircumference": 82,
    "hipCircumference": 95,
    "notes": "Medición inicial"
  }'

# Lista mediciones de un cliente
curl -X GET http://localhost:3000/api/clients/<client_id>/measurements \
  -H "Authorization: Bearer <access_token>"

# Obtiene última medición
curl -X GET http://localhost:3000/api/clients/<client_id>/measurements/latest \
  -H "Authorization: Bearer <access_token>"
```

### Objetivos (Goals)

```bash
# Crea objetivo para cliente
curl -X POST http://localhost:3000/api/clients/<client_id>/goals \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "weight_loss",
    "targetValue": 65,
    "targetDate": "2024-12-31",
    "description": "Bajar 5kg antes de fin de año"
  }'

# Lista objetivos de cliente
curl -X GET http://localhost:3000/api/clients/<client_id>/goals \
  -H "Authorization: Bearer <access_token>"

# Actualiza objetivo
curl -X PATCH http://localhost:3000/api/clients/goals/<goal_id> \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"currentValue": 68}'

# Elimina objetivo
curl -X DELETE http://localhost:3000/api/clients/goals/<goal_id> \
  -H "Authorization: Bearer <access_token>"
```

### Documentos de cliente

```bash
# Sube documento
curl -X POST http://localhost:3000/api/clients/<client_id>/documents \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "medical_certificate",
    "name": "Certificado médico",
    "url": "https://storage.example.com/docs/cert-123.pdf",
    "expiryDate": "2025-01-15"
  }'

# Lista documentos
curl -X GET http://localhost:3000/api/clients/<client_id>/documents \
  -H "Authorization: Bearer <access_token>"

# Elimina documento
curl -X DELETE http://localhost:3000/api/clients/documents/<document_id> \
  -H "Authorization: Bearer <access_token>"
```

### Planes de membresía

```bash
# Lista planes de membresía
curl -X GET http://localhost:3000/api/memberships/plans \
  -H "Authorization: Bearer <access_token>"

# Obtiene plan por ID
curl -X GET http://localhost:3000/api/memberships/plans/<plan_id> \
  -H "Authorization: Bearer <access_token>"

# Crea plan (admin)
curl -X POST http://localhost:3000/api/memberships/plans \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Mensual",
    "description": "Acceso completo a todas las instalaciones",
    "price": 99.99,
    "durationDays": 30,
    "features": ["Piscina", "Sauna", "Clases grupales", "Entrenador personal"]
  }'

# Actualiza plan (admin)
curl -X PATCH http://localhost:3000/api/memberships/plans/<plan_id> \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"price": 109.99}'

# Elimina plan (admin)
curl -X DELETE http://localhost:3000/api/memberships/plans/<plan_id> \
  -H "Authorization: Bearer <access_token>"
```

### Membresías (suscripciones de clientes)

```bash
# Obtiene membresías de un cliente
curl -X GET http://localhost:3000/api/memberships/client/<client_id> \
  -H "Authorization: Bearer <access_token>"

# Crea membresía para cliente (admin, recepcionist)
curl -X POST http://localhost:3000/api/memberships \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "<client_id>",
    "planId": "<plan_id>",
    "startDate": "2024-01-01"
  }'

# Obtiene membresía por ID
curl -X GET http://localhost:3000/api/memberships/<membership_id> \
  -H "Authorization: Bearer <access_token>"

# Actualiza membresía
curl -X PATCH http://localhost:3000/api/memberships/<membership_id> \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'

# Cancela membresía
curl -X POST http://localhost:3000/api/memberships/<membership_id>/cancel \
  -H "Authorization: Bearer <access_token>"

# Renueva membresía
curl -X POST http://localhost:3000/api/memberships/<membership_id>/renew \
  -H "Authorization: Bearer <access_token>"

# Membresías por expirar (admin, recepcionist)
curl -X GET http://localhost:3000/api/memberships/expiring \
  -H "Authorization: Bearer <access_token>"
```

### Registro de visitas (Check-in / Check-out)

```bash
# Check-in de cliente
curl -X POST http://localhost:3000/api/memberships/visits/check-in \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "<client_id>",
    "membershipId": "<membership_id>"
  }'

# Check-out de visita
curl -X POST http://localhost:3000/api/memberships/visits/<visit_id>/check-out \
  -H "Authorization: Bearer <access_token>"

# Historial de visitas de cliente
curl -X GET http://localhost:3000/api/memberships/visits/client/<client_id> \
  -H "Authorization: Bearer <access_token>"
```

### Congelamientos de membresía

```bash
# Crea congelamiento
curl -X POST http://localhost:3000/api/memberships/freezes \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "membershipId": "<membership_id>",
    "startDate": "2024-07-01",
    "endDate": "2024-07-31",
    "reason": "Vacaciones"
  }'

# Obtiene congelamientos de una membresía
curl -X GET http://localhost:3000/api/memberships/freezes/<membership_id> \
  -H "Authorization: Bearer <access_token>"
```

### Procesamiento de pagos

```bash
# Registra pago (admin, recepcionist)
curl -X POST http://localhost:3000/api/payments \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "<client_id>",
    "amount": 99.99,
    "currency": "USD",
    "paymentMethod": "credit_card",
    "description": "Membresía mensual - enero 2024",
    "transactionId": "txn_abc123"
  }'

# Lista pagos con filtros
curl -X GET "http://localhost:3000/api/payments?page=1&limit=10&clientId=<client_id>" \
  -H "Authorization: Bearer <access_token>"

# Busca pago por transactionId
curl -X GET http://localhost:3000/api/payments/transaction/txn_abc123 \
  -H "Authorization: Bearer <access_token>"

# Obtiene pago por ID
curl -X GET http://localhost:3000/api/payments/<payment_id> \
  -H "Authorization: Bearer <access_token>"

# Actualiza pago
curl -X PATCH http://localhost:3000/api/payments/<payment_id> \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'

# Resumen de pagos de cliente
curl -X GET http://localhost:3000/api/payments/summary/<client_id> \
  -H "Authorization: Bearer <access_token>"
```

### Facturas

```bash
# Crea factura
curl -X POST http://localhost:3000/api/payments/invoices \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "<client_id>",
    "items": [
      {"description": "Membresía Premium", "quantity": 1, "unitPrice": 99.99}
    ],
    "dueDate": "2024-02-01"
  }'

# Lista facturas
curl -X GET "http://localhost:3000/api/payments/invoices?page=1&limit=10" \
  -H "Authorization: Bearer <access_token>"

# Busca factura por número
curl -X GET http://localhost:3000/api/payments/invoices/number/INV-2024-001 \
  -H "Authorization: Bearer <access_token>"

# Obtiene factura por ID
curl -X GET http://localhost:3000/api/payments/invoices/<invoice_id> \
  -H "Authorization: Bearer <access_token>"

# Marca factura como pagada
curl -X POST http://localhost:3000/api/payments/invoices/<invoice_id>/pay \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"paymentId": "<payment_id>"}'

# Cancela factura
curl -X POST http://localhost:3000/api/payments/invoices/<invoice_id>/cancel \
  -H "Authorization: Bearer <access_token>"
```

### Métodos de pago

```bash
# Agrega método de pago
curl -X POST http://localhost:3000/api/payments/methods \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "<client_id>",
    "type": "credit_card",
    "provider": "stripe",
    "token": "pm_card_visa",
    "isDefault": true
  }'

# Lista métodos de pago de cliente
curl -X GET http://localhost:3000/api/payments/methods/<client_id> \
  -H "Authorization: Bearer <access_token>"

# Establece método por defecto
curl -X POST http://localhost:3000/api/payments/methods/<client_id>/<method_id>/default \
  -H "Authorization: Bearer <access_token>"

# Desactiva método de pago
curl -X DELETE http://localhost:3000/api/payments/methods/<client_id>/<method_id> \
  -H "Authorization: Bearer <access_token>"
```

### Reembolsos

```bash
# Crea reembolso (admin, recepcionist)
curl -X POST http://localhost:3000/api/payments/refunds \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "<payment_id>",
    "amount": 50.00,
    "reason": "partial_refund"
  }'

# Procesa reembolso (admin)
curl -X POST http://localhost:3000/api/payments/refunds/<refund_id>/process \
  -H "Authorization: Bearer <access_token>"
```

## Documentación de la API

### URL base

```
Desarrollo: http://localhost:3000
Producción: https://api.mundofitness.com
```

### Autenticación

Todos los endpoints protegidos requieren un token Bearer:

```
Authorization: Bearer <access_token>
```

Endpoints públicos (no requieren autenticación):
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /health`
- `GET /health/*`

### Formato común de respuesta

**Éxito:**
```json
{
  "data": { ... },
  "meta": { "page": 1, "limit": 10, "total": 100 }
}
```

**Error:**
```json
{
  "error": {
    "message": "Mensaje de error comprensible",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

### Códigos de estado HTTP estándar

| Código | Descripción |
|------|-------------|
| 200 | Correcto |
| 201 | Creado |
| 400 | Solicitud incorrecta (error de validación) |
| 401 | No autorizado (token no válido o ausente) |
| 403 | Prohibido (permisos insuficientes) |
| 404 | No encontrado |
| 409 | Conflicto (recurso duplicado) |
| 422 | Entidad no procesable |
| 429 | Demasiadas solicitudes (límite de velocidad alcanzado) |
| 500 | Error interno del servidor |
| 503 | Servicio no disponible |

### Limitación de velocidad

- Predeterminado: 100 solicitudes cada 15 minutos por IP
- Configurable mediante `RATE_LIMIT_MAX_REQUESTS` y `RATE_LIMIT_WINDOW_MS`
- Devuelve `429 Demasiadas solicitudes` con el encabezado `Retry-After`

### Resumen de endpoints de los servicios

| Servicio | Ruta base | Endpoints principales |
|---------|-----------|---------------|
| Autenticación | `/api/auth` | `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`, `POST /forgot-password`, `POST /reset-password`, `POST /change-password`, `GET /me`, `PATCH /me`, `GET /users`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id`, `GET /roles` |
| Clientes | `/api/clients` | `POST /`, `GET /`, `GET /dni/:dni`, `GET /user/:userId`, `GET /:id`, `PATCH /:id`, `DELETE /:id`, `POST /:clientId/measurements`, `GET /:clientId/measurements`, `GET /:clientId/measurements/latest`, `POST /:clientId/goals`, `GET /:clientId/goals`, `PATCH /goals/:id`, `DELETE /goals/:id`, `POST /:clientId/documents`, `GET /:clientId/documents`, `DELETE /documents/:id` |
| Membresías | `/api/memberships` | `GET /plans`, `GET /plans/:id`, `POST /plans`, `PATCH /plans/:id`, `DELETE /plans/:id`, `GET /expiring`, `GET /client/:clientId`, `POST /`, `GET /:id`, `PATCH /:id`, `POST /:id/cancel`, `POST /:id/renew`, `POST /visits/check-in`, `POST /visits/:visitId/check-out`, `GET /visits/client/:clientId`, `POST /freezes`, `GET /freezes/:membershipId` |
| Pagos | `/api/payments` | `POST /`, `GET /`, `GET /transaction/:transactionId`, `GET /summary/:clientId`, `GET /:id`, `PATCH /:id`, `POST /invoices`, `GET /invoices`, `GET /invoices/number/:invoiceNumber`, `GET /invoices/:id`, `POST /invoices/:id/pay`, `POST /invoices/:id/cancel`, `POST /methods`, `GET /methods/:clientId`, `POST /methods/:clientId/:methodId/default`, `DELETE /methods/:clientId/:methodId`, `POST /refunds`, `POST /refunds/:refundId/process` |

## Estructura del proyecto

```
GYM_Proyect/
├── .github/workflows/          # Pipelines de CI/CD
├── frontend/                   # Aplicación React + Vite
│   ├── src/
│   │   ├── api/               # Cliente de API y hooks de TanStack Query
│   │   ├── components/        # Componentes React reutilizables
│   │   ├── context/           # Proveedores de React Context (autenticación)
│   │   ├── hooks/             # Hooks personalizados de React
│   │   ├── pages/             # Componentes de páginas
│   │   ├── types/             # Tipos de TypeScript
│   │   └── utils/             # Utilidades del frontend
│   └── package.json
├── shared/                     # @gym/shared - Infraestructura común
│   ├── config/                # Configuración del entorno
│   ├── database/              # Grupo de conexiones de PostgreSQL
│   ├── logger/                # Instancia del registrador Pino
│   ├── messaging/             # Cliente pub/sub de Redis
│   ├── errors/                # Clases de error y controlador de errores
│   ├── utils/
│   │   ├── jwt.ts             # Utilidades de JWT
│   │   └── validation.ts      # Ayudas de validación de Zod
│   ├── test/                    # Pruebas unitarias compartidas
│   └── package.json
├── services/                   # Microservicios del sistema
│   ├── api-gateway/           # Puerto 3000 - Punto de entrada
│   ├── auth-service/          # Puerto 3001 - Autenticación
│   ├── client-service/        # Puerto 3002 - Gestión de clientes
│   ├── membership-service/    # Puerto 3003 - Membresías
│   ├── payment-service/       # Puerto 3004 - Pagos
├── compose.yaml          # Orquestación de contenedores (Docker Compose v2)
├── package.json               # Configuración raíz del espacio de trabajo
├── pnpm-workspace.yaml        # Definición del espacio de trabajo de pnpm
├── tsconfig.json              # Referencias de proyectos de TypeScript
└── README.md                  # Este archivo
```

## Flujo de trabajo de desarrollo

### Comandos de calidad del código

```bash
# Ejecuta todos los linters
pnpm lint

# Comprueba tipos y compila todos los paquetes
pnpm build

# Ejecuta las pruebas
pnpm test

# Compila todos los paquetes
pnpm build

# Ejecuta solo las pruebas unitarias
pnpm test:unit

# Ejecuta E2E en Chromium contra el stack local
pnpm test:e2e:install
pnpm docker:dev
pnpm test:e2e
```

`pnpm test` ejecuta las pruebas unitarias y luego las pruebas de integración con Docker/Testcontainers. `pnpm test:e2e` espera hasta dos minutos a que todos los servicios estén saludables.

### Añadir un servicio nuevo

1. Crea un directorio para el servicio dentro de `services/`
2. Añade `package.json` con las dependencias del espacio de trabajo
3. Configura `tsconfig.json` para que extienda la configuración raíz
4. Implementa la aplicación Express con la infraestructura compartida
5. Registra el servicio en la puerta de enlace de API (`services/api-gateway/src/index.ts`)
6. Documenta las variables necesarias en las plantillas `.env.*.example`
7. Actualiza Docker Compose y CI/CD

### Migraciones de la base de datos

El esquema es compartido en `shared/database/schema.sql`; los servicios usan el mismo PostgreSQL. Compose ejecuta `003-membership-renewal-requests.sql` como script de inicio cuando se crea un volumen nuevo. `pnpm db:init` aplica el esquema y, por defecto, el seed; volver a ejecutarlo puede restablecer las contraseñas demo.

```bash
# Inicializa/aplica esquema compartido y seeds desde la raíz
pnpm db:init
```

## Despliegue

### Docker Compose (solo desarrollo local)

```bash
# Compila e inicia todos los servicios
docker compose --env-file .env.docker build
docker compose --env-file .env.docker up -d

# Consulta los registros
docker compose --env-file .env.docker logs -f

# Detén los servicios
docker compose --env-file .env.docker down
```

Los puertos están enlazados a loopback y las variables de ejemplo son de desarrollo; este Compose no es una configuración de preproducción ni producción.

### Consideraciones para producción

- Usa PostgreSQL administrado (RDS, Cloud SQL) y Redis (ElastiCache, Redis Cloud)
- Configura la terminación TLS/SSL en el balanceador de carga
- Establece `NODE_ENV=production`
- Usa un administrador de secretos para los valores sensibles
- Habilita el registro de solicitudes y la monitorización
- Configura comprobaciones de estado para la orquestación
- Configura el registro centralizado (ELK, Datadog, etc.)
- Implementa el rastreo distribuido (OpenTelemetry)

### Estado de CI/CD y despliegue

GitHub Actions ejecuta lint, compilación y pruebas. Los jobs de deployment son placeholders: no hay infraestructura configurada. Aún no existe un procedimiento de producción listo para usar.

## Contribución

### Primeros pasos

1. Crea un fork del repositorio
2. Crea una rama de funcionalidad: `git checkout -b feature/renovacion-membresias`
3. Realiza los cambios
4. Asegúrate de la calidad del código: `pnpm lint && pnpm build`
5. Ejecuta las pruebas: `pnpm test`
6. Confirma los cambios con Commits convencionales: `git commit -m "feat(memberships): agregar renovacion de membresias"`
7. Envía los cambios a tu fork: `git push origin feature/renovacion-membresias`
8. Abre una solicitud de extracción (Pull Request)

### Nomenclatura de ramas

Las ramas de trabajo usan el formato `<tipo>/<descripcion>`. El tipo indica el propósito del trabajo y la descripción identifica el cambio concreto. Por ejemplo, en `fix/login-vacio`, `fix` indica una corrección y `login-vacio` identifica el problema.

El job **Branch Name** de [CI/CD](.github/workflows/ci-cd.yml) valida el nombre de la rama de origen de las Pull Request dirigidas a `main` con esta expresión:

```text
^(feature|fix|refactor|docs|test|chore|hotfix)/[a-z0-9]+([._-][a-z0-9]+)*$
```

| Tipo de rama | Cuándo utilizarlo | Ejemplo válido | Qué expresa el ejemplo |
|---|---|---|---|
| `feature/` | Incorporar una funcionalidad o ampliar una existente. | `feature/renovacion-membresias` | Añadir el flujo de renovación de membresías. |
| `fix/` | Corregir un fallo del comportamiento actual. | `fix/login-vacio` | Impedir que se envíe un inicio de sesión sin credenciales. |
| `refactor/` | Reorganizar código sin cambiar su comportamiento observable. | `refactor/consultas-membresias` | Simplificar la implementación de las consultas de membresías. |
| `docs/` | Actualizar documentación, instrucciones o ejemplos. | `docs/convenciones-git` | Documentar los nombres de ramas y mensajes de commits. |
| `test/` | Añadir, corregir o reorganizar pruebas. | `test/flujo-pagos` | Cubrir el registro y la consulta de pagos con pruebas. |
| `chore/` | Realizar mantenimiento, actualizar dependencias o ajustar herramientas y configuración. | `chore/actualizar-dependencias` | Actualizar paquetes del proyecto. |
| `hotfix/` | Identificar una corrección urgente. El prefijo expresa la urgencia; no crea un proceso de despliegue automático. | `hotfix/error-autenticacion` | Corregir con prioridad un fallo de autenticación. |

Reglas para la descripción:

- Usa letras minúsculas de `a` a `z` y números; evita espacios, tildes y `ñ`.
- Separa las palabras preferentemente con guiones: `registro-pagos`. El validador también permite puntos y guiones bajos entre grupos alfanuméricos.
- Incluye una sola `/`, entre el tipo y la descripción. La descripción no puede estar vacía ni empezar o terminar con un separador; tampoco admite separadores consecutivos.
- Elige un nombre concreto: `fix/login-vacio` explica mejor el cambio que `fix/arreglos`.
- `main` y `develop` aparecen como ramas de destino de eventos `push` en CI. No siguen el formato de las ramas de trabajo; el validador anterior solo se ejecuta para la rama de origen de una Pull Request a `main`.

| Nombre inválido para una rama de trabajo | Motivo | Alternativa válida |
|---|---|---|
| `feat/renovacion-membresias` | El prefijo de rama es `feature`, aunque el tipo de commit sea `feat`. | `feature/renovacion-membresias` |
| `fix/Login Vacio` | Contiene mayúsculas y un espacio. | `fix/login-vacio` |
| `docs/convenciones/git` | Contiene una segunda `/`. | `docs/convenciones-git` |
| `chore/actualizar-` | La descripción termina con un separador. | `chore/actualizar-dependencias` |

### Convención de commits

El historial reciente utiliza **Commits convencionales**: un tipo en inglés seguido de `: ` y una descripción breve del cambio. También se puede incluir un ámbito opcional entre paréntesis para identificar el módulo afectado:

```text
<tipo>: <descripcion>
<tipo>(<ambito>): <descripcion>
```

Por ejemplo, `fix(auth): impedir login con credenciales vacias` se descompone en tipo `fix`, ámbito `auth` y descripción `impedir login con credenciales vacias`. Los ejemplos siguientes usan descripciones en español, como los commits recientes del proyecto. Esta es una convención de colaboración; el workflow actual valida los nombres de ramas, pero no los mensajes de commits.

| Tipo de commit | Cuándo utilizarlo | Ejemplo | Rama relacionada habitual |
|---|---|---|---|
| `feat` | Añadir o ampliar una funcionalidad. | `feat(memberships): agregar renovacion de membresias` | `feature/renovacion-membresias` |
| `fix` | Corregir un error. | `fix(auth): impedir login con credenciales vacias` | `fix/login-vacio` o `hotfix/error-autenticacion` |
| `docs` | Modificar exclusivamente documentación. | `docs: explicar convenciones de ramas y commits` | `docs/convenciones-git` |
| `refactor` | Reestructurar código sin añadir funcionalidades ni corregir errores. | `refactor(memberships): simplificar consultas de membresias` | `refactor/consultas-membresias` |
| `test` | Añadir o modificar pruebas. | `test(payments): cubrir registro de pagos` | `test/flujo-pagos` |
| `chore` | Mantener dependencias, herramientas o configuración. | `chore: actualizar dependencias del proyecto` | `chore/actualizar-dependencias` |
| `style` | Cambios de presentación o formato; el historial del proyecto también lo usa para ajustes visuales, como colores del login. | `style(frontend): ajustar paleta del login` | `feature/paleta-login` o `fix/colores-login`, según el propósito |

La rama agrupa un objetivo de trabajo; el tipo de cada commit describe su cambio individual. Una rama `feature/renovacion-membresias` puede contener commits `feat`, `test` y `docs`. `feature` es un prefijo de rama y `feat` es un tipo de commit; una corrección urgente sigue usando `fix` en el commit, aunque la rama empiece con `hotfix/`. `style/` no está admitido por el validador de ramas.

Para escribir mensajes claros:

- Mantén el tipo en minúsculas y deja un espacio después de los dos puntos.
- Usa un verbo que explique la acción, por ejemplo `agregar`, `corregir`, `actualizar` o `simplificar`; evita mensajes como `cambios` o `arreglos varios`.
- El ámbito es opcional. Usa nombres consistentes como `auth`, `clients`, `memberships`, `payments`, `frontend`, `gateway` o `shared`.
- Procura que cada commit reúna un cambio coherente. Si hace falta explicar el motivo o sus consecuencias, añade un cuerpo separado del título por una línea en blanco.
- Para un cambio incompatible, usa `!` antes de `:` y explica la incompatibilidad en el cuerpo con `BREAKING CHANGE:`. Por ejemplo: `feat(api)!: cambiar formato de respuesta de pagos`. Esta marca documenta el cambio; no incrementa la versión ni publica una versión automáticamente.

Ejemplo completo para una actualización de documentación, ejecutado desde una rama base actualizada y con los cambios guardados en `README.md`:

```bash
git switch -c docs/convenciones-git
git add README.md
git commit -m "docs: explicar convenciones de ramas y commits"
git push -u origin docs/convenciones-git
```

### Directrices de estilo de código

- **TypeScript**: modo estricto activado, sin tipos `any`, tipos de retorno explícitos para las API públicas
- **ESLint**: sigue las reglas definidas por el repositorio
- **Commits**: sigue los tipos y ejemplos de la sección [Convención de commits](#convención-de-commits).
- **Ramas**: sigue el formato y los prefijos de la sección [Nomenclatura de ramas](#nomenclatura-de-ramas).

### Requisitos para las Pull Request

- Todas las comprobaciones de CI se superan (lint, comprobación de tipos, pruebas, compilación)
- La cobertura de código se mantiene o mejora
- No hay cambios incompatibles sin un incremento de versión mayor
- La documentación se actualiza para las nuevas funcionalidades
- Se completa una autorrevisión antes de solicitar una revisión

### Estrategia de pruebas

- `pnpm test` ejecuta primero `pnpm test:unit` y después `pnpm test:integration`.
- `pnpm test:unit` ejecuta las pruebas unitarias de shared, servicios y frontend.
- `pnpm test:integration` crea PostgreSQL y Redis desechables con Testcontainers, aplica el esquema y los datos iniciales, y verifica los recorridos de autenticación contra PostgreSQL/Redis. Requiere Docker activo.
- Los planes se prueban a través del módulo de membresías, que es donde vive su API.
- Playwright ejecuta los recorridos E2E del producto real en `tests/e2e`; requiere que todos los servicios Docker locales estén saludables. Levanta/actualiza el stack con `pnpm docker:dev`, instala Chromium una vez con `pnpm test:e2e:install` y ejecuta `pnpm test:e2e`.
- La suite E2E cubre registro, inicio/cierre de sesión y renovación solicitada por web; alta, edición y búsqueda de clientes; planes, asignación de membresía y check-in; registro e historial de pagos; panel e informes. No utiliza servidores simulados.

## Solución de problemas

### Problemas comunes

**Conflictos de puertos**: asegúrate de que los puertos 3000-3004, 5173, 5432 y 6379 estén disponibles

**Error de conexión a la base de datos**:
```bash
# Comprueba que PostgreSQL esté en ejecución
pg_isready -h localhost -p 5432

# Node local usa .env.local; Compose usa .env.docker
```

**Error de conexión a Redis**:
```bash
# Comprueba que Redis esté en ejecución
redis-cli ping

# Node local usa localhost; Compose configura el host redis
```

**Errores de resolución de módulos**: ejecuta `pnpm install` desde la raíz para asegurarte de que todas las dependencias del espacio de trabajo estén enlazadas

**Errores de TypeScript tras cambiar dependencias**: ejecuta `pnpm build` para recompilar todos los paquetes

### Registros

```bash
# Consulta los registros de todos los servicios (al usar docker compose)
docker compose --env-file .env.docker logs -f

# Registros de un servicio individual (desarrollo)
pnpm --filter=api-gateway dev 2>&1 | tail -f
```

## Licencia

Este proyecto está bajo la Licencia MIT; consulta el archivo [LICENSE](LICENSE) para obtener más detalles.

## Soporte

- **Incidencias**: [Incidencias de GitHub](https://github.com/Kenzowo-dev/GYM_Proyect/issues)
- **Correo electrónico**: support@mundofitness.com

## Agradecimientos

- [TanStack Query](https://tanstack.com/query) para la gestión de estado del servidor
- [Pino](https://getpino.io/) por su registro rápido y estructurado
- [Zod](https://zod.dev/) para la validación de esquemas
