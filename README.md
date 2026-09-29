# Mundo Fitness - Sistema de gestión de gimnasios

Una plataforma integral de gestión de gimnasios construida con una arquitectura de microservicios, que incluye un frontend en React + TypeScript y servicios backend en Node.js/Express con PostgreSQL y Redis.

## Descripción general de la arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│              Puerta de enlace de API (puerto 3000)                 │
│       Enrutamiento, autenticación y límite de solicitudes          │
└─────────────────────────────────────────────────────────────────────┘
          │           │           │           │           │
    ┌─────┴───┐ ┌─────┴───┐ ┌─────┴───┐ ┌─────┴───┐ ┌─────┴───┐ ┌─────┴───┐
    │ Auth    │ │ Client  │ │Membresía│ │ Pagos   │ │ Plan    │ │Reportes │
    │Service  │ │Service  │ │ Service │ │Service  │ │Service  │ │Service  │
    │  :3001  │ │  :3002  │ │  :3003  │ │  :3004  │ │  :3005  │ │  :3006  │
    └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
          │           │           │           │           │           │
          └───────────┴───────────┴───────────┴───────────┴───────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │       Infraestructura compartida   │
                    │ Configuración | Registro | Base de datos │
                    │ Mensajería | Errores | Validación │
                    │ Utilidades JWT                    │
                    └─────────────────┬─────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │      PostgreSQL  │      Redis      │
                    └───────────────────────────────────┘
```

### Servicios

| Servicio | Puerto | Descripción |
|---------|------|-------------|
| **Puerta de enlace de API** | 3000 | Punto de entrada, enrutamiento de solicitudes, validación de autenticación, limitación de velocidad, comprobaciones de estado de los servicios |
| **Servicio de autenticación** | 3001 | Registro de usuarios, inicio de sesión, gestión de tokens JWT (acceso/actualización), restablecimiento de contraseña, control de acceso basado en roles |
| **Servicio de clientes** | 3002 | CRUD de clientes, mediciones corporales, objetivos de acondicionamiento físico, gestión de documentos |
| **Servicio de membresías** | 3003 | Planes de membresía, suscripciones, registro de entrada/salida, congelamientos, notificaciones de vencimiento |
| **Servicio de pagos** | 3004 | Procesamiento de pagos, facturas, métodos de pago, reembolsos, resúmenes de pagos de clientes |
| **Servicio de planes** | 3005 | Biblioteca de ejercicios, creación de planes de entrenamiento, asignación de planes a clientes, registro de entrenamientos |
| **Servicio de informes** | 3006 | Plantillas de informes, informes generados, widgets del panel, paneles de usuario, analítica |

### Infraestructura compartida (`@gym/shared`)

- **Config** - Configuración centralizada basada en el entorno con validación
- **Logger** - Registro estructurado con Pino
- **Database** - Gestión de grupos de conexiones de PostgreSQL
- **Messaging** - Pub/sub de Redis para comunicación entre servicios
- **Errors** - Clases de error estandarizadas (AppError, ValidationError, AuthenticationError, etc.)
- **Validation** - Esquemas Zod para validación de solicitudes
- **JWT Utils** - Generación, verificación y extracción de tokens

## Pila tecnológica

### Backend
- **Entorno de ejecución**: Node.js 20+ con módulos ES
- **Framework**: Express.js
- **Lenguaje**: TypeScript 6.0.x (modo estricto)
- **Base de datos**: PostgreSQL 17 (en Docker) con grupo de conexiones pg
- **Caché/cola**: Redis 7+ (redis@5, no ioredis)
- **Validación**: Zod
- **Autenticación**: JWT (jsonwebtoken), bcryptjs
- **Documentación**: OpenAPI/Swagger (planificada)

### Frontend
- **Framework**: React 19.2.x con TypeScript
- **Herramienta de compilación**: Vite 8.2.x
- **Enrutamiento**: React Router 7.18.x
- **Gestión de estado**: **TanStack Query (React Query) v5** para estado del servidor + React Context para autenticación
- **Formularios**: Validación con **Zod** (esquemas compartidos en `@gym/shared`), manejo manual de estado (sin React Hook Form)
- **Componentes de IU**: **TailwindCSS + shadcn/ui (Radix UI primitives)**
- **Iconos**: Emoji
- **Gráficos**: Placeholders implementados en ReportsPage (Recharts planificado para producción)

### DevOps
- **Gestor de paquetes**: pnpm 11.24.0 (espacios de trabajo)
- **Contenedorización**: Docker + Docker Compose v2
- **CI/CD**: GitHub Actions
- **Linting**: ESLint 10.9.0 + TypeScript ESLint
- **Comprobación de tipos**: TypeScript 6.0.x

## Requisitos previos

- **Node.js** 20.0.0 o superior
- **pnpm** 11.0.0 o superior (`npm install -g pnpm`)
- **PostgreSQL** 17.0 o superior (o usar Docker)
- **Redis** 7.0 o superior (o usar Docker)
- **Docker** 24.0+ y **Docker Compose** 2.0+ (opcional, para una implementación en contenedores)

## Instalación

### 1. Verifica que tu computadora cumple los requisitos

Antes de instalar cualquier cosa, comprueba que tienes lo siguiente. Si alguno falta, instálalo primero.

| Herramienta | Versión mínima | Cómo verificarla |
|---|---|---|
| **Node.js** | 20.0.0 o superior | Abre una terminal y escribe `node -v` |
| **pnpm** | 9.0.0 o superior (el proyecto usa pnpm 11) | Escribe `pnpm -v` |
| **PostgreSQL** | 16.0 o superior | Escribe `psql --version` |
| **Redis** | 7.0 o superior | Escribe `redis-cli --version` |
| **Docker** (opcional) | 24.0+ | Escribe `docker --version` |

> **Para principiantes:** si alguno de estos comandos no existe, significa que no está instalado. Puedes instalar Node.js y pnpm fácilmente desde https://nodejs.org (trae npm) y luego escribir `npm install -g pnpm`.

### 2. Clona el repositorio a tu computadora

Abre una terminal (PowerShell, CMD, Terminal de macOS o consola de Linux) y copia este comando tal cual:

```bash
# Descarga el código del proyecto a tu computadora
git clone https://github.com/<TU_USUARIO>/gym-project.git

