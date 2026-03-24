from __future__ import annotations

import logging
import shutil
import subprocess
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.models.scrape_run import ScrapeRun
from app.scrapping.migrations.loader import JSON_DIR, migrate_json_to_db

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parents[2]
SCRAPPING_SCRIPTS_DIR = BASE_DIR / "app" / "scrapping" / "scripts"

CANONICAL_JSON = {
    "reseñas_google.json": ["reseñas_google.json", "comentarios_hoteles.json"],
    "reseñas_booking.json": ["reseñas_booking.json", "datos.json"],
    "reseñas_airbnb.json": ["reseñas_airbnb.json", "reseñas_airbnb_barranquilla_final.json"],
}


class ScrappingPipelineError(RuntimeError):
    pass


def _run_scripts() -> dict[str, Any]:
    script_files = sorted(SCRAPPING_SCRIPTS_DIR.glob("*_scrapp.py"))
    if not script_files:
        return {"scripts": [], "executed": 0, "skipped": True, "failed": 0}

    results: list[dict[str, Any]] = []
    for script in script_files:
        command = ["python", str(script)]
        try:
            # Some scripts are interactive at the end (input), so we use timeout and keep produced files.
            completed = subprocess.run(
                command,
                cwd=str(BASE_DIR),
                capture_output=True,
                text=True,
                stdin=subprocess.DEVNULL,
                timeout=120,
            )
            results.append(
                {
                    "script": script.name,
                    "returncode": completed.returncode,
                    "timeout": False,
                    "stdout": completed.stdout[-1000:],
                    "stderr": completed.stderr[-1000:],
                }
            )
        except subprocess.TimeoutExpired as timeout_exc:
            results.append(
                {
                    "script": script.name,
                    "returncode": 124,
                    "timeout": True,
                    "stdout": (timeout_exc.stdout or "")[-1000:],
                    "stderr": (timeout_exc.stderr or "")[-1000:],
                }
            )

    return {
        "scripts": results,
        "executed": len(results),
        "skipped": False,
        "failed": sum(1 for item in results if item["returncode"] not in (0, 124)),
    }


def _candidate_paths(file_name: str) -> list[Path]:
    return [
        JSON_DIR / file_name,
        BASE_DIR / file_name,
        BASE_DIR / "app" / "scrapping" / "scripts" / file_name,
    ]


def _normalize_json_outputs() -> dict[str, str]:
    JSON_DIR.mkdir(parents=True, exist_ok=True)
    moved: dict[str, str] = {}

    for canonical_name, aliases in CANONICAL_JSON.items():
        source_path: Path | None = None

        for candidate_name in aliases:
            for candidate_path in _candidate_paths(candidate_name):
                if candidate_path.exists():
                    source_path = candidate_path
                    break
            if source_path:
                break

        if source_path is None:
            continue

        target_path = JSON_DIR / canonical_name
        if source_path.resolve() != target_path.resolve():
            shutil.copy2(source_path, target_path)
        moved[canonical_name] = str(source_path)

    return moved


def run_full_scrapping_pipeline(db: Session, execute_scripts: bool = True) -> ScrapeRun:
    run = ScrapeRun(estado="running", iniciado_en=datetime.now(UTC), resumen_json={})
    db.add(run)
    db.commit()
    db.refresh(run)

    try:
        script_report: dict[str, Any] | None = None
        normalized_json: dict[str, str] = {}
        if execute_scripts:
            script_report = _run_scripts()
            normalized_json = _normalize_json_outputs()

        migration_summary = migrate_json_to_db(db=db, run_id=run.id)

        run.estado = "completed"
        run.finalizado_en = datetime.now(UTC)
        run.resumen_json = {
            **migration_summary,
             "script_report": script_report,
            "json_normalization": normalized_json,
         }
        db.commit()
        db.refresh(run)
        return run

    except Exception as exc:  # noqa: BLE001
        db.rollback()
        run.estado = "failed"
        run.finalizado_en = datetime.now(UTC)
        run.resumen_json = {
            "error": str(exc),
        }
        db.add(run)
        db.commit()
        db.refresh(run)
        logger.exception("Error en pipeline de scrapping")
        raise ScrappingPipelineError(str(exc)) from exc


def get_last_run(db: Session) -> ScrapeRun | None:
    return db.query(ScrapeRun).order_by(ScrapeRun.iniciado_en.desc()).first()
