from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class PlatformIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    status: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 2:
            raise ValueError("Nombre de plataforma invalido")
        return normalized


class PlatformOut(BaseModel):
    id: str
    name: str
    status: bool
    created_at: datetime
    updated_at: datetime | None = None


class SentimentIn(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    status: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 2:
            raise ValueError("Nombre de sentimiento invalido")
        return normalized


class SentimentOut(BaseModel):
    id: str
    name: str
    status: bool
    created_at: datetime
    updated_at: datetime | None = None


class ScrapingOut(BaseModel):
    id: str
    source: str
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime | None = None


class UserIn(BaseModel):
    username: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=6, max_length=255)
    role: str = Field(pattern="^(admin|consultant)$")

    @field_validator("username", "password")
    @classmethod
    def validate_non_empty(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Campo requerido")
        return normalized


class UserUpdateIn(BaseModel):
    username: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=255)
    role: str = Field(pattern="^(admin|consultant)$")
    password: str | None = Field(default=None, min_length=6, max_length=255)

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Username requerido")
        return normalized


class UserOut(BaseModel):
    id: str
    username: str
    email: str
    role: str


class LoginIn(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=1)

    @field_validator("email", "password")
    @classmethod
    def validate_non_empty(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Campo requerido")
        return normalized


class AuthUserOut(BaseModel):
    id: str
    username: str
    email: str
    role: str


class LoginOut(BaseModel):
    authenticated: bool
    token: str
    user: AuthUserOut
