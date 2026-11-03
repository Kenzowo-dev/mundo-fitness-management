# Despliegue en el servidor casero

> Esta guía describe el despliegue inicial con Docker Compose y Nginx Proxy Manager. Para la migración y los siguientes despliegues, sigue [DEPLOY_DOKPLOY.md](DEPLOY_DOKPLOY.md). No ejecutes ambos métodos al mismo tiempo.

Destino previsto: Debian 13, 3.3 GiB de RAM, Docker Compose, Nginx Proxy Manager (`homelab-proxy`), Cloudflare Tunnel y `https://gym.kenzowo.dev`.
El stack completo se desplegó en Debian 13 el 19 de octubre de 2026. Los ocho contenedores están saludables. Probé el registro, el inicio de sesión y una ruta protegida desde la web por la red local. `gym.kenzowo.dev` aún no está publicado: Nginx Proxy Manager muestra su página predeterminada y la ruta del túnel todavía no aparece en Cloudflare.

## Antes de abrir la web al público

1. El servidor ya usa `cloudflared` como servicio y Nginx Proxy Manager escucha en `127.0.0.1:80`. Confirmaste que **`gym.kenzowo.dev` no aparece** en las rutas del túnel. El nombre ya resuelve a direcciones de Cloudflare, pero eso no publica la aplicación. Deja la publicación para el paso 6. No abras 80 ni 443 en el router. La IP cambiante de tu casa no necesita actualización DNS para este acceso por túnel. [Guía de rutas publicadas de Cloudflare](https://developers.cloudflare.com/cloudflare-one/networks/routes/add-routes/).
2. En la carpeta del proyecto en el servidor, crea `.env.production`:

   ```bash
   cp .env.production.example .env.production
   chmod 600 .env.production
   openssl rand -hex 32
   openssl rand -hex 32
   openssl rand -hex 32
   ```

   Copia cada resultado a `POSTGRES_PASSWORD`, `REDIS_PASSWORD` y `JWT_SECRET`, en ese orden. Edita `.env.production` con tu editor. No pegues los secretos en el chat ni los guardes en Git.

3. Comprueba la configuración y crea los contenedores. Estos comandos afectan solo a este proyecto Docker y a sus volúmenes:

   ```bash
   docker compose --env-file .env.production -f compose.yaml -f compose.home.yaml config --quiet
   docker compose --env-file .env.production -f compose.yaml -f compose.home.yaml build auth-service
   docker compose --env-file .env.production -f compose.yaml -f compose.home.yaml build client-service
   docker compose --env-file .env.production -f compose.yaml -f compose.home.yaml build membership-service
   docker compose --env-file .env.production -f compose.yaml -f compose.home.yaml build payment-service
   docker compose --env-file .env.production -f compose.yaml -f compose.home.yaml build api-gateway
   docker compose --env-file .env.production -f compose.yaml -f compose.home.yaml build frontend
   docker compose --env-file .env.production -f compose.yaml -f compose.home.yaml up -d
   docker compose --env-file .env.production -f compose.yaml -f compose.home.yaml ps
   curl -fsS http://127.0.0.1:3000/health
   curl -fsSI http://127.0.0.1:5173/
   ```

   Ejecuta cada orden de compilación por separado y espera a que termine antes de iniciar la siguiente. `--parallel 1` no limitó las compilaciones cuando Compose las lanzó juntas. Los ocho servicios deben aparecer como `healthy`. `compose.home.yaml` conecta la web y la API a la red `homelab-proxy`, que ya existe en el servidor. La base nueva carga `seed.production.sql`, que solo crea roles. No crea cuentas de prueba.

4. Antes de activar el sitio público, crea tu cuenta desde un túnel SSH en tu computadora:

   ```bash
   ssh -L 5173:127.0.0.1:5173 kenzo@192.168.1.200
   ```

   Abre `http://localhost:5173/registro`, registra tu correo y vuelve a iniciar sesión después del siguiente paso. En el servidor, abre PostgreSQL:

   ```bash
   docker compose --env-file .env.production -f compose.yaml -f compose.home.yaml exec postgres psql -U gym_user -d gym_db
   ```

   Dentro de `psql`, cambia el correo por el que acabas de registrar:

   ```sql
   UPDATE users SET role = 'admin', updated_at = NOW()
   WHERE email = 'tu-correo@ejemplo.com' AND role = 'member'
   RETURNING id, email, role;
   ```

   Comprueba que devuelve **una** fila. Escribe `\q` para salir. Cierra el túnel y entra de nuevo para recibir un token con el nuevo rol. No promociones una cuenta que no acabas de crear tú.

5. En Nginx Proxy Manager, entra por `http://192.168.1.200:81` desde tu red local. En **Hosts → Proxy Hosts**, crea `gym.kenzowo.dev` con esquema `http`, destino `frontend` y puerto `5173`. En **Custom Locations**, añade `/api/` con esquema `http`, destino `api-gateway` y puerto `3000`. La red externa `homelab-proxy` ya une esos dos servicios con Nginx Proxy Manager. PostgreSQL y Redis quedan fuera de esa red. No uses `127.0.0.1` como destino: dentro del contenedor apuntaría al propio Nginx Proxy Manager.

   En este servidor, HTTPS termina en Cloudflare y el túnel entrega HTTP por el puerto 80 local. No necesitas publicar el puerto 443 ni pedir un certificado en Nginx Proxy Manager para esta ruta. No actives **Force SSL** en Nginx Proxy Manager si genera un bucle de redirección; fuerza HTTPS en Cloudflare. El modo **Full (strict)** de la zona no valida este tramo HTTP local del túnel. [Protocolos admitidos por Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/protocols/).

   Antes de usarlo con varias personas, comprueba qué IP recibe la API en solicitudes de dos clientes distintos. Nginx Proxy Manager confía en `X-Real-IP` desde redes Docker privadas y reenvía `X-Forwarded-For`; sin una prueba real no puedo afirmar que el límite de peticiones distingue visitantes. No abras los puertos 3000–3004, 5173, 5432 ni 6379 en el router.

6. Cuando el administrador y el host de Nginx Proxy Manager funcionen desde la red local, publica `gym.kenzowo.dev` en la sección **Routes** del túnel como **Published application** con **Service URL** `http://localhost:80`. Si Cloudflare indica que ya existe un registro DNS para `gym`, revisa ese registro antes de cambiarlo; la ruta nueva debe quedar asociada al túnel. No crees un registro `A` hacia tu casa. Después haz la comprobación final desde otra red.

## Límites antes de usar datos reales

- El enlace de recuperación de contraseña está oculto en producción porque no existe un proveedor de correo. La recuperación requiere ayuda manual del administrador.
- El registro guarda la cuenta y la ficha del socio en una misma transacción de PostgreSQL. Si ya existe una ficha con ese correo, no crea la cuenta: el administrador debe revisar la unión manualmente. El registro no verifica que la persona controle el correo que escribe.
- Borrar un cliente también borra sus pagos y facturas por las reglas actuales de PostgreSQL. La ruta de borrado queda desactivada en producción; cambia su estado a `inactive` para retirarlo de uso.
- El pago y la activación de la membresía se guardan en una misma transacción de PostgreSQL. El registro hace lo mismo con la cuenta y la ficha del socio.
- `pnpm audit --prod` ya no reporta vulnerabilidades. Se quitó `http-proxy-middleware`, que añadía `braces`, y la imagen activa del gateway no contiene ninguno de esos paquetes. `pnpm audit` completo aún muestra alertas en dependencias de desarrollo; no forman parte de la imagen de producción.
- No hay copia de seguridad fuera del disco del servidor. Kenzo acepta este riesgo por ahora; no se ha probado una restauración.
- Los cambios de `seed.production.sql` solo se aplican al crear un volumen PostgreSQL vacío. No uses `docker compose down -v` con datos que quieras conservar.
- El archivo de CI contiene pasos de despliegue vacíos. La actualización del servidor es manual.

## Comprobación final

Desde otra red, abre `https://gym.kenzowo.dev`. Comprueba el candado HTTPS, el registro, el inicio de sesión, la vista de administrador y una llamada a `/api/` sin errores. Revisa que PostgreSQL y Redis no respondan desde Internet. Guarda la fecha, versión y resultado de esta prueba antes de ingresar datos reales.
