from pydantic import BaseModel

class SettingsResponse(BaseModel):
    project_name: str
    version: str
    default_model: str
    supported_models: list[str]
    has_openai_key: bool
    has_gemini_key: bool
