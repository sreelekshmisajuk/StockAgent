from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.schemas import SimulationCreate, SimulationResponse, SimulationStatusResponse
from backend.app.services import simulation_service

router = APIRouter(prefix="/simulations", tags=["Simulations"])

@router.post("", response_model=SimulationResponse, status_code=status.HTTP_201_CREATED)
def create_simulation(data: SimulationCreate, db: Session = Depends(get_db)):
    return simulation_service.create_simulation(db, data)

@router.get("", response_model=List[SimulationResponse])
def list_simulations(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return simulation_service.list_simulations(db, skip=skip, limit=limit)

@router.get("/{simulation_id}", response_model=SimulationResponse)
def get_simulation(simulation_id: str, db: Session = Depends(get_db)):
    return simulation_service.get_simulation(db, simulation_id)

@router.get("/{simulation_id}/status", response_model=SimulationStatusResponse)
def get_simulation_status(simulation_id: str, db: Session = Depends(get_db)):
    return simulation_service.get_status(db, simulation_id)

@router.post("/{simulation_id}/start", response_model=SimulationResponse)
def start_simulation(simulation_id: str, db: Session = Depends(get_db)):
    return simulation_service.start_simulation(db, simulation_id)

@router.post("/{simulation_id}/pause", response_model=SimulationResponse)
def pause_simulation(simulation_id: str, db: Session = Depends(get_db)):
    return simulation_service.pause_simulation(db, simulation_id)

@router.post("/{simulation_id}/resume", response_model=SimulationResponse)
def resume_simulation(simulation_id: str, db: Session = Depends(get_db)):
    return simulation_service.resume_simulation(db, simulation_id)

@router.post("/{simulation_id}/stop", response_model=SimulationResponse)
def stop_simulation(simulation_id: str, db: Session = Depends(get_db)):
    return simulation_service.stop_simulation(db, simulation_id)
