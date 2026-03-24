from app.routers.dashboard_router import router as dashboard_router
from app.routers.hotels_router import router as hotels_router
from app.routers.scrapping_router import router as scrapping_router

__all__ = [
    "dashboard_router",
    "hotels_router",
    "scrapping_router",
]
