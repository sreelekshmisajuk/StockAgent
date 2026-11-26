from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    model_name = Column(String(50), nullable=False, default="gemini-1.5-flash")
    total_agents = Column(Integer, nullable=False, default=50)
    total_days = Column(Integer, nullable=False, default=10)
    total_sessions = Column(Integer, nullable=False, default=3)
    stocks = Column(String(200), default="AAPL,MSFT,GOOGL")
    initial_capital = Column(Float, default=100000.0)
    scenario_type = Column(String(50), default="event-driven")  # baseline, event-driven
    config_json = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="PENDING")  # PENDING, RUNNING, PAUSED, COMPLETED, FAILED, STOPPED
    current_day = Column(Integer, default=0)
    current_session = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    output_dir = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    agents = relationship("AgentProfile", back_populates="simulation", cascade="all, delete-orphan")
    stock_snapshots = relationship("StockSnapshot", back_populates="simulation", cascade="all, delete-orphan")
    trades = relationship("TradeOrder", back_populates="simulation", cascade="all, delete-orphan")
    order_intents = relationship("OrderIntent", back_populates="simulation", cascade="all, delete-orphan")
    portfolios = relationship("PortfolioHistory", back_populates="simulation", cascade="all, delete-orphan")
    events = relationship("MacroEvent", back_populates="simulation", cascade="all, delete-orphan")
    forum_messages = relationship("ForumMessage", back_populates="simulation", cascade="all, delete-orphan")
    loans = relationship("LoanRecord", back_populates="simulation", cascade="all, delete-orphan")
    logs = relationship("SimulationLog", back_populates="simulation", cascade="all, delete-orphan")
