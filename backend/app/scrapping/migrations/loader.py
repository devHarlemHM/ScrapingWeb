from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import UUID

from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.models.fuente import Fuente
from app.models.hotel import Hotel
from app.models.resena import Resena

JSON_DIR = Path(__file__).resolve().parents[1] / "json"
REQUIRED_JSON_FILES = {
    "google": "reseñas_google.json",
    "booking": "reseñas_booking.json",
    "airbnb": "reseñas_airbnb.json",
}

_MONTHS = {
    "enero": 1,
    "febrero": 2,
    "marzo": 3,
    "abril": 4,
    "mayo": 5,
    "junio": 6,
    "julio": 7,
    "agosto": 8,
    "septiembre": 9,
    "octubre": 10,
    "noviembre": 11,
    "diciembre": 12,
}


@dataclass(slots=True)
class ReviewInput:
    source_code: str
    hotel_name: str
    hotel_url: str | None
    author: str | None
    rating_raw: str | None
    rating_score_5: float | None
    date_raw: str | None
    date_value: datetime | None
    title: str | None
    review_text: str | None
    positive_text: str | None
    negative_text: str | None
    stay_type: str | None
    external_id: str | None
    payload: dict[str, Any]


def validate_json_inputs() -> dict[str, Path]:
    JSON_DIR.mkdir(parents=True, exist_ok=True)
    found: dict[str, Path] = {}

    missing: list[str] = []
    for source, file_name in REQUIRED_JSON_FILES.items():
        path = JSON_DIR / file_name
        if path.exists():
            found[source] = path
        else:
            missing.append(file_name)

    if missing:
        raise FileNotFoundError(
            "Faltan JSON requeridos en app/scrapping/json: " + ", ".join(missing)
        )

    return found


def _load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def _normalize_text(value: str | None) -> str:
    return (value or "").strip().lower()


def _parse_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)

    normalized = str(value).strip().replace(",", ".")
    match = re.search(r"\d+(?:\.\d+)?", normalized)
    if not match:
        return None
    try:
        return float(match.group(0))
    except ValueError:
        return None


def _parse_rating(raw: Any, source: str) -> tuple[str | None, float | None]:
    if raw is None:
        return None, None

    raw_str = str(raw).strip()
    value = _parse_float(raw_str)
    if value is None:
        return raw_str, None

    if source.lower() == "booking":
        return raw_str, round(min(5.0, value / 2.0), 2)
    if "/5" in raw_str:
        return raw_str, round(min(5.0, value), 2)
    return raw_str, round(min(5.0, value), 2)


def _parse_date(raw: Any) -> datetime | None:
    if raw is None:
        return None

    text = str(raw).strip()
    if not text:
        return None

    try:
        return datetime.strptime(text, "%Y-%m-%d").replace(tzinfo=UTC)
    except ValueError:
        pass

    booking_match = re.search(r"(\d{1,2})\s+de\s+([a-zA-Z]+)\s+de\s+(\d{4})", text.lower())
    if booking_match:
        day = int(booking_match.group(1))
        month = _MONTHS.get(booking_match.group(2))
        year = int(booking_match.group(3))
        if month:
            return datetime(year, month, day, tzinfo=UTC)

    airbnb_match = re.search(r"([a-zA-Z]+)\s+de\s+(\d{4})", text.lower())
    if airbnb_match:
        month = _MONTHS.get(airbnb_match.group(1))
        year = int(airbnb_match.group(2))
        if month:
            return datetime(year, month, 1, tzinfo=UTC)

    return None


def _sentiment_from_rating(rating_5: float | None) -> str:
    if rating_5 is None:
        return "neutral"
    if rating_5 >= 4.2:
        return "positive"
    if rating_5 >= 3.0:
        return "neutral"
    return "negative"


