import uuid

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class Resena(Base):
    __tablename__ = "resenas"
    __table_args__ = (
        sa.Index("ix_resenas_hotel", "hotel_id"),
        sa.Index("ix_resenas_fuente", "fuente_id"),
        sa.Index("ix_resenas_scrape_run", "scrape_run_id"),
        sa.Index("ix_resenas_fecha_publicacion", "fecha_publicacion"),
        sa.Index("ix_resenas_sentimiento", "sentimiento"),
        sa.Index("ix_resenas_hash", "hash_unico", unique=True),
    )

    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hotel_id = sa.Column(UUID(as_uuid=True), sa.ForeignKey("hoteles.id", ondelete="CASCADE"), nullable=False)
    fuente_id = sa.Column(UUID(as_uuid=True), sa.ForeignKey("fuentes.id", ondelete="RESTRICT"), nullable=False)
    scrape_run_id = sa.Column(UUID(as_uuid=True), sa.ForeignKey("scrape_runs.id", ondelete="SET NULL"), nullable=True)

    review_external_id = sa.Column(sa.String(255), nullable=True)
    autor = sa.Column(sa.String(255), nullable=True)
    titulo = sa.Column(sa.String(500), nullable=True)
    resena_texto = sa.Column(sa.Text, nullable=True)
    texto_positivo = sa.Column(sa.Text, nullable=True)
    texto_negativo = sa.Column(sa.Text, nullable=True)

    rating_raw = sa.Column(sa.String(50), nullable=True)
    rating_score_5 = sa.Column(sa.Float, nullable=True)
    fecha_raw = sa.Column(sa.String(255), nullable=True)
    fecha_publicacion = sa.Column(sa.DateTime(timezone=True), nullable=True)
    tipo_estadia = sa.Column(sa.String(100), nullable=True)
    sentimiento = sa.Column(sa.String(20), nullable=True)

    payload_json = sa.Column(JSONB, nullable=False)
    hash_unico = sa.Column(sa.String(64), nullable=False, unique=True)
    creado_en = sa.Column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))

    hotel = relationship("Hotel", back_populates="resenas")
    fuente = relationship("Fuente", back_populates="resenas")
    scrape_run = relationship("ScrapeRun", back_populates="resenas")
