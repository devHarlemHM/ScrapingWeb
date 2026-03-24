# Backend (nuevo)

Backend minimal de ScrapingWeb creado desde cero.

## Incluye

- Conexion a PostgreSQL
- Modelos SQLAlchemy
- API minima con FastAPI

## Ejecutar

1. Crear entorno virtual e instalar dependencias:

```bash
pip install -r requirements.txt
```

2. Definir variables en `.env` (opcional):

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=scrapingweb
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
DEBUG=true
```

3. Levantar API:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints

- `GET /`
- `GET /health`
- `GET /db-check`
