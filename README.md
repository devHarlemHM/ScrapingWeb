# ScrapingWeb - Documentacion Tecnica

## 1. Resumen

ScrapingWeb es una plataforma full-stack para:

- Extraccion de resenas hoteleras desde Google, Booking y Airbnb.
- Versionado de datos por corrida de scraping (`scrape_run_id`).
- Analitica de hoteles y dashboard de negocio.
- Administracion de catalogos (plataformas, sentimientos, corridas) y usuarios.

El sistema esta dividido en:

- Backend API: FastAPI + SQLAlchemy + PostgreSQL.
- Frontend SPA: React + Vite.
- Orquestacion de infraestructura: Docker Compose (backend, frontend, DB, pgAdmin).

## 2. Arquitectura General

### 2.1 Componentes

- `db` (PostgreSQL 16): almacenamiento principal.
- `backend` (FastAPI): API REST, logica de negocio, scheduler y pipeline de scraping.
- `frontend` (React + Nginx): interfaz de usuario y proxy `/api` hacia backend.
- `pgadmin`: administracion visual de la base de datos.

### 2.2 Flujo de alto nivel

1. El scheduler (APScheduler) dispara corridas de scraping.
2. Se ejecutan scripts de scraping en `backend/app/scrapping/scripts`.
3. Los JSON resultantes se normalizan y migran a tablas relacionales.
4. Se crea un `scrape_run` con estado (`running/completed/failed`) y resumen.
5. Las consultas API usan `scrape_run_id` solicitado o hacen fallback al ultimo run `completed`.

## 3. Estructura del Repositorio

```
.
|-- backend/
|   |-- main.py
|   |-- requirements.txt
|   `-- app/
|       |-- core/              # config, auth JWT, hashing
|       |-- db/                # engine, session, schema runtime
|       |-- models/            # modelos SQLAlchemy
|       |-- routers/           # endpoints REST
|       |-- schemas/           # contratos Pydantic
|       |-- services/          # logica de negocio
|       `-- scrapping/         # scripts, loader, scheduler
|-- frontend/
|   |-- src/
|   |   |-- context/           # AuthContext
|   |   |-- core/              # apiClient
|   |   |-- services/          # servicios HTTP
|   |   |-- router/            # rutas SPA
|   |   `-- pages/             # pantallas
|   `-- nginx.conf
|-- docker-compose.yml
|-- Dockerfile.backend
|-- Dockerfile.frontend
`-- docker-entrypoint.sh
```

## 4. Backend

### 4.1 Stack

- FastAPI
- Uvicorn
- SQLAlchemy 2.x
- psycopg2-binary
- APScheduler
- Selenium + Playwright (scraping)
- PyJWT

### 4.2 Arranque de aplicacion

En startup (`backend/main.py`):

- `Base.metadata.create_all(bind=engine)`
- `ensure_runtime_schema()`
- `start_scheduler()`

En shutdown:

- `stop_scheduler()`

### 4.3 Configuracion

`backend/app/core/config.py` usa `pydantic-settings` y carga variables desde `.env`.

Variables principales:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `DEBUG`
- `BACKEND_CORS_ORIGINS`

Variables scheduler/pipeline:

- `SCRAPPING_SCHEDULE_DAY`
- `SCRAPPING_SCHEDULE_HOUR`
- `SCRAPPING_SCHEDULE_MINUTE`
- `SCRAPPING_SCHEDULE_TIMEZONE`
- `SCRAPPING_RUN_ON_STARTUP`
- `SCRAPPING_SCRIPT_TIMEOUT_SECONDS`

Variables de auth:

- `JWT_SECRET_KEY`
- `ACCESS_TOKEN_EXPIRE_MINUTES`

### 4.4 Seguridad y autenticacion

- Login: `POST /api/v1/auth/login`
- Token: JWT HS256 con claims `sub`, `exp`, `iat`, `type=access`, `role`, `email`.
- Passwords: PBKDF2 SHA-256 (120000 iteraciones) con salt aleatorio.
- Rutas de administracion protegidas con bearer token (`get_current_user`).

### 4.5 Modelo de datos (principal)

Tablas core:

- `hoteles`
- `resenas`
- `fuentes`
- `scrape_runs`

Tablas de administracion/config:

- `platforms`
- `sentiments`
- `scrapings`
- `users`

Puntos importantes:

- `resenas` se versiona por `scrape_run_id`.
- Deduplicacion por indice unico `(hash_unico, scrape_run_id)`.
- Seed runtime en `ensure_runtime_schema()`:
  - plataformas: Google, Booking, Airbnb
  - sentimientos: Positive, Neutral, Negative
  - usuario admin inicial:
    - email: `admin@hotelens.local`
    - password: `Admin123!`

### 4.6 Resolucion de corrida efectiva

La API soporta `scrape_run_id` opcional. La seleccion efectiva funciona asi:

1. Si no llega `scrape_run_id`, usa `scrapings.is_active` si apunta a un run completed.
2. Si no aplica, usa el ultimo `scrape_run` completed.
3. Si llega `scrape_run_id` invalido/inexistente/no completed, hace fallback al completed previo o al ultimo completed.

Esto evita que analitica y listados se rompan cuando una corrida esta `running` o `failed`.

### 4.7 API REST

Base URL: `/api/v1`

Dashboard:

- `GET /dashboard/summary`
- `GET /dashboard/categories`

Hoteles:

- `GET /hotels`
- `GET /hotels/advanced-search`
- `GET /hotels/{hotel_id}`
- `GET /hotels/{hotel_id}/reviews`
- `GET /hotels/{hotel_id}/analytics`
- `POST /hotels/{hotel_id}/favorite`

Scrapping:

- `GET /scrapping/status`
- `GET /scrapping/monitor`

Admin/Auth:

- `POST /auth/login`
- `GET/POST/PUT/PATCH/DELETE /platforms...`
- `GET/POST/PUT/PATCH/DELETE /sentiments...`
- `GET /scrapings`
- `PATCH /scrapings/{scraping_id}/activate`
- `GET/POST/PUT/DELETE /users...`

Health:

- `GET /`
- `GET /health`
- `GET /db-check`

Documentacion OpenAPI (FastAPI):

- `/docs`
- `/redoc`

### 4.8 Pipeline de scrapping

Servicio central: `run_full_scrapping_pipeline`.

Pasos:

1. Toma lock de Postgres (`pg_try_advisory_lock`) para evitar corridas concurrentes.
2. Cierra runs huerfanos en estado `running` como `failed`.
3. Crea nuevo `scrape_run` en `running`.
4. Ejecuta scripts `*_scrapp.py` (opcional).
5. Normaliza salidas JSON con nombres canonicos.
6. Migra JSON a BD (`migrate_json_to_db`).
7. Marca run como `completed` o `failed`.

JSON canonicos esperados:

- `resenas_google.json`
- `resenas_booking.json`
- `resenas_airbnb.json`

## 5. Frontend

### 5.1 Stack

- React 18
- React Router
- Vite
- MUI + Radix UI

### 5.2 Arquitectura cliente

- `AuthProvider` persiste sesion en `localStorage` (`hotelens.auth`).
- `apiClient` adjunta token bearer si existe.
- Capa de servicios:
  - `dashboardService`
  - `hotelService`
  - `adminService`
- Rutas protegidas (`/admin`, `/users`) via `RequireAuth`.

### 5.3 Rutas SPA

- `/`
- `/explore`
- `/results`
- `/hotel/:id`
- `/admin` (protegida)
- `/users` (protegida)

### 5.4 Variables frontend

- `VITE_API_BASE_URL`

Si corre en Docker, Nginx tambien hace proxy de `/api/` a `backend:8010`.

## 6. Infraestructura con Docker

El archivo `docker-compose.yml` se usa para desarrollo local. El despliegue aislado
del VPS esta definido en `docker-compose.prod.yml` y documentado paso a paso en
`DEPLOYMENT.md`.

Servicios de desarrollo definidos en `docker-compose.yml`:

- `db` en puerto `5434`
- `backend` en puerto `8010`
- `frontend` en puerto `3001`
- `pgadmin` en puerto `5050`

### 6.1 Requisitos

- Docker
- Docker Compose

### 6.2 Variables recomendadas (.env en raiz)

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=scrapingweb

PGADMIN_EMAIL=admin@local.com
PGADMIN_PASSWORD=admin123

VITE_API_BASE_URL=/api

JWT_SECRET_KEY=change-this-secret
ACCESS_TOKEN_EXPIRE_MINUTES=120

SCRAPPING_SCHEDULE_DAY=sun
SCRAPPING_SCHEDULE_HOUR=22
SCRAPPING_SCHEDULE_MINUTE=0
SCRAPPING_SCHEDULE_TIMEZONE=America/Bogota
SCRAPPING_RUN_ON_STARTUP=false
SCRAPPING_SCRIPT_TIMEOUT_SECONDS=0
```

