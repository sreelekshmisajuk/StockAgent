from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class MacroEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    simulation_id: str
    day: int
    event_name: str
    category: Optional[str] = "Macroeconomic"
    affected_stocks: Optional[str] = "ALL"
    sentiment: Optional[str] = "NEUTRAL"
    severity: Optional[str] = "MODERATE"
    message: str
    loan_rates: Optional[str] = None
    timestamp: datetime
