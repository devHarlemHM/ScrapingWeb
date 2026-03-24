from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from sqlalchemy import bindparam, case, func, text
from sqlalchemy.orm import Session

from app.models.fuente import Fuente
from app.models.hotel import Hotel
from app.models.resena import Resena


def _sentiments_from_counts(pos: int, neu: int, neg: int) -> dict[str, int]:
    return {
        "positive": pos,
        "neutral": neu,
        "negative": neg,
    }


def _safe_pct(numerator: int, denominator: int) -> float:
    if denominator <= 0:
        return 0.0
    return round((numerator / denominator) * 100, 2)


STOPWORDS = {
    "hotel",
    "barranquilla",
    "habitacion",
    "habitaciones",
    "muy",
    "mas",
    "para",
    "con",
    "del",
    "las",
    "los",
    "una",
    "uno",
    "por",
    "que",
    "como",
    "pero",
    "porque",
    "desde",
    "este",
    "esta",
    "estaba",
    "todo",
    "noche",
}


def get_dashboard_summary(db: Session) -> dict[str, Any]:
    total_reviews = db.query(func.count(Resena.id)).scalar() or 0
    total_platforms = db.query(func.count(Fuente.id)).filter(Fuente.activo.is_(True)).scalar() or 0

    positive_reviews = (
        db.query(func.count(Resena.id)).filter(func.lower(func.coalesce(Resena.sentimiento, "")) == "positive").scalar() or 0
    )

    # Proxy for IA precision while no external labeled benchmark exists.
    ia_precision = _safe_pct(positive_reviews, total_reviews) if total_reviews else 0.0

    return {
        "total_reviews": int(total_reviews),
        "ia_precision": float(ia_precision),
        "total_platforms": int(total_platforms),
        "stars_scale_min": 1,
        "stars_scale_max": 5,
    }


def get_dashboard_categories(db: Session) -> list[dict[str, Any]]:
    base_total = db.query(func.count(Hotel.id)).filter(Hotel.activo.is_(True)).scalar() or 0

    high_sustainability = (
        db.query(func.count(Hotel.id))
        .filter(Hotel.activo.is_(True), func.coalesce(Hotel.sostenibilidad_score, 0) >= 4)
        .scalar()
        or 0
    )
    high_quality = (
        db.query(func.count(Hotel.id))
        .filter(Hotel.activo.is_(True), func.coalesce(Hotel.calidad_score, 0) >= 4)
        .scalar()
        or 0
    )

    positive_hotels = (
        db.query(func.count(func.distinct(Resena.hotel_id)))
        .filter(func.lower(func.coalesce(Resena.sentimiento, "")) == "positive")
        .scalar()
        or 0
    )

    return [
        {
            "id": "sustainability",
            "name": "Sostenibilidad",
            "description": "Compromiso ambiental verificado",
            "count": int(high_sustainability),
            "sort": "sustainability",
        },
        {
            "id": "quality",
            "name": "Calidad",
            "description": "Puntuacion de calidad general",
            "count": int(high_quality),
            "sort": "quality",
        },
        {
            "id": "reviews",
            "name": "Mejores Resenas",
            "description": "Mayor volumen de opiniones",
            "count": int(base_total),
            "sort": "reviews",
        },
        {
            "id": "sentiment",
            "name": "Sentimiento Positivo",
            "description": "Analisis de emociones por IA",
            "count": int(positive_hotels),
            "sort": "sentiment",
        },
        {
            "id": "analyzed",
            "name": "Mas Analizados",
            "description": "Mayor cobertura de scraping",
            "count": int(base_total),
            "sort": "analyzed",
        },
        {
            "id": "comparative",
            "name": "Comparativa",
            "description": "Ranking cruzado de plataformas",
            "count": int(base_total),
            "sort": "balance",
        },
    ]


def _platform_payload(ratings: Iterable[tuple[str, float]]) -> dict[str, float | None]:
    payload: dict[str, float | None] = {"google": None, "booking": None, "airbnb": None}
    for code, rating in ratings:
        payload[code.lower()] = round(float(rating), 2)
    return payload


def _normalize_token(token: str) -> str:
    return "".join(ch.lower() for ch in token if ch.isalnum())


