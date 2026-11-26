from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.schemas import MacroEventResponse
from backend.app.services import news_service

router = APIRouter(prefix="/news", tags=["News & Events"])

@router.get("/{simulation_id}", response_model=List[MacroEventResponse])
def get_events(simulation_id: str, db: Session = Depends(get_db)):
    return news_service.get_events(db, simulation_id)
