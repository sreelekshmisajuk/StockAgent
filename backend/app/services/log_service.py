from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models import SimulationLog

class LogService:
    def get_logs(
        self,
        db: Session,
        simulation_id: Optional[str] = None,
        level: Optional[str] = None,
        limit: int = 100
    ) -> List[SimulationLog]:
        query = db.query(SimulationLog)
        if isinstance(simulation_id, str) and simulation_id.strip():
            query = query.filter(SimulationLog.simulation_id == simulation_id)
        if isinstance(level, str) and level.strip():
            query = query.filter(SimulationLog.level == level.upper())
        lim = limit if isinstance(limit, int) else 100
        return query.order_by(SimulationLog.timestamp.desc(), SimulationLog.id.desc()).limit(lim).all()

log_service = LogService()