def _extract_keywords(texts: list[str], limit: int = 5) -> list[str]:
    counts: dict[str, int] = {}
    for text in texts:
        for raw in text.split():
            token = _normalize_token(raw)
            if len(token) < 4 or token in STOPWORDS:
                continue
            counts[token] = counts.get(token, 0) + 1

    top = sorted(counts.items(), key=lambda item: (-item[1], item[0]))[:limit]
    return [token.capitalize() for token, _ in top]


def _review_texts_for_hotels(db: Session, hotel_ids: list[Any], per_hotel_limit: int = 8) -> dict[Any, list[str]]:
    if not hotel_ids:
        return {}

    rows = (
        db.query(Resena.hotel_id, Resena.resena_texto)
        .filter(Resena.hotel_id.in_(hotel_ids), Resena.resena_texto.isnot(None))
        .order_by(Resena.hotel_id.asc(), Resena.fecha_publicacion.desc().nullslast(), Resena.creado_en.desc())
        .all()
    )

    out: dict[Any, list[str]] = {hotel_id: [] for hotel_id in hotel_ids}
    for hotel_id, review_text in rows:
        text_value = (review_text or "").strip()
        if not text_value:
            continue
        current = out.setdefault(hotel_id, [])
        if len(current) < per_hotel_limit:
            current.append(text_value)
    return out


def _fallback_description(hotel: Hotel, review_texts: list[str]) -> str:
    if hotel.descripcion and hotel.descripcion.strip():
        return hotel.descripcion.strip()
    if review_texts:
        first = review_texts[0][:220].strip()
        return first if len(first) > 30 else f"Hotel destacado en {hotel.ciudad}."
    return f"Hotel ubicado en {hotel.ciudad}, {hotel.pais}."


def _highlight_review(review_texts: list[str]) -> str | None:
    if not review_texts:
        return None
    return review_texts[0][:180].strip()


def _platform_links_for_hotels(db: Session, hotel_ids: list[Any]) -> dict[str, dict[str, str | None]]:
    payload = {
        str(hotel_id): {
            "google": None,
            "booking": None,
            "airbnb": None,
        }
        for hotel_id in hotel_ids
    }

    if not hotel_ids:
        return payload

    try:
        stmt = (
            text(
                """
                SELECT hp.hotel_id::text AS hotel_id, lower(p.codigo) AS codigo, hp.url_hotel AS url_hotel
                FROM hotel_plataforma hp
                JOIN plataformas p ON p.id = hp.plataforma_id
                WHERE hp.hotel_id IN :hotel_ids
                  AND hp.activo IS TRUE
                  AND hp.url_hotel IS NOT NULL
                  AND hp.url_hotel <> ''
                """
            )
            .bindparams(bindparam("hotel_ids", expanding=True))
        )
        rows = db.execute(stmt, {"hotel_ids": hotel_ids}).mappings().all()
        for row in rows:
            hotel_id = row["hotel_id"]
            code = (row["codigo"] or "").strip().lower()
            url_hotel = row["url_hotel"]
            if hotel_id in payload and code in payload[hotel_id] and url_hotel:
                payload[hotel_id][code] = str(url_hotel)
    except Exception:
        db.rollback()
        return payload

    return payload


def _sentiments_payload(rows: Iterable[tuple[str | None, int]]) -> dict[str, int]:
    payload = {"positive": 0, "neutral": 0, "negative": 0}
    for sentiment, count in rows:
        key = (sentiment or "").lower()
        if key in payload:
            payload[key] = int(count)
    return payload


