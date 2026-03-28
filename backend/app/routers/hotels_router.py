from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.hotel import FavoriteUpdateIn, FavoriteUpdateOut, HotelDetailOut, HotelListItemOut, HotelReviewsOut
from app.services.analytics_service import get_hotel_detail, get_hotel_reviews, list_hotels, update_hotel_favorite

router = APIRouter(prefix="/api/v1/hotels", tags=["Hoteles"])


@router.get("", response_model=list[HotelListItemOut])
def hotels_list(
    q: str | None = Query(default=None),
    sort: str = Query(default="reviews"),
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    min_reviews: int | None = Query(default=None, ge=0),
    min_price: float | None = Query(default=None),
    max_price: float | None = Query(default=None),
    min_rating: float | None = Query(default=None),
    min_quality: float | None = Query(default=None),
    min_sustainability: float | None = Query(default=None),
    sentiment: str | None = Query(default=None),
    platforms: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[HotelListItemOut]:
    platform_list = [p.strip() for p in platforms.split(",")] if platforms else None

    rows = list_hotels(
        db=db,
        query=q,
        sort=sort,
        limit=limit,
        offset=offset,
        min_reviews=min_reviews,
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
        min_quality=min_quality,
        min_sustainability=min_sustainability,
        sentiment=sentiment,
        platforms=platform_list,
    )
    return [HotelListItemOut(**row) for row in rows]


@router.get("/{hotel_id}", response_model=HotelDetailOut)
def hotel_detail(hotel_id: str, db: Session = Depends(get_db)) -> HotelDetailOut:
    payload = get_hotel_detail(db, hotel_id)
    if not payload:
        raise HTTPException(status_code=404, detail="Hotel no encontrado")
    return HotelDetailOut(**payload)


@router.get("/{hotel_id}/reviews", response_model=HotelReviewsOut)
def hotel_reviews(
    hotel_id: str,
    platform: str | None = Query(default=None),
    sentiment: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> HotelReviewsOut:
    payload = get_hotel_reviews(
        db=db,
        hotel_id=hotel_id,
        platform=platform,
        sentiment=sentiment,
        limit=limit,
        offset=offset,
    )
    if not payload:
        raise HTTPException(status_code=404, detail="Hotel no encontrado")
    return HotelReviewsOut(**payload)


@router.post("/{hotel_id}/favorite", response_model=FavoriteUpdateOut)
def hotel_favorite_update(
    hotel_id: str,
    body: FavoriteUpdateIn,
    db: Session = Depends(get_db),
) -> FavoriteUpdateOut:
    payload = update_hotel_favorite(db=db, hotel_id=hotel_id, is_favorite=body.is_favorite)
    if not payload:
        raise HTTPException(status_code=404, detail="Hotel no encontrado")
    return FavoriteUpdateOut(**payload)
