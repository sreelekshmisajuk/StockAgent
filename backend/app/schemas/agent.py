from typing import Optional
from pydantic import BaseModel, ConfigDict

class AgentProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    simulation_id: str
    agent_order: int
    name: Optional[str] = None
    character: str
    persona: Optional[str] = None
    risk_appetite: Optional[str] = None
    initial_cash: float
    initial_stock_a: int
    initial_stock_b: int
    initial_debt: float
    current_cash: float
    current_stock_a: int
    current_stock_b: int
    current_debt: float
    is_bankrupt: bool
    is_active: bool

class AgentDetailResponse(AgentProfileResponse):
    total_portfolio_value: float = 0.0
    unrealized_pnl: float = 0.0
