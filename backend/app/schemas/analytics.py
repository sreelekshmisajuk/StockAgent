from typing import Optional
from pydantic import BaseModel

class PersonaPerformance(BaseModel):
    character: str
    count: int
    average_wealth: float
    total_trades: int
    bankruptcy_rate: float

class AnalyticsOverview(BaseModel):
    simulation_id: str
    total_trades_count: int = 0
    total_trades: int = 0
    total_volume_traded: int = 0
    total_volume_shares: int = 0
    total_turnover: float = 0.0
    total_turnover_cash: float = 0.0
    stock_a_final_price: float = 26.79
    stock_b_final_price: float = 42.23
    stock_a_return_pct: float = 0.0
    stock_b_return_pct: float = 0.0
    total_market_capitalization: float = 0.0
    wealth_gini_index: float = 0.0
    persona_breakdown: list[PersonaPerformance] = []
    top_performers: list[dict] = []
    top_performer: Optional[dict] = None
    total_defaults: int = 0
