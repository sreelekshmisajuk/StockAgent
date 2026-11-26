from typing import List
from sqlalchemy.orm import Session
from backend.app.models import MacroEvent

class NewsService:
    def get_events(self, db: Session, simulation_id: str) -> List[MacroEvent]:
        return db.query(MacroEvent).filter(
            MacroEvent.simulation_id == simulation_id
        ).order_by(MacroEvent.day.asc()).all()

news_service = NewsService()
