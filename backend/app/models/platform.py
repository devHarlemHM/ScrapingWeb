import uuid

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class Platform(Base):
    __tablename__ = "platforms"

    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = sa.Column(sa.String(100), nullable=False, unique=True)
    status = sa.Column(sa.Boolean, nullable=False, server_default=sa.text("TRUE"))
    created_at = sa.Column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    updated_at = sa.Column(sa.DateTime(timezone=True), nullable=True, onupdate=sa.text("now()"))
