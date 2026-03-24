import uuid

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class ScrapeRun(Base):
    __tablename__ = "scrape_runs"

    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    estado = sa.Column(sa.String(30), nullable=False, default="running")
    iniciado_en = sa.Column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    finalizado_en = sa.Column(sa.DateTime(timezone=True), nullable=True)
    resumen_json = sa.Column(JSONB, nullable=True)

    resenas = relationship("Resena", back_populates="scrape_run")
