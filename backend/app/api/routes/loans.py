from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.schemas import LoanRecordResponse
from backend.app.services import loan_service

router = APIRouter(prefix="/loans", tags=["Loans & Credit"])

@router.get("/{simulation_id}", response_model=List[LoanRecordResponse])
def get_loans(
    simulation_id: str,
    agent_id: Optional[int] = Query(None),
    day: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    return loan_service.get_loans(db, simulation_id, agent_id=agent_id, day=day, limit=limit)
