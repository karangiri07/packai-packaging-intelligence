"""
Centralized application configuration.

All secrets and environment-specific values are loaded from environment
variables (or a local .env file for development). Nothing is hardcoded.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "AI-Powered Food Packaging Recommendation System"
    ENV: str = "development"

    # Database - defaults to a local SQLite file so the project runs with
    # zero external setup during a hackathon demo. Set DATABASE_URL to a
    # PostgreSQL URL for production / deployment.
    DATABASE_URL: str = "sqlite:///./packaging_demo.db"

    # JWT auth
    JWT_SECRET_KEY: str = "insecure-dev-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # LLM explanation layer (OpenAI-compatible). Optional - if LLM_API_KEY
    # is empty, the app uses a deterministic template-based fallback so the
    # scoring/recommendation workflow is never blocked by a missing key.
    LLM_API_KEY: str = ""
    LLM_API_BASE_URL: str = "https://api.openai.com/v1"
    LLM_MODEL: str = "gpt-4o-mini"

    # CORS
    FRONTEND_ORIGIN: str = "http://localhost:5173"


@lru_cache
def get_settings() -> Settings:
    return Settings()