def _build_hotel_payload(db: Session, hotel: Hotel) -> dict[str, Any]:
    rating_rows = (
        db.query(Fuente.codigo, func.avg(Resena.rating_score_5))
        .join(Resena, Resena.fuente_id == Fuente.id)
        .filter(Resena.hotel_id == hotel.id)
        .group_by(Fuente.codigo)
        .all()
    )

    sentiment_rows = (
        db.query(func.lower(Resena.sentimiento), func.count(Resena.id))
        .filter(Resena.hotel_id == hotel.id)
        .group_by(func.lower(Resena.sentimiento))
        .all()
    )

    total_reviews = db.query(func.count(Resena.id)).filter(Resena.hotel_id == hotel.id).scalar() or 0
    sentiments = _sentiments_payload(sentiment_rows)

    sentiment_score = _safe_pct(sentiments["positive"], int(total_reviews)) if total_reviews else 0.0

    return {
        "id": str(hotel.id),
        "name": hotel.nombre,
        "location": hotel.ubicacion,
        "city": hotel.ciudad,
        "country": hotel.pais,
        "rating": round(float(hotel.rating_promedio), 2) if hotel.rating_promedio is not None else None,
        "price_per_night": float(hotel.precio_noche) if hotel.precio_noche is not None else None,
        "total_reviews": int(total_reviews),
        "sentiment_score": sentiment_score,
        "quality_score": float(hotel.calidad_score) if hotel.calidad_score is not None else None,
        "sustainability_score": float(hotel.sostenibilidad_score) if hotel.sostenibilidad_score is not None else None,
        "platforms": _platform_payload(rating_rows),
        "sentiments": sentiments,
        "features": hotel.features_json or [],
        "description": hotel.descripcion,
        "image_url": hotel.image_url,
    }


def _platforms_for_hotels(db: Session, hotel_ids: list[Any]) -> dict[Any, dict[str, float | None]]:
    if not hotel_ids:
        return {}

    rows = (
        db.query(Resena.hotel_id, func.lower(Fuente.codigo), func.avg(Resena.rating_score_5))
        .join(Fuente, Fuente.id == Resena.fuente_id)
        .filter(Resena.hotel_id.in_(hotel_ids))
        .group_by(Resena.hotel_id, func.lower(Fuente.codigo))
        .all()
    )

    payload: dict[Any, dict[str, float | None]] = {
        hotel_id: {"google": None, "booking": None, "airbnb": None} for hotel_id in hotel_ids
    }

    for hotel_id, source_code, avg_rating in rows:
        if source_code in payload[hotel_id]:
            payload[hotel_id][source_code] = round(float(avg_rating), 2) if avg_rating is not None else None

    return payload


