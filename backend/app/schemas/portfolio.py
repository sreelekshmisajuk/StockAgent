from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class PortfolioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    simulation_id: str
    agent_id: int
    day: int
    session: int
    cash: float
    stock_a_shares: int
    stock_a_amount: Optional[int] = None
    stock_a_value: float
    stock_b_shares: int
    stock_b_amount: Optional[int] = None
    stock_b_value: float
    total_property: float
    net_worth: Optional[float] = None
    debt: float
    total_debt: Optional[float] = None
    timestamp: datetime

class PortfolioSummary(BaseModel):
    agent_id: int
    character: str
    cash: float
    stock_a_shares: int
    stock_b_shares: int
    total_valuation: float
    debt: float
    net_worth: float
    return_percentage: float
