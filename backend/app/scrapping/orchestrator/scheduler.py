from __future__ import annotations

import logging
import os
from datetime import UTC, datetime

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.db.session import SessionLocal
from app.services.scrapping_service import ScrappingPipelineBusy, ScrappingPipelineError, run_full_scrapping_pipeline

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone="UTC")
JOB_ID = "weekly_scrapping_job"
SCRAPPING_SCHEDULE_DAY = os.getenv("SCRAPPING_SCHEDULE_DAY", "sun")
SCRAPPING_SCHEDULE_HOUR = int(os.getenv("SCRAPPING_SCHEDULE_HOUR", "3"))
SCRAPPING_SCHEDULE_MINUTE = int(os.getenv("SCRAPPING_SCHEDULE_MINUTE", "0"))


def _run_weekly_job() -> None:
    logger.info("Scheduler disparo job semanal de scrapping")
    print("[SCRAPPING] Scheduler disparo job semanal", flush=True)
    db = SessionLocal()
    try:
        run_full_scrapping_pipeline(db, execute_scripts=True)
        logger.info("Weekly scrapping job completed")
    except ScrappingPipelineBusy as busy_exc:
        logger.info("Weekly scrapping job omitido: %s", busy_exc)
        print(f"[SCRAPPING] Job omitido: {busy_exc}", flush=True)
    except ScrappingPipelineError:
        logger.exception("Weekly scrapping job failed")
    finally:
        db.close()


def start_scheduler() -> None:
    if scheduler.running:
        return

    scheduler.add_job(
        _run_weekly_job,
        trigger=CronTrigger(
            day_of_week=SCRAPPING_SCHEDULE_DAY,
            hour=SCRAPPING_SCHEDULE_HOUR,
            minute=SCRAPPING_SCHEDULE_MINUTE,
            timezone="UTC",
        ),
        id=JOB_ID,
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler de scrapping iniciado | job_id=%s", JOB_ID)
    print(
        (
            "[SCRAPPING] Scheduler iniciado | "
            f"job_id={JOB_ID} | day={SCRAPPING_SCHEDULE_DAY} | "
            f"hour={SCRAPPING_SCHEDULE_HOUR:02d}:{SCRAPPING_SCHEDULE_MINUTE:02d} UTC"
        ),
        flush=True,
    )


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)


def get_scheduler_status() -> dict[str, object | None]:
    job = scheduler.get_job(JOB_ID)
    next_run = None
    trigger = None
    if job is not None:
        next_run = job.next_run_time
        trigger = str(job.trigger)

    return {
        "running": scheduler.running,
        "job_id": JOB_ID,
        "next_run_time": next_run,
        "trigger": trigger,
    }
