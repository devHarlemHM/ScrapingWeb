from __future__ import annotations

from datetime import UTC, datetime
from collections.abc import Iterable
import re
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

POSITIVE_HINTS = {
    "excelente",
    "limpio",
    "comod",
    "recomend",
    "amable",
    "agradable",
    "perfect",
    "genial",
    "espectacular",
    "tranquil",
    "segur",
    "hermos",
    "encant",
    "atent",
    "buena",
    "bien",
}

NEGATIVE_HINTS = {
    "malo",
    "sucio",
    "ruido",
    "demora",
    "caro",
    "peor",
    "horrible",
    "incomod",
    "deficient",
    "insegur",
    "problema",
    "fatal",
    "mal",
    "nunca",
    "cancel",
}

HOST_REPLY_MARKERS = {
    "respuesta del anfitri",
    "respuesta del alojamiento",
    "respuesta de",
    "host response",
    "owner response",
    "los esperamos",
    "esperamos nuevamente",
}

HOST_REPLY_STARTS = (
    "gracias",
    "estimado",
    "estimada",
    "mil gracias",
    "nos alegra",
    "me alegra",
    "lamentamos",
    "esperamos",
    "atentamente",
    "cordialmente",
)

HOST_REPLY_AUTHOR_MARKERS = (
    "respuesta de",
    "host response",
    "owner response",
    "anfitri",
    "propietario",
)

_GENERIC_HOTEL_DESCRIPTIONS = {
    "hotel importado desde scrapping json",
    "hotel importado desde scraping json",
    "hotel importado de scrapping json",
    "hotel importado de scraping json",
}


def _normalize_description(value: str) -> str:
    return " ".join(
        "".join(char.lower() for char in token if char.isalnum())
        for token in value.split()
    ).strip()


def _is_generic_hotel_description(value: str | None) -> bool:
    if not value:
        return False
    normalized = _normalize_description(value)
    return normalized in _GENERIC_HOTEL_DESCRIPTIONS


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
        {
            "id": "worst-balance",
            "name": "Peor Balance",
            "description": "Hoteles con menor balance general",
            "count": int(base_total),
            "sort": "worst-balance",
        },
        {
            "id": "one-star",
            "name": "1 Estrella",
            "description": "Hoteles con las calificaciones mas bajas",
            "count": int(base_total),
            "sort": "rating-asc",
        },
    ]


def _platform_payload(ratings: Iterable[tuple[str, float]]) -> dict[str, float | None]:
    payload: dict[str, float | None] = {"google": None, "booking": None, "airbnb": None}
    for code, rating in ratings:
        payload[code.lower()] = round(float(rating), 2)
    return payload


def _normalize_token(token: str) -> str:
    return "".join(ch.lower() for ch in token if ch.isalnum())


def _tokenize(text: str) -> list[str]:
    return [_normalize_token(part) for part in text.split() if _normalize_token(part)]


def _is_host_reply_text(text: str | None) -> bool:
    if not text:
        return False
    lower_text = text.strip().lower()
    if not lower_text:
        return False

    if any(marker in lower_text for marker in HOST_REPLY_MARKERS):
        return True
    if lower_text.startswith(HOST_REPLY_STARTS):
        # Heuristica conservadora: mensajes de agradecimiento cortos suelen ser respuesta del anfitrion.
        if len(lower_text) <= 220:
            return True
        if "esperamos" in lower_text or "volver" in lower_text or "nuevamente" in lower_text:
            return True
    return False


def _is_host_reply_author(author_or_title: str | None) -> bool:
    if not author_or_title:
        return False
    value = author_or_title.strip().lower()
    if not value:
        return False
    return any(marker in value for marker in HOST_REPLY_AUTHOR_MARKERS)


def _clean_review_text(review: Resena) -> str | None:
    if _is_host_reply_author(review.autor) or _is_host_reply_author(review.titulo):
        return None

    candidates = [review.resena_texto, review.texto_positivo, review.texto_negativo]
    merged = " ".join([(value or "").strip() for value in candidates if value and value.strip()]).strip()
    if not merged:
        return None
    if merged.lower() == "n/a":
        return None
    if _is_host_reply_text(merged):
        return None
    return merged