# Entra a la carpeta que se acaba de crear
cd GYM_Proyect
```

> **Consejo:** si `git clone` no funciona, instala Git desde https://git-scm.com y luego repite el comando.

### 3. Instala todas las dependencias con pnpm

El proyecto está dividido en varias partes (frontend, backend y servicios). pnpm las instala todas de una sola vez:

```bash
# Instala las dependencias de TODAS las partes del proyecto
pnpm install
```

> **Para principiantes:** este comando puede tardar varios minutos la primera vez. No lo interrumpas. Al finalizar, verás archivos `node_modules` en cada carpeta (`frontend/`, `services/...`, `shared/`).

### 4. Configura las variables de entorno

El proyecto utiliza un **único archivo `.env` en la raíz** que comparten todos los servicios. No existen archivos `.env.example` individuales por servicio.

```bash
# Copia la plantilla de configuración general
cp .env.example .env
```

Luego edita `.env` con tus valores reales (base de datos, claves secretas, etc.). La plantilla ya incluye valores por defecto para desarrollo local.

> **Importante:** El archivo `.env` raíz es **obligatorio**, no opcional. Todos los servicios leen sus variables desde este archivo compartido.

### 5. Inicia las bases de datos (PostgreSQL y Redis)

#### Opción A: Con Docker (recomendado, más fácil)

Si instalaste Docker, levanta solo PostgreSQL y Redis:

```bash
docker compose up -d postgres redis
```

Esto iniciará PostgreSQL en el puerto 5432 y Redis en el puerto 6379 automáticamente.

#### Opción B: Instalados localmente (sin Docker)

1. **Inicia PostgreSQL:**
   - Windows: abre el programa "pgAdmin" o ejecuta `pg_ctlcluster start` o `service postgresql start`.
   - macOS: ejecuta `brew services start postgresql@16` (si usas Homebrew).
   - Linux: ejecuta `sudo systemctl start postgresql`.
2. **Crea la base de datos:**
   ```bash
   # Inicia la consola de PostgreSQL
   psql -U postgres

   # Dentro de psql, escribe:
   CREATE DATABASE gym_db;
   \q
   ```
3. **Inicia Redis:**
   - Windows: `redis-server` (si lo instalaste).
   - macOS: `brew services start redis`
   - Linux: `sudo systemctl start redis`

### 6. Inicia el entorno de desarrollo

El proyecto soporta **dos modos de ejecución**. Elige uno:

---

#### Modo A: Desarrollo local (recomendado para desarrollo diario)

Los servicios corren en tu máquina (Node.js) y se conectan a PostgreSQL/Redis en Docker.

```bash
# 1. Asegúrate de que PostgreSQL y Redis estén corriendo (paso 5)
docker compose up -d postgres redis

