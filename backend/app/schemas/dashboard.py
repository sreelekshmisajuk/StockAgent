from typing import Optional, List, Any
from pydantic import BaseModel

class DashboardSummary(BaseModel):
    total_simulations: int
    active_simulations_count: int
    total_agents_count: int
    total_agents: Optional[int] = None
    total_trades_count: int
    total_executed_trades: Optional[int] = None
    total_volume_traded: int
    latest_stock_a_price: Optional[float] = None
    latest_stock_b_price: Optional[float] = None
    latest_simulation: Optional[dict] = None
    market_overview: List[dict] = []
    recent_activities: List[dict] = []
    recent_trades: List[Any] = []
    recent_news: List[Any] = []
    recent_forum: List[Any] = []
