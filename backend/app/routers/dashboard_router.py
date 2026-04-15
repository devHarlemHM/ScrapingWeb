from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.dashboard import DashboardCategory, DashboardSummary
from app.services.analytics_service import get_dashboard_categories, get_dashboard_summary

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(
    scrape_run_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> DashboardSummary:
    return DashboardSummary(**get_dashboard_summary(db, scrape_run_id=scrape_run_id))


@router.get("/categories", response_model=list[DashboardCategory])
def dashboard_categories(
    scrape_run_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[DashboardCategory]:
    rows = get_dashboard_categories(db, scrape_run_id=scrape_run_id)
    return [DashboardCategory(**row) for row in rows]
