from __future__ import annotations

import re
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.auth import create_access_token, get_current_user
from app.core.security import hash_password, verify_password
from app.db.session import get_db
from app.models.platform import Platform
from app.models.scraping import Scraping
from app.models.sentiment_config import SentimentConfig
from app.models.user import User
from app.schemas.admin import (
    AuthUserOut,
    LoginIn,
    LoginOut,
    PlatformIn,
    PlatformOut,
    ScrapingOut,
    SentimentIn,
    SentimentOut,
    UserIn,
    UserOut,
    UserUpdateIn,
)

router = APIRouter(prefix="/api/v1", tags=["Admin"])


def _validate_email(email: str) -> str:
    normalized = (email or "").strip().lower()
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", normalized):
        raise HTTPException(status_code=422, detail="Email invalido")
    return normalized


def _as_uuid(value: str) -> UUID:
    try:
        return UUID(value)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail="ID invalido") from exc


@router.get("/platforms", response_model=list[PlatformOut])
def list_platforms(active: bool | None = Query(default=None), db: Session = Depends(get_db)) -> list[PlatformOut]:
    query = db.query(Platform)
    if active is not None:
        query = query.filter(Platform.status.is_(active))
    rows = query.order_by(Platform.created_at.asc()).all()
    return [
        PlatformOut(
            id=str(item.id),
            name=item.name,
            status=bool(item.status),
            created_at=item.created_at,
            updated_at=item.updated_at,
        )
        for item in rows
    ]


