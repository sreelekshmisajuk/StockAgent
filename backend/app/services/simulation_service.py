import os
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.app.core.config import settings
from backend.app.models import SimulationRun, StockSnapshot
from backend.app.schemas import SimulationCreate, SimulationResponse, SimulationStatusResponse
from backend.app.services.engine_adapter import engine_adapter

class SimulationService:
    def create_simulation(self, db: Session, data: SimulationCreate) -> SimulationRun:
        import json
        sim_id = str(uuid.uuid4())
        output_dir = str(settings.SIMULATION_OUTPUT_DIR / sim_id)
        os.makedirs(output_dir, exist_ok=True)

        stocks_str = ",".join(data.stocks) if data.stocks else "AAPL,MSFT,GOOGL"
        config_payload = {
            "stocks": data.stocks,
            "initial_capital": data.initial_capital,
            "scenario_type": data.scenario_type,
            "selected_factors": data.selected_factors,
            "custom_events": [e.model_dump() for e in data.custom_events]
        }

        run = SimulationRun(
            id=sim_id,
            name=data.name,
            model_name=data.model_name,
            total_agents=data.total_agents,
            total_days=data.total_days,
            total_sessions=data.total_sessions,
            stocks=stocks_str,
            initial_capital=data.initial_capital,
            scenario_type=data.scenario_type,
            config_json=json.dumps(config_payload),
            status="PENDING",
            current_day=0,
            current_session=0,
            output_dir=output_dir,
            created_at=datetime.utcnow()
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        return run

    def list_simulations(self, db: Session, skip: int = 0, limit: int = 50) -> List[SimulationRun]:
        return db.query(SimulationRun).order_by(SimulationRun.created_at.desc()).offset(skip).limit(limit).all()

    def get_simulation(self, db: Session, simulation_id: str) -> SimulationRun:
        run = db.query(SimulationRun).filter(SimulationRun.id == simulation_id).first()
        if not run:
            raise HTTPException(status_code=404, detail=f"Simulation {simulation_id} not found")
        return run

    def start_simulation(self, db: Session, simulation_id: str) -> SimulationRun:
        run = self.get_simulation(db, simulation_id)
        if run.status == "RUNNING":
            raise HTTPException(status_code=400, detail="Simulation is already running")

        running_id = engine_adapter.get_any_running_id()
        if running_id and running_id != simulation_id:
            raise HTTPException(status_code=409, detail=f"Another simulation ({running_id}) is currently running. Please wait or stop it first.")

        try:
            import json
            cfg = json.loads(run.config_json) if run.config_json else {}
            stocks_list = [s.strip() for s in (run.stocks or "AAPL,MSFT,GOOGL").split(",") if s.strip()]
            custom_events = cfg.get("custom_events", [])

            engine_adapter.start_simulation(
                run_id=run.id,
                model_name=run.model_name,
                agents=run.total_agents,
                days=run.total_days,
                sessions=run.total_sessions,
                output_dir=run.output_dir,
                stocks=stocks_list,
                initial_capital=float(run.initial_capital or 100000.0),
                scenario_type=run.scenario_type or "event-driven",
                custom_events=custom_events
            )
            run.status = "RUNNING"
            db.commit()
            db.refresh(run)
            return run
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def pause_simulation(self, db: Session, simulation_id: str) -> SimulationRun:
        run = self.get_simulation(db, simulation_id)
        if run.status != "RUNNING":
            raise HTTPException(status_code=400, detail=f"Cannot pause simulation in state: {run.status}")
        success = engine_adapter.pause_simulation(simulation_id)
        if success:
            run.status = "PAUSED"
            db.commit()
            db.refresh(run)
        return run

    def resume_simulation(self, db: Session, simulation_id: str) -> SimulationRun:
        run = self.get_simulation(db, simulation_id)
        if run.status != "PAUSED":
            raise HTTPException(status_code=400, detail=f"Cannot resume simulation in state: {run.status}")
        success = engine_adapter.resume_simulation(simulation_id)
        if success:
            run.status = "RUNNING"
            db.commit()
            db.refresh(run)
        return run

    def stop_simulation(self, db: Session, simulation_id: str) -> SimulationRun:
        run = self.get_simulation(db, simulation_id)
        if run.status in ["COMPLETED", "STOPPED", "FAILED"]:
            return run
        engine_adapter.stop_simulation(simulation_id)
        run.status = "STOPPED"
        run.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(run)
        return run

    def get_status(self, db: Session, simulation_id: str) -> SimulationStatusResponse:
        run = self.get_simulation(db, simulation_id)
        total_steps = run.total_days * run.total_sessions
        current_steps = max(0, (run.current_day - 1) * run.total_sessions + run.current_session)
        progress = min(100.0, (current_steps / total_steps * 100.0)) if total_steps > 0 else 0.0

        if run.status == "COMPLETED":
            progress = 100.0

        return SimulationStatusResponse(
            id=run.id,
            status=run.status,
            current_day=run.current_day,
            total_days=run.total_days,
            current_session=run.current_session,
            total_sessions=run.total_sessions,
            progress_percentage=round(progress, 1),
            error_message=run.error_message
        )

simulation_service = SimulationService()
