from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class StockSnapshot(Base):
    __tablename__ = "stock_snapshots"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    simulation_id = Column(String(36), ForeignKey("simulation_runs.id"), nullable=False, index=True)
    day = Column(Integer, nullable=False)
    session = Column(Integer, nullable=False)
    ticker = Column(String(10), nullable=False)  # 'A' or 'B'
    price = Column(Float, nullable=False)
    deals_count = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow)

    simulation = relationship("SimulationRun", back_populates="stock_snapshots")

    @property
    def close_price(self) -> float:
        return self.price

    @property
    def open_price(self) -> float:
        return self.price

    @property
    def high_price(self) -> float:
        return self.price

    @property
    def low_price(self) -> float:
        return self.price

    @property
    def volume(self) -> int:
        return self.deals_count

    @property
    def turnover(self) -> float:
        return round(self.price * self.deals_count, 2)
