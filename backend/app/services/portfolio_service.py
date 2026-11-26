from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models import PortfolioHistory, AgentProfile, StockSnapshot
import util

class PortfolioService:
    def get_portfolios(
        self,
        db: Session,
        simulation_id: str,
        day: Optional[int] = None,
        session: Optional[int] = None
    ) -> List[PortfolioHistory]:
        query = db.query(PortfolioHistory).filter(PortfolioHistory.simulation_id == simulation_id)
        if isinstance(day, int):
            query = query.filter(PortfolioHistory.day == day)
        if isinstance(session, int):
            query = query.filter(PortfolioHistory.session == session)
        return query.order_by(PortfolioHistory.day.desc(), PortfolioHistory.session.desc(), PortfolioHistory.agent_id.asc()).all()

    def get_agent_portfolio_history(self, db: Session, simulation_id: str, agent_id: int) -> List[PortfolioHistory]:
        return db.query(PortfolioHistory).filter(
            PortfolioHistory.simulation_id == simulation_id,
            PortfolioHistory.agent_id == agent_id
        ).order_by(PortfolioHistory.day.asc(), PortfolioHistory.session.asc()).all()

    def get_portfolio_summaries(self, db: Session, simulation_id: str) -> List[dict]:
        agents = db.query(AgentProfile).filter(AgentProfile.simulation_id == simulation_id).all()

        latest_a = db.query(StockSnapshot).filter(
            StockSnapshot.simulation_id == simulation_id,
            StockSnapshot.ticker == "A"
        ).order_by(StockSnapshot.day.desc(), StockSnapshot.session.desc()).first()

        latest_b = db.query(StockSnapshot).filter(
            StockSnapshot.simulation_id == simulation_id,
            StockSnapshot.ticker == "B"
        ).order_by(StockSnapshot.day.desc(), StockSnapshot.session.desc()).first()

        price_a = latest_a.price if latest_a else util.STOCK_A_INITIAL_PRICE
        price_b = latest_b.price if latest_b else util.STOCK_B_INITIAL_PRICE

        summaries = []
        for agent in agents:
            total_val = agent.current_cash + (agent.current_stock_a * price_a) + (agent.current_stock_b * price_b)
            net_worth = total_val - agent.current_debt
            init_val = agent.initial_cash + (agent.initial_stock_a * util.STOCK_A_INITIAL_PRICE) + (agent.initial_stock_b * util.STOCK_B_INITIAL_PRICE)
            ret_pct = ((net_worth - init_val) / init_val * 100.0) if init_val > 0 else 0.0

            summaries.append({
                "agent_id": agent.agent_order,
                "character": agent.character,
                "cash": round(agent.current_cash, 2),
                "stock_a_shares": agent.current_stock_a,
                "stock_b_shares": agent.current_stock_b,
                "total_valuation": round(total_val, 2),
                "debt": round(agent.current_debt, 2),
                "net_worth": round(net_worth, 2),
                "return_percentage": round(ret_pct, 2)
            })

        summaries.sort(key=lambda s: s["net_worth"], reverse=True)
        return summaries

portfolio_service = PortfolioService()
