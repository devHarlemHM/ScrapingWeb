import uuid

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class Hotel(Base):
    __tablename__ = "hoteles"
    __table_args__ = (
        sa.Index("ix_hoteles_nombre", "nombre"),
        sa.Index("ix_hoteles_ciudad", "ciudad"),
    )

    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = sa.Column(sa.String(255), nullable=False)
    ubicacion = sa.Column(sa.String(255), nullable=True)
    ciudad = sa.Column(sa.String(100), nullable=False, server_default="Barranquilla")
    pais = sa.Column(sa.String(100), nullable=False, server_default="Colombia")
    url = sa.Column(sa.Text, nullable=True)
    descripcion = sa.Column(sa.Text, nullable=True)
    precio_noche = sa.Column(sa.Float, nullable=True)
    image_url = sa.Column(sa.Text, nullable=True)
    features_json = sa.Column(JSONB, nullable=True)

    rating_promedio = sa.Column(sa.Float, nullable=True)
    calidad_score = sa.Column(sa.Float, nullable=True)
    sostenibilidad_score = sa.Column(sa.Float, nullable=True)
    favorites_count = sa.Column(sa.Integer, nullable=False, server_default=sa.text("0"))

    activo = sa.Column(sa.Boolean, nullable=False, server_default=sa.text("TRUE"))
    creado_en = sa.Column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    actualizado_en = sa.Column(sa.DateTime(timezone=True), nullable=True, onupdate=sa.text("now()"))

    resenas = relationship("Resena", back_populates="hotel", cascade="all, delete-orphan")
