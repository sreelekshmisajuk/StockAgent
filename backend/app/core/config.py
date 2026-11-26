import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent
REPO_ROOT = BASE_DIR.parent

class Settings(BaseModel):
    PROJECT_NAME: str = "StockAgent Simulation API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'stockagent.db'}")
    CORS_ORIGINS: list[str] = ["*"]
    SIMULATION_OUTPUT_DIR: Path = BASE_DIR / "data" / "simulations"

    # Supported simulation defaults
    DEFAULT_MODEL: str = "gemini-1.5-flash"
    SUPPORTED_MODELS: list[str] = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.0-flash",
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-3.5-turbo"
    ]

    @property
    def has_openai_key(self) -> bool:
        return bool(os.getenv("OPENAI_API_KEY", "").strip())

    @property
    def has_gemini_key(self) -> bool:
        return bool(os.getenv("GOOGLE_API_KEY", "").strip() or os.getenv("GEMINI_API_KEY", "").strip())

settings = Settings()
