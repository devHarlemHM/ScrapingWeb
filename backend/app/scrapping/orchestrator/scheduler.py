from __future__ import annotations

import logging
from datetime import UTC, datetime

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.db.session import SessionLocal
from app.services.scrapping_service import ScrappingPipelineError, run_full_scrapping_pipeline

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone="UTC")
JOB_ID = "weekly_scrapping_job"


def _run_weekly_job() -> None:
    db = SessionLocal()
    try:
        run_full_scrapping_pipeline(db, execute_scripts=True)
        logger.info("Weekly scrapping job completed")
    except ScrappingPipelineError:
        logger.exception("Weekly scrapping job failed")
    finally:
        db.close()


def start_scheduler() -> None:
    if scheduler.running:
        return

    scheduler.add_job(
        _run_weekly_job,
        trigger=IntervalTrigger(days=7),
        id=JOB_ID,
        max_instances=1,
        coalesce=True,
        replace_existing=True,
        next_run_time=datetime.now(UTC),
    )
    scheduler.start()


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
