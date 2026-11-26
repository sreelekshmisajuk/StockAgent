from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.models import SimulationRun, AgentProfile, TradeOrder, StockSnapshot
from backend.app.schemas import DashboardSummary
import util

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db), simulation_id: Optional[str] = Query(None)):
    total_sims = db.query(SimulationRun).count()
    active_sims = db.query(SimulationRun).filter(SimulationRun.status.in_(["RUNNING", "PAUSED"])).count()
    
    sim_id = simulation_id if isinstance(simulation_id, str) and simulation_id.strip() else None
    if sim_id:
        target_sim = db.query(SimulationRun).filter(SimulationRun.id == sim_id).first()
    else:
        target_sim = db.query(SimulationRun).order_by(SimulationRun.created_at.desc()).first()

    total_agents = target_sim.total_agents if target_sim else db.query(AgentProfile).count()
    
    if target_sim:
        total_trades = db.query(TradeOrder).filter(TradeOrder.simulation_id == target_sim.id).count()
        total_vol = db.query(func.sum(TradeOrder.amount)).filter(TradeOrder.simulation_id == target_sim.id).scalar() or 0
    else:
        total_trades = db.query(TradeOrder).count()
        total_vol = db.query(func.sum(TradeOrder.amount)).scalar() or 0

    latest_dict = None
    market_overview = []
    stock_a_p = round(float(util.STOCK_A_INITIAL_PRICE), 2)
    stock_b_p = round(float(util.STOCK_B_INITIAL_PRICE), 2)

    if target_sim:
        latest_dict = {
            "id": target_sim.id,
            "name": target_sim.name,
            "status": target_sim.status,
            "model": target_sim.model_name,
            "current_day": target_sim.current_day,
            "total_days": target_sim.total_days,
            "current_session": target_sim.current_session,
            "total_sessions": target_sim.total_sessions,
        }

        # Market prices for target sim
        for ticker in ["A", "B"]:
            latest_price = db.query(StockSnapshot).filter(
                StockSnapshot.simulation_id == target_sim.id,
                func.upper(StockSnapshot.ticker).in_([ticker, f"STOCK_{ticker}"])
            ).order_by(StockSnapshot.day.desc(), StockSnapshot.session.desc()).first()

            init_p = util.STOCK_A_INITIAL_PRICE if ticker == "A" else util.STOCK_B_INITIAL_PRICE
            curr_p = latest_price.price if latest_price else init_p
            pct = ((curr_p - init_p) / init_p * 100.0) if init_p else 0.0

            if ticker == "A":
                stock_a_p = round(curr_p, 2)
            else:
                stock_b_p = round(curr_p, 2)

            market_overview.append({
                "ticker": ticker,
                "current_price": round(curr_p, 2),
                "change_percentage": round(pct, 2)
            })

    # Recent activities (recent trades)
    trade_query = db.query(TradeOrder)
    if target_sim:
        trade_query = trade_query.filter(TradeOrder.simulation_id == target_sim.id)
    recent_trades_db = trade_query.order_by(TradeOrder.id.desc()).limit(10).all()
    
    recent_trades_list = [
        {
            "id": t.id,
            "simulation_id": t.simulation_id,
            "day": t.day,
            "session": t.session,
            "ticker": t.ticker,
            "buyer_id": t.buyer_id,
            "seller_id": t.seller_id,
            "amount": t.amount,
            "price": t.price,
            "turnover": t.turnover or round(t.amount * t.price, 2),
            "order_type": "TRADE",
            "reasoning": t.reasoning or "Bid matched ask",
            "risk_assessment": t.risk_assessment or "Moderate",
            "confidence": t.confidence or 85.0,
            "timestamp": t.timestamp.isoformat()
        }
        for t in recent_trades_db
    ]

    recent_activities = [
        {
            "id": t.id,
            "simulation_id": t.simulation_id,
            "day": t.day,
            "session": t.session,
            "type": "TRADE",
            "description": f"Trade executed: {t.amount} shares of Stock {t.ticker} at ₹{t.price:.2f} (Buyer: Agent {t.buyer_id}, Seller: Agent {t.seller_id})",
            "timestamp": t.timestamp.isoformat()
        }
        for t in recent_trades_db
    ]

    return DashboardSummary(
        total_simulations=total_sims,
        active_simulations_count=active_sims,
        total_agents_count=total_agents,
        total_agents=total_agents,
        total_trades_count=total_trades,
        total_executed_trades=total_trades,
        total_volume_traded=int(total_vol),
        latest_stock_a_price=stock_a_p,
        latest_stock_b_price=stock_b_p,
        latest_simulation=latest_dict,
        market_overview=market_overview,
        recent_activities=recent_activities,
        recent_trades=recent_trades_list,
        recent_news=[],
        recent_forum=[]
    )
