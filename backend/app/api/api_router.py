from fastapi import APIRouter

from backend.app.api.routes import (
    dashboard,
    simulations,
    agents,
    stocks,
    trades,
    portfolios,
    news,
    forum,
    loans,
    analytics,
    reports,
    logs,
    settings,
)

api_router = APIRouter(prefix="/api")

api_router.include_router(dashboard.router)
api_router.include_router(simulations.router)
api_router.include_router(agents.router)
api_router.include_router(stocks.router)
api_router.include_router(trades.router)
api_router.include_router(portfolios.router)
api_router.include_router(news.router)
api_router.include_router(forum.router)
api_router.include_router(loans.router)
api_router.include_router(analytics.router)
api_router.include_router(reports.router)
api_router.include_router(logs.router)
api_router.include_router(settings.router)
