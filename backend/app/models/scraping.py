import uuid

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class Scraping(Base):
    __tablename__ = "scrapings"

    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source = sa.Column(sa.String(255), nullable=False)
    status = sa.Column(sa.String(30), nullable=False, server_default="Processing")
    is_active = sa.Column(sa.Boolean, nullable=False, server_default=sa.text("FALSE"))
    created_at = sa.Column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    updated_at = sa.Column(sa.DateTime(timezone=True), nullable=True, onupdate=sa.text("now()"))
