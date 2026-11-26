from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.schemas import LogEntryResponse
from backend.app.services import log_service

router = APIRouter(prefix="/logs", tags=["Activity Logs"])

@router.get("", response_model=List[LogEntryResponse])
def get_logs(
    simulation_id: Optional[str] = Query(None),
    level: Optional[str] = Query(None, pattern="^(DEBUG|INFO|WARNING|ERROR)$"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    return log_service.get_logs(db, simulation_id=simulation_id, level=level, limit=limit)

@router.get("/{simulation_id}", response_model=List[LogEntryResponse])
def get_logs_by_sim(
    simulation_id: str,
    level: Optional[str] = Query(None, pattern="^(DEBUG|INFO|WARNING|ERROR)$"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    return log_service.get_logs(db, simulation_id=simulation_id, level=level, limit=limit)

