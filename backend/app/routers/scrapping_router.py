from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.scrapping import ScrapeRunOut
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
