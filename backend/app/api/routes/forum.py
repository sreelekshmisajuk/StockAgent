from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.schemas import ForumMessageResponse
from backend.app.services import forum_service

router = APIRouter(prefix="/forum", tags=["Investor Forum"])

@router.get("/{simulation_id}", response_model=List[ForumMessageResponse])
def get_forum_messages(
    simulation_id: str,
    day: Optional[int] = Query(None),
    agent_id: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    return forum_service.get_forum_messages(db, simulation_id, day=day, agent_id=agent_id, limit=limit)
