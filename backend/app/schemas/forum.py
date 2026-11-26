from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ForumMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    simulation_id: str
    day: int
    agent_id: int
    message: str
    content: Optional[str] = None
    timestamp: datetime
