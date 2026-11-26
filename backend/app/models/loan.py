from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class LoanRecord(Base):
    __tablename__ = "loan_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    simulation_id = Column(String(36), ForeignKey("simulation_runs.id"), nullable=False, index=True)
    agent_id = Column(Integer, nullable=False)
    day = Column(Integer, nullable=False)
    applied = Column(Boolean, nullable=False)
    loan_type = Column(Integer, nullable=True)  # 0, 1, 2
    amount = Column(Float, nullable=True)
    repayment_day = Column(Integer, nullable=True)
    status = Column(String(20), default="ACTIVE")  # ACTIVE, REPAID, DEFAULTED
    timestamp = Column(DateTime, default=datetime.utcnow)

    simulation = relationship("SimulationRun", back_populates="loans")

    @property
    def day_borrowed(self) -> int:
        return self.day

    @property
    def is_repaid(self) -> bool:
        return self.status == "REPAID"

    @property
    def interest_rate(self) -> float:
        import util
        idx = self.loan_type if self.loan_type is not None else 0
        return float(util.LOAN_RATE[idx]) if idx < len(util.LOAN_RATE) else 0.02