def list_hotels(
    db: Session,
    query: str | None,
    sort: str,
    limit: int,
    offset: int,
    min_reviews: int | None,
    min_price: float | None,
    max_price: float | None,
    min_rating: float | None,
    min_quality: float | None,
    min_sustainability: float | None,
    sentiment: str | None,
    platforms: list[str] | None,
) -> list[dict[str, Any]]:
    positive_count = func.coalesce(
        func.sum(case((func.lower(func.coalesce(Resena.sentimiento, "")) == "positive", 1), else_=0)),
        0,
    )
    neutral_count = func.coalesce(
        func.sum(case((func.lower(func.coalesce(Resena.sentimiento, "")) == "neutral", 1), else_=0)),
        0,
    )
    negative_count = func.coalesce(
        func.sum(case((func.lower(func.coalesce(Resena.sentimiento, "")) == "negative", 1), else_=0)),
        0,
    )
    total_reviews = func.coalesce(func.count(Resena.id), 0)
    sentiment_score_expr = case(
        (total_reviews > 0, (positive_count * 100.0) / total_reviews),
        else_=0.0,
    )

    hotels_query = (
        db.query(
            Hotel,
            total_reviews.label("total_reviews"),
            positive_count.label("positive_reviews"),
            neutral_count.label("neutral_reviews"),
            negative_count.label("negative_reviews"),
            sentiment_score_expr.label("sentiment_score"),
        )
        .outerjoin(Resena, Resena.hotel_id == Hotel.id)
        .filter(Hotel.activo.is_(True))
        .group_by(Hotel.id)
    )

    if query:
        pattern = f"%{query.strip()}%"
        hotels_query = hotels_query.filter(
            (Hotel.nombre.ilike(pattern)) | (Hotel.ubicacion.ilike(pattern)) | (Hotel.ciudad.ilike(pattern))
        )

    if min_price is not None:
        hotels_query = hotels_query.filter(Hotel.precio_noche >= min_price)
    if max_price is not None:
        hotels_query = hotels_query.filter(Hotel.precio_noche <= max_price)
    if min_rating is not None:
        hotels_query = hotels_query.filter(Hotel.rating_promedio >= min_rating)
    if min_quality is not None:
        hotels_query = hotels_query.filter(Hotel.calidad_score >= min_quality)
    if min_sustainability is not None:
        hotels_query = hotels_query.filter(Hotel.sostenibilidad_score >= min_sustainability)
    if min_reviews is not None:
        hotels_query = hotels_query.having(total_reviews >= min_reviews)

    if sentiment:
        wanted = sentiment.lower()
        if wanted in {"positive", "neutral", "negative"}:
            if wanted == "positive":
                hotels_query = hotels_query.having(positive_count > 0)
            elif wanted == "neutral":
                hotels_query = hotels_query.having(neutral_count > 0)
            else:
                hotels_query = hotels_query.having(negative_count > 0)

    if platforms:
        wanted_platforms = {p.lower().strip() for p in platforms if p.strip()}
        if wanted_platforms:
            platform_exists = (
                db.query(Resena.id)
                .join(Fuente, Fuente.id == Resena.fuente_id)
                .filter(Resena.hotel_id == Hotel.id, func.lower(Fuente.codigo).in_(wanted_platforms))
                .exists()
            )
            hotels_query = hotels_query.filter(platform_exists)

    if sort == "rating":
        hotels_query = hotels_query.order_by(func.coalesce(Hotel.rating_promedio, 0).desc(), Hotel.nombre.asc())
    elif sort == "favorites":
        hotels_query = hotels_query.order_by(func.coalesce(Hotel.favorites_count, 0).desc(), Hotel.nombre.asc())
    elif sort == "price-low":
        hotels_query = hotels_query.order_by(Hotel.precio_noche.asc().nullslast(), Hotel.nombre.asc())
    elif sort == "price-high":
        hotels_query = hotels_query.order_by(Hotel.precio_noche.desc().nullslast(), Hotel.nombre.asc())
    elif sort == "reviews":
        hotels_query = hotels_query.order_by(total_reviews.desc(), Hotel.nombre.asc())
    elif sort == "quality":
        hotels_query = hotels_query.order_by(func.coalesce(Hotel.calidad_score, 0).desc(), Hotel.nombre.asc())
    elif sort == "sustainability":
        hotels_query = hotels_query.order_by(func.coalesce(Hotel.sostenibilidad_score, 0).desc(), Hotel.nombre.asc())
    elif sort == "balance":
        balance_score = (
            func.coalesce(Hotel.calidad_score, 0) * 0.4
            + func.coalesce(Hotel.sostenibilidad_score, 0) * 0.3
            + func.coalesce(Hotel.rating_promedio, 0) * 0.3
        )
        hotels_query = hotels_query.order_by(balance_score.desc(), Hotel.nombre.asc())
    else:
        hotels_query = hotels_query.order_by(sentiment_score_expr.desc(), Hotel.nombre.asc())

    rows = hotels_query.offset(offset).limit(limit).all()

    hotel_ids = [hotel.id for hotel, *_ in rows]
    platform_by_hotel = _platforms_for_hotels(db, hotel_ids)
    links_by_hotel = _platform_links_for_hotels(db, hotel_ids)
    review_texts_by_hotel = _review_texts_for_hotels(db, hotel_ids)

    payload: list[dict[str, Any]] = []
    for hotel, reviews_count, pos_count, neu_count, neg_count, sentiment_score in rows:
        review_texts = review_texts_by_hotel.get(hotel.id, [])
        features = hotel.features_json or _extract_keywords(review_texts, limit=5)

        fallback_links = {
            "google": None,
            "booking": None,
            "airbnb": None,
        }
        if hotel.url:
            hotel_url = hotel.url.strip().lower()
            if "google" in hotel_url:
                fallback_links["google"] = hotel.url
            elif "booking" in hotel_url:
                fallback_links["booking"] = hotel.url
            elif "airbnb" in hotel_url:
                fallback_links["airbnb"] = hotel.url

        platform_links = links_by_hotel.get(str(hotel.id), fallback_links)
        platform_links = {
            "google": platform_links.get("google") or fallback_links["google"],
            "booking": platform_links.get("booking") or fallback_links["booking"],
            "airbnb": platform_links.get("airbnb") or fallback_links["airbnb"],
        }

        payload.append(
            {
                "id": str(hotel.id),
                "name": hotel.nombre,
                "location": hotel.ubicacion,
                "city": hotel.ciudad,
                "country": hotel.pais,
                "rating": round(float(hotel.rating_promedio), 2) if hotel.rating_promedio is not None else None,
                "price_per_night": float(hotel.precio_noche) if hotel.precio_noche is not None else None,
                "total_reviews": int(reviews_count or 0),
                "sentiment_score": round(float(sentiment_score or 0), 2),
                "quality_score": float(hotel.calidad_score) if hotel.calidad_score is not None else None,
                "sustainability_score": float(hotel.sostenibilidad_score) if hotel.sostenibilidad_score is not None else None,
                "favorites_count": int(hotel.favorites_count or 0),
                "platforms": platform_by_hotel.get(
                    hotel.id,
                    {
                        "google": None,
                        "booking": None,
                        "airbnb": None,
                    },
                ),
                "platform_links": platform_links,
                "sentiments": _sentiments_from_counts(int(pos_count or 0), int(neu_count or 0), int(neg_count or 0)),
                "features": features,
                "description": _fallback_description(hotel, review_texts),
                "highlight_review": _highlight_review(review_texts),
                "image_url": hotel.image_url,
            }
        )

    return payload


