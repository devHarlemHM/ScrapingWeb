#!/bin/sh
set -e

echo "🚀 Iniciando ScrapingWeb Backend..."

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando PostgreSQL..."
while ! pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB > /dev/null 2>&1; do
  sleep 1
done
echo "✅ PostgreSQL listo"

# Ejecutar migraciones
if [ -f "alembic.ini" ]; then
  echo "📦 Ejecutando migraciones Alembic..."
  alembic upgrade head || true
fi

# Poblar datos iniciales (solo si no existen)
if [ -f "app/seeds/initial_data.py" ]; then
  echo "🌱 Poblando datos iniciales..."
  python -m app.seeds.initial_data || true
fi

# Ejecutar comando
echo "✅ Iniciando aplicación..."
exec "$@"