# 2. Levanta todos los servicios + frontend en modo watch
pnpm dev
```

Verás en la terminal varios mensajes como `Listening on http://localhost:3000`, `Listening on http://localhost:5173`, etc. Deja esa terminal abierta mientras trabajas.

> **Nota:** `pnpm dev` compila `@gym/shared` en watch mode automáticamente antes de iniciar los servicios, así que un clon limpio funciona sin builds previos.

---

#### Modo B: Completamente Dockerizado (para pruebas de integración / staging)

Todos los servicios (incluyendo frontend) corren dentro de contenedores.

```bash
# 1. Asegúrate de tener .env configurado
cp .env.example .env

# 2. Levanta TODO (build + up)
docker compose up -d --build
```

> **Importante:** No ejecutes `pnpm dev` después de iniciar todos los servicios mediante Docker Compose. Los puertos colisionarían (3000-3006, 5173).

---

#### Modo C: Servicios por separado (control granular)

Si necesitas depurar un servicio específico, abre terminales separadas:

```bash
# Terminal 1 — API Gateway
pnpm --filter=api-gateway dev

# Terminal 2 — Servicio de autenticación
pnpm --filter=auth-service dev

# Terminal 3 — Servicio de clientes
pnpm --filter=client-service dev

# Terminal 4 — Servicio de membresías
pnpm --filter=membership-service dev

# Terminal 5 — Servicio de pagos
pnpm --filter=payment-service dev

# Terminal 6 — Servicio de planes
pnpm --filter=plan-service dev

# Terminal 7 — Servicio de informes
pnpm --filter=report-service dev

# Terminal 8 — Frontend (React)
pnpm --filter=frontend dev
```

### 7. Verifica que todo funcione

Abre tu navegador y visita estas direcciones:

| Dirección | Qué esperas ver |
|---|---|
| **Frontend** `http://localhost:5173` | La página principal de Mundo Fitness |
| **Health check** `http://localhost:3000/health` | Health check del gateway + estado de todos los servicios |
| **Lista de servicios** `http://localhost:3000/services` | JSON listando los microservicios conectados |

> **Para principiantes:** si alguna dirección no carga, revisa la terminal donde ejecutaste `pnpm dev` y lee los mensajes de error. Lo más común es que la base de datos o Redis no estén encendidos (ver paso 5) o que no hayas editado correctamente el archivo `.env` (ver paso 4).

### 8. Solución de problemas comunes (para principiantes)

