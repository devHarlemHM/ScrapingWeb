from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


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
