from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.schemas import PortfolioResponse, PortfolioSummary
from backend.app.services import portfolio_service

router = APIRouter(prefix="/portfolios", tags=["Portfolios"])

@router.get("/{simulation_id}", response_model=List[PortfolioResponse])
def get_portfolios_by_sim(
    simulation_id: str,
    day: Optional[int] = Query(None),
    session: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return portfolio_service.get_portfolios(db, simulation_id, day=day, session=session)

@router.get("/{simulation_id}/summary", response_model=List[PortfolioSummary])
def get_portfolio_summaries(simulation_id: str, db: Session = Depends(get_db)):
    return portfolio_service.get_portfolio_summaries(db, simulation_id)

@router.get("/{simulation_id}/history", response_model=List[PortfolioResponse])
def get_portfolio_history(
    simulation_id: str,
    day: Optional[int] = Query(None),
    session: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return portfolio_service.get_portfolios(db, simulation_id, day=day, session=session)

@router.get("/{simulation_id}/agent/{agent_id}", response_model=List[PortfolioResponse])
def get_agent_portfolio_timeline(simulation_id: str, agent_id: int, db: Session = Depends(get_db)):
    return portfolio_service.get_agent_portfolio_history(db, simulation_id, agent_id)