- **"Error de conexión a la base de datos":** asegúrate de haber iniciado PostgreSQL y de que `POSTGRES_PASSWORD` en tus `.env` coincida con la contraseña real de tu usuario `postgres`.
- **"Error de conexión a Redis":** verifica que Redis esté corriendo con `redis-cli ping` (debe responder `PONG`).
- **"No se encuentra pnpm":** instálalo con `npm install -g pnpm` y luego repite `pnpm install`.
- **"El puerto 3000 ya está en uso":** cierra la terminal donde corriste `pnpm dev` o ejecuta `pnpm dev` en otra máquina.
- **"Los archivos .env no existen":** repite el paso 4.2. Si la plantilla `.env.example` falta en algún servicio, copia las variables del ejemplo de la sección de arriba.

## Ejemplos de uso

> **Nota:** Todos los endpoints usan el prefijo `/api` a través del API Gateway (puerto 3000). Los ejemplos requieren un token Bearer válido excepto registro y login.

### Flujo de autenticación

```bash
# Registra un usuario nuevo (público)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trainer@gym.com",
    "password": "securePassword123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "trainer"
  }'

# Inicia sesión (público)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "trainer@gym.com", "password": "securePassword123"}'

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
  -d '{"email": "trainer@gym.com"}'

# Resetea contraseña con token (público)
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "<reset_token>", "password": "newSecure456"}'
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
  -d '{"role": "trainer", "isActive": true}'

# Elimina usuario (admin)
curl -X DELETE http://localhost:3000/api/auth/users/<user_id> \
  -H "Authorization: Bearer <access_token>"

# Obtiene roles disponibles
curl -X GET http://localhost:3000/api/auth/roles \
  -H "Authorization: Bearer <access_token>"
```

### Gestión de clientes

```bash
# Crea un cliente (admin, recepcionist, trainer)
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

### Ejercicios (Plan Service)

```bash
# Lista ejercicios
curl -X GET http://localhost:3000/api/plans/exercises \
  -H "Authorization: Bearer <access_token>"

# Obtiene ejercicio por ID
curl -X GET http://localhost:3000/api/plans/exercises/<exercise_id> \
  -H "Authorization: Bearer <access_token>"

# Crea ejercicio (admin, trainer)
curl -X POST http://localhost:3000/api/plans/exercises \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Press de banca",
    "muscleGroup": "chest",
    "equipment": "barbell",
    "difficulty": "intermediate",
    "instructions": "Acuéstate en el banco, sujeta la barra..."
  }'

# Actualiza ejercicio (admin, trainer)
curl -X PATCH http://localhost:3000/api/plans/exercises/<exercise_id> \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"difficulty": "advanced"}'
```

### Planes de entrenamiento

```bash
# Lista planes de entrenamiento
curl -X GET http://localhost:3000/api/plans/plans \
  -H "Authorization: Bearer <access_token>"

# Obtiene plan por ID
curl -X GET http://localhost:3000/api/plans/plans/<plan_id> \
  -H "Authorization: Bearer <access_token>"

# Crea plan de entrenamiento (admin, trainer)
curl -X POST http://localhost:3000/api/plans/plans \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fuerza Superior",
    "description": "Enfoque en pecho, espalda y hombros",
    "exercises": [
      {"exerciseId": "<ex_id_1>", "sets": 4, "reps": 8, "restSeconds": 90},
      {"exerciseId": "<ex_id_2>", "sets": 3, "reps": 10, "restSeconds": 60}
    ]
  }'

# Actualiza plan (admin, trainer)
curl -X PATCH http://localhost:3000/api/plans/plans/<plan_id> \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"description": "Actualizado"}'

# Elimina plan (admin)
curl -X DELETE http://localhost:3000/api/plans/plans/<plan_id> \
  -H "Authorization: Bearer <access_token>"
```

### Asignación de planes a clientes

```bash
# Asigna plan a cliente (admin, trainer)
curl -X POST http://localhost:3000/api/plans/assign \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "<client_id>",
    "planId": "<plan_id>",
    "startDate": "2024-01-15"
  }'

