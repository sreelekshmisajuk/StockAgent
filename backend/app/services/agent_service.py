from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.app.models import AgentProfile, OrderIntent, LoanRecord, StockSnapshot
import util

CANONICAL_PERSONAS = ['Conservative', 'Aggressive', 'Fundamental', 'News-Driven', 'Technical']
RISK_MAP = {
    'Conservative': 'Low Risk',
    'Aggressive': 'High Risk',
    'Fundamental': 'Moderate',
    'News-Driven': 'Event-Driven',
    'Technical': 'Quantitative'
}

class AgentService:
    def _normalize_agent(self, agent: AgentProfile) -> AgentProfile:
        order = agent.agent_order if agent.agent_order is not None else 0
        if not agent.persona or agent.persona not in CANONICAL_PERSONAS:
            if agent.character in CANONICAL_PERSONAS:
                agent.persona = agent.character
            else:
                agent.persona = CANONICAL_PERSONAS[order % len(CANONICAL_PERSONAS)]
        if not agent.risk_appetite:
            agent.risk_appetite = RISK_MAP.get(agent.persona, 'Moderate')
        return agent

    def get_agents(self, db: Session, simulation_id: str) -> List[AgentProfile]:
        agents = db.query(AgentProfile).filter(AgentProfile.simulation_id == simulation_id).order_by(AgentProfile.agent_order).all()
        for a in agents:
            self._normalize_agent(a)
        return agents

    def get_agent(self, db: Session, simulation_id: str, agent_order: int) -> AgentProfile:
        agent = db.query(AgentProfile).filter(
            AgentProfile.simulation_id == simulation_id,
            AgentProfile.agent_order == agent_order
        ).first()
        if not agent:
            raise HTTPException(status_code=404, detail=f"Agent {agent_order} not found in simulation {simulation_id}")
        return self._normalize_agent(agent)

    def get_agent_detail(self, db: Session, simulation_id: str, agent_order: int) -> dict:
        agent = self.get_agent(db, simulation_id, agent_order)

        # Get latest stock prices
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

        valuation = agent.current_cash + (agent.current_stock_a * price_a) + (agent.current_stock_b * price_b)
        initial_val = agent.initial_cash + (agent.initial_stock_a * util.STOCK_A_INITIAL_PRICE) + (agent.initial_stock_b * util.STOCK_B_INITIAL_PRICE)
        pnl = valuation - initial_val

        return {
            "id": agent.id,
            "simulation_id": agent.simulation_id,
            "agent_order": agent.agent_order,
            "character": agent.character,
            "initial_cash": agent.initial_cash,
            "initial_stock_a": agent.initial_stock_a,
            "initial_stock_b": agent.initial_stock_b,
            "initial_debt": agent.initial_debt,
            "current_cash": agent.current_cash,
            "current_stock_a": agent.current_stock_a,
            "current_stock_b": agent.current_stock_b,
            "current_debt": agent.current_debt,
            "is_bankrupt": agent.is_bankrupt,
            "is_active": agent.is_active,
            "total_portfolio_value": round(valuation, 2),
            "unrealized_pnl": round(pnl, 2)
        }

    def get_agent_decisions(self, db: Session, simulation_id: str, agent_order: int, limit: int = 50) -> List[OrderIntent]:
        return db.query(OrderIntent).filter(
            OrderIntent.simulation_id == simulation_id,
            OrderIntent.agent_id == agent_order
        ).order_by(OrderIntent.day.desc(), OrderIntent.session.desc()).limit(limit).all()

agent_service = AgentService()
