from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models import TradeOrder, StockSnapshot, AgentProfile, SimulationRun
from backend.app.schemas import AnalyticsOverview, PersonaPerformance
import util

class AnalyticsService:
    def get_analytics_overview(self, db: Session, simulation_id: str) -> AnalyticsOverview:
        # Trade statistics
        trades = db.query(TradeOrder).filter(TradeOrder.simulation_id == simulation_id).all()
        total_trades = len(trades)
        total_volume = sum(t.amount for t in trades)
        total_turnover = sum(t.amount * t.price for t in trades)

        # Final stock prices
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

        ret_a = ((price_a - util.STOCK_A_INITIAL_PRICE) / util.STOCK_A_INITIAL_PRICE * 100.0)
        ret_b = ((price_b - util.STOCK_B_INITIAL_PRICE) / util.STOCK_B_INITIAL_PRICE * 100.0)

        # Total market cap of simulated stocks (using company shares from util)
        cap_a = price_a * util.COMPANY_FINANCIAL_CONSTANTS["A"]["number_of_shares"]
        cap_b = price_b * util.COMPANY_FINANCIAL_CONSTANTS["B"]["number_of_shares"]
        total_cap = cap_a + cap_b

        # Persona breakdown
        agents = db.query(AgentProfile).filter(AgentProfile.simulation_id == simulation_id).all()
        personas = ["Conservative", "Aggressive", "Fundamental", "News-Driven", "Technical", "Balanced"]
        persona_breakdown = []

        agent_wealths = []
        for persona in personas:
            p_agents = [a for a in agents if a.character == persona]
            count = len(p_agents)
            if count == 0:
                continue

            wealths = [
                a.current_cash + (a.current_stock_a * price_a) + (a.current_stock_b * price_b) - a.current_debt
                for a in p_agents
            ]
            bankrupts = sum(1 for a in p_agents if a.is_bankrupt)

            # Trades involving these agents
            agent_ids = {a.agent_order for a in p_agents}
            p_trades = sum(1 for t in trades if t.buyer_id in agent_ids or t.seller_id in agent_ids)

            persona_breakdown.append(PersonaPerformance(
                character=persona,
                count=count,
                average_wealth=round(sum(wealths) / count, 2) if count > 0 else 0.0,
                total_trades=p_trades,
                bankruptcy_rate=round(bankrupts / count * 100.0, 2) if count > 0 else 0.0
            ))

        for a in agents:
            w = a.current_cash + (a.current_stock_a * price_a) + (a.current_stock_b * price_b) - a.current_debt
            agent_wealths.append({
                "agent_id": a.agent_order,
                "character": a.character,
                "net_worth": round(w, 2),
                "cash": round(a.current_cash, 2),
                "is_bankrupt": a.is_bankrupt
            })
        agent_wealths.sort(key=lambda x: x["net_worth"], reverse=True)

        # Wealth Gini coefficient calculation
        wealths_all = [w["net_worth"] for w in agent_wealths if w["net_worth"] > 0]
        gini = 0.0
        if len(wealths_all) > 1 and sum(wealths_all) > 0:
            n = len(wealths_all)
            s_wealths = sorted(wealths_all)
            gini = (2 * sum((i + 1) * y for i, y in enumerate(s_wealths))) / (n * sum(s_wealths)) - (n + 1) / n
            gini = round(max(0.0, min(1.0, gini)), 3)

        top_p = None
        if agent_wealths:
            best = agent_wealths[0]
            initial_cap = 100000.0
            roi = round(((best["net_worth"] - initial_cap) / initial_cap) * 100.0, 2)
            top_p = {
                "agent_id": str(best["agent_id"]),
                "character": best["character"],
                "net_worth": best["net_worth"],
                "roi_percent": max(0.0, roi)
            }

        return AnalyticsOverview(
            simulation_id=simulation_id,
            total_trades_count=total_trades,
            total_trades=total_trades,
            total_volume_traded=total_volume,
            total_volume_shares=total_volume,
            total_turnover=round(total_turnover, 2),
            total_turnover_cash=round(total_turnover, 2),
            stock_a_final_price=round(price_a, 2),
            stock_b_final_price=round(price_b, 2),
            stock_a_return_pct=round(ret_a, 2),
            stock_b_return_pct=round(ret_b, 2),
            total_market_capitalization=round(total_cap, 2),
            wealth_gini_index=gini,
            persona_breakdown=persona_breakdown,
            top_performers=agent_wealths[:5],
            top_performer=top_p,
            total_defaults=sum(1 for a in agents if a.is_bankrupt)
        )

analytics_service = AnalyticsService()
