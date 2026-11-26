from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.schemas import TradeOrderResponse, OrderIntentResponse
from backend.app.services import trading_service

router = APIRouter(prefix="/trades", tags=["Trades & Orders"])

@router.get("/{simulation_id}", response_model=List[TradeOrderResponse])
def get_trades(
    simulation_id: str,
    ticker: Optional[str] = Query(None, description="Filter by stock ticker (A or B)"),
    agent_id: Optional[int] = Query(None, description="Filter by buyer or seller agent ID"),
    day: Optional[int] = Query(None, description="Filter by simulation day"),
    session: Optional[int] = Query(None, description="Filter by trading session"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    return trading_service.get_trades(
        db=db,
        simulation_id=simulation_id,
        ticker=ticker,
        agent_id=agent_id,
        day=day,
        session=session,
        limit=limit
    )

@router.get("/{simulation_id}/orders", response_model=List[OrderIntentResponse])
def get_order_intents(
    simulation_id: str,
    agent_id: Optional[int] = Query(None, description="Filter by agent ID"),
    day: Optional[int] = Query(None, description="Filter by simulation day"),
    session: Optional[int] = Query(None, description="Filter by trading session"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    return trading_service.get_order_intents(
        db=db,
        simulation_id=simulation_id,
        agent_id=agent_id,
        day=day,
        session=session,
        limit=limit
    )
