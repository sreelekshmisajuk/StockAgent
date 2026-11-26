from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models import LoanRecord

class LoanService:
    def get_loans(
        self,
        db: Session,
        simulation_id: str,
        agent_id: Optional[int] = None,
        day: Optional[int] = None,
        limit: int = 100
    ) -> List[LoanRecord]:
        query = db.query(LoanRecord).filter(LoanRecord.simulation_id == simulation_id)
        if isinstance(agent_id, int):
            query = query.filter(LoanRecord.agent_id == agent_id)
        if isinstance(day, int):
            query = query.filter(LoanRecord.day == day)
        lim = limit if isinstance(limit, int) else 100
        return query.order_by(LoanRecord.day.desc(), LoanRecord.id.desc()).limit(lim).all()

loan_service = LoanService()
