from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models import ForumMessage

class ForumService:
    def get_forum_messages(
        self,
        db: Session,
        simulation_id: str,
        day: Optional[int] = None,
        agent_id: Optional[int] = None,
        limit: int = 100
    ) -> List[ForumMessage]:
        query = db.query(ForumMessage).filter(ForumMessage.simulation_id == simulation_id)
        if isinstance(day, int):
            query = query.filter(ForumMessage.day == day)
        if isinstance(agent_id, int):
            query = query.filter(ForumMessage.agent_id == agent_id)
        lim = limit if isinstance(limit, int) else 100
        return query.order_by(ForumMessage.day.desc(), ForumMessage.id.desc()).limit(lim).all()

forum_service = ForumService()
