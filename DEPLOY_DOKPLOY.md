# Despliegue con Dokploy

Dokploy administra el despliegue y Traefik recibe el tráfico web. Nginx Proxy Manager queda disponible para sitios externos a Dokploy, como el panel web de un NAS.

## Instalar Dokploy

El instalador oficial exige libres los puertos 80, 443 y 3000. En este servidor, Nginx Proxy Manager usa el 80 y la API del gimnasio usa el 3000. Haz el cambio en este orden:

1. En `/home/kenzo/homelab/infrastructure/proxy/compose.yml`, cambia `127.0.0.1:80:80` por `127.0.0.1:8080:80`. Mantén `192.168.1.200:81:81` y los dos volúmenes actuales. Aplica el cambio con `docker compose up -d` en esa carpeta.
2. En `.env.production` del proyecto actual, añade `API_GATEWAY_HOST_PORT=13000`.
3. Detén el Compose anterior con el comando de abajo. Esto conserva PostgreSQL y Redis. **No agregues `-v`.**
4. Instala Dokploy con `curl -sSL https://dokploy.com/install.sh | sudo sh`. El instalador activa Docker Swarm. Este servidor no tenía Swarm activo.

```bash
cd /home/kenzo/homelab/projects/gym
docker compose --env-file .env.production -f compose.yaml -f compose.home.yaml down
```

La web tendrá una pausa hasta que termine el primer despliegue. El puerto 80 queda para Traefik de Dokploy; Nginx Proxy Manager sigue disponible en el puerto 8080 y su panel sigue en el 81.

## Proyecto en Dokploy

- Tipo: **Docker Compose**. No selecciones **Stack**.
- Repositorio: `https://github.com/Kenzowo-dev/mundo-fitness-management.git`
- Rama: `feature/mundo-fitness-ui-redesign`
- Ruta del archivo Compose: `./compose.yaml`
- Dominio: `gym.kenzowo.dev`, servicio `frontend`, puerto `5173`.
- Desactiva HTTPS y Let's Encrypt en Dokploy. Cloudflare termina HTTPS.
- En Cloudflare Tunnel, el servicio de esta ruta debe ser `http://localhost:80`.

## Variables de entorno

Agrega en **Environment**:

```dotenv
NODE_ENV=production
DB_SEED_FILE=seed.production.sql
POSTGRES_DB=gym_db
POSTGRES_USER=gym_user
POSTGRES_PASSWORD=<el valor actual del servidor>
REDIS_PASSWORD=<el valor actual del servidor>
JWT_SECRET=<el valor actual del servidor>
API_GATEWAY_HOST_PORT=13000
CORS_ORIGIN=https://gym.kenzowo.dev
```

No escribas los secretos en Git. Copia los tres valores secretos del archivo `.env.production` actual del servidor a Dokploy.

## Datos existentes

PostgreSQL y Redis usan los volúmenes `gym_postgres_data` y `gym_redis_data`. El Compose conserva esos nombres para que Dokploy use los datos actuales. No borres esos volúmenes ni uses `docker compose down -v`.

El Dockerfile de PostgreSQL incluye los archivos de inicio dentro de la imagen. Dokploy limpia su copia del repositorio entre despliegues; la base no depende de rutas del repositorio mientras está activa.

## Corte de Nginx Proxy Manager

La API escucha dentro de Docker en el puerto `3000` y se publica en el servidor en `13000`, para dejar libre el puerto del panel de Dokploy. No publiques el panel de Dokploy en Internet; accede por la red local o protégelo con Cloudflare Access.
