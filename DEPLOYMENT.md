# Despliegue independiente en el VPS

Este stack publica **un solo puerto** del host: el frontend Nginx en `8095` por defecto.
El backend FastAPI y PostgreSQL no publican puertos y solo son accesibles dentro de la
red privada de Docker. Nginx entrega React y reenvia `/api/*` al backend.

## 1. DNS de `scrapingweb.site`

En el panel mostrado, configura:

| Tipo | Nombre | Contenido | TTL |
|---|---|---|---|
| A | `@` | `179.197.239.216` | 300 |
| CNAME | `www` | `scrapingweb.site` | 300 |

Reemplaza el registro `A` actual de `@` que apunta a `2.57.91.91`. No crees el
registro `api`: la API se consume en el mismo origen mediante `/api`.

DNS no permite indicar un puerto. Como los puertos estandar `80` y `443` ya estan
ocupados por otro stack del VPS y este despliegue no los comparte, la URL sera:

- Aplicacion: `http://scrapingweb.site:8095`
- API: `http://scrapingweb.site:8095/api/v1/...`

## 2. Preparar el VPS

Comprueba que el puerto elegido no esta ocupado por Docker ni por otro proceso:

```bash
ss -lntp | grep ':8095 ' || echo 'Puerto 8095 disponible'
```

Permite el puerto en el firewall, si UFW esta activo:

```bash
ufw allow 8095/tcp
ufw status
```

Clona o copia el proyecto a una carpeta propia, por ejemplo:

```bash
mkdir -p /opt/scrapingweb
cd /opt/scrapingweb
git clone <URL_DEL_REPOSITORIO> .
```

## 3. Variables y secretos

```bash
cp .env.production.example .env.production
openssl rand -base64 48
openssl rand -base64 64
nano .env.production
```

Usa el primer valor aleatorio para `POSTGRES_PASSWORD`, el segundo para
`JWT_SECRET_KEY`, y define credenciales fuertes para el administrador inicial.
No subas `.env.production` al repositorio.

Si cambias `FRONTEND_PORT`, actualiza ese mismo puerto en
`BACKEND_CORS_ORIGINS`, en el firewall y en las URLs de acceso.

## 4. Construir y arrancar

Desde `/opt/scrapingweb`:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml config
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

La salida de `docker compose ps` debe mostrar `db`, `backend` y `frontend` como
`healthy`. Solo `frontend` debe mostrar un mapeo de puerto del host.

## 5. Verificar

```bash
curl -I http://127.0.0.1:8095/
curl http://127.0.0.1:8095/healthz
curl http://127.0.0.1:8095/api/v1/scrapping/status
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=100
```

Tras propagarse DNS:

```bash
curl -I http://scrapingweb.site:8095/
```

## 6. Actualizar o respaldar

Para desplegar cambios:

```bash
git pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Para respaldar PostgreSQL sin publicar su puerto:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T db \
  pg_dump -U scrapingweb scrapingweb > scrapingweb-backup.sql
```

## HTTPS sin compartir `80/443`

Un certificado no resuelve el conflicto de puertos: aunque Nginx escuche dentro de
su contenedor, Docker no puede publicar `80/443` porque ya estan ocupados. Para usar
`https://scrapingweb.site` sin `:puerto`, hace falta una de estas opciones:

1. que el gateway que ya posee `80/443` enrute este dominio al frontend;
2. asignar otra IP publica al VPS; o
3. usar un tunel/proxy externo, por ejemplo Cloudflare Tunnel.

Todas ellas cambian la condicion de independencia indicada para este despliegue.
