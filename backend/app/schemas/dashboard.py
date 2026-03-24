from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_reviews: int
    ia_precision: float
    total_platforms: int
    stars_scale_min: int = 1
    stars_scale_max: int = 5


class DashboardCategory(BaseModel):
    id: str
    name: str
    description: str
    count: int
    sort: str