def get_hotel_detail(db: Session, hotel_id: str) -> dict[str, Any] | None:
    hotel = db.query(Hotel).filter(Hotel.id == hotel_id, Hotel.activo.is_(True)).first()
    if not hotel:
        return None

    base = _build_hotel_payload(db, hotel)

    recent_reviews = (
        db.query(Resena, Fuente.codigo)
        .join(Fuente, Fuente.id == Resena.fuente_id)
        .filter(Resena.hotel_id == hotel.id)
        .order_by(Resena.fecha_publicacion.desc().nullslast(), Resena.creado_en.desc())
        .limit(10)
        .all()
    )

    base["recent_reviews"] = [
        {
            "id": str(review.id),
            "author": review.autor,
            "platform": source_code,
            "rating": float(review.rating_score_5) if review.rating_score_5 is not None else None,
            "date": review.fecha_publicacion,
            "text": review.resena_texto,
            "sentiment": review.sentimiento,
            "positive_text": review.texto_positivo,
            "negative_text": review.texto_negativo,
        }
        for review, source_code in recent_reviews
    ]

    return base


def update_hotel_favorite(db: Session, hotel_id: str, is_favorite: bool) -> dict[str, Any] | None:
    hotel = db.query(Hotel).filter(Hotel.id == hotel_id, Hotel.activo.is_(True)).first()
    if not hotel:
        return None

    current = int(hotel.favorites_count or 0)
    if is_favorite:
        hotel.favorites_count = current + 1
    else:
        hotel.favorites_count = max(0, current - 1)

    db.commit()
    db.refresh(hotel)

    return {
        "hotel_id": str(hotel.id),
        "favorites_count": int(hotel.favorites_count or 0),
    }


def get_hotel_reviews(
    db: Session,
    hotel_id: str,
    platform: str | None,
    sentiment: str | None,
    limit: int,
    offset: int,
) -> dict[str, Any] | None:
    hotel_exists = db.query(func.count(Hotel.id)).filter(Hotel.id == hotel_id, Hotel.activo.is_(True)).scalar()
    if not hotel_exists:
        return None

    query = db.query(Resena, Fuente.codigo).join(Fuente, Fuente.id == Resena.fuente_id).filter(Resena.hotel_id == hotel_id)

    if platform:
        query = query.filter(func.lower(Fuente.codigo) == platform.lower())
    if sentiment:
        query = query.filter(func.lower(func.coalesce(Resena.sentimiento, "")) == sentiment.lower())

    total = query.count()
    rows = (
        query.order_by(Resena.fecha_publicacion.desc().nullslast(), Resena.creado_en.desc()).offset(offset).limit(limit).all()
    )

    reviews = [
        {
            "id": str(review.id),
            "author": review.autor,
            "platform": source_code,
            "rating": float(review.rating_score_5) if review.rating_score_5 is not None else None,
            "date": review.fecha_publicacion,
            "text": review.resena_texto,
            "sentiment": review.sentimiento,
            "positive_text": review.texto_positivo,
            "negative_text": review.texto_negativo,
        }
        for review, source_code in rows
    ]

    return {
        "hotel_id": str(hotel_id),
        "total": int(total),
        "reviews": reviews,
    }
