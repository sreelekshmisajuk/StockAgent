from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.schemas import AnalyticsOverview
from backend.app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/{simulation_id}", response_model=AnalyticsOverview)
def get_analytics(simulation_id: str, db: Session = Depends(get_db)):
    return analytics_service.get_analytics_overview(db, simulation_id)

@router.get("/{simulation_id}/summary", response_model=AnalyticsOverview)
def get_analytics_summary(simulation_id: str, db: Session = Depends(get_db)):
    return analytics_service.get_analytics_overview(db, simulation_id)