def _db_sentiment(value: str | None) -> str:
    normalized = (value or "").strip().lower()
    if normalized in {"positive", "neutral", "negative"}:
        return normalized
    return "neutral"


def _month_key_from_review(review: Resena) -> str | None:
    if review.fecha_publicacion:
        return review.fecha_publicacion.strftime("%Y-%m")

    raw = (review.fecha_raw or "").strip().lower()
    if not raw:
        return None

    numeric_match = re.search(r"(\d{4})-(\d{2})", raw)
    if numeric_match:
        return f"{numeric_match.group(1)}-{numeric_match.group(2)}"

    month_map = {
        "enero": "01",
        "febrero": "02",
        "marzo": "03",
        "abril": "04",
        "mayo": "05",
        "junio": "06",
        "julio": "07",
        "agosto": "08",
        "septiembre": "09",
        "octubre": "10",
        "noviembre": "11",
        "diciembre": "12",
    }
    month_match = re.search(
        r"(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})",
        raw,
    )
    if month_match:
        month = month_map.get(month_match.group(1))
        year = month_match.group(2)
        if month:
            return f"{year}-{month}"

    return None


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
    if hotel.descripcion and hotel.descripcion.strip() and not _is_generic_hotel_description(hotel.descripcion):
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
        "description": None if _is_generic_hotel_description(hotel.descripcion) else hotel.descripcion,
        "image_url": hotel.image_url,
    }


