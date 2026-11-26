from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class LoanRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    simulation_id: str
    agent_id: int
    day: int
    day_borrowed: Optional[int] = None
    applied: bool
    loan_type: Optional[int] = None
    amount: Optional[float] = None
    repayment_day: Optional[int] = None
    interest_rate: Optional[float] = 0.02
    status: str
    is_repaid: Optional[bool] = False
    timestamp: datetime
