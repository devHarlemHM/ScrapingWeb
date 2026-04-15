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

NEGATION_TOKENS = {
    "no",
    "nunca",
    "jamas",
    "sin",
    "ni",
    "tampoco",
}

CONTRAST_TOKENS = {
    "pero",
    "aunque",
    "sinembargo",
}

PLATFORM_RATING_THRESHOLDS = {
    "google": (4.3, 2.3),
    "booking": (4.1, 2.4),
    "airbnb": (4.4, 2.5),
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
    return _normalize_description(value) in _GENERIC_HOTEL_DESCRIPTIONS


def _extract_hotel_description(review: ReviewInput) -> str | None:
    if isinstance(review.payload, dict):
        for key in ("descripcion", "description", "descripcion_alojamiento", "about", "summary"):
            candidate = review.payload.get(key)
            if isinstance(candidate, str):
                text = candidate.strip()
                if len(text) >= 25 and not _is_generic_hotel_description(text):
                    return text[:280]

    if review.review_text:
        text = review.review_text.strip()
        if len(text) >= 35:
            return text[:220]

    return None


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


def _normalize_token(token: str) -> str:
    return "".join(ch.lower() for ch in token if ch.isalnum())


def _tokenize(text: str) -> list[str]:
    return [_normalize_token(part) for part in text.split() if _normalize_token(part)]


def _token_matches_hint(token: str, hint: str) -> bool:
    if len(hint) <= 3:
        return token == hint
    return token.startswith(hint)


def _token_label(token: str) -> int:
    if any(_token_matches_hint(token, hint) for hint in POSITIVE_HINTS):
        return 1
    if any(_token_matches_hint(token, hint) for hint in NEGATIVE_HINTS):
        return -1
    return 0


def _clause_score(tokens: list[str]) -> tuple[float, int, int]:
    score = 0.0
    positive_hits = 0
    negative_hits = 0

    for idx, token in enumerate(tokens):
        label = _token_label(token)
        if label == 0:
            continue

        negated = any(prev in NEGATION_TOKENS for prev in tokens[max(0, idx - 3) : idx])
        if negated:
            label *= -1

        score += float(label)
        if label > 0:
            positive_hits += 1
        else:
            negative_hits += 1

    return score, positive_hits, negative_hits


def _split_by_contrast(tokens: list[str]) -> list[list[str]]:
    segments: list[list[str]] = []
    current: list[str] = []

    for token in tokens:
        if token in CONTRAST_TOKENS:
            if current:
                segments.append(current)
                current = []
            continue
        current.append(token)

    if current:
        segments.append(current)
    return segments


def _text_score(text: str) -> tuple[float, int, int]:
    tokens = _tokenize(text)
    if not tokens:
        return 0.0, 0, 0

    segments = _split_by_contrast(tokens)
    if not segments:
        return _clause_score(tokens)

    total_score = 0.0
    total_positive_hits = 0
    total_negative_hits = 0

    for idx, segment in enumerate(segments):
        score, pos_hits, neg_hits = _clause_score(segment)
        weight = 1.0
        # In Spanish reviews, sentiment after "pero/aunque" usually dominates.
        if idx == len(segments) - 1 and len(segments) > 1:
            weight = 1.6

        total_score += score * weight
        total_positive_hits += pos_hits
        total_negative_hits += neg_hits

    return total_score, total_positive_hits, total_negative_hits


def _is_host_reply_text(text: str | None) -> bool:
    if not text:
        return False

    lower_text = text.strip().lower()
    if not lower_text:
        return False

    if any(marker in lower_text for marker in HOST_REPLY_MARKERS):
        return True
    if lower_text.startswith(HOST_REPLY_STARTS):
        if len(lower_text) <= 220:
            return True
        if "esperamos" in lower_text or "volver" in lower_text or "nuevamente" in lower_text:
            return True
    return False


def _is_host_reply_author(value: str | None) -> bool:
    if not value:
        return False
    normalized = value.strip().lower()
    if not normalized:
        return False
    return any(marker in normalized for marker in HOST_REPLY_AUTHOR_MARKERS)


def _merged_review_text(item: ReviewInput) -> str | None:
    candidates = [item.review_text, item.positive_text, item.negative_text]
    merged = " ".join([(value or "").strip() for value in candidates if value and value.strip()]).strip()
    if not merged:
        return None
    if merged.lower() == "n/a":
        return None
    return merged


def _sentiment_from_review(item: ReviewInput) -> str:
    text_value = _merged_review_text(item)

    if _is_host_reply_author(item.author) or _is_host_reply_author(item.title) or _is_host_reply_text(text_value):
        return "neutral"

    text_bias: str | None = None
    lexical_score = 0.0
    positive_hits = 0
    negative_hits = 0

    booking_positive = bool((item.positive_text or "").strip()) and (item.positive_text or "").strip().lower() != "n/a"
    booking_negative = bool((item.negative_text or "").strip()) and (item.negative_text or "").strip().lower() != "n/a"

    if item.source_code.lower() == "booking":
        if booking_positive and not booking_negative:
            lexical_score += 1.5
            positive_hits += 1
        elif booking_negative and not booking_positive:
            lexical_score -= 1.5
            negative_hits += 1

    if text_value:
        text_score, text_positive_hits, text_negative_hits = _text_score(text_value)
        lexical_score += text_score
        positive_hits += text_positive_hits
        negative_hits += text_negative_hits
        diff = positive_hits - negative_hits

        if lexical_score >= 2.0:
            return "positive"
        if lexical_score <= -2.0:
            return "negative"

        if diff >= 2:
            return "positive"
        if diff <= -2:
            return "negative"

        if positive_hits > negative_hits and positive_hits >= 1:
            text_bias = "positive"
        elif negative_hits > positive_hits and negative_hits >= 1:
            text_bias = "negative"

    valid_rating: float | None = None
    if item.rating_score_5 is not None and item.rating_score_5 > 0:
        valid_rating = item.rating_score_5

    if valid_rating is not None:
        source_code = item.source_code.lower()
        positive_threshold, negative_threshold = PLATFORM_RATING_THRESHOLDS.get(source_code, (4.2, 2.4))

        if valid_rating >= positive_threshold and text_bias != "negative":
            return "positive"
        if valid_rating <= negative_threshold and text_bias != "positive":
            return "negative"

        # Keep lexical signal if present when rating is ambiguous.
        if lexical_score >= 1.0:
            return "positive"
        if lexical_score <= -1.0:
            return "negative"

        if text_bias:
            return text_bias
        return "neutral"

    if text_bias:
        return text_bias

    return "neutral"


def _hash_review(
    run_id: UUID,
    source: str,
    hotel_name: str,
    author: str | None,
    date_raw: str | None,
    text: str,
) -> str:
    payload = "|".join(
        [
            str(run_id),
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
        cached = cache[key]
        if (not cached.descripcion or _is_generic_hotel_description(cached.descripcion)):
            enriched_description = _extract_hotel_description(review)
            if enriched_description:
                cached.descripcion = enriched_description
        return cached

    hotel = Hotel(
        nombre=review.hotel_name,
        ubicacion="Barranquilla",
        ciudad="Barranquilla",
        pais="Colombia",
        url=review.hotel_url,
        descripcion=_extract_hotel_description(review),
        precio_noche=None,
        image_url=None,
        features_json=[],
    )
    db.add(hotel)
    db.flush()
    cache[key] = hotel
    return hotel


def _refresh_hotel_metrics(db: Session, run_id: UUID) -> None:
    hotels = db.query(Hotel).all()
    for hotel in hotels:
        stats = (
            db.query(
                func.avg(Resena.rating_score_5),
                func.count(Resena.id),
                func.sum(case((func.lower(Resena.sentimiento) == "positive", 1), else_=0)),
            )
            .filter(Resena.hotel_id == hotel.id, Resena.scrape_run_id == run_id)
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

    hotel_cache: dict[str, Hotel] = {
        _normalize_text(hotel.nombre): hotel
        for hotel in db.query(Hotel).all()
    }
    inserted_reviews = 0
    skipped_duplicates = 0
    seen_hashes: set[str] = set()
    processed_hotel_keys: set[str] = set()

    all_reviews: list[ReviewInput] = []
    all_reviews.extend(_extract_google_reviews(_load_json(json_files["google"])))
    all_reviews.extend(_extract_booking_reviews(_load_json(json_files["booking"])))
    all_reviews.extend(_extract_airbnb_reviews(_load_json(json_files["airbnb"])))

    for item in all_reviews:
        hotel = _upsert_hotel(db, hotel_cache, item)
        processed_hotel_keys.add(_normalize_text(item.hotel_name))
        text_for_hash = item.review_text or item.positive_text or item.negative_text or ""
        hash_value = _hash_review(
            run_id=run_id,
            source=item.source_code,
            hotel_name=item.hotel_name,
            author=item.author,
            date_raw=item.date_raw,
            text=text_for_hash,
        )

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
            sentimiento=_sentiment_from_review(item),
            payload_json=item.payload,
            hash_unico=hash_value,
        )
        db.add(review)
        inserted_reviews += 1

    _refresh_hotel_metrics(db, run_id)

    return {
        "hotels": len(processed_hotel_keys),
        "reviews": inserted_reviews,
        "sources": len(fuentes),
        "duplicates_skipped": skipped_duplicates,
    }
