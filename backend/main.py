from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.base import Base
from app.db.session import check_db_connection, engine, ensure_runtime_schema
from app.routers import dashboard_router, hotels_router, scrapping_router
from app.scrapping.orchestrator import start_scheduler, stop_scheduler
import app.models  # noqa: F401


app = FastAPI(
    title="ScrapingWeb Backend",
    version="1.0.0",
    description="Backend minimo con conexion a BD y modelos.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_runtime_schema()
    start_scheduler()


@app.on_event("shutdown")
def shutdown_event() -> None:
    stop_scheduler()


@app.get("/")
def root() -> dict:
    return {
        "app": "ScrapingWeb Backend",
        "status": "running",
    }


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/db-check")
def db_check() -> dict:
    check_db_connection()
    return {"database": "connected"}


app.include_router(dashboard_router)
app.include_router(hotels_router)
app.include_router(scrapping_router)
