from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class AgentProfile(Base):
    __tablename__ = "agent_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    simulation_id = Column(String(36), ForeignKey("simulation_runs.id"), nullable=False, index=True)
    agent_order = Column(Integer, nullable=False)
    character = Column(String(50), nullable=False)  # Conservative, Aggressive, Balanced, Growth-Oriented
    initial_cash = Column(Float, nullable=False, default=0.0)
    initial_stock_a = Column(Integer, nullable=False, default=0)
    initial_stock_b = Column(Integer, nullable=False, default=0)
    initial_debt = Column(Float, nullable=False, default=0.0)
    current_cash = Column(Float, nullable=False, default=0.0)
    current_stock_a = Column(Integer, nullable=False, default=0)
    current_stock_b = Column(Integer, nullable=False, default=0)
    current_debt = Column(Float, nullable=False, default=0.0)
    is_bankrupt = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    persona = Column(String(50), nullable=True)
    risk_appetite = Column(String(50), nullable=True)

    simulation = relationship("SimulationRun", back_populates="agents")

    @property
    def name(self) -> str:
        char = self.persona or self.character or "Investor"
        return f"Agent {self.agent_order} ({char})"