### 6.3 Levantar stack completo

```
docker compose up --build
```

Accesos:

- Frontend: http://localhost:3001
- Backend docs: http://localhost:8010/docs
- pgAdmin: http://localhost:5050

## 7. Ejecucion local sin Docker

### 7.1 Backend

```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 7.2 Frontend

```
cd frontend
npm install
npm run dev
```

## 8. Consideraciones tecnicas

- El proyecto usa `create_all` + ajustes runtime en lugar de migraciones versionadas formales para todo el esquema.
- Existe guard para links por plataforma en analitica (`to_regclass`) para no fallar si tablas legacy no existen.
- En filtros de resenas por `sentiment`, usar valores normalizados en ingles (`positive`, `neutral`, `negative`).
- Frontend usa mapeo defensivo para plataformas/sentimientos desconocidos.

## 9. Problemas comunes

1. Error de conexion a BD
   - Verificar `POSTGRES_*` y que PostgreSQL este disponible.

2. Endpoints admin retornan 401
   - Hacer login en `/api/v1/auth/login` y enviar `Authorization: Bearer <token>`.

3. No aparecen datos recientes
   - Revisar `/api/v1/scrapping/monitor` y que exista un run `completed`.
   - Confirmar cual `scrape_run_id` efectivo esta usando el backend.

4. Frontend no alcanza backend
   - Revisar `VITE_API_BASE_URL` y/o proxy Nginx en `frontend/nginx.conf`.

## 10. Referencias internas

- Backend entrypoint: `backend/main.py`
- Logica analitica: `backend/app/services/analytics_service.py`
- Pipeline scraping: `backend/app/services/scrapping_service.py`
- Scheduler: `backend/app/scrapping/orchestrator/scheduler.py`
- API client frontend: `frontend/src/core/apiClient.ts`
