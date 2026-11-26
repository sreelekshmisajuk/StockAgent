from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.schemas import StockOverviewResponse, StockSnapshotResponse, MacroEventResponse
from backend.app.services import market_service

router = APIRouter(prefix="/stocks", tags=["Market & Stocks"])

@router.get("/{simulation_id}", response_model=List[StockOverviewResponse])
def get_stocks_overview(simulation_id: str, db: Session = Depends(get_db)):
    return market_service.get_stocks_overview(db, simulation_id)

@router.get("/{simulation_id}/snapshots", response_model=List[StockSnapshotResponse])
def get_stock_snapshots(
    simulation_id: str,
    ticker: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return market_service.get_all_snapshots(db, simulation_id, ticker)

@router.get("/{simulation_id}/history/{ticker}", response_model=List[StockSnapshotResponse])
def get_stock_price_history(simulation_id: str, ticker: str, db: Session = Depends(get_db)):
    return market_service.get_stock_history(db, simulation_id, ticker)

@router.get("/{simulation_id}/events", response_model=List[MacroEventResponse])
def get_market_events(simulation_id: str, db: Session = Depends(get_db)):
    return market_service.get_market_events(db, simulation_id)

@router.get("/{simulation_id}/financial-reports")
def get_financial_reports(simulation_id: str, db: Session = Depends(get_db)):
    return market_service.get_financial_reports(db, simulation_id)

@router.get("/live/{ticker}")
def get_live_stock_quote(
    ticker: str,
    currency: str = Query("INR", pattern="^(INR|USD)$"),
    simulation_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return market_service.get_live_stock_quote(db, ticker, currency=currency, simulation_id=simulation_id)