@router.post("/platforms", response_model=PlatformOut)
def create_platform(
    payload: PlatformIn,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> PlatformOut:
    normalized_name = payload.name.strip()
    if not normalized_name:
        raise HTTPException(status_code=422, detail="Nombre de plataforma requerido")
    existing = db.query(Platform).filter(Platform.name.ilike(normalized_name)).first()
    if existing:
        raise HTTPException(status_code=409, detail="La plataforma ya existe")

    row = Platform(name=normalized_name, status=payload.status)
    db.add(row)
    db.commit()
    db.refresh(row)
    return PlatformOut(id=str(row.id), name=row.name, status=bool(row.status), created_at=row.created_at, updated_at=row.updated_at)


@router.put("/platforms/{platform_id}", response_model=PlatformOut)
def update_platform(
    platform_id: str,
    payload: PlatformIn,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> PlatformOut:
    row = db.query(Platform).filter(Platform.id == _as_uuid(platform_id)).first()
    if not row:
        raise HTTPException(status_code=404, detail="Plataforma no encontrada")

    normalized_name = payload.name.strip()
    if not normalized_name:
        raise HTTPException(status_code=422, detail="Nombre de plataforma requerido")
    row.name = normalized_name
    row.status = payload.status
    db.commit()
    db.refresh(row)
    return PlatformOut(id=str(row.id), name=row.name, status=bool(row.status), created_at=row.created_at, updated_at=row.updated_at)


@router.patch("/platforms/{platform_id}/toggle", response_model=PlatformOut)
def toggle_platform(
    platform_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> PlatformOut:
    row = db.query(Platform).filter(Platform.id == _as_uuid(platform_id)).first()
    if not row:
        raise HTTPException(status_code=404, detail="Plataforma no encontrada")

    row.status = not bool(row.status)
    db.commit()
    db.refresh(row)
    return PlatformOut(id=str(row.id), name=row.name, status=bool(row.status), created_at=row.created_at, updated_at=row.updated_at)


@router.delete("/platforms/{platform_id}")
def delete_platform(
    platform_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict[str, bool]:
    row = db.query(Platform).filter(Platform.id == _as_uuid(platform_id)).first()
    if not row:
        raise HTTPException(status_code=404, detail="Plataforma no encontrada")

    db.delete(row)
    db.commit()
    return {"ok": True}


@router.get("/sentiments", response_model=list[SentimentOut])
def list_sentiments(active: bool | None = Query(default=None), db: Session = Depends(get_db)) -> list[SentimentOut]:
    query = db.query(SentimentConfig)
    if active is not None:
        query = query.filter(SentimentConfig.status.is_(active))
    rows = query.order_by(SentimentConfig.created_at.asc()).all()
    return [
        SentimentOut(
            id=str(item.id),
            name=item.name,
            status=bool(item.status),
            created_at=item.created_at,
            updated_at=item.updated_at,
        )
        for item in rows
    ]


@router.post("/sentiments", response_model=SentimentOut)
def create_sentiment(
    payload: SentimentIn,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> SentimentOut:
    normalized_name = payload.name.strip()
    if not normalized_name:
        raise HTTPException(status_code=422, detail="Nombre de sentimiento requerido")
    existing = db.query(SentimentConfig).filter(SentimentConfig.name.ilike(normalized_name)).first()
    if existing:
        raise HTTPException(status_code=409, detail="El sentimiento ya existe")

    row = SentimentConfig(name=normalized_name, status=payload.status)
    db.add(row)
    db.commit()
    db.refresh(row)
    return SentimentOut(id=str(row.id), name=row.name, status=bool(row.status), created_at=row.created_at, updated_at=row.updated_at)


@router.put("/sentiments/{sentiment_id}", response_model=SentimentOut)
def update_sentiment(
    sentiment_id: str,
    payload: SentimentIn,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> SentimentOut:
    row = db.query(SentimentConfig).filter(SentimentConfig.id == _as_uuid(sentiment_id)).first()
    if not row:
        raise HTTPException(status_code=404, detail="Sentimiento no encontrado")

    normalized_name = payload.name.strip()
    if not normalized_name:
        raise HTTPException(status_code=422, detail="Nombre de sentimiento requerido")
    row.name = normalized_name
    row.status = payload.status
    db.commit()
    db.refresh(row)
    return SentimentOut(id=str(row.id), name=row.name, status=bool(row.status), created_at=row.created_at, updated_at=row.updated_at)


@router.patch("/sentiments/{sentiment_id}/toggle", response_model=SentimentOut)
def toggle_sentiment(
    sentiment_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> SentimentOut:
    row = db.query(SentimentConfig).filter(SentimentConfig.id == _as_uuid(sentiment_id)).first()
    if not row:
        raise HTTPException(status_code=404, detail="Sentimiento no encontrado")

    row.status = not bool(row.status)
    db.commit()
    db.refresh(row)
    return SentimentOut(id=str(row.id), name=row.name, status=bool(row.status), created_at=row.created_at, updated_at=row.updated_at)


@router.delete("/sentiments/{sentiment_id}")
def delete_sentiment(
    sentiment_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict[str, bool]:
    row = db.query(SentimentConfig).filter(SentimentConfig.id == _as_uuid(sentiment_id)).first()
    if not row:
        raise HTTPException(status_code=404, detail="Sentimiento no encontrado")

    db.delete(row)
    db.commit()
    return {"ok": True}


@router.get("/scrapings", response_model=list[ScrapingOut])
def list_scrapings(db: Session = Depends(get_db)) -> list[ScrapingOut]:
    rows = db.query(Scraping).order_by(Scraping.created_at.desc()).all()
    return [
        ScrapingOut(
            id=str(item.id),
            source=item.source,
            status=item.status,
            is_active=bool(item.is_active),
            created_at=item.created_at,
            updated_at=item.updated_at,
        )
        for item in rows
    ]


@router.patch("/scrapings/{scraping_id}/activate", response_model=ScrapingOut)
def activate_scraping(
    scraping_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ScrapingOut:
    row = db.query(Scraping).filter(Scraping.id == _as_uuid(scraping_id)).first()
    if not row:
        raise HTTPException(status_code=404, detail="Scraping no encontrado")

    db.query(Scraping).update({Scraping.is_active: False})
    row.is_active = True
    db.commit()
    db.refresh(row)
    return ScrapingOut(
        id=str(row.id),
        source=row.source,
        status=row.status,
        is_active=bool(row.is_active),
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.get("/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[UserOut]:
    rows = db.query(User).order_by(User.created_at.asc()).all()
    return [UserOut(id=str(item.id), username=item.username, email=item.email, role=item.role) for item in rows]


@router.post("/users", response_model=UserOut)
def create_user(
    payload: UserIn,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> UserOut:
    normalized_username = payload.username.strip()
    if not normalized_username:
        raise HTTPException(status_code=422, detail="Username requerido")
    normalized_email = _validate_email(payload.email)
    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        raise HTTPException(status_code=409, detail="El email ya existe")

    row = User(
        username=normalized_username,
        email=normalized_email,
        password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return UserOut(id=str(row.id), username=row.username, email=row.email, role=row.role)


@router.put("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    payload: UserUpdateIn,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> UserOut:
    row = db.query(User).filter(User.id == _as_uuid(user_id)).first()
    if not row:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    normalized_username = payload.username.strip()
    if not normalized_username:
        raise HTTPException(status_code=422, detail="Username requerido")

    normalized_email = _validate_email(payload.email)
    existing = db.query(User).filter(User.email == normalized_email, User.id != row.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="El email ya existe")

    row.username = normalized_username
    row.email = normalized_email
    row.role = payload.role
    if payload.password:
        row.password = hash_password(payload.password)

    db.commit()
    db.refresh(row)
    return UserOut(id=str(row.id), username=row.username, email=row.email, role=row.role)


@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict[str, bool]:
    row = db.query(User).filter(User.id == _as_uuid(user_id)).first()
    if not row:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    db.delete(row)
    db.commit()
    return {"ok": True}


@router.post("/auth/login", response_model=LoginOut)
def auth_login(payload: LoginIn, db: Session = Depends(get_db)) -> LoginOut:
    normalized_email = _validate_email(payload.email)
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=401, detail="Credenciales invalidas")

    access_token = create_access_token(
        subject=str(user.id),
        additional_claims={"role": user.role, "email": user.email},
    )

    return LoginOut(
        authenticated=True,
        token=access_token,
        user=AuthUserOut(id=str(user.id), username=user.username, email=user.email, role=user.role),
    )
