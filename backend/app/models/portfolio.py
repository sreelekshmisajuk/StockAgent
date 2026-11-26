from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class PortfolioHistory(Base):
    __tablename__ = "portfolio_histories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    simulation_id = Column(String(36), ForeignKey("simulation_runs.id"), nullable=False, index=True)
    agent_id = Column(Integer, nullable=False)
    day = Column(Integer, nullable=False)
    session = Column(Integer, nullable=False)
    cash = Column(Float, nullable=False)
    stock_a_shares = Column(Integer, nullable=False)
    stock_a_value = Column(Float, nullable=False)
    stock_b_shares = Column(Integer, nullable=False)
    stock_b_value = Column(Float, nullable=False)
    total_property = Column(Float, nullable=False)
    debt = Column(Float, nullable=False, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow)

    simulation = relationship("SimulationRun", back_populates="portfolios")

    @property
    def stock_a_amount(self) -> int:
        return self.stock_a_shares

    @property
    def stock_b_amount(self) -> int:
        return self.stock_b_shares

    @property
    def total_debt(self) -> float:
        return self.debt

    @property
    def net_worth(self) -> float:
        return self.total_property
