from datetime import datetime

from pydantic import BaseModel, Field


class PlatformIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    status: bool = True


class PlatformOut(BaseModel):
    id: str
    name: str
    status: bool
    created_at: datetime
    updated_at: datetime | None = None


class SentimentIn(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    status: bool = True


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


class UserUpdateIn(BaseModel):
    username: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=255)
    role: str = Field(pattern="^(admin|consultant)$")
    password: str | None = Field(default=None, min_length=6, max_length=255)


class UserOut(BaseModel):
    id: str
    username: str
    email: str
    role: str


class LoginIn(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=1)


class AuthUserOut(BaseModel):
    id: str
    username: str
    email: str
    role: str


class LoginOut(BaseModel):
    authenticated: bool
    token: str
    user: AuthUserOut
