from __future__ import annotations

import logging
import os
from datetime import datetime
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.db.session import SessionLocal
from app.services.scrapping_service import ScrappingPipelineBusy, ScrappingPipelineError, run_full_scrapping_pipeline

logger = logging.getLogger(__name__)

JOB_ID = "weekly_scrapping_job"
SCRAPPING_SCHEDULE_DAY = os.getenv("SCRAPPING_SCHEDULE_DAY", "sun")
SCRAPPING_SCHEDULE_HOUR = int(os.getenv("SCRAPPING_SCHEDULE_HOUR", "22"))
SCRAPPING_SCHEDULE_MINUTE = int(os.getenv("SCRAPPING_SCHEDULE_MINUTE", "0"))
SCRAPPING_SCHEDULE_TIMEZONE = os.getenv("SCRAPPING_SCHEDULE_TIMEZONE", "America/Bogota")
SCRAPPING_RUN_ON_STARTUP = os.getenv("SCRAPPING_RUN_ON_STARTUP", "false").lower() in ("1", "true", "yes", "on")

try:
    SCHEDULE_TZ = ZoneInfo(SCRAPPING_SCHEDULE_TIMEZONE)
except Exception:
    logger.warning("Timezone invalida para scheduler (%s). Se usa UTC", SCRAPPING_SCHEDULE_TIMEZONE)
    SCHEDULE_TZ = ZoneInfo("UTC")

scheduler = BackgroundScheduler(timezone=SCHEDULE_TZ)


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

    immediate_run_time = datetime.now(SCHEDULE_TZ) if SCRAPPING_RUN_ON_STARTUP else None

    scheduler.add_job(
        _run_weekly_job,
        trigger=CronTrigger(
            day_of_week=SCRAPPING_SCHEDULE_DAY,
            hour=SCRAPPING_SCHEDULE_HOUR,
            minute=SCRAPPING_SCHEDULE_MINUTE,
            timezone=SCHEDULE_TZ,
        ),
        next_run_time=immediate_run_time,
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
            f"hour={SCRAPPING_SCHEDULE_HOUR:02d}:{SCRAPPING_SCHEDULE_MINUTE:02d} {SCHEDULE_TZ.key} | "
            f"run_on_startup={SCRAPPING_RUN_ON_STARTUP}"
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
        "timezone": SCHEDULE_TZ.key,
        "run_on_startup": SCRAPPING_RUN_ON_STARTUP,
    }
