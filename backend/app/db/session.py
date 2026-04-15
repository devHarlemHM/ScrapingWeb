from typing import Generator
from uuid import uuid4

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.core.security import hash_password


engine = create_engine(
    settings.database_url,
    echo=settings.DEBUG,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return True


def ensure_runtime_schema() -> None:
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                ALTER TABLE hoteles
                ADD COLUMN IF NOT EXISTS favorites_count INTEGER NOT NULL DEFAULT 0
                """
            )
        )
        connection.execute(text("ALTER TABLE resenas DROP CONSTRAINT IF EXISTS resenas_hash_unico_key"))
        connection.execute(text("DROP INDEX IF EXISTS ix_resenas_hash"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_resenas_hash ON resenas (hash_unico)"))
        connection.execute(
            text(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS uq_resenas_hash_run
                ON resenas (hash_unico, scrape_run_id)
                """
            )
        )
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(120)"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255)"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'consultant'"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now()"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ"))

        for platform_name in ("Google", "Booking", "Airbnb"):
            connection.execute(
                text(
                    """
                    INSERT INTO platforms (id, name, status)
                    VALUES (:id, :name, TRUE)
                    ON CONFLICT (name) DO NOTHING
                    """
                ),
                {
                    "id": str(uuid4()),
                    "name": platform_name,
                },
            )

        for sentiment_name in ("Positive", "Neutral", "Negative"):
            connection.execute(
                text(
                    """
                    INSERT INTO sentiments (id, name, status)
                    VALUES (:id, :name, TRUE)
                    ON CONFLICT (name) DO NOTHING
                    """
                ),
                {
                    "id": str(uuid4()),
                    "name": sentiment_name,
                },
            )

        scrape_runs = connection.execute(
            text(
                """
                SELECT
                    sr.id::text AS source,
                    CASE
                        WHEN lower(sr.estado) = 'completed' THEN 'Completed'
                        WHEN lower(sr.estado) = 'failed' THEN 'Failed'
                        ELSE 'Processing'
                    END AS status,
                    coalesce(sr.iniciado_en, now()) AS created_at
                FROM scrape_runs sr
                """
            )
        ).mappings().all()

        for run in scrape_runs:
            connection.execute(
                text(
                    """
                    INSERT INTO scrapings (id, source, status, is_active, created_at)
                    VALUES (:id, :source, :status, FALSE, :created_at)
                    ON CONFLICT DO NOTHING
                    """
                ),
                {
                    "id": str(uuid4()),
                    "source": run["source"],
                    "status": run["status"],
                    "created_at": run["created_at"],
                },
            )

        connection.execute(
            text(
                """
                UPDATE scrapings
                SET is_active = FALSE
                WHERE is_active = TRUE
                """
            )
        )
        connection.execute(
            text(
                """
                UPDATE scrapings
                SET is_active = TRUE
                WHERE id = (
                    SELECT id
                    FROM scrapings
                    ORDER BY
                        CASE WHEN lower(status) = 'completed' THEN 0 ELSE 1 END,
                        created_at DESC
                    LIMIT 1
                )
                """
            )
        )

        admin_exists = connection.execute(text("SELECT 1 FROM users LIMIT 1")).first()
        if not admin_exists:
            connection.execute(
                text(
                    """
                    INSERT INTO users (id, username, email, password, role)
                    VALUES (:id, :username, :email, :password, :role)
                    """
                ),
                {
                    "id": str(uuid4()),
                    "username": "Admin",
                    "email": "admin@hotelens.local",
                    "password": hash_password("Admin123!"),
                    "role": "admin",
                },
            )