# Obtiene planes de un cliente
curl -X GET http://localhost:3000/api/plans/client/<client_id> \
  -H "Authorization: Bearer <access_token>"

# Obtiene plan activo del cliente
curl -X GET http://localhost:3000/api/plans/client/<client_id>/active \
  -H "Authorization: Bearer <access_token>"

# Actualiza progreso del plan asignado
curl -X PATCH http://localhost:3000/api/plans/client-plans/<client_plan_id>/progress \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"week": 3, "completedSessions": 12}'

# Completa plan asignado
curl -X POST http://localhost:3000/api/plans/client-plans/<client_plan_id>/complete \
  -H "Authorization: Bearer <access_token>"
```

### Registro de entrenamientos (Workout Logs)

```bash
# Registra entrenamiento
curl -X POST http://localhost:3000/api/plans/logs \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "clientPlanId": "<client_plan_id>",
    "exercises": [
      {"exerciseId": "<ex_id>", "sets": 3, "reps": 10, "weight": 60, "rpe": 8}
    ],
    "durationMinutes": 45,
    "notes": "Buen entrenamiento"
  }'

# Obtiene logs de un plan asignado
curl -X GET http://localhost:3000/api/plans/logs/client-plan/<client_plan_id> \
  -H "Authorization: Bearer <access_token>"

# Obtiene log específico
curl -X GET http://localhost:3000/api/plans/logs/<log_id> \
  -H "Authorization: Bearer <access_token>"
```

### Informes y analítica

```bash
# Plantillas de informes
curl -X GET http://localhost:3000/api/reports/templates \
  -H "Authorization: Bearer <access_token>"

# Crea plantilla (admin)
curl -X POST http://localhost:3000/api/reports/templates \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Progreso Mensual",
    "description": "Informe de progreso del cliente",
    "query": "SELECT * FROM client_progress WHERE client_id = ?"
  }'

# Genera informe
curl -X POST http://localhost:3000/api/reports/generate \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "<template_id>",
    "clientId": "<client_id>",
    "dateRange": {"start": "2024-01-01", "end": "2024-01-31"}
  }'

# Lista informes generados
curl -X GET http://localhost:3000/api/reports/generated \
  -H "Authorization: Bearer <access_token>"

# Obtiene informe generado
curl -X GET http://localhost:3000/api/reports/generated/<report_id> \
  -H "Authorization: Bearer <access_token>"

# Ejecuta query personalizada (admin)
curl -X POST http://localhost:3000/api/reports/query \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT COUNT(*) FROM clients WHERE created_at > ?", "params": ["2024-01-01"]}'

# Widgets de dashboard
curl -X GET http://localhost:3000/api/reports/widgets \
  -H "Authorization: Bearer <access_token>"

# Ejecuta widget específico
curl -X GET http://localhost:3000/api/reports/widgets/<widget_id>/execute \
  -H "Authorization: Bearer <access_token>"

# Dashboards de usuario
curl -X GET http://localhost:3000/api/reports/dashboards/user/<user_id> \
  -H "Authorization: Bearer <access_token>"

# Eventos de analítica
curl -X POST http://localhost:3000/api/reports/events \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"eventType": "check_in", "clientId": "<client_id>", "metadata": {}}'

