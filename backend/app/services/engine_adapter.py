import sys
import threading
import traceback
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

# Ensure project root is in sys.path so Stockagent modules (agent, stock, etc.) can be imported
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import main as stockagent_main
from backend.app.core.database import SessionLocal
from backend.app.models import (
    SimulationRun, AgentProfile, StockSnapshot, TradeOrder, OrderIntent,
    PortfolioHistory, MacroEvent, ForumMessage, LoanRecord, SimulationLog
)
from backend.app.websocket.manager import ws_manager

class SimulationTask:
    def __init__(self, run_id: str, thread: threading.Thread, pause_event: threading.Event, stop_event: threading.Event):
        self.run_id = run_id
        self.thread = thread
        self.pause_event = pause_event
        self.stop_event = stop_event
        self.started_at = datetime.utcnow()

class EngineAdapter:
    def __init__(self):
        self.active_tasks: Dict[str, SimulationTask] = {}
        self._lock = threading.RLock()

    def is_running(self, run_id: str) -> bool:
        with self._lock:
            task = self.active_tasks.get(run_id)
            return task is not None and task.thread.is_alive()

    def get_any_running_id(self) -> Optional[str]:
        with self._lock:
            for run_id, task in self.active_tasks.items():
                if task.thread.is_alive():
                    return run_id
        return None

    def start_simulation(
        self,
        run_id: str,
        model_name: str,
        agents: int,
        days: int,
        sessions: int,
        output_dir: str,
        stocks: Optional[list] = None,
        initial_capital: float = 100000.0,
        scenario_type: str = "event-driven",
        custom_events: Optional[list] = None
    ):
        with self._lock:
            running_id = self.get_any_running_id()
            if running_id:
                raise RuntimeError(f"Simulation {running_id} is already running. Parallel simulations are prevented to avoid resource contention.")

            pause_event = threading.Event()
            stop_event = threading.Event()

            class SimArgs:
                def __init__(self):
                    self.model = model_name
                    self.agents = agents
                    self.days = days
                    self.sessions = sessions
                    self.res_dir = output_dir
                    self.stocks = stocks or ["AAPL", "MSFT", "GOOGL"]
                    self.initial_capital = initial_capital
                    self.scenario_type = scenario_type
                    self.custom_events = custom_events or []

            args = SimArgs()

            thread = threading.Thread(
                target=self._run_thread,
                args=(run_id, args, pause_event, stop_event),
                name=f"sim-{run_id}",
                daemon=True
            )

            task = SimulationTask(run_id, thread, pause_event, stop_event)
            self.active_tasks[run_id] = task
            thread.start()
            return task

    def pause_simulation(self, run_id: str) -> bool:
        with self._lock:
            task = self.active_tasks.get(run_id)
            if not task or not task.thread.is_alive():
                return False
            task.pause_event.set()
            self._update_run_status(run_id, "PAUSED")
            ws_manager.broadcast_threadsafe(run_id, {"type": "SIMULATION_PAUSED", "run_id": run_id})
            return True

    def resume_simulation(self, run_id: str) -> bool:
        with self._lock:
            task = self.active_tasks.get(run_id)
            if not task or not task.thread.is_alive():
                return False
            task.pause_event.clear()
            self._update_run_status(run_id, "RUNNING")
            ws_manager.broadcast_threadsafe(run_id, {"type": "SIMULATION_RESUMED", "run_id": run_id})
            return True

    def stop_simulation(self, run_id: str) -> bool:
        with self._lock:
            task = self.active_tasks.get(run_id)
            if not task:
                return False
            task.stop_event.set()
            task.pause_event.clear()  # Unblock if paused
            self._update_run_status(run_id, "STOPPED")
            ws_manager.broadcast_threadsafe(run_id, {"type": "SIMULATION_STOPPED", "run_id": run_id})
            return True

    def _update_run_status(self, run_id: str, status: str, error_message: str = None):
        db = SessionLocal()
        try:
            run = db.query(SimulationRun).filter(SimulationRun.id == run_id).first()
            if run:
                run.status = status
                if error_message:
                    run.error_message = error_message
                if status in ["COMPLETED", "FAILED", "STOPPED"]:
                    run.completed_at = datetime.utcnow()
                db.commit()
        finally:
            db.close()

    def _run_thread(self, run_id: str, args, pause_event: threading.Event, stop_event: threading.Event):
        self._update_run_status(run_id, "RUNNING")

        def event_callback(event_type: str, data: dict):
            self._handle_simulation_event(run_id, event_type, data)

        try:
            stockagent_main.simulation(
                args=args,
                event_callback=event_callback,
                pause_event=pause_event,
                stop_event=stop_event
            )
            if not stop_event.is_set():
                self._update_run_status(run_id, "COMPLETED")
                ws_manager.broadcast_threadsafe(run_id, {
                    "type": "SIMULATION_COMPLETED",
                    "run_id": run_id,
                    "timestamp": datetime.utcnow().isoformat()
                })
        except Exception as e:
            tb = traceback.format_exc()
            self._update_run_status(run_id, "FAILED", error_message=str(e))
            self._record_log(run_id, "ERROR", f"Simulation failed with error: {e}\n{tb}", "engine")
            ws_manager.broadcast_threadsafe(run_id, {
                "type": "SIMULATION_FAILED",
                "run_id": run_id,
                "error": str(e)
            })
        finally:
            with self._lock:
                self.active_tasks.pop(run_id, None)

    def _handle_simulation_event(self, run_id: str, event_type: str, data: dict):
        db = SessionLocal()
        try:
            if event_type == "AGENT_INIT":
                agent = AgentProfile(
                    simulation_id=run_id,
                    agent_order=data["agent_order"],
                    character=data["character"],
                    persona=data.get("character", "Balanced"),
                    risk_appetite="Low Risk" if data["character"] == "Conservative" else ("High Risk" if data["character"] == "Aggressive" else "Moderate"),
                    initial_cash=data["cash"],
                    initial_stock_a=data["stock_a"],
                    initial_stock_b=data["stock_b"],
                    initial_debt=data.get("debt", 0.0),
                    current_cash=data["cash"],
                    current_stock_a=data["stock_a"],
                    current_stock_b=data["stock_b"],
                    current_debt=data.get("debt", 0.0),
                )
                db.add(agent)
                db.commit()

            elif event_type == "SESSION_CLOSED":
                snap_a = StockSnapshot(
                    simulation_id=run_id,
                    day=data["day"],
                    session=data["session"],
                    ticker="A",
                    price=data["stock_a_price"]
                )
                snap_b = StockSnapshot(
                    simulation_id=run_id,
                    day=data["day"],
                    session=data["session"],
                    ticker="B",
                    price=data["stock_b_price"]
                )
                db.add_all([snap_a, snap_b])

                # Update current day and session on simulation run
                run = db.query(SimulationRun).filter(SimulationRun.id == run_id).first()
                if run:
                    run.current_day = data["day"]
                    run.current_session = data["session"]
                db.commit()
                self._record_log(run_id, "INFO", f"Day {data['day']} Session {data['session']} closed · Stock A: ₹{data['stock_a_price']:.2f}, Stock B: ₹{data['stock_b_price']:.2f}", "market")

            elif event_type == "TRADE_EXECUTED":
                turnover = data.get("turnover", round(data["amount"] * data["price"], 2))
                trade = TradeOrder(
                    simulation_id=run_id,
                    day=data["day"],
                    session=data["session"],
                    ticker=data["ticker"],
                    buyer_id=data["buyer_id"],
                    seller_id=data["seller_id"],
                    amount=data["amount"],
                    price=data["price"],
                    turnover=turnover,
                    reasoning=data.get("reasoning", "Bid matched ask on exchange."),
                    risk_assessment=data.get("risk_assessment", "Moderate"),
                    confidence=float(data.get("confidence", 85.0))
                )
                db.add(trade)
                db.commit()
                self._record_log(run_id, "TRADE", f"Trade executed: {trade.amount} shs of {trade.ticker} @ ₹{trade.price:.2f} (Buyer: Agent {trade.buyer_id}, Seller: Agent {trade.seller_id})", "exchange")
                ws_manager.broadcast_threadsafe(run_id, {
                    "type": "TRADE_EXECUTED",
                    "data": {
                        "id": trade.id,
                        "day": trade.day,
                        "session": trade.session,
                        "ticker": trade.ticker,
                        "buyer_id": str(trade.buyer_id),
                        "seller_id": str(trade.seller_id),
                        "amount": trade.amount,
                        "price": trade.price,
                        "turnover": trade.turnover,
                        "reasoning": trade.reasoning,
                        "risk_assessment": trade.risk_assessment,
                        "confidence": trade.confidence,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                })

            elif event_type == "ORDER_INTENT":
                action = data.get("action", {})
                act_type = action.get("action_type", "no").lower()
                intent = OrderIntent(
                    simulation_id=run_id,
                    day=data["day"],
                    session=data["session"],
                    agent_id=data["agent_id"],
                    action_type=act_type,
                    ticker=action.get("stock"),
                    amount=action.get("amount"),
                    price=action.get("price"),
                    reasoning=action.get("reasoning"),
                    risk_assessment=action.get("risk_assessment", "Moderate"),
                    confidence=float(action.get("confidence", 80.0) or 80.0),
                    status="EXECUTED" if act_type not in ["no", "hold"] else "SKIPPED"
                )
                db.add(intent)
                db.commit()
                if act_type in ["buy", "sell"]:
                    self._record_log(run_id, "INFO", f"Agent {intent.agent_id} submitted {intent.action_type.upper()} {intent.amount or 0} shs of {intent.ticker or 'N/A'} @ ₹{(intent.price or 0):.2f} - {intent.reasoning or ''}", "agent")

            elif event_type == "PORTFOLIO_SNAPSHOT":
                port = PortfolioHistory(
                    simulation_id=run_id,
                    agent_id=data["agent_id"],
                    day=data["day"],
                    session=data["session"],
                    cash=data["cash"],
                    stock_a_shares=data["stock_a_shares"],
                    stock_a_value=data["stock_a_value"],
                    stock_b_shares=data["stock_b_shares"],
                    stock_b_value=data["stock_b_value"],
                    total_property=data["total_property"],
                    debt=data.get("debt", 0.0)
                )
                db.add(port)

                # Update latest agent values in AgentProfile
                agent = db.query(AgentProfile).filter(
                    AgentProfile.simulation_id == run_id,
                    AgentProfile.agent_order == data["agent_id"]
                ).first()
                if agent:
                    agent.current_cash = data["cash"]
                    agent.current_stock_a = data["stock_a_shares"]
                    agent.current_stock_b = data["stock_b_shares"]
                    agent.current_debt = data.get("debt", 0.0)
                db.commit()

            elif event_type == "LOAN_DECISION":
                loan = data.get("loan", {})
                loan_rec = LoanRecord(
                    simulation_id=run_id,
                    agent_id=data["agent_id"],
                    day=data["day"],
                    applied=loan.get("loan") == "yes",
                    loan_type=loan.get("loan_type"),
                    amount=loan.get("amount"),
                    repayment_day=loan.get("repayment_date")
                )
                db.add(loan_rec)
                db.commit()

            elif event_type == "MACRO_EVENT":
                event = MacroEvent(
                    simulation_id=run_id,
                    day=data["day"],
                    event_name=data["event_name"],
                    category=data.get("category", "Macroeconomic"),
                    affected_stocks=data.get("affected_stocks", "ALL"),
                    sentiment=data.get("sentiment", "NEUTRAL"),
                    severity=data.get("severity", "MODERATE"),
                    message=data["message"],
                    loan_rates=data.get("loan_rates")
                )
                db.add(event)
                db.commit()

            elif event_type == "FORUM_POST":
                post = ForumMessage(
                    simulation_id=run_id,
                    day=data["day"],
                    agent_id=data["agent_id"],
                    message=data["message"]
                )
                db.add(post)
                db.commit()

        except Exception as err:
            db.rollback()
            self._record_log(run_id, "ERROR", f"Error saving simulation event '{event_type}': {err}", "adapter")
        finally:
            db.close()

        # Send WebSocket update
        ws_manager.broadcast_threadsafe(run_id, {
            "type": event_type,
            "run_id": run_id,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        })

    def _record_log(self, run_id: Optional[str], level: str, message: str, source: str = "backend"):
        db = SessionLocal()
        try:
            log_entry = SimulationLog(
                simulation_id=run_id,
                level=level,
                message=message,
                source=source,
                timestamp=datetime.utcnow()
            )
            db.add(log_entry)
            db.commit()
        finally:
            db.close()

engine_adapter = EngineAdapter()
