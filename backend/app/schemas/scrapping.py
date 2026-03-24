from datetime import datetime

from pydantic import BaseModel


class ScrapeRunOut(BaseModel):
    id: str
    status: str
    started_at: datetime
    finished_at: datetime | None = None
    summary: dict | None = None