def _hash_review(source: str, hotel_name: str, author: str | None, date_raw: str | None, text: str) -> str:
    payload = "|".join(
        [
            _normalize_text(source),
            _normalize_text(hotel_name),
            _normalize_text(author),
            _normalize_text(date_raw),
            _normalize_text(text),
        ]
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _extract_google_reviews(payload: Any) -> list[ReviewInput]:
    results: list[ReviewInput] = []
    if not isinstance(payload, dict):
        return results

    for city_hotels in payload.values():
        if not isinstance(city_hotels, list):
            continue
        for hotel_data in city_hotels:
            if not isinstance(hotel_data, dict):
                continue
            hotel_name = str(hotel_data.get("nombre") or "Hotel sin nombre").strip()
            hotel_url = hotel_data.get("url")
            comments = hotel_data.get("comentarios", [])
            if not isinstance(comments, list):
                continue
            for comment in comments:
                if not isinstance(comment, dict):
                    continue
                rating_raw, rating_score_5 = _parse_rating(comment.get("puntuacion"), "google")
                review_text = (comment.get("texto") or "").strip() or None
                date_raw = (comment.get("fecha") or "").strip() or None
                results.append(
                    ReviewInput(
                        source_code="google",
                        hotel_name=hotel_name,
                        hotel_url=hotel_url,
                        author=comment.get("usuario"),
                        rating_raw=rating_raw,
                        rating_score_5=rating_score_5,
                        date_raw=date_raw,
                        date_value=_parse_date(date_raw),
                        title=None,
                        review_text=review_text,
                        positive_text=None,
                        negative_text=None,
                        stay_type=None,
                        external_id=str(comment.get("id") or "") or None,
                        payload=comment,
                    )
                )
    return results


def _extract_booking_reviews(payload: Any) -> list[ReviewInput]:
    results: list[ReviewInput] = []
    if not isinstance(payload, dict):
        return results

    comments = payload.get("comentarios_parciales", [])
    if not isinstance(comments, list):
        return results

    for comment in comments:
        if not isinstance(comment, dict):
            continue
        hotel_name = str(comment.get("hotel") or "Hotel sin nombre").strip()
        rating_raw, rating_score_5 = _parse_rating(comment.get("puntuacion"), "booking")
        positive_text = (comment.get("positivo") or "").strip() or None
        negative_text = (comment.get("negativo") or "").strip() or None
        review_text = " ".join([part for part in [positive_text, negative_text] if part]).strip() or None
        date_raw = (comment.get("Registro") or "").strip() or None

        results.append(
            ReviewInput(
                source_code="booking",
                hotel_name=hotel_name,
                hotel_url=comment.get("url"),
                author=comment.get("usuario"),
                rating_raw=rating_raw,
                rating_score_5=rating_score_5,
                date_raw=date_raw,
                date_value=_parse_date(date_raw),
                title=None,
                review_text=review_text,
                positive_text=positive_text,
                negative_text=negative_text,
                stay_type=None,
                external_id=str(comment.get("id") or "") or None,
                payload=comment,
            )
        )

    return results


def _extract_airbnb_reviews(payload: Any) -> list[ReviewInput]:
    results: list[ReviewInput] = []
    if not isinstance(payload, list):
        return results

    for comment in payload:
        if not isinstance(comment, dict):
            continue
        hotel_name = str(comment.get("titulo_alojamiento") or "Alojamiento Airbnb").strip()
        rating_raw, rating_score_5 = _parse_rating(comment.get("puntuacion"), "airbnb")
        review_text = (comment.get("comentario") or "").strip() or None
        if review_text == "N/A":
            review_text = None
        date_raw = (comment.get("fecha") or "").strip() or None
        results.append(
            ReviewInput(
                source_code="airbnb",
                hotel_name=hotel_name,
                hotel_url=comment.get("url_alojamiento"),
                author=comment.get("nombre"),
                rating_raw=rating_raw,
                rating_score_5=rating_score_5,
                date_raw=date_raw,
                date_value=_parse_date(date_raw),
                title=comment.get("tipo_estadia"),
                review_text=review_text,
                positive_text=None,
                negative_text=None,
                stay_type=comment.get("tipo_estadia"),
                external_id=str(comment.get("room_id") or "") or None,
                payload=comment,
            )
        )

    return results


def _seed_sources(db: Session) -> dict[str, Fuente]:
    existing = {source.codigo.lower(): source for source in db.query(Fuente).all()}

    for code, name in (("google", "Google"), ("booking", "Booking"), ("airbnb", "Airbnb")):
        if code not in existing:
            source = Fuente(codigo=code, nombre=name)
            db.add(source)
            db.flush()
            existing[code] = source

    return existing


def _upsert_hotel(db: Session, cache: dict[str, Hotel], review: ReviewInput) -> Hotel:
    key = _normalize_text(review.hotel_name)
    if key in cache:
        return cache[key]

    hotel = Hotel(
        nombre=review.hotel_name,
        ubicacion="Barranquilla",
        ciudad="Barranquilla",
        pais="Colombia",
        url=review.hotel_url,
        descripcion="Hotel importado desde scrapping JSON.",
        precio_noche=None,
        image_url=None,
        features_json=[],
    )
    db.add(hotel)
    db.flush()
    cache[key] = hotel
    return hotel


def _refresh_hotel_metrics(db: Session) -> None:
    hotels = db.query(Hotel).all()
    for hotel in hotels:
        stats = (
            db.query(
                func.avg(Resena.rating_score_5),
                func.count(Resena.id),
                func.sum(case((func.lower(Resena.sentimiento) == "positive", 1), else_=0)),
            )
            .filter(Resena.hotel_id == hotel.id)
            .one()
        )

        avg_rating = float(stats[0]) if stats[0] is not None else None
        total_reviews = int(stats[1] or 0)
        positive_reviews = int(stats[2] or 0)

        hotel.rating_promedio = round(avg_rating, 2) if avg_rating is not None else None
        hotel.calidad_score = round(avg_rating, 2) if avg_rating is not None else None

        if total_reviews:
            ratio = positive_reviews / total_reviews
            hotel.sostenibilidad_score = round(min(5.0, max(1.0, ratio * 5.0)), 2)
        else:
            hotel.sostenibilidad_score = None


def migrate_json_to_db(db: Session, run_id: UUID) -> dict[str, int]:
    json_files = validate_json_inputs()

    fuentes = _seed_sources(db)

    # Replace strategy: keep only latest complete snapshot.
    db.query(Resena).delete(synchronize_session=False)
    db.query(Hotel).delete(synchronize_session=False)
    db.flush()

    hotel_cache: dict[str, Hotel] = {}
    inserted_reviews = 0
    skipped_duplicates = 0
    seen_hashes: set[str] = set()

    all_reviews: list[ReviewInput] = []
    all_reviews.extend(_extract_google_reviews(_load_json(json_files["google"])))
    all_reviews.extend(_extract_booking_reviews(_load_json(json_files["booking"])))
    all_reviews.extend(_extract_airbnb_reviews(_load_json(json_files["airbnb"])))

    for item in all_reviews:
        hotel = _upsert_hotel(db, hotel_cache, item)
        text_for_hash = item.review_text or item.positive_text or item.negative_text or ""
        hash_value = _hash_review(item.source_code, item.hotel_name, item.author, item.date_raw, text_for_hash)

        if hash_value in seen_hashes:
            skipped_duplicates += 1
            continue
        seen_hashes.add(hash_value)

        review = Resena(
            hotel_id=hotel.id,
            fuente_id=fuentes[item.source_code].id,
            scrape_run_id=run_id,
            review_external_id=item.external_id,
            autor=item.author,
            titulo=item.title,
            resena_texto=item.review_text,
            texto_positivo=item.positive_text,
            texto_negativo=item.negative_text,
            rating_raw=item.rating_raw,
            rating_score_5=item.rating_score_5,
            fecha_raw=item.date_raw,
            fecha_publicacion=item.date_value,
            tipo_estadia=item.stay_type,
            sentimiento=_sentiment_from_rating(item.rating_score_5),
            payload_json=item.payload,
            hash_unico=hash_value,
        )
        db.add(review)
        inserted_reviews += 1

    _refresh_hotel_metrics(db)

    return {
        "hotels": len(hotel_cache),
        "reviews": inserted_reviews,
        "sources": len(fuentes),
        "duplicates_skipped": skipped_duplicates,
    }
