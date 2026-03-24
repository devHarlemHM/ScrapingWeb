import uuid

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class Fuente(Base):
    __tablename__ = "fuentes"

    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codigo = sa.Column(sa.String(50), nullable=False, unique=True, index=True)
    nombre = sa.Column(sa.String(100), nullable=False)
    activo = sa.Column(sa.Boolean, nullable=False, server_default=sa.text("TRUE"))
    creado_en = sa.Column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))

    resenas = relationship("Resena", back_populates="fuente")
