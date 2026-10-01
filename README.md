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

## Instalación y ejecución paso a paso

Esta guía te permite abrir Mundo Fitness en tu propia computadora y probarlo con cuentas de ejemplo. No necesitas saber programar para seguir el recorrido principal. Necesitas conexión a Internet para descargar el proyecto y sus componentes la primera vez.

### Antes de empezar: ¿qué vas a utilizar?

| Concepto | Explicación sencilla | Para qué lo usamos |
|---|---|---|
| Terminal | Una ventana donde escribes instrucciones y pulsas Enter para ejecutarlas. | Descargar el proyecto, iniciarlo y detenerlo. |
| Git | Una herramienta para descargar y llevar el historial de un proyecto. | Obtener una copia del código en tu computadora. |
| Docker | Ejecuta las distintas partes del sistema en entornos separados llamados **contenedores**. | Preparar la aplicación y su base de datos sin instalar cada componente manualmente. |
| Docker Compose | Lee el archivo `compose.yaml`, que describe las partes que deben funcionar juntas. | Iniciar todo el sistema con un comando. |
| Base de datos | El lugar donde se guardan socios, membresías, pagos y cuentas. | Conservar la información que registras en la aplicación. |
| `localhost` | Una dirección que significa «esta misma computadora». | Abrir la aplicación en tu navegador. |
| Puerto | Un número que identifica un servicio dentro de tu computadora. | `5173` corresponde a la página web del sistema. |

### Paso 1. Instalar las herramientas

