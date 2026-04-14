from fastapi import APIRouter, Depends, HTTPException
from datetime import UTC, datetime
from pathlib import Path
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.scrape_run import ScrapeRun
from app.scrapping.orchestrator.scheduler import get_scheduler_status
from app.schemas.scrapping import ScrapeRunOut
from app.scrapping.migrations.loader import JSON_DIR
from app.services.scrapping_service import CANONICAL_JSON
from app.services.scrapping_service import get_last_run

router = APIRouter(prefix="/api/v1/scrapping", tags=["Scrapping"])


@router.get("/status", response_model=ScrapeRunOut)
def scrapping_status(db: Session = Depends(get_db)) -> ScrapeRunOut:
    run = get_last_run(db)
    if not run:
        raise HTTPException(status_code=404, detail="No hay ejecuciones de scrapping registradas")

    return ScrapeRunOut(
        id=str(run.id),
        status=run.estado,
        started_at=run.iniciado_en,
        finished_at=run.finalizado_en,
        summary=run.resumen_json,
    )


@router.get("/monitor")
def scrapping_monitor(db: Session = Depends(get_db)) -> dict:
    scheduler_status = get_scheduler_status()
    now = datetime.now(UTC)

    total_running = db.query(func.count(ScrapeRun.id)).filter(ScrapeRun.estado == "running").scalar() or 0

    recent_runs = (
        db.query(ScrapeRun)
        .order_by(ScrapeRun.iniciado_en.desc())
        .limit(10)
        .all()
    )

    recent = []
    stale_running = []
    for run in recent_runs:
        elapsed_minutes = round((now - run.iniciado_en).total_seconds() / 60.0, 2)
        error_value = None
        if isinstance(run.resumen_json, dict):
            maybe_error = run.resumen_json.get("error")
            if isinstance(maybe_error, str) and maybe_error.strip():
                error_value = maybe_error[:220]

        if run.estado == "running" and elapsed_minutes > 30:
            stale_running.append(
                {
                    "id": str(run.id),
                    "started_at": run.iniciado_en,
                    "minutes_elapsed": elapsed_minutes,
                }
            )

        recent.append(
            {
                "id": str(run.id),
                "status": run.estado,
                "started_at": run.iniciado_en,
                "finished_at": run.finalizado_en,
                "minutes_elapsed": elapsed_minutes,
                "reviews": run.resumen_json.get("reviews") if isinstance(run.resumen_json, dict) else None,
                "duplicates_skipped": run.resumen_json.get("duplicates_skipped") if isinstance(run.resumen_json, dict) else None,
                "error": error_value,
            }
        )

    json_files = []
    latest_json_update: datetime | None = None
    for canonical_name in CANONICAL_JSON.keys():
        path = JSON_DIR / canonical_name
        exists = path.exists()
        size_bytes = path.stat().st_size if exists else None
        modified_at = datetime.fromtimestamp(path.stat().st_mtime, tz=UTC) if exists else None
        if modified_at and (latest_json_update is None or modified_at > latest_json_update):
            latest_json_update = modified_at

        json_files.append(
            {
                "name": canonical_name,
                "path": str(path),
                "exists": exists,
                "size_bytes": size_bytes,
                "modified_at": modified_at,
            }
        )

    json_recently_updated = False
    if latest_json_update is not None:
        json_recently_updated = (now - latest_json_update).total_seconds() <= 900

    return {
        "scheduler": scheduler_status,
        "running_runs": int(total_running),
        "stale_running_runs": stale_running,
        "json_status": {
            "directory": str(Path(JSON_DIR)),
            "latest_update": latest_json_update,
            "updated_last_15m": json_recently_updated,
            "files": json_files,
        },
        "recent_runs": recent,
    }