curl -X GET http://localhost:3000/api/reports/events/counts \
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
| Planes | `/api/plans` | `GET /exercises`, `GET /exercises/:id`, `POST /exercises`, `PATCH /exercises/:id`, `GET /plans`, `GET /plans/:id`, `POST /plans`, `PATCH /plans/:id`, `DELETE /plans/:id`, `POST /assign`, `GET /client/:clientId`, `GET /client/:clientId/active`, `PATCH /client-plans/:clientPlanId/progress`, `POST /client-plans/:clientPlanId/complete`, `POST /logs`, `GET /logs/client-plan/:clientPlanId`, `GET /logs/:logId` |
| Informes | `/api/reports` | `POST /templates`, `GET /templates`, `GET /templates/:id`, `PATCH /templates/:id`, `DELETE /templates/:id`, `POST /query`, `POST /generate`, `GET /generated`, `GET /generated/:id`, `POST /widgets`, `GET /widgets`, `GET /widgets/:widgetId/execute`, `PATCH /widgets/:id`, `DELETE /widgets/:id`, `POST /dashboards`, `GET /dashboards/user/:userId`, `GET /dashboards/:id`, `PATCH /dashboards/:id`, `DELETE /dashboards/:id`, `POST /events`, `GET /events/counts` |

## Estructura del proyecto

```
GYM_Proyect/
├── .github/workflows/          # Pipelines de CI/CD
├── frontend/                   # Aplicación React + Vite
│   ├── src/
│   │   ├── api/               # Cliente de API y hooks de TanStack Query
│   │   ├── components/        # Componentes de IU reutilizables (shadcn/ui)
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
│   ├── test/
│   │   └── integration-setup.ts  # Configuración Testcontainers para tests de integración
│   └── package.json
├── services/                   # Microservicios (7 servicios)
│   ├── api-gateway/           # Puerto 3000 - Punto de entrada
│   ├── auth-service/          # Puerto 3001 - Autenticación
│   ├── client-service/        # Puerto 3002 - Gestión de clientes
│   ├── membership-service/    # Puerto 3003 - Membresías
│   ├── payment-service/       # Puerto 3004 - Pagos
│   ├── plan-service/          # Puerto 3005 - Planes de entrenamiento
│   └── report-service/        # Puerto 3006 - Informes y analítica
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

# Comprueba los tipos de todos los paquetes
pnpm --filter=shared tsc --noEmit
pnpm --filter=services/* tsc --noEmit
pnpm --filter=frontend tsc --noEmit

# Ejecuta las pruebas
pnpm test

# Compila todos los paquetes
pnpm build
```

### Añadir un servicio nuevo

1. Crea un directorio para el servicio dentro de `services/`
2. Añade `package.json` con las dependencias del espacio de trabajo
3. Configura `tsconfig.json` para que extienda la configuración raíz
4. Implementa la aplicación Express con la infraestructura compartida
5. Registra el servicio en la puerta de enlace de API (`services/api-gateway/src/index.ts`)
6. Añade las variables de entorno a `.env.example`
7. Actualiza Docker Compose y CI/CD

### Migraciones de la base de datos

Las migraciones se gestionan por servicio. Cada servicio es propietario de sus tablas.

```bash
# Ejemplo: crear una migración en un servicio
cd services/client-service
# Crea el archivo de migración
# Ejecuta la migración
pnpm db:migrate
```

## Despliegue

### Docker Compose (desarrollo/preproducción)

```bash
# Compila e inicia todos los servicios
docker compose up -d --build

# Consulta los registros
docker compose logs -f

# Detén los servicios
docker compose down
```

### Consideraciones para producción

- Usa PostgreSQL administrado (RDS, Cloud SQL) y Redis (ElastiCache, Redis Cloud)
- Configura la terminación TLS/SSL en el balanceador de carga
- Establece `NODE_ENV=production`
- Usa un administrador de secretos para los valores sensibles
- Habilita el registro de solicitudes y la monitorización
- Configura comprobaciones de estado para la orquestación
- Configura el registro centralizado (ELK, Datadog, etc.)
- Implementa el rastreo distribuido (OpenTelemetry)

### Configuraciones específicas del entorno

Crea archivos `.env.production` y `.env.staging` por servicio con los valores adecuados.

> **Nota:** Los jobs de deployment en CI/CD son **placeholders** (no hay infraestructura real configurada). Ver sección CI/CD.

## Contribución

### Primeros pasos

