from fastapi import APIRouter
from backend.app.schemas import SettingsResponse
from backend.app.services import settings_service

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=SettingsResponse)
def get_settings():
    return settings_service.get_settings()
