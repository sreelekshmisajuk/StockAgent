from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class StockSnapshotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    simulation_id: str
    day: int
    session: int
    ticker: str
    price: float
    close_price: Optional[float] = None
    open_price: Optional[float] = None
    high_price: Optional[float] = None
    low_price: Optional[float] = None
    deals_count: int = 0
    volume: Optional[int] = 0
    turnover: Optional[float] = 0.0
    timestamp: datetime

class StockOverviewResponse(BaseModel):
    ticker: str
    current_price: float
    initial_price: float
    change_percentage: float
    deals_count: int
