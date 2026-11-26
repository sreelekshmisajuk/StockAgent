from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class MacroEvent(Base):
    __tablename__ = "macro_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    simulation_id = Column(String(36), ForeignKey("simulation_runs.id"), nullable=False, index=True)
    day = Column(Integer, nullable=False)
    event_name = Column(String(100), nullable=False)
    category = Column(String(50), default="Macroeconomic")  # Macroeconomic, Government and Policy, Company Fundamentals, Global Events, Custom
    affected_stocks = Column(String(100), default="ALL")
    sentiment = Column(String(20), default="NEUTRAL")  # POSITIVE, NEGATIVE, NEUTRAL
    severity = Column(String(20), default="MODERATE")  # LOW, MODERATE, HIGH, CRITICAL
    message = Column(Text, nullable=False)
    loan_rates = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    simulation = relationship("SimulationRun", back_populates="events")
