# Guía de Configuración de Red Docker

## Arquitectura de Red

Este proyecto utiliza una red Docker personalizada llamada `scrapingweb_network` que conecta todos los servicios:

```
┌─────────────────────────────────────────────────┐
│         scrapingweb_network (bridge)            │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐    │
│  │ Frontend │  │ Backend  │  │ Database  │    │
│  │  :3000   │◄─┤  :8000   │◄─┤  :5432    │    │
│  └──────────┘  └──────────┘  └───────────┘    │
│                     │                           │
│                     ▼                           │
│                ┌──────────┐                     │
│                │  Redis   │                     │
│                │  :6379   │                     │
│                └──────────┘                     │
│                     │                           │
│         ┌───────────┴───────────┐              │
│         ▼                       ▼              │
│  ┌──────────────┐      ┌──────────────┐       │
│  │ Celery Worker│      │ Celery Beat  │       │
│  └──────────────┘      └──────────────┘       │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Servicios Disponibles

### Backend (FastAPI)
- **Puerto**: 8000
- **URL interna**: `http://backend:8000`
- **URL externa**: `http://localhost:8000`
- **Descripción**: API REST para gestión de hoteles y scraping

### Frontend (Next.js)
- **Puerto**: 3000
- **URL externa**: `http://localhost:3000`
- **Descripción**: Interfaz de usuario web

### Base de Datos (PostgreSQL)
- **Puerto**: 5432
- **URL interna**: `postgresql://postgres:postgres@db:5432/scrapingweb`
- **Descripción**: Base de datos principal

### Redis
- **Puerto**: 6379
- **URL interna**: `redis://redis:6379/0`
- **Descripción**: Cache y cola de mensajes para Celery

### PgAdmin (Opcional)
- **Puerto**: 5050
- **URL externa**: `http://localhost:5050`
- **Descripción**: Herramienta de administración de PostgreSQL
  - Email: admin@scrapingweb.com
  - Password: admin

## Instrucciones de Uso

### 1. Configuración Inicial

Copia el archivo de variables de entorno:
```bash
cp .env.example .env
```

Edita el archivo `.env` según tus necesidades:
```bash
# También copia el .env en el backend si es necesario
cp .env backend/.env
```

### 2. Levantar todos los servicios

Desde la raíz del proyecto:
```bash
docker-compose up -d
```

Este comando levantará:
- Base de datos PostgreSQL
- Redis
- Backend FastAPI
- Celery Worker
- Celery Beat
- Frontend Next.js
- PgAdmin

### 3. Ver logs de los servicios

Ver todos los logs:
```bash
docker-compose logs -f
```

Ver logs de un servicio específico:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 4. Detener los servicios

```bash
docker-compose down
```

Para eliminar también los volúmenes (base de datos):
```bash
docker-compose down -v
```

### 5. Reconstruir los servicios

Si realizas cambios en el código:
```bash
docker-compose up -d --build
```

## Comunicación entre Servicios

### Desde el Frontend al Backend

El frontend puede comunicarse con el backend usando:
- **Desde el navegador (client-side)**: `http://localhost:8000`
- **Desde Next.js (server-side)**: `http://backend:8000`

Configurar en el frontend:
```typescript
// Para llamadas desde el cliente
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Para llamadas desde el servidor Next.js
const API_URL_INTERNAL = process.env.API_URL_INTERNAL || 'http://backend:8000';
```

### Desde el Backend a la Base de Datos

El backend se conecta a PostgreSQL usando:
```python
DATABASE_URL = "postgresql://postgres:postgres@db:5432/scrapingweb"
```

### Desde Celery a Redis

Los workers de Celery se conectan a Redis usando:
```python
REDIS_URL = "redis://redis:6379/0"
```

## Comandos Útiles

### Verificar el estado de los servicios
```bash
docker-compose ps
```

### Ejecutar comandos en un contenedor
```bash
# Backend: Ejecutar migraciones
docker-compose exec backend alembic upgrade head

# Backend: Crear un superusuario
docker-compose exec backend python -m app.seeds.initial_data

# Frontend: Instalar dependencias
docker-compose exec frontend npm install
```

### Acceder a la base de datos
```bash
docker-compose exec db psql -U postgres -d scrapingweb
```

### Limpiar todo y empezar de cero
```bash
docker-compose down -v
docker-compose up -d --build
```

## Resolución de Problemas

### El frontend no puede conectarse al backend
- Verifica que `NEXT_PUBLIC_API_URL` apunte a `http://localhost:8000`
- Verifica que el backend esté corriendo: `docker-compose ps backend`
- Revisa los logs: `docker-compose logs backend`

### Errores de conexión a la base de datos
- Verifica que PostgreSQL esté corriendo: `docker-compose ps db`
- Espera a que el healthcheck pase (puede tomar unos segundos)
- Verifica las credenciales en el archivo `.env`

### Celery no procesa tareas
- Verifica que Redis esté corriendo: `docker-compose ps redis`
- Verifica los logs del worker: `docker-compose logs celery_worker`
- Verifica que el backend esté conectado a Redis

### Puertos ya en uso
Si recibes errores de que los puertos ya están en uso:
```bash
# Cambiar los puertos en el archivo .env
POSTGRES_PORT=5433  # en lugar de 5432
# O detener otros servicios que usan esos puertos
```

## Red Personalizada

La red `scrapingweb_network` permite:
- ✅ Comunicación entre todos los contenedores por nombre
- ✅ Aislamiento de otros proyectos Docker
- ✅ Resolución DNS automática
- ✅ Fácil escalabilidad

Para conectar otros servicios a esta red:
```yaml
networks:
  - scrapingweb_network

networks:
  scrapingweb_network:
    external: true
```
