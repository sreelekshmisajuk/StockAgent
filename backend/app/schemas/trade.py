from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class TradeOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    simulation_id: str
    day: int
    session: int
    ticker: str
    buyer_id: int
    seller_id: int
    amount: int
    price: float
    order_type: Optional[str] = "TRADE"
    turnover: Optional[float] = 0.0
    reasoning: Optional[str] = None
    risk_assessment: Optional[str] = None
    confidence: Optional[float] = None
    timestamp: datetime

class OrderIntentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    simulation_id: str
    day: int
    session: int
    agent_id: int
    action_type: str
    ticker: Optional[str] = None
    amount: Optional[int] = None
    price: Optional[float] = None
    reasoning: Optional[str] = None
    risk_assessment: Optional[str] = None
    confidence: Optional[float] = None
    status: str
    timestamp: datetime
