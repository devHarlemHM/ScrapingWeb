from __future__ import annotations

import logging
import os
import shutil
import subprocess
from time import perf_counter
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from sqlalchemy import text
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


class ScrappingPipelineBusy(ScrappingPipelineError):
    pass


SCRAPPING_ADVISORY_LOCK_KEY = 884211
SCRIPT_TIMEOUT_SECONDS = int(os.getenv("SCRAPPING_SCRIPT_TIMEOUT_SECONDS", "0"))


def _signal(message: str) -> None:
    logger.info(message)
    print(f"[SCRAPPING] {message}", flush=True)


def _try_acquire_scrapping_lock(db: Session) -> bool:
    return bool(
        db.execute(
            text("SELECT pg_try_advisory_lock(:lock_key)"),
            {"lock_key": SCRAPPING_ADVISORY_LOCK_KEY},
        ).scalar()
    )


def _release_scrapping_lock(db: Session) -> None:
    db.execute(
        text("SELECT pg_advisory_unlock(:lock_key)"),
        {"lock_key": SCRAPPING_ADVISORY_LOCK_KEY},
    )


def _close_stale_running_runs(db: Session) -> int:
    stale_runs = db.query(ScrapeRun).filter(ScrapeRun.estado == "running").all()
    if not stale_runs:
        return 0

    now = datetime.now(UTC)
    for stale_run in stale_runs:
        stale_run.estado = "failed"
        stale_run.finalizado_en = now
        existing_summary = stale_run.resumen_json if isinstance(stale_run.resumen_json, dict) else {}
        stale_run.resumen_json = {
            **existing_summary,
            "error": "Run interrumpido por reinicio o recarga del backend",
        }

    db.commit()
    return len(stale_runs)


def _safe_log_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return str(value)


def _run_scripts() -> dict[str, Any]:
    script_files = sorted(SCRAPPING_SCRIPTS_DIR.glob("*_scrapp.py"))
    if not script_files:
        logger.warning("No se encontraron scripts de scrapping en %s", SCRAPPING_SCRIPTS_DIR)
        _signal(f"No se encontraron scripts en {SCRAPPING_SCRIPTS_DIR}")
        return {"scripts": [], "executed": 0, "skipped": True, "failed": 0}

    _signal(f"Iniciando ejecucion de scripts ({len(script_files)} scripts)")
    if SCRIPT_TIMEOUT_SECONDS > 0:
        _signal(f"Timeout de script activo: {SCRIPT_TIMEOUT_SECONDS}s")
    else:
        _signal("Timeout de script desactivado: cada script termina antes de iniciar el siguiente")

    results: list[dict[str, Any]] = []
    for script in script_files:
        command = ["python", "-u", str(script)]
        started_at = perf_counter()
        _signal(f"Script iniciado: {script.name}")
        try:
            # Run unbuffered and inherit stdout/stderr so script logs are visible in real time.
            completed = subprocess.run(
                command,
                cwd=str(BASE_DIR),
                stdout=None,
                stderr=None,
                text=True,
                stdin=subprocess.DEVNULL,
                timeout=SCRIPT_TIMEOUT_SECONDS if SCRIPT_TIMEOUT_SECONDS > 0 else None,
            )
            results.append(
                {
                    "script": script.name,
                    "returncode": completed.returncode,
                    "timeout": False,
                    "stdout": "streamed_to_backend_logs",
                    "stderr": "streamed_to_backend_logs",
                }
            )
            elapsed = round(perf_counter() - started_at, 2)
            logger.info(
                "Script finalizado: %s | returncode=%s | duracion=%ss",
                script.name,
                completed.returncode,
                elapsed,
            )
            _signal(f"Script finalizado: {script.name} | returncode={completed.returncode} | duracion={elapsed}s")
        except subprocess.TimeoutExpired as timeout_exc:
            results.append(
                {
                    "script": script.name,
                    "returncode": 124,
                    "timeout": True,
                    "stdout": "streamed_to_backend_logs",
                    "stderr": "streamed_to_backend_logs",
                }
            )
            elapsed = round(perf_counter() - started_at, 2)
            logger.warning("Script con timeout: %s | duracion=%ss", script.name, elapsed)
            _signal(f"Script timeout: {script.name} | duracion={elapsed}s")

    summary = {
        "scripts": results,
        "executed": len(results),
        "skipped": False,
        "failed": sum(1 for item in results if item["returncode"] not in (0, 124)),
    }
    logger.info(
        "Ejecucion de scripts completada | ejecutados=%s | fallidos=%s",
        summary["executed"],
        summary["failed"],
    )
    _signal(f"Ejecucion de scripts completada | ejecutados={summary['executed']} | fallidos={summary['failed']}")
    return summary


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
        size_bytes = target_path.stat().st_size if target_path.exists() else 0
        _signal(f"JSON listo: {canonical_name} | size_bytes={size_bytes}")

    logger.info("JSON normalizados para migracion: %s", moved)
    _signal(f"JSON normalizados: {moved}")
    return moved


def run_full_scrapping_pipeline(db: Session, execute_scripts: bool = True) -> ScrapeRun:
    lock_acquired = _try_acquire_scrapping_lock(db)
    if not lock_acquired:
        _signal("Pipeline omitido: ya existe un scraping en ejecucion")
        raise ScrappingPipelineBusy("Otro proceso de scraping ya esta en ejecucion")

    stale_closed = _close_stale_running_runs(db)
    if stale_closed:
        _signal(f"Runs running huerfanos cerrados: {stale_closed}")

    run = ScrapeRun(estado="running", iniciado_en=datetime.now(UTC), resumen_json={})
    db.add(run)
    db.commit()
    db.refresh(run)
    logger.info("Pipeline de scrapping iniciado | run_id=%s | execute_scripts=%s", run.id, execute_scripts)
    _signal(f"Pipeline iniciado | run_id={run.id} | execute_scripts={execute_scripts}")

    try:
        script_report: dict[str, Any] | None = None
        normalized_json: dict[str, str] = {}
        if execute_scripts:
            script_report = _run_scripts()
            normalized_json = _normalize_json_outputs()

        _signal(f"Iniciando migracion a BD | run_id={run.id}")
        migration_summary = migrate_json_to_db(db=db, run_id=run.id)
        logger.info("Migracion a BD completada | run_id=%s | resumen=%s", run.id, migration_summary)
        _signal(f"Migracion a BD completada | run_id={run.id} | resumen={migration_summary}")

        run.estado = "completed"
        run.finalizado_en = datetime.now(UTC)
        run.resumen_json = {
            **migration_summary,
             "script_report": script_report,
            "json_normalization": normalized_json,
         }
        db.commit()
        db.refresh(run)
        logger.info("Pipeline de scrapping finalizado OK | run_id=%s", run.id)
        _signal(f"Pipeline finalizado OK | run_id={run.id}")
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
        _signal(f"Pipeline fallo | run_id={run.id} | error={exc}")
        raise ScrappingPipelineError(str(exc)) from exc
    finally:
        try:
            _release_scrapping_lock(db)
        except Exception as lock_exc:  # noqa: BLE001
            _signal(f"No se pudo liberar lock de scraping: {lock_exc}")


def get_last_run(db: Session) -> ScrapeRun | None:
    return db.query(ScrapeRun).order_by(ScrapeRun.iniciado_en.desc()).first()
