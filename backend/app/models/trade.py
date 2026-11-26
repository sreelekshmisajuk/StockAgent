from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class TradeOrder(Base):
    __tablename__ = "trade_orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    simulation_id = Column(String(36), ForeignKey("simulation_runs.id"), nullable=False, index=True)
    day = Column(Integer, nullable=False)
    session = Column(Integer, nullable=False)
    ticker = Column(String(10), nullable=False)
    buyer_id = Column(Integer, nullable=False)
    seller_id = Column(Integer, nullable=False)
    amount = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    turnover = Column(Float, default=0.0)
    reasoning = Column(Text, nullable=True)
    risk_assessment = Column(String(50), nullable=True)
    confidence = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    simulation = relationship("SimulationRun", back_populates="trades")

    @property
    def order_type(self) -> str:
        return "TRADE"


class OrderIntent(Base):
    __tablename__ = "order_intents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    simulation_id = Column(String(36), ForeignKey("simulation_runs.id"), nullable=False, index=True)
    day = Column(Integer, nullable=False)
    session = Column(Integer, nullable=False)
    agent_id = Column(Integer, nullable=False)
    action_type = Column(String(10), nullable=False)  # "buy", "sell", "hold", "no"
    ticker = Column(String(10), nullable=True)
    amount = Column(Integer, nullable=True)
    price = Column(Float, nullable=True)
    reasoning = Column(Text, nullable=True)
    risk_assessment = Column(String(20), nullable=True)  # Low, Medium, High
    confidence = Column(Float, nullable=True)  # 0.0 - 100.0
    status = Column(String(20), default="SUBMITTED")  # SUBMITTED, MATCHED, QUEUED, REJECTED
    timestamp = Column(DateTime, default=datetime.utcnow)

    simulation = relationship("SimulationRun", back_populates="order_intents")