1. Crea un fork del repositorio
2. Crea una rama de funcionalidad: `git checkout -b feature/amazing-feature`
3. Realiza los cambios
4. Asegúrate de la calidad del código: `pnpm lint && pnpm build`
5. Ejecuta las pruebas: `pnpm test`
6. Confirma los cambios con Commits convencionales: `git commit -m "feat: add amazing feature"`
7. Envía los cambios a tu fork: `git push origin feature/amazing-feature`
8. Abre una solicitud de extracción (Pull Request)

### Directrices de estilo de código

- **TypeScript**: modo estricto activado, sin tipos `any`, tipos de retorno explícitos para las API públicas
- **ESLint**: sigue las reglas configuradas (se recomiendan Airbnb + TypeScript ESLint)
- **Prettier**: formatear al guardar (configurado en el editor)
- **Commits**: Commits convencionales (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`)
- **Ramas**: `feature/*`, `fix/*`, `hotfix/*`, `release/*`

### Requisitos para las Pull Request

- Todas las comprobaciones de CI se superan (lint, comprobación de tipos, pruebas, compilación)
- La cobertura de código se mantiene o mejora
- No hay cambios incompatibles sin un incremento de versión mayor
- La documentación se actualiza para las nuevas funcionalidades
- Se completa una autorrevisión antes de solicitar una revisión

### Estrategia de pruebas

- **Pruebas unitarias**: utilidades, validadores, funciones puras y clases de error (Vitest) — **92 tests pasando**
- **Pruebas de integración**: endpoints de servicios con base de datos real (Testcontainers: PostgreSQL + Redis) — **Infraestructura lista en `shared/test/integration-setup.ts`**, tests creados para Auth, Client, Membership, Payment, Plan services
- **Pruebas E2E**: flujos de usuario críticos (Playwright) — **Configurado en `playwright.config.ts`**, 5 suites: auth, dashboard, clients, memberships, payments
- **Pruebas de contrato**: compatibilidad de API entre servicios via API Gateway — **Tests de contrato en `services/api-gateway/test/contract.test.ts`**

## Solución de problemas

### Problemas comunes

**Conflictos de puertos**: asegúrate de que los puertos 3000-3006, 5173, 5432 y 6379 estén disponibles

**Error de conexión a la base de datos**:
```bash
# Comprueba que PostgreSQL esté en ejecución
pg_isready -h localhost -p 5432

# Verifica las credenciales en .env
```

**Error de conexión a Redis**:
```bash
# Comprueba que Redis esté en ejecución
redis-cli ping

# Verifica REDIS_HOST/REDIS_PORT en .env
```

**Errores de resolución de módulos**: ejecuta `pnpm install` desde la raíz para asegurarte de que todas las dependencias del espacio de trabajo estén enlazadas

**Errores de TypeScript tras cambiar dependencias**: ejecuta `pnpm build` para recompilar todos los paquetes

### Registros

```bash
# Consulta los registros de todos los servicios (al usar docker compose)
docker compose logs -f

# Registros de un servicio individual (desarrollo)
pnpm --filter=api-gateway dev 2>&1 | tail -f
```

## Licencia

Este proyecto está bajo la Licencia MIT; consulta el archivo [LICENSE](LICENSE) para obtener más detalles.

## Soporte

- **Incidencias**: [Incidencias de GitHub](https://github.com/<TU_USUARIO>/gym-project/issues)
- **Debates**: [Debates de GitHub](https://github.com/<TU_USUARIO>/gym-project/discussions)
- **Correo electrónico**: support@mundofitness.com

## Agradecimientos

- [shadcn/ui](https://ui.shadcn.com/) por sus componentes accesibles y bien diseñados
- [TanStack Query](https://tanstack.com/query) para la gestión de estado del servidor
- [Radix UI](https://www.radix-ui.com/) por sus primitivas de IU sin estilo
- [Pino](https://getpino.io/) por su registro rápido y estructurado
- [Zod](https://zod.dev/) para la validación de esquemas
