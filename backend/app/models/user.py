import uuid

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = sa.Column(sa.String(120), nullable=False)
    email = sa.Column(sa.String(255), nullable=False, unique=True, index=True)
    password = sa.Column(sa.String(255), nullable=False)
    role = sa.Column(sa.String(30), nullable=False, server_default="consultant")
    created_at = sa.Column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    updated_at = sa.Column(sa.DateTime(timezone=True), nullable=True, onupdate=sa.text("now()"))