def _platforms_for_hotels(db: Session, hotel_ids: list[Any]) -> dict[Any, dict[str, int]]:
    if not hotel_ids:
        return {}

    rows = (
        db.query(Resena.hotel_id, func.lower(Fuente.codigo), func.count(Resena.id))
        .join(Fuente, Fuente.id == Resena.fuente_id)
        .filter(Resena.hotel_id.in_(hotel_ids))
        .group_by(Resena.hotel_id, func.lower(Fuente.codigo))
        .all()
    )

    payload: dict[Any, dict[str, int]] = {
        hotel_id: {"google": 0, "booking": 0, "airbnb": 0} for hotel_id in hotel_ids
    }

    for hotel_id, source_code, reviews_count in rows:
        if source_code in payload[hotel_id]:
            payload[hotel_id][source_code] = int(reviews_count or 0)

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
    avg_review_rating = func.avg(Resena.rating_score_5)
    effective_rating_expr = func.coalesce(func.nullif(Hotel.rating_promedio, 0), avg_review_rating, 3.0)
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
            effective_rating_expr.label("effective_rating"),
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
        hotels_query = hotels_query.having(effective_rating_expr >= min_rating)
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

    sentiment_component = sentiment_score_expr / 20.0

    if sort == "rating":
        hotels_query = hotels_query.order_by(effective_rating_expr.desc(), Hotel.nombre.asc())
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
            + effective_rating_expr * 0.2
            + sentiment_component * 0.1
        )
        hotels_query = hotels_query.order_by(balance_score.desc(), Hotel.nombre.asc())
    elif sort == "worst-balance":
        balance_score = (
            func.coalesce(Hotel.calidad_score, 0) * 0.4
            + func.coalesce(Hotel.sostenibilidad_score, 0) * 0.3
            + effective_rating_expr * 0.2
            + sentiment_component * 0.1
        )
        hotels_query = hotels_query.having(total_reviews > 0)
        hotels_query = hotels_query.having(negative_count > 0)
        hotels_query = hotels_query.having(negative_count >= positive_count)
        hotels_query = hotels_query.order_by(balance_score.asc(), negative_count.desc(), Hotel.nombre.asc())
    elif sort == "rating-asc":
        hotels_query = hotels_query.order_by(effective_rating_expr.asc(), Hotel.nombre.asc())
    else:
        hotels_query = hotels_query.order_by(sentiment_score_expr.desc(), Hotel.nombre.asc())

    rows = hotels_query.offset(offset).limit(limit).all()

    hotel_ids = [hotel.id for hotel, *_ in rows]
    platform_by_hotel = _platforms_for_hotels(db, hotel_ids)
    links_by_hotel = _platform_links_for_hotels(db, hotel_ids)
    review_texts_by_hotel = _review_texts_for_hotels(db, hotel_ids)

    payload: list[dict[str, Any]] = []
    for hotel, reviews_count, pos_count, neu_count, neg_count, sentiment_score, effective_rating in rows:
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
                "rating": round(float(effective_rating), 2) if effective_rating is not None else None,
                "price_per_night": float(hotel.precio_noche) if hotel.precio_noche is not None else None,
                "total_reviews": int(reviews_count or 0),
                "sentiment_score": round(float(sentiment_score or 0), 2),
                "quality_score": float(hotel.calidad_score) if hotel.calidad_score is not None else None,
                "sustainability_score": float(hotel.sostenibilidad_score) if hotel.sostenibilidad_score is not None else None,
                "favorites_count": int(hotel.favorites_count or 0),
                "platforms": platform_by_hotel.get(
                    hotel.id,
                    {
                        "google": 0,
                        "booking": 0,
                        "airbnb": 0,
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


def list_hotels_advanced(
    db: Session,
    sort: str,
    limit: int,
    offset: int,
    platforms: list[str] | None,
    sentiment: str | None,
    rating_star: int | None,
    date_from: datetime | None,
    date_to: datetime | None,
) -> list[dict[str, Any]]:
    wanted_platforms = {p.lower().strip() for p in (platforms or []) if p and p.strip()}
    wanted_sentiment = (sentiment or "").strip().lower()
    if wanted_sentiment not in {"positive", "neutral", "negative"}:
        wanted_sentiment = ""

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
    total_reviews = func.count(Resena.id)
    avg_rating = func.avg(Resena.rating_score_5)

    grouped_reviews = (
        db.query(
            Resena.hotel_id.label("hotel_id"),
            total_reviews.label("total_reviews"),
            positive_count.label("positive_reviews"),
            neutral_count.label("neutral_reviews"),
            negative_count.label("negative_reviews"),
            avg_rating.label("effective_rating"),
        )
        .join(Fuente, Fuente.id == Resena.fuente_id)
        .group_by(Resena.hotel_id)
    )

    if wanted_platforms:
        grouped_reviews = grouped_reviews.filter(func.lower(Fuente.codigo).in_(wanted_platforms))

    if wanted_sentiment:
        grouped_reviews = grouped_reviews.filter(func.lower(func.coalesce(Resena.sentimiento, "")) == wanted_sentiment)

    if date_from is not None:
        grouped_reviews = grouped_reviews.filter(Resena.fecha_publicacion.isnot(None), Resena.fecha_publicacion >= date_from)

    if date_to is not None:
        grouped_reviews = grouped_reviews.filter(Resena.fecha_publicacion.isnot(None), Resena.fecha_publicacion <= date_to)

    grouped_reviews = grouped_reviews.having(total_reviews > 0)

    if rating_star is not None:
        if rating_star >= 5:
            grouped_reviews = grouped_reviews.having(avg_rating >= 5.0)
        else:
            grouped_reviews = grouped_reviews.having(avg_rating >= float(rating_star), avg_rating < float(rating_star + 1))

    grouped_subquery = grouped_reviews.subquery()

    sentiment_score_expr = case(
        (grouped_subquery.c.total_reviews > 0, (grouped_subquery.c.positive_reviews * 100.0) / grouped_subquery.c.total_reviews),
        else_=0.0,
    )

    hotels_query = (
        db.query(
            Hotel,
            grouped_subquery.c.total_reviews,
            grouped_subquery.c.positive_reviews,
            grouped_subquery.c.neutral_reviews,
            grouped_subquery.c.negative_reviews,
            grouped_subquery.c.effective_rating,
            sentiment_score_expr.label("sentiment_score"),
        )
        .join(grouped_subquery, grouped_subquery.c.hotel_id == Hotel.id)
        .filter(Hotel.activo.is_(True))
    )

    if sort == "rating-asc":
        hotels_query = hotels_query.order_by(grouped_subquery.c.effective_rating.asc().nullslast(), Hotel.nombre.asc())
    elif sort == "rating-desc":
        hotels_query = hotels_query.order_by(grouped_subquery.c.effective_rating.desc().nullslast(), Hotel.nombre.asc())
    else:
        hotels_query = hotels_query.order_by(grouped_subquery.c.total_reviews.desc(), Hotel.nombre.asc())

    rows = hotels_query.offset(offset).limit(limit).all()

    hotel_ids = [hotel.id for hotel, *_ in rows]

    filtered_platform_counts: dict[Any, dict[str, int]] = {
        hotel_id: {"google": 0, "booking": 0, "airbnb": 0} for hotel_id in hotel_ids
    }

    if hotel_ids:
        platform_counts_query = (
            db.query(Resena.hotel_id, func.lower(Fuente.codigo), func.count(Resena.id))
            .join(Fuente, Fuente.id == Resena.fuente_id)
            .filter(Resena.hotel_id.in_(hotel_ids))
        )

        if wanted_platforms:
            platform_counts_query = platform_counts_query.filter(func.lower(Fuente.codigo).in_(wanted_platforms))

        if wanted_sentiment:
            platform_counts_query = platform_counts_query.filter(
                func.lower(func.coalesce(Resena.sentimiento, "")) == wanted_sentiment
            )

        if date_from is not None:
            platform_counts_query = platform_counts_query.filter(
                Resena.fecha_publicacion.isnot(None), Resena.fecha_publicacion >= date_from
            )

        if date_to is not None:
            platform_counts_query = platform_counts_query.filter(
                Resena.fecha_publicacion.isnot(None), Resena.fecha_publicacion <= date_to
            )

        platform_counts_rows = platform_counts_query.group_by(Resena.hotel_id, func.lower(Fuente.codigo)).all()
        for hotel_id, source_code, count in platform_counts_rows:
            if hotel_id in filtered_platform_counts and source_code in filtered_platform_counts[hotel_id]:
                filtered_platform_counts[hotel_id][source_code] = int(count or 0)

    filtered_review_texts: dict[Any, list[str]] = {hotel_id: [] for hotel_id in hotel_ids}
    if hotel_ids:
        texts_query = (
            db.query(Resena)
            .join(Fuente, Fuente.id == Resena.fuente_id)
            .filter(Resena.hotel_id.in_(hotel_ids))
            .order_by(Resena.hotel_id.asc(), Resena.fecha_publicacion.desc().nullslast(), Resena.creado_en.desc())
        )

        if wanted_platforms:
            texts_query = texts_query.filter(func.lower(Fuente.codigo).in_(wanted_platforms))

        if wanted_sentiment:
            texts_query = texts_query.filter(func.lower(func.coalesce(Resena.sentimiento, "")) == wanted_sentiment)

        if date_from is not None:
            texts_query = texts_query.filter(Resena.fecha_publicacion.isnot(None), Resena.fecha_publicacion >= date_from)

        if date_to is not None:
            texts_query = texts_query.filter(Resena.fecha_publicacion.isnot(None), Resena.fecha_publicacion <= date_to)

        for review in texts_query.all():
            text_value = _clean_review_text(review)
            if not text_value:
                continue
            current = filtered_review_texts.setdefault(review.hotel_id, [])
            if len(current) < 8:
                current.append(text_value)

    links_by_hotel = _platform_links_for_hotels(db, hotel_ids)

    payload: list[dict[str, Any]] = []
    for hotel, reviews_count, pos_count, neu_count, neg_count, effective_rating, sentiment_score in rows:
        review_texts = filtered_review_texts.get(hotel.id, [])
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
                "rating": round(float(effective_rating), 2) if effective_rating is not None else None,
                "price_per_night": float(hotel.precio_noche) if hotel.precio_noche is not None else None,
                "total_reviews": int(reviews_count or 0),
                "sentiment_score": round(float(sentiment_score or 0), 2),
                "quality_score": float(hotel.calidad_score) if hotel.calidad_score is not None else None,
                "sustainability_score": float(hotel.sostenibilidad_score) if hotel.sostenibilidad_score is not None else None,
                "favorites_count": int(hotel.favorites_count or 0),
                "platforms": filtered_platform_counts.get(
                    hotel.id,
                    {
                        "google": 0,
                        "booking": 0,
                        "airbnb": 0,
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

    recent_reviews_rows = (
        db.query(Resena, Fuente.codigo)
        .join(Fuente, Fuente.id == Resena.fuente_id)
        .filter(Resena.hotel_id == hotel.id)
        .order_by(Resena.fecha_publicacion.desc().nullslast(), Resena.creado_en.desc())
        .limit(250)
        .all()
    )

    cleaned_recent_reviews: list[dict[str, Any]] = []
    for review, source_code in recent_reviews_rows:
        text_value = _clean_review_text(review)
        if not text_value:
            continue
        cleaned_recent_reviews.append(
            {
                "id": str(review.id),
                "author": review.autor,
                "platform": source_code,
                "rating": float(review.rating_score_5) if review.rating_score_5 is not None else None,
                "date": review.fecha_publicacion,
                "text": text_value,
                "sentiment": _db_sentiment(review.sentimiento),
                "positive_text": review.texto_positivo,
                "negative_text": review.texto_negativo,
            }
        )
        if len(cleaned_recent_reviews) >= 10:
            break

    base["recent_reviews"] = cleaned_recent_reviews

    return base


def _last_six_month_keys(anchor_month: str | None = None) -> list[str]:
    if anchor_month and re.match(r"^\d{4}-\d{2}$", anchor_month):
        year = int(anchor_month[:4])
        month = int(anchor_month[5:7])
    else:
        now = datetime.now(UTC)
        year = now.year
        month = now.month

    months: list[str] = []
    for _ in range(6):
        months.append(f"{year:04d}-{month:02d}")
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    months.reverse()
    return months


def _topic_analysis(rows: list[tuple[str, str | None]]) -> list[dict[str, Any]]:
    topics: dict[str, dict[str, int]] = {}
    for text, sentiment in rows:
        seen_tokens: set[str] = set()
        for raw in text.split():
            token = _normalize_token(raw)
            if len(token) < 4 or token in STOPWORDS:
                continue
            if token in seen_tokens:
                continue
            seen_tokens.add(token)
            if token not in topics:
                topics[token] = {"mentions": 0, "positive": 0, "neutral": 0, "negative": 0}
            topics[token]["mentions"] += 1
            sentiment_key = (sentiment or "neutral").lower()
            if sentiment_key not in {"positive", "neutral", "negative"}:
                sentiment_key = "neutral"
            topics[token][sentiment_key] += 1

    top = sorted(topics.items(), key=lambda item: (-item[1]["mentions"], item[0]))[:8]
    payload: list[dict[str, Any]] = []
    for token, values in top:
        mentions = values["mentions"]
        payload.append(
            {
                "topic": token.capitalize(),
                "mentions": mentions,
                "positive": values["positive"],
                "neutral": values["neutral"],
                "negative": values["negative"],
                "positive_pct": _safe_pct(values["positive"], mentions),
            }
        )
    return payload


def get_hotel_analytics(db: Session, hotel_id: str) -> dict[str, Any] | None:
    hotel = db.query(Hotel).filter(Hotel.id == hotel_id, Hotel.activo.is_(True)).first()
    if not hotel:
        return None

    rows = (
        db.query(Resena, Fuente.codigo)
        .join(Fuente, Fuente.id == Resena.fuente_id)
        .filter(Resena.hotel_id == hotel.id)
        .order_by(Resena.fecha_publicacion.desc().nullslast(), Resena.creado_en.desc())
        .all()
    )

    cleaned_reviews: list[dict[str, Any]] = []
    for review, source_code in rows:
        text_value = _clean_review_text(review)
        if not text_value:
            continue
        cleaned_reviews.append(
            {
                "platform": (source_code or "").lower(),
                "rating": float(review.rating_score_5) if review.rating_score_5 is not None else None,
                "sentiment": _db_sentiment(review.sentimiento),
                "text": text_value,
                "month": _month_key_from_review(review),
            }
        )

    sentiments = {"positive": 0, "neutral": 0, "negative": 0}
    for item in cleaned_reviews:
        sentiments[item["sentiment"]] += 1
    total_reviews = len(cleaned_reviews)

    sentiment_percentages = {
        "positive": _safe_pct(sentiments["positive"], total_reviews),
        "neutral": _safe_pct(sentiments["neutral"], total_reviews),
        "negative": _safe_pct(sentiments["negative"], total_reviews),
    }

    platform_map: dict[str, dict[str, Any]] = {}
    for item in cleaned_reviews:
        code = item["platform"]
        if code not in platform_map:
            platform_map[code] = {
                "reviews": 0,
                "rating_sum": 0.0,
                "rating_count": 0,
                "positive": 0,
                "neutral": 0,
                "negative": 0,
            }
        entry = platform_map[code]
        entry["reviews"] += 1
        entry[item["sentiment"]] += 1
        if item["rating"] is not None:
            entry["rating_sum"] += float(item["rating"])
            entry["rating_count"] += 1

    platform_breakdown = []
    for code, entry in platform_map.items():
        reviews_count = int(entry["reviews"])
        avg_rating = None
        if entry["rating_count"] > 0:
            avg_rating = round(entry["rating_sum"] / entry["rating_count"], 2)
        platform_breakdown.append(
            {
                "platform": code,
                "reviews": reviews_count,
                "avg_rating": avg_rating,
                "positive": int(entry["positive"]),
                "neutral": int(entry["neutral"]),
                "negative": int(entry["negative"]),
                "positive_pct": _safe_pct(int(entry["positive"]), reviews_count),
            }
        )
    platform_breakdown.sort(key=lambda item: item["reviews"], reverse=True)

    latest_data_month = max((item["month"] for item in cleaned_reviews if item["month"]), default=None)
    months = _last_six_month_keys(latest_data_month)
    trend_map = {month: {"positive": 0, "neutral": 0, "negative": 0, "total": 0} for month in months}
    for item in cleaned_reviews:
        month = item["month"]
        if not month or month not in trend_map:
            continue
        sentiment_key = item["sentiment"]
        trend_map[month][sentiment_key] += 1
        trend_map[month]["total"] += 1

    trend = []
    for month in months:
        row = trend_map[month]
        trend.append(
            {
                "month": month,
                "positive": int(row["positive"]),
                "neutral": int(row["neutral"]),
                "negative": int(row["negative"]),
                "total": int(row["total"]),
                "positive_pct": _safe_pct(int(row["positive"]), int(row["total"])),
            }
        )

    topics = _topic_analysis([(item["text"], item["sentiment"]) for item in cleaned_reviews])

    return {
        "hotel_id": str(hotel.id),
        "hotel_name": hotel.nombre,
        "total_reviews": int(total_reviews),
        "sentiments": sentiments,
        "sentiment_percentages": sentiment_percentages,
        "platform_breakdown": platform_breakdown,
        "topics": topics,
        "trend_6m": trend,
    }


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
    rows = query.order_by(Resena.fecha_publicacion.desc().nullslast(), Resena.creado_en.desc()).all()

    filtered_reviews: list[dict[str, Any]] = []
    wanted_sentiment = sentiment.lower() if sentiment else None
    for review, source_code in rows:
        text_value = _clean_review_text(review)
        if not text_value:
            continue
        db_sentiment = _db_sentiment(review.sentimiento)
        if wanted_sentiment and db_sentiment != wanted_sentiment:
            continue

        filtered_reviews.append(
            {
                "id": str(review.id),
                "author": review.autor,
                "platform": source_code,
                "rating": float(review.rating_score_5) if review.rating_score_5 is not None else None,
                "date": review.fecha_publicacion,
                "text": text_value,
                "sentiment": db_sentiment,
                "positive_text": review.texto_positivo,
                "negative_text": review.texto_negativo,
            }
        )

    total = len(filtered_reviews)
    reviews = filtered_reviews[offset : offset + limit]

    return {
        "hotel_id": str(hotel_id),
        "total": int(total),
        "reviews": reviews,
    }
