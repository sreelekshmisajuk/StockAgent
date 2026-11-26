from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class LogEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    simulation_id: Optional[str] = None
    level: str
    message: str
    source: str
    timestamp: datetime
