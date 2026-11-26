from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.schemas import AgentProfileResponse, AgentDetailResponse, OrderIntentResponse
from backend.app.services import agent_service

router = APIRouter(prefix="/agents", tags=["AI Agents"])

@router.get("/{simulation_id}", response_model=List[AgentProfileResponse])
def get_agents(simulation_id: str, db: Session = Depends(get_db)):
    return agent_service.get_agents(db, simulation_id)

@router.get("/{simulation_id}/{agent_order}", response_model=AgentDetailResponse)
def get_agent_profile(simulation_id: str, agent_order: int, db: Session = Depends(get_db)):
    return agent_service.get_agent_detail(db, simulation_id, agent_order)

@router.get("/{simulation_id}/{agent_order}/decisions", response_model=List[OrderIntentResponse])
def get_agent_decisions(simulation_id: str, agent_order: int, limit: int = 50, db: Session = Depends(get_db)):
    return agent_service.get_agent_decisions(db, simulation_id, agent_order, limit=limit)
