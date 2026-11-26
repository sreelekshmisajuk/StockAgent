from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models import TradeOrder, OrderIntent

class TradingService:
    def get_trades(
        self,
        db: Session,
        simulation_id: str,
        ticker: Optional[str] = None,
        agent_id: Optional[int] = None,
        day: Optional[int] = None,
        session: Optional[int] = None,
        limit: int = 100
    ) -> List[TradeOrder]:
        query = db.query(TradeOrder).filter(TradeOrder.simulation_id == simulation_id)
        if isinstance(ticker, str) and ticker.strip():
            query = query.filter(TradeOrder.ticker == ticker.upper())
        if isinstance(agent_id, int):
            query = query.filter((TradeOrder.buyer_id == agent_id) | (TradeOrder.seller_id == agent_id))
        if isinstance(day, int):
            query = query.filter(TradeOrder.day == day)
        if isinstance(session, int):
            query = query.filter(TradeOrder.session == session)
        lim = limit if isinstance(limit, int) else 100
        return query.order_by(TradeOrder.day.desc(), TradeOrder.session.desc(), TradeOrder.id.desc()).limit(lim).all()

    def get_order_intents(
        self,
        db: Session,
        simulation_id: str,
        agent_id: Optional[int] = None,
        day: Optional[int] = None,
        session: Optional[int] = None,
        limit: int = 100
    ) -> List[OrderIntent]:
        query = db.query(OrderIntent).filter(OrderIntent.simulation_id == simulation_id)
        if isinstance(agent_id, int):
            query = query.filter(OrderIntent.agent_id == agent_id)
        if isinstance(day, int):
            query = query.filter(OrderIntent.day == day)
        if isinstance(session, int):
            query = query.filter(OrderIntent.session == session)
        lim = limit if isinstance(limit, int) else 100
        return query.order_by(OrderIntent.day.desc(), OrderIntent.session.desc(), OrderIntent.id.desc()).limit(lim).all()

trading_service = TradingService()
