from backend.app.core.config import settings
from backend.app.schemas import SettingsResponse

class SettingsService:
    def get_settings(self) -> SettingsResponse:
        return SettingsResponse(
            project_name=settings.PROJECT_NAME,
            version=settings.VERSION,
            default_model=settings.DEFAULT_MODEL,
            supported_models=settings.SUPPORTED_MODELS,
            has_openai_key=settings.has_openai_key,
            has_gemini_key=settings.has_gemini_key
        )

settings_service = SettingsService()
