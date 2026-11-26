from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class CustomEventCreate(BaseModel):
    title: str = Field(..., max_length=100)
    description: str = Field(..., max_length=500)
    affected_stocks: str = Field(default="ALL", max_length=100)
    category: str = Field(default="Government and Policy", max_length=50)
    sentiment: str = Field(default="NEGATIVE")  # POSITIVE, NEGATIVE, NEUTRAL
    severity: str = Field(default="HIGH")  # LOW, MODERATE, HIGH, CRITICAL
    round_day: int = Field(default=2, ge=1)

class SimulationCreate(BaseModel):
    name: str = Field(default="Market Simulation Run", max_length=100)
    model_name: str = Field(default="gemini-1.5-flash", max_length=50)
    total_agents: int = Field(default=10, ge=1, le=100)
    total_days: int = Field(default=5, ge=1, le=264)
    total_sessions: int = Field(default=3, ge=1, le=10)
    stocks: List[str] = Field(default=["AAPL", "MSFT", "GOOGL"])
    initial_capital: float = Field(default=100000.0, ge=1000.0)
    scenario_type: str = Field(default="event-driven")  # baseline, event-driven
    selected_factors: List[str] = Field(default=["Macroeconomic", "Policy", "Fundamentals", "Global"])
    custom_events: List[CustomEventCreate] = Field(default_factory=list)

class SimulationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    model_name: str
    total_agents: int
    total_days: int
    total_sessions: int
    stocks: Optional[str] = "AAPL,MSFT,GOOGL"
    initial_capital: Optional[float] = 100000.0
    scenario_type: Optional[str] = "event-driven"
    status: str
    current_day: int
    current_session: int
    error_message: Optional[str] = None
    output_dir: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

class SimulationStatusResponse(BaseModel):
    id: str
    status: str
    current_day: int
    total_days: int
    current_session: int
    total_sessions: int
    progress_percentage: float
    error_message: Optional[str] = None
