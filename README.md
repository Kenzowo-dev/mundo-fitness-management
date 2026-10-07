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

Esta guía está escrita para los miembros del equipo que usan Windows. Al terminar, podrás abrir Mundo Fitness en tu navegador e iniciar sesión con una cuenta de prueba.

Copia un bloque de comandos a la vez. Pulsa **Enter** y espera el resultado que se indica debajo. Si aparece un error, resuélvelo antes de seguir; ejecutar el siguiente comando no arregla el anterior.

### Elige una sola forma de trabajar

| Quiero hacer esto | Ruta que debo seguir | Qué instalaré |
|---|---|---|
| Abrir y probar el sistema completo. | [Sistema completo con Docker](#sistema-completo-con-docker). | Git y Docker Desktop. |
| Modificar el código y ejecutar todo directamente en Windows. | [Desarrollo en Windows sin Docker](#desarrollo-en-windows-sin-docker). | Git, Node.js, pnpm, PostgreSQL y Memurai. |
| Modificar el código, dejando las bases en Docker. | [Desarrollo con almacenamiento en Docker](#desarrollo-con-almacenamiento-en-docker). | Git, Docker Desktop, Node.js y pnpm. |

Sigue únicamente la ruta elegida. Cada ruta indica cuándo consultar un paso compartido. No enciendas dos rutas a la vez: utilizan los mismos puertos.

### Las palabras que encontrarás

| Palabra | Qué significa aquí |
|---|---|
| Terminal | La ventana donde pegas los comandos. En esta guía utilizarás PowerShell. |
| Frontend | La página que ves y utilizas en el navegador. |
| Backend | Los programas que procesan el inicio de sesión, los clientes, las membresías y los pagos. |
| Gateway | La entrada del backend. Recibe las solicitudes de la página y las envía al servicio correspondiente. |
| PostgreSQL | La base donde se guardan las cuentas y los datos del gimnasio. |
| Redis o Memurai | El servidor que el backend utiliza para mensajería y otras funciones de infraestructura. Memurai es compatible con Redis y funciona en Windows. |
| Contenedor | El entorno donde Docker ejecuta un componente del proyecto. |
| `localhost` | Esta misma computadora. |
| Puerto | El número que identifica a un programa que recibe conexiones. La página utiliza `5173`; la API utiliza `3000`. |
| Raíz del proyecto | La carpeta `GYM_Proyect` donde están `README.md`, `package.json` y `compose.yaml`. |

### Abre PowerShell y descarga el proyecto

Este paso sirve para las tres rutas. Hazlo una sola vez.

1. Instala [Git para Windows](https://git-scm.com/downloads/win).
2. Abre el menú Inicio, escribe **PowerShell** y ábrelo. No necesitas abrirlo como administrador para descargar el proyecto.
3. Comprueba que Git esté disponible:

```powershell
git --version
```

Debes ver `git version` seguido de un número. Si no se reconoce el comando, cierra PowerShell y vuelve a abrirlo después de instalar Git.

Entra en tu carpeta personal:

```powershell
Set-Location $HOME
```

`Set-Location` cambia de carpeta. `$HOME` representa tu carpeta personal de Windows.

Si todavía no tienes el proyecto, descárgalo:

```powershell
git clone https://github.com/Kenzowo-dev/GYM_Proyect.git
```

Espera a que termine. Git crea la carpeta `GYM_Proyect` y coloca el código dentro. Entra en ella:

```powershell
Set-Location .\GYM_Proyect
```

Si ya tienes una copia, no ejecutes `git clone` otra vez. Abre su carpeta en el Explorador de archivos, haz clic en la barra de dirección, escribe `powershell` y pulsa **Enter**. Así abrirás PowerShell dentro de esa carpeta.

Comprueba dónde estás:

```powershell
Get-Location
```

Guarda esa ruta; la necesitarás al abrir otras pestañas. Comprueba también el contenido:

```powershell
Get-ChildItem
```

Debes ver `README.md`, `package.json` y `compose.yaml`. Si no aparecen, estás en otra carpeta. Corrige eso antes de continuar.

Todos los comandos del proyecto se ejecutan desde esta carpeta. Una pestaña nueva puede abrirse en otro lugar. En ese caso, usa `Set-Location` seguido de la ruta que guardaste entre comillas. Por ejemplo, **solo si esa es tu ruta**:

```powershell
Set-Location "C:\Users\Ana\GYM_Proyect"
```

### Sistema completo con Docker

En esta ruta, Docker ejecuta la página, el backend, PostgreSQL y Redis. No necesitas instalar Node.js, pnpm, PostgreSQL ni Memurai en Windows para seguirla.

#### Paso 1. Instala y abre Docker Desktop

Instala [Docker Desktop para Windows siguiendo su guía oficial](https://docs.docker.com/desktop/setup/install/windows-install/). Completa los requisitos que indique el instalador y reinicia Windows si te lo pide. Docker Desktop puede habilitar WSL como parte de su instalación; esta ruta no requiere que instales Redis manualmente en Ubuntu.

Abre Docker Desktop y espera a que su motor esté funcionando. Utiliza contenedores Linux y deja Docker Desktop abierto.

En PowerShell, dentro de la raíz del proyecto, ejecuta:

```powershell
docker --version
```

Debes ver la versión de Docker. Ahora comprueba Compose, la herramienta que inicia los componentes juntos:

```powershell
docker compose version
```

Debes ver la versión de Docker Compose. El proyecto requiere Compose v2 o compatible. Si no se reconoce alguno de los comandos, termina la instalación y abre una terminal nueva.

#### Paso 2. Crea tu configuración de Docker

Ejecuta:

```powershell
if (-not (Test-Path .env.docker)) { Copy-Item .env.docker.example .env.docker }
```

Este comando copia la plantilla **solo si tu archivo todavía no existe**. Así no reemplaza una configuración que ya habías preparado. Que termine sin mostrar texto es normal.

Comprueba que el archivo exista:

```powershell
Test-Path .env.docker
```

Debes ver `True`. El archivo contiene las credenciales y direcciones necesarias para las pruebas. Puedes conservar los valores de ejemplo mientras uses datos ficticios. No los uses para datos reales ni para producción.

#### Paso 3. Prepara y enciende todo el sistema

Ejecuta:

```powershell
docker compose --env-file .env.docker -f compose.yaml up -d --build
```

Este comando hace lo siguiente:

- `--env-file .env.docker` lee tu configuración.
- `-f compose.yaml` selecciona los componentes del sistema completo.
- `up` crea e inicia los contenedores.
- `--build` prepara las imágenes con el código actual. Una imagen contiene los archivos que Docker ejecutará.
- `-d` deja los componentes funcionando en segundo plano, aunque el comando termine.

La primera ejecución descarga componentes y puede tardar varios minutos. Espera a que PowerShell te permita escribir otro comando. Si la construcción termina con un error, no des por actualizado el sistema: puede seguir funcionando una versión anterior.

Cuando PostgreSQL tiene un almacenamiento nuevo, se crean las tablas y se cargan las cuentas de prueba automáticamente.

#### Paso 4. Comprueba que terminó de arrancar

Ejecuta:

```powershell
docker compose --env-file .env.docker -f compose.yaml ps
```

Debes ver ocho componentes: `postgres`, `redis`, los cuatro servicios del gimnasio, `api-gateway` y `frontend`. Sus estados deben indicar que están funcionando y saludables, normalmente `Up` y `healthy`.

Si ves `starting`, espera unos segundos y repite el mismo comando. Si ves `unhealthy` o `Exited`, consulta [Si algo no funciona](#si-algo-no-funciona).

#### Paso 5. Abre la página

Abre [http://localhost:5173](http://localhost:5173) en el navegador. Después sigue [Inicia sesión y comprueba el resultado](#inicia-sesión-y-comprueba-el-resultado).

Puedes cerrar PowerShell después del arranque porque Docker trabaja en segundo plano. Mantén Docker Desktop funcionando.

#### Paso 6. Detén el sistema al terminar

Abre PowerShell en la raíz y ejecuta:

```powershell
docker compose --env-file .env.docker -f compose.yaml down
```

`down` detiene y elimina los contenedores. Conserva los datos del gimnasio en los volúmenes, que son el almacenamiento de Docker. No añadas `-v` para una detención normal: esa opción borra los volúmenes.

#### La próxima vez que uses esta ruta

Abre Docker Desktop y espera a que esté listo. Abre PowerShell en la raíz. No vuelvas a descargar el proyecto ni a copiar la plantilla.

Enciende el sistema:

```powershell
docker compose --env-file .env.docker -f compose.yaml up -d --build
```

Comprueba los estados:

```powershell
docker compose --env-file .env.docker -f compose.yaml ps
```

Cuando estén saludables, abre [http://localhost:5173](http://localhost:5173). Usa este mismo arranque después de actualizar el código para preparar las imágenes actuales.

### Desarrollo en Windows sin Docker

En esta ruta, la página y el backend se ejecutan desde tus terminales de Windows. PostgreSQL y Memurai funcionan como servicios de Windows, es decir, programas que pueden seguir encendidos sin una terminal abierta.

Memurai sustituye al servidor Redis en esta ruta. No necesitas instalar Ubuntu ni WSL.

#### Paso 1. Prepara Node.js y pnpm

Completa [Prepara Node.js y pnpm para desarrollar](#prepara-nodejs-y-pnpm-para-desarrollar). Regresa aquí cuando tengas las dependencias instaladas y el código compartido compilado.

#### Paso 2. Instala PostgreSQL

Descarga PostgreSQL **17** desde los [instaladores oficiales de Windows](https://www.postgresql.org/download/windows/).

Durante la instalación:

1. Incluye el servidor, **pgAdmin** y las herramientas de línea de comandos.
2. Conserva el puerto `5432`.
3. Guarda la contraseña que eliges para el administrador `postgres`. La usarás en pgAdmin; no es la contraseña de las cuentas del gimnasio.
4. Termina la instalación antes de continuar.

Abre **pgAdmin** desde el menú Inicio. En el panel izquierdo, abre **Servers** y selecciona tu servidor PostgreSQL 17. Introduce la contraseña del administrador si te la pide.

Si el servidor no aparece, selecciona **Register > Server**. Escribe un nombre como `PostgreSQL local`. En **Connection**, utiliza `localhost`, puerto `5432`, base de mantenimiento `postgres`, usuario `postgres` y la contraseña del instalador. Guarda y conecta.

#### Paso 3. Crea el usuario y la base del gimnasio

En pgAdmin, abre **Databases**, selecciona la base `postgres` y abre **Tools > Query Tool**. Esta ventana sirve para ejecutar instrucciones SQL, el lenguaje de PostgreSQL.

Con autocommit activado, pega **solo** esta instrucción y pulsa el botón de ejecutar o **F5**:

```sql
CREATE ROLE gym_user WITH LOGIN PASSWORD 'gym_password';
```

Debes recibir un mensaje de ejecución correcta. Has creado el usuario que utilizará el backend.

Borra la instrucción del editor. Pega esta otra y ejecútala por separado:

```sql
CREATE DATABASE gym_db OWNER gym_user;
```

Debes recibir otro mensaje de ejecución correcta. Has creado la base `gym_db` y asignado su propiedad a `gym_user`. PostgreSQL explica estas instrucciones en [CREATE ROLE](https://www.postgresql.org/docs/17/sql-createrole.html) y [CREATE DATABASE](https://www.postgresql.org/docs/17/sql-createdatabase.html).

Si aparece que el usuario o la base ya existen, no los borres. Comprueba que pertenecen a tu entorno del proyecto y utiliza sus credenciales en la configuración local.

Todavía no hay tablas del gimnasio. Las prepararás con `db:init` más adelante. Ese comando necesita que la base y el usuario ya existan.

#### Paso 4. Instala e inicia Memurai

Descarga **Memurai Developer** desde la [página de Memurai](https://www.memurai.com/get-memurai). Utiliza Windows de 64 bits compatible con las herramientas; Memurai admite Windows 10 o posterior.

Ejecuta el instalador MSI y acepta la solicitud de permisos. Selecciona estas opciones:

1. Instalar como **servicio de Windows**.
2. Utilizar el puerto `6379`.
3. Añadir la carpeta de instalación al `PATH`, para poder ejecutar su cliente desde PowerShell.

Para conectarte desde esta misma computadora no necesitas añadir una excepción de acceso remoto al firewall. Conserva el servidor limitado al acceso local. La [guía oficial de instalación](https://docs.memurai.com/en/installation) describe las opciones del instalador.

Pulsa **Win+R**, escribe `services.msc` y pulsa **Enter**. Se abre **Servicios**. Busca Memurai y comprueba que indique **En ejecución**. Si está detenido, selecciónalo y pulsa **Iniciar**.

Abre una **nueva** ventana de PowerShell y ejecuta:

```powershell
memurai-cli -h 127.0.0.1 -p 6379 ping
```

Este comando pregunta si Memurai responde en tu computadora, en el puerto `6379`. Debes ver `PONG`.

Si no se reconoce `memurai-cli`, utiliza su ruta completa:

```powershell
& "C:\Program Files\Memurai\memurai-cli.exe" -h 127.0.0.1 -p 6379 ping
```

El símbolo `&` ejecuta el programa cuya ruta está entre comillas. Si elegiste otra carpeta en el instalador, cambia esa ruta.

Memurai Developer es gratuito para desarrollo y pruebas. No permite uso en producción y se detiene después de diez días de funcionamiento continuo. Si sucede, reinicia su servicio desde **Servicios**. Consulta las [condiciones de la edición Developer](https://www.memurai.com/faq).

La compatibilidad con Redis está documentada por Memurai. El arranque de este proyecto con Memurai todavía debe comprobarse en un equipo Windows mediante los pasos de verificación de esta guía.

#### Paso 5. Prepara la configuración local

Completa [Crea y revisa la configuración local](#crea-y-revisa-la-configuración-local). Utiliza `gym_db`, `gym_user` y `gym_password` si seguiste los ejemplos anteriores. Deja `REDIS_PASSWORD` vacío si Memurai no tiene contraseña.

Si antes usabas Docker para este proyecto, detén sus contenedores desde Docker Desktop. PostgreSQL y Memurai deben poder utilizar `5432` y `6379` sin otra instancia ocupándolos.

#### Paso 6. Crea las tablas y los datos de prueba

Desde PowerShell en la raíz, ejecuta:

```powershell
pnpm.cmd db:init
```

El comando se conecta a PostgreSQL, aplica las tablas y carga las cuentas y datos iniciales. Debe mostrar `Base de datos inicializada correctamente.` y terminar sin errores.

No lo ejecutes cada vez que arrancas la aplicación. Volver a ejecutarlo reaplica el esquema y los datos de prueba, y puede restablecer las cuentas demo. La base instalada en Windows es independiente de cualquier base que tengas en Docker.

#### Paso 7. Enciende la página y el backend

Completa [Inicia el código local en PowerShell](#inicia-el-código-local-en-powershell). Luego sigue [Inicia sesión y comprueba el resultado](#inicia-sesión-y-comprueba-el-resultado).

#### Paso 8. Detén el sistema al terminar

Pulsa **Ctrl+C** en cada una de las siete pestañas donde ejecutaste el código. Si Windows pregunta si deseas terminar el trabajo, confirma según las opciones que muestra.

PostgreSQL y Memurai siguen activos. Si quieres detenerlos, abre `services.msc`, selecciona el servicio correspondiente y pulsa **Detener**. Esto detiene el programa; no borra la base de datos.

#### La próxima vez que uses esta ruta

Abre `services.msc` y comprueba que PostgreSQL y Memurai estén **En ejecución**. Inícialos si están detenidos.

Abre PowerShell en la raíz y prepara el código compartido:

```powershell
pnpm.cmd --filter=@gym/shared build
```

Después repite [Inicia el código local en PowerShell](#inicia-el-código-local-en-powershell). No necesitas crear otra base ni ejecutar `db:init` otra vez. Si cambiaron las dependencias, ejecuta `pnpm.cmd install` antes de compilar.

### Desarrollo con almacenamiento en Docker

En esta ruta, tú ejecutas la página y el backend en Windows para editar el código. Docker ejecuta únicamente PostgreSQL y Redis. No necesitas instalar PostgreSQL ni Memurai en Windows.

#### Paso 1. Prepara las herramientas

Instala y abre Docker Desktop como indica el [paso 1 del sistema completo](#paso-1-instala-y-abre-docker-desktop). Después completa [Prepara Node.js y pnpm para desarrollar](#prepara-nodejs-y-pnpm-para-desarrollar).

Regresa aquí con Docker Desktop funcionando, las dependencias instaladas y PowerShell en la raíz del proyecto.

#### Paso 2. Prepara los dos archivos de configuración

Crea la configuración para los contenedores:

```powershell
if (-not (Test-Path .env.docker)) { Copy-Item .env.docker.example .env.docker }
```

La copia solo se realiza si el archivo no existe. Ahora completa [Crea y revisa la configuración local](#crea-y-revisa-la-configuración-local) para preparar `.env.local`.

Abre la configuración de Docker:

```powershell
notepad .env.docker
```

Comprueba que `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` y `REDIS_PASSWORD` coincidan en ambos archivos. Con las plantillas originales ya coinciden. Si cambiaste alguna credencial, utiliza el valor de la base existente; cambiar el archivo no cambia automáticamente la contraseña guardada en un volumen.

Guarda y cierra el Bloc de notas. `.env.docker` configura el almacenamiento en contenedores; `.env.local` indica al código de Windows cómo conectarse a él.

#### Paso 3. Libera los puertos de otras rutas

Si tenías código local ejecutándose, pulsa **Ctrl+C** en sus pestañas. Si instalaste PostgreSQL o Memurai en Windows, detén esos servicios desde `services.msc` antes de usar el almacenamiento de Docker.

Con Docker Desktop abierto, ejecuta:

```powershell
docker compose --env-file .env.docker -f compose.yaml down
```

Esto detiene la ejecución anterior del sistema en Docker y conserva sus volúmenes. Es necesario para que los contenedores del backend y del frontend no ocupen los mismos puertos que utilizará tu código local.

#### Paso 4. Enciende únicamente PostgreSQL y Redis

Ejecuta:

```powershell
docker compose --env-file .env.docker -f compose.yaml up -d postgres redis
```

Los nombres `postgres redis` indican que deben iniciarse solo esos dos componentes. `-d` los deja funcionando en segundo plano.

Comprueba su estado:

```powershell
docker compose --env-file .env.docker -f compose.yaml ps
```

Debes ver PostgreSQL y Redis funcionando y saludables. Si aún aparece `starting`, espera y repite el comando. No continúes si alguno está detenido o `unhealthy`.

#### Paso 5. Prepara los datos

Para preparar el esquema y las cuentas demo, ejecuta desde PowerShell en la raíz:

```powershell
pnpm.cmd db:init
```

Debes ver `Base de datos inicializada correctamente.`. En un volumen nuevo, Docker ya carga los datos iniciales; este comando vuelve a aplicar el esquema y el seed. Puede restablecer las cuentas demo. Si estás reutilizando una base preparada y quieres conservar esas cuentas tal como están, omite este paso.

#### Paso 6. Enciende el código local

Completa [Inicia el código local en PowerShell](#inicia-el-código-local-en-powershell). Son los mismos comandos que la ruta sin Docker: solo cambia dónde funcionan PostgreSQL y Redis.

Después sigue [Inicia sesión y comprueba el resultado](#inicia-sesión-y-comprueba-el-resultado). Deja Docker Desktop abierto y conserva las siete pestañas del código en ejecución.

#### Paso 7. Detén esta ruta

Primero pulsa **Ctrl+C** en cada una de las siete pestañas del código. Después, desde una pestaña disponible en la raíz, ejecuta:

```powershell
docker compose --env-file .env.docker -f compose.yaml down
```

Se detienen PostgreSQL y Redis. Los datos permanecen en los volúmenes.

#### La próxima vez que uses esta ruta

Abre Docker Desktop. Abre PowerShell en la raíz y enciende las bases:

```powershell
docker compose --env-file .env.docker -f compose.yaml up -d postgres redis
```

Comprueba que estén saludables:

```powershell
docker compose --env-file .env.docker -f compose.yaml ps
```

Prepara el código compartido:

```powershell
pnpm.cmd --filter=@gym/shared build
```

Repite [Inicia el código local en PowerShell](#inicia-el-código-local-en-powershell). No vuelvas a copiar los archivos ni a ejecutar `db:init` para un arranque normal. Si cambiaron las dependencias, ejecuta `pnpm.cmd install` antes de compilar.

### Prepara Node.js y pnpm para desarrollar

Este paso se utiliza en las dos rutas de desarrollo. La ruta del sistema completo con Docker no lo necesita.

Instala una versión actualizada de **Node.js 22.x** desde la [página oficial de Node.js](https://nodejs.org/en/download). Node.js ejecuta el código JavaScript del backend y las herramientas del frontend.

Abre una nueva ventana de PowerShell y comprueba:

```powershell
node --version
```

Debes ver una versión que empiece por `v22.`. Comprueba también npm, la herramienta incluida con Node.js:

```powershell
npm.cmd --version
```

Debes ver un número de versión. El sufijo `.cmd` permite ejecutar la herramienta sin depender de la política de scripts de PowerShell.

Instala la versión de pnpm fijada por este proyecto:

```powershell
npm.cmd install --global pnpm@11.24.0
```

pnpm descarga y organiza las bibliotecas que necesita el proyecto. `--global` instala la herramienta en tu equipo para poder utilizarla desde tus carpetas.

Cuando termine, comprueba:

```powershell
pnpm.cmd --version
```

Debes ver `11.24.0`. Si aparece un error de instalación o permisos, consulta la [guía oficial de pnpm](https://pnpm.io/installation); no continúes hasta poder consultar la versión.

Entra en la raíz del proyecto y descarga sus dependencias:

```powershell
pnpm.cmd install
```

Espera a que termine sin errores. Este comando prepara todas las partes del proyecto; no lo ejecutes por separado dentro de cada servicio.

Compila ahora el código compartido:

```powershell
pnpm.cmd --filter=@gym/shared build
```

`--filter=@gym/shared` selecciona únicamente el paquete compartido. `build` genera sus archivos ejecutables en `shared/dist`. El backend necesita esos archivos antes de arrancar.

Regresa al siguiente paso de la ruta que elegiste.

### Crea y revisa la configuración local

Este paso se utiliza en las dos rutas que ejecutan el código directamente en Windows. Abre PowerShell en la raíz del proyecto.

Crea tu archivo sin reemplazar uno existente:

```powershell
if (-not (Test-Path .env.local)) { Copy-Item .env.local.example .env.local }
```

`Test-Path` comprueba si existe el archivo. `Copy-Item` copia la plantilla cuando falta. Que no aparezca texto es normal.

Comprueba la copia:

```powershell
Test-Path .env.local
```

Debes ver `True`. Abre el archivo:

```powershell
notepad .env.local
```

Debes ver los ajustes de la plantilla. El comentario inicial menciona Docker, pero las conexiones a `localhost` sirven también para PostgreSQL y Memurai instalados en Windows.

Comprueba estas líneas. **Este bloque es contenido del archivo, no un comando para PowerShell.** No reemplaces el archivo completo con él: conserva las demás líneas de la plantilla.

```dotenv
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=gym_db
POSTGRES_USER=gym_user
POSTGRES_PASSWORD=gym_password
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
CORS_ORIGIN=http://localhost:5173
AUTH_SERVICE_URL=http://localhost:3001
CLIENT_SERVICE_URL=http://localhost:3002
MEMBERSHIP_SERVICE_URL=http://localhost:3003
PAYMENT_SERVICE_URL=http://localhost:3004
```

| Ajuste | Qué debes comprobar |
|---|---|
| `POSTGRES_HOST` y `REDIS_HOST` | `localhost` porque el código se conecta desde Windows. No escribas los nombres internos `postgres` o `redis` de Docker. |
| `POSTGRES_DB`, `POSTGRES_USER` y `POSTGRES_PASSWORD` | Deben coincidir con la base y el usuario que preparaste, o con `.env.docker` si elegiste almacenamiento en Docker. |
| `REDIS_PASSWORD` | Déjalo vacío si el servidor no tiene contraseña. Si tiene una, escribe la misma aquí. |
| `CORS_ORIGIN` | Conserva `http://localhost:5173`. Autoriza al navegador a conectar esa página con el backend. |
| Las cuatro variables `*_SERVICE_URL` | Conserva las direcciones y puertos indicados para cada servicio local. |

Conserva también `JWT_SECRET`, que debe tener al menos 32 caracteres. Esa clave firma las credenciales de sesión. La plantilla contiene un valor para pruebas; utiliza secretos propios antes de manejar datos reales.

Pulsa **Ctrl+S** para guardar y cierra el Bloc de notas. Regresa a tu ruta.

El backend lee `.env.local` antes que `.env`. Si una variable ya está definida en la terminal, ese valor tiene prioridad. Reinicia los procesos cuando cambies la configuración.

El frontend usa `http://localhost:3000` por defecto. No necesitas crear otro archivo para esta guía. Si en el futuro cambias la dirección de la API, abre:

```powershell
notepad frontend/.env.local
```

Acepta crear el archivo si no existe y añade esta línea, sustituyendo la URL por la de tu API:

```dotenv
VITE_API_URL=http://localhost:3000
```

Guarda y reinicia el frontend. Vite lee este archivo dentro de `frontend`, no el `.env.local` de la raíz.

### Inicia el código local en PowerShell

Este paso sirve para las dos rutas de desarrollo. Antes de comenzar, PostgreSQL y Redis o Memurai deben estar encendidos, `.env.local` debe estar preparado y `shared/dist` debe existir.

En Windows, no uses directamente `pnpm dev` desde PowerShell: el script raíz contiene asignaciones como `PORT=3001` que la shell predeterminada de Windows no interpreta. Los siguientes comandos ejecutan los mismos componentes por separado.

Abre siete pestañas de PowerShell en Windows Terminal o en la terminal de VS Code. También puedes utilizar siete ventanas. En **cada pestaña**, entra en la raíz usando la ruta que guardaste y comprueba con `Get-Location` que sea la correcta.

Ejecuta los siguientes bloques en orden. Utiliza **una pestaña diferente por bloque**. Déjala abierta y pasa a la siguiente cuando el programa indique que está escuchando o esperando cambios. Estos comandos siguen activos; no esperes que terminen para abrir otra pestaña.

#### Pestaña 1. Código compartido

```powershell
pnpm.cmd --filter=@gym/shared dev
```

Esta pestaña observa el código compartido y lo recompila al editarlo. Debes ver un mensaje de compilación y espera de cambios. Si hay errores de TypeScript, corrígelos antes de continuar.

#### Pestaña 2. Autenticación

```powershell
$env:PORT='3001'
pnpm.cmd --filter=auth-service dev
```

La primera línea asigna el puerto solo a esta pestaña. La segunda inicia el servicio que gestiona las cuentas y las sesiones. Espera que sus registros indiquen que escucha en `3001`.

#### Pestaña 3. Clientes

```powershell
$env:PORT='3002'
pnpm.cmd --filter=client-service dev
```

Este servicio trabaja con los datos de clientes. Espera que escuche en `3002`.

#### Pestaña 4. Membresías

```powershell
$env:PORT='3003'
pnpm.cmd --filter=membership-service dev
```

Este servicio trabaja con planes, membresías y visitas. Espera que escuche en `3003`.

#### Pestaña 5. Pagos

```powershell
$env:PORT='3004'
pnpm.cmd --filter=payment-service dev
```

Este servicio trabaja con los registros de pagos. Espera que escuche en `3004`.

#### Pestaña 6. Gateway

```powershell
$env:PORT='3000'
pnpm.cmd --filter=api-gateway dev
```

El gateway recibe las solicitudes de la página y las envía a los cuatro servicios anteriores. Espera que escuche en `3000`.

#### Pestaña 7. Frontend

```powershell
pnpm.cmd --filter=frontend dev --port 5173 --strictPort
```

Este comando inicia la página con Vite. Debes ver una dirección local con el puerto `5173`. `--strictPort` hace que falle si ese puerto está ocupado, en lugar de elegir otro que no coincida con la configuración.

La página se actualiza al editar su código. Los servicios del backend se reinician al detectar cambios en sus archivos de código. Los mensajes de cada componente aparecen en su propia pestaña.

#### Comprueba que el backend responde

Abre otra pestaña de PowerShell y ejecuta:

```powershell
Invoke-RestMethod http://localhost:3000/health | ConvertTo-Json -Depth 5
```

`Invoke-RestMethod` consulta la dirección de estado del gateway. `ConvertTo-Json` muestra su respuesta como texto organizado. Debes ver `"status": "healthy"` y los cuatro servicios saludables.

Si devuelve `degraded` o un error, revisa las pestañas del backend antes de intentar iniciar sesión. Cuando esté saludable, abre [http://localhost:5173](http://localhost:5173) y sigue el apartado siguiente.

### Inicia sesión y comprueba el resultado

Este paso es igual para las tres rutas.

1. Abre tu navegador.
2. Escribe `http://localhost:5173` en la barra de direcciones y pulsa **Enter**.
3. Abre la opción de inicio de sesión.
4. Elige una cuenta de la tabla y escribe su correo.
5. Escribe la contraseña `Admin1234!` y confirma el inicio de sesión. Respeta la mayúscula inicial y el signo `!`.

| Quiero comprobar | Correo | Qué debo poder abrir |
|---|---|---|
| Administración | `admin@mundofitness.com` | Panel general y Configuración. |
| Recepción | `recepcion@mundofitness.com` | Clientes, membresías, planes y pagos. |
| Portal del socio | `socio@mundofitness.com` | Información personal y de su membresía. |

Si puedes entrar y navegar por las opciones de tu rol, completaste el arranque. Para probar otro rol, cierra la sesión actual y entra con otra cuenta.

Los cambios que confirmas se guardan en la base local de la ruta elegida. El sistema registra pagos manuales; no realiza cobros electrónicos. Las cuentas y contraseñas de ejemplo son únicamente para pruebas.

### Si algo no funciona

No borres la base ni los volúmenes para intentar corregir un error de arranque. Primero revisa el mensaje que aparece y el componente que falla.

| Lo que ves | Qué hacer |
|---|---|
| No se reconoce `git`, `docker`, `node` o `pnpm.cmd` | Instala la herramienta correspondiente, abre una terminal nueva y vuelve a comprobar su versión. |
| PowerShell bloquea `pnpm.ps1` o `npm.ps1` | Usa `pnpm.cmd` y `npm.cmd`, como en esta guía. |
| No encuentra `compose.yaml` o `package.json` | Ejecuta `Get-Location` y `Get-ChildItem`. Entra en la raíz del proyecto antes de repetir el comando. |
| Docker no conecta con el motor o daemon | Abre Docker Desktop y espera a que su motor funcione. |
| Docker muestra `unhealthy` o `Exited` | Consulta los registros con el comando que aparece debajo de esta tabla. |
| Falla la descarga o la construcción | Revisa el mensaje de red, certificados o dependencias. No continúes hasta que termine sin errores; una imagen anterior puede seguir activa. |
| Aparece `port is already allocated`, `EADDRINUSE` o puerto ocupado | Detén la instancia anterior. Si usas bases en Docker, detén PostgreSQL y Memurai de Windows; si usas bases en Windows, detén los contenedores anteriores. |
| `PORT` no se reconoce | Sigue los bloques por pestaña de [Inicia el código local en PowerShell](#inicia-el-código-local-en-powershell). |
| PostgreSQL devuelve `ECONNREFUSED` | Comprueba que PostgreSQL esté encendido en Servicios o que su contenedor esté saludable, según tu ruta. |
| PostgreSQL rechaza la contraseña | Revisa `POSTGRES_PASSWORD` en `.env.local` y las credenciales reales de la base. Editar `.env.docker` no cambia una contraseña de un volumen existente. |
| Falta el usuario o la base de PostgreSQL | En la ruta sin Docker, completa su paso 3. `db:init` no crea la base ni el usuario. |
| Redis devuelve `ECONNREFUSED` | Comprueba el servicio Memurai o el contenedor Redis, según tu ruta. Memurai Developer necesita reiniciarse tras diez días de funcionamiento continuo. |
| No se reconoce `memurai-cli` | Abre una terminal nueva o utiliza la ruta completa del ejecutable indicada en la instalación de Memurai. |
| Falta `@gym/shared/dist` | Ejecuta `pnpm.cmd --filter=@gym/shared build` desde la raíz antes de arrancar el backend local. |
| El gateway devuelve `degraded` | Revisa los cuatro servicios y sus puertos. Comprueba las variables `*_SERVICE_URL` en `.env.local`. |
| La página aparece pero no conecta a la API | Comprueba el gateway en `3000`, la página en `5173`, `CORS_ORIGIN` y cualquier archivo `frontend/.env.local` que hayas creado. |
| Aparece una interfaz anterior en la ruta Docker completa | Repite su arranque con `up -d --build`, espera una construcción correcta y recarga `http://localhost:5173/`. |
| No puedes entrar con una cuenta demo | Comprueba correo y contraseña. Si faltan los datos, utiliza `db:init` con la configuración local de la base correcta; recuerda que reaplica datos y cuentas demo. |

En las rutas con Docker, consulta los últimos mensajes desde PowerShell en la raíz:

```powershell
docker compose --env-file .env.docker -f compose.yaml logs --tail=100
```

Este comando muestra los registros de los contenedores. Para consultar únicamente PostgreSQL:

```powershell
docker compose --env-file .env.docker -f compose.yaml logs --tail=100 postgres
```

En las rutas de desarrollo, consulta además la pestaña del componente que falla. Los registros del código local no aparecen en `docker compose logs`.

### Comprueba tu código antes de compartir cambios

Si instalaste Node.js y pnpm, puedes ejecutar estos comandos desde la raíz. Espera a que cada uno termine antes de pasar al siguiente.

Revisa las reglas de código:

```powershell
pnpm.cmd lint
```

Comprueba los tipos y la compilación:

```powershell
pnpm.cmd build
```

Ejecuta las pruebas unitarias:

```powershell
pnpm.cmd test:unit
```

Los tres comandos deben terminar sin errores. No necesitan Docker. `pnpm.cmd test` también ejecuta pruebas de integración que crean contenedores temporales y sí requieren Docker. El lanzador `pnpm.cmd test:e2e` comprueba que el sistema completo esté saludable en Docker; no sirve directamente para las dos rutas con código local.

### Borra los datos de Docker solo si quieres empezar de cero

Este paso es opcional y **elimina los datos de los volúmenes del proyecto**, incluidos los socios, las membresías y los pagos que hayas registrado. No lo utilices para una detención normal. No afecta a la base PostgreSQL instalada como servicio de Windows.

Si quieres empezar de cero en la ruta del sistema completo con Docker, ejecuta desde la raíz:

```powershell
docker compose --env-file .env.docker -f compose.yaml down -v
```

`-v` borra los volúmenes. Después enciende de nuevo el sistema:

```powershell
docker compose --env-file .env.docker -f compose.yaml up -d --build
```

PostgreSQL crea el almacenamiento y carga otra vez los datos de prueba. Comprueba los estados con:

```powershell
docker compose --env-file .env.docker -f compose.yaml ps
```

Espera a que estén saludables antes de abrir la página.

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
docker compose --env-file .env.docker -f compose.yaml build
docker compose --env-file .env.docker -f compose.yaml up -d --build

# Consulta los registros
docker compose --env-file .env.docker -f compose.yaml logs -f

# Detén los servicios
docker compose --env-file .env.docker -f compose.yaml down
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
docker compose --env-file .env.docker -f compose.yaml logs -f

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
