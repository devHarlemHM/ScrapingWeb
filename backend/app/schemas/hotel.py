from datetime import datetime

from pydantic import BaseModel


class PlatformRatings(BaseModel):
    google: float | None = None
    booking: float | None = None
    airbnb: float | None = None


class PlatformLinks(BaseModel):
    google: str | None = None
    booking: str | None = None
    airbnb: str | None = None


class SentimentsOut(BaseModel):
    positive: int
    neutral: int
    negative: int


class HotelListItemOut(BaseModel):
    id: str
    name: str
    location: str | None = None
    city: str
    country: str
    rating: float | None = None
    price_per_night: float | None = None
    total_reviews: int
    sentiment_score: float
    quality_score: float | None = None
    sustainability_score: float | None = None
    favorites_count: int = 0
    platforms: PlatformRatings
    platform_links: PlatformLinks | None = None
    sentiments: SentimentsOut
    features: list[str]
    description: str | None = None
    highlight_review: str | None = None
    image_url: str | None = None


class ReviewOut(BaseModel):
    id: str
    author: str | None = None
    platform: str
    rating: float | None = None
    date: datetime | None = None
    text: str | None = None
    sentiment: str | None = None
    positive_text: str | None = None
    negative_text: str | None = None


class HotelDetailOut(HotelListItemOut):
    recent_reviews: list[ReviewOut]


class HotelReviewsOut(BaseModel):
    hotel_id: str
    total: int
    reviews: list[ReviewOut]


class FavoriteUpdateIn(BaseModel):
    is_favorite: bool


class FavoriteUpdateOut(BaseModel):
    hotel_id: str
    favorites_count: int