1. Instala [Git desde su página oficial](https://git-scm.com/downloads/), eligiendo tu sistema operativo.
2. Instala [Docker Desktop siguiendo la guía oficial](https://docs.docker.com/desktop/), eligiendo Windows, macOS o Linux. Docker Desktop incluye Docker Compose. Si el instalador pide reiniciar o habilitar algún componente, sigue sus instrucciones antes de continuar.
3. Abre Docker Desktop y espera a que indique que su motor está funcionando. Déjalo abierto mientras uses el proyecto. En Windows, utiliza contenedores Linux.
4. Abre una terminal:
   - **Windows:** busca y abre **Git Bash**, instalado junto con Git. Los comandos de esta guía están escritos para esa terminal.
   - **macOS:** busca y abre **Terminal**.
   - **Linux:** abre la aplicación **Terminal** de tu distribución.

Escribe los siguientes comandos **uno por uno**. Pulsa Enter después de cada línea y espera el resultado antes de seguir:

```bash
git --version
docker --version
docker compose version
```

Cada comando debe mostrar el nombre de la herramienta y un número de versión. Compose debe ser de la versión 2. Si aparece «command not found» o «no se reconoce», revisa la instalación de esa herramienta y vuelve a abrir la terminal.

Para ejecutar todo con Docker no necesitas instalar Node.js, pnpm, PostgreSQL ni Redis en tu computadora: los archivos Docker del proyecto preparan esos componentes dentro de los contenedores. Node.js y pnpm se utilizan en la alternativa para desarrollar que se explica más abajo.

### Paso 2. Descargar el proyecto y entrar en su carpeta

En la terminal, entra primero en la carpeta donde quieres guardar el proyecto. Por ejemplo, para usar tu carpeta personal:

```bash
cd ~
```

`cd` significa «cambiar de carpeta» y `~` representa tu carpeta personal. Ahora descarga el proyecto:

```bash
git clone https://github.com/Kenzowo-dev/GYM_Proyect.git
```

Espera a que termine la descarga y entra en la carpeta creada:

```bash
cd GYM_Proyect
```

Si ya tienes el proyecto descargado, entra en su carpeta existente y continúa con el paso 3; no necesitas clonarlo otra vez.

Comprueba que estás en el lugar correcto:

```bash
ls
```

Debes ver, entre otros archivos, `README.md`, `compose.yaml` y `package.json`. Esta carpeta se llama **raíz del proyecto**. Todos los comandos siguientes se ejecutan desde ahí. Si cierras la terminal, tendrás que volver a entrar en esa carpeta al abrirla de nuevo.

### Paso 3. Crear el archivo de configuración

El proyecto incluye una plantilla con valores para pruebas locales. Cópiala con este comando **solo si todavía no tienes `.env.docker`**:

```bash
cp .env.docker.example .env.docker
```

`cp` copia el archivo: conserva la plantilla y crea tu configuración personal. Si el comando termina sin mostrar texto, es normal. Puedes comprobar que el archivo existe con:

```bash
ls -a
```

La opción `-a` permite ver archivos cuyos nombres comienzan con un punto. Debe aparecer `.env.docker`.

Un archivo `.env` contiene ajustes como el nombre y la contraseña de la base de datos. Para esta primera prueba con datos ficticios puedes mantener los valores de la plantilla. Git ignora estos archivos personales para evitar incluirlos en el repositorio. Usa estas credenciales únicamente en pruebas locales y cambia las contraseñas y `JWT_SECRET` antes de manejar datos reales. `JWT_SECRET` es la clave que usa el sistema para firmar las credenciales de sesión.

### Paso 4. Preparar la aplicación

Con Docker Desktop funcionando, ejecuta:

```bash
docker compose --env-file .env.docker build
```

Este comando lee tu configuración, descarga los componentes necesarios y prepara las versiones ejecutables de la aplicación, llamadas **imágenes**. La primera vez puede tardar varios minutos y mostrar muchas líneas de texto; eso es normal. Espera a que vuelva a aparecer el lugar donde puedes escribir otro comando. Si termina con un error, revisa la tabla de solución de problemas antes de continuar.

### Paso 5. Encender el sistema

Ejecuta:

```bash
docker compose --env-file .env.docker up -d
```

`up` inicia los componentes del sistema. `-d` los deja funcionando en segundo plano, para que puedas seguir usando la terminal. Se inician la página web, los servicios que procesan las operaciones y las bases de infraestructura PostgreSQL y Redis.

En la primera ejecución con un almacenamiento de base de datos nuevo, el proyecto crea automáticamente las tablas y carga las cuentas y datos de prueba. No necesitas crear esos datos manualmente.

Comprueba el estado:

```bash
docker compose --env-file .env.docker ps
```

En la columna de estado debes ver los servicios funcionando, con `Up` y `healthy`. `healthy` significa que la comprobación automática indica que ese componente responde. Si aparece `health: starting`, espera un poco y repite el comando. Si aparece `unhealthy` o `Exited`, consulta la solución de problemas.

### Paso 6. Abrir la aplicación e iniciar sesión

Abre tu navegador, escribe esta dirección en la barra de direcciones y pulsa Enter:

[http://localhost:5173](http://localhost:5173)

`localhost` apunta a tu computadora; no es una página publicada en Internet. La configuración Docker del proyecto limita el acceso a esta computadora mediante `127.0.0.1`.

Entra en la opción de inicio de sesión y utiliza una de estas cuentas. **La contraseña de las tres es `Admin1234!`**, respetando las mayúsculas y el signo de exclamación:

| Quiero probar… | Correo | Qué revisar después de iniciar sesión |
|---|---|---|
| Administración del gimnasio | `admin@mundofitness.com` | Panel general y Configuración. |
| Atención en recepción | `recepcion@mundofitness.com` | Clientes, membresías, planes y pagos. |
| Experiencia de un socio | `socio@mundofitness.com` | Portal personal e información de su membresía. |

Para probar otro rol, cierra la sesión actual e inicia sesión con la otra cuenta. Los cambios que confirmes en los formularios se guardan en la base de datos local. El sistema registra pagos manuales; no realiza cobros electrónicos.

**Comprobación de que terminaste:** puedes abrir la página, iniciar sesión con una cuenta de prueba y navegar por las opciones de su rol.

Si necesitas comprobar los servicios internos, abre [http://localhost:3000/health](http://localhost:3000/health). Esa dirección muestra información técnica de su estado; la página para usar el gimnasio sigue siendo la del puerto `5173`.

### Paso 7. Detener el sistema y volver a usarlo

Cuando termines, ejecuta desde la raíz del proyecto:

```bash
docker compose --env-file .env.docker down
```

Este comando detiene y elimina los contenedores, pero **conserva los datos guardados** en el almacenamiento de PostgreSQL, llamado volumen.

La próxima vez:

1. Abre Docker Desktop y espera a que esté listo.
2. Abre la terminal y entra en la carpeta `GYM_Proyect` que descargaste.
3. Ejecuta `docker compose --env-file .env.docker up -d`.
4. Comprueba el estado con `docker compose --env-file .env.docker ps`.
5. Abre [http://localhost:5173](http://localhost:5173).

No necesitas volver a clonar el proyecto ni copiar la configuración. Si modificaste el código, vuelve a ejecutar el comando `build` antes de `up -d` para preparar las imágenes actualizadas.

### Si algo no funciona

| Qué ocurre | Qué significa o qué comprobar | Cómo continuar |
|---|---|---|
| No se reconoce `git` o `docker` | Falta instalar la herramienta o la terminal no ha detectado su instalación. | Completa el paso 1 y cierra y vuelve a abrir la terminal. |
| Docker indica que no puede conectar con el motor o daemon | Docker no está funcionando todavía. | Abre Docker Desktop, espera a que su motor esté listo y repite el comando. |
| No encuentra `compose.yaml` | La terminal está en otra carpeta. | Entra en `GYM_Proyect` con `cd` y comprueba con `ls` que aparece el archivo. |
| No encuentra `.env.docker` | Falta el archivo de configuración. | Desde la raíz del proyecto, realiza el paso 3. |
| Falla la descarga durante `build` | Puede haber un problema de conexión o de acceso al registro de imágenes o paquetes. | Comprueba tu conexión, revisa el mensaje de error y vuelve a ejecutar `build`. |
| Aparece `port is already allocated` o «puerto ocupado» | Otro programa está utilizando uno de los puertos que necesita el proyecto. | Detén la otra instancia del proyecto o el programa que ocupa el puerto; luego repite `up -d`. |
| La página no abre | La aplicación puede estar arrancando, detenida o haber fallado. | Comprueba la dirección `http://localhost:5173` y ejecuta `ps` como en el paso 5. |
| Un servicio aparece como `unhealthy` o `Exited` | Ese componente no responde o se detuvo por un error. | Consulta sus registros con el comando que aparece debajo de esta tabla. |
| Las cuentas de prueba no permiten entrar | Comprueba el correo y la contraseña; si son correctos, puede faltar la carga de datos iniciales en una base existente. | Revisa los registros de PostgreSQL. Si necesitas conservar los datos, utiliza la preparación de Node y `pnpm db:init` explicadas más abajo. |

Para ver los mensajes de todos los componentes, ejecuta:

```bash
docker compose --env-file .env.docker logs --tail=100
```

Para revisar uno concreto, añade su nombre. Por ejemplo, para la base de datos:

```bash
docker compose --env-file .env.docker logs --tail=100 postgres
```

Los **registros**, también llamados *logs*, son los mensajes que genera cada componente y ayudan a identificar el problema. Otros nombres de servicio son `frontend`, `api-gateway`, `auth-service`, `client-service`, `membership-service` y `payment-service`.

### Alternativa para quienes quieren modificar el código

Esta sección es opcional. Úsala para ejecutar el código directamente en tu computadora mientras PostgreSQL y Redis siguen funcionando en Docker. Al ejecutar `pnpm dev`, las herramientas de desarrollo observan los archivos para actualizar o reiniciar la aplicación cuando los editas.

#### 1. Preparar Node.js y pnpm

Instala **Node.js 22** desde la [página oficial de Node.js](https://nodejs.org/en/download), seleccionando una versión `22.x` y el instalador de tu sistema operativo. Node.js ejecuta el código JavaScript del proyecto. Vuelve a abrir la terminal, entra en la raíz del proyecto y comprueba:

```bash
node --version
npm --version
```

El primer resultado debe comenzar con `v22.`. `npm` es una herramienta que viene con Node.js y permite instalar otras herramientas.

El proyecto fija **pnpm 11.24.0** en `package.json`. pnpm descarga las bibliotecas que necesita el código, llamadas **dependencias**. Si dispones de Corepack, la herramienta que selecciona la versión de pnpm del proyecto, ejecuta:

```bash
corepack enable
pnpm --version
```

Si `corepack` no existe en tu instalación, puedes instalar la versión fijada de pnpm con npm:

```bash
npm install --global pnpm@11.24.0
pnpm --version
```

El resultado de `pnpm --version` debe ser `11.24.0`. Consulta la [documentación oficial de instalación de pnpm](https://pnpm.io/installation) si tu sistema muestra un error de instalación o permisos.

Después descarga las dependencias del proyecto:

```bash
pnpm install
```

Espera a que termine antes de continuar.

#### 2. Preparar la configuración local

Si todavía no existe `.env.local`, crea una copia de la plantilla:

```bash
cp .env.local.example .env.local
```

`.env.docker` configura la ejecución dentro de Docker; `.env.local` configura los programas que ejecutas directamente en tu computadora. Este segundo archivo contiene las direcciones `localhost` de PostgreSQL, Redis y los servicios. Si cambiaste las credenciales de `.env.docker`, ajusta también las correspondientes en `.env.local`.

#### 3. Iniciar solo PostgreSQL y Redis

Si tenías la aplicación completa funcionando en Docker, detén primero sus contenedores para liberar los puertos:

```bash
docker compose --env-file .env.docker down
```

Después inicia únicamente los dos componentes de almacenamiento:

```bash
docker compose --env-file .env.docker up -d postgres redis
docker compose --env-file .env.docker ps
```

Espera a que ambos indiquen `healthy` antes de continuar.

#### 4. Preparar los datos e iniciar la aplicación

Ejecuta, uno por uno:

```bash
pnpm db:init
pnpm dev
```

`pnpm db:init` aplica la estructura de la base y los datos de prueba. Puede restablecer las contraseñas de las cuentas demo, conservando las demás filas. `pnpm dev` inicia la página web y los servicios desde tu computadora.

Deja esa terminal abierta mientras uses este modo. Cuando los servicios estén listos, abre [http://localhost:5173](http://localhost:5173) y utiliza las mismas cuentas de prueba. Para detener los procesos de desarrollo, pulsa **Ctrl+C** en esa terminal. Para detener PostgreSQL y Redis, ejecuta después el comando `down` del paso 7.

No inicies la aplicación completa en Docker y `pnpm dev` al mismo tiempo: utilizan los mismos puertos `3000`–`3004` y `5173`.

Si prefieres aplicar cambios de código al modo Docker completo, con Node.js, pnpm y las dependencias ya preparados puedes usar `pnpm docker:dev`. Este comando compila en tu computadora y actualiza los contenedores de aplicación sin borrar los datos de PostgreSQL y Redis.

### Información sobre la configuración y los datos

- `.env.docker` define las credenciales de PostgreSQL y Redis, `JWT_SECRET` y el origen permitido para las solicitudes del navegador (`CORS_ORIGIN`). Compose proporciona las direcciones internas de los servicios.
- `.env.local` define las conexiones desde tu computadora, la dirección del gateway y `VITE_API_URL`, que indica al frontend dónde consultar la API. La configuración del backend busca `.env.local` en las carpetas superiores; también acepta un archivo indicado mediante `ENV_FILE`.
- `shared/database/schema.sql` define las tablas; `shared/database/seed.sql` incluye las cuentas y datos de prueba. La carga inicial, conocida como **seed**, y la migración `003-membership-renewal-requests.sql` se ejecutan automáticamente cuando Compose crea un volumen de PostgreSQL nuevo.
- Estas plantillas sirven para desarrollo local. Un entorno de producción requiere secretos robustos y conexiones HTTPS.

### Reiniciar todos los datos de prueba (opcional)

**Este procedimiento elimina los datos locales del almacenamiento de Docker, incluidos socios, membresías y pagos que hayas registrado.** Úsalo únicamente si quieres empezar de cero con los datos de ejemplo:

```bash
docker compose --env-file .env.docker down -v
docker compose --env-file .env.docker up -d
```

La diferencia con la detención habitual es `-v`: también elimina los volúmenes de almacenamiento. En el siguiente inicio, PostgreSQL crea de nuevo la base y carga los datos de prueba. Espera a que los servicios estén `healthy` antes de iniciar sesión.

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
