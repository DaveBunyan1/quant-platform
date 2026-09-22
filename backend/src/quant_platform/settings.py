import secrets
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    environment: str = "development"
    database_url: str = "postgresql+asyncpg://quant:quant@localhost:5432/quant_platform"
    redis_url: str = "redis://localhost:6379/0"
    log_level: str = "INFO"

    jwt_secret_key: str = secrets.token_hex(32)
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15

    refresh_token_expire_days: int = 7
    refresh_token_cookie_name: str = "refresh_token"
    token_cookie_secure: bool = False
    token_cookie_samesite: str = "lax"

    csrf_secret_token: str = secrets.token_hex(32)

    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
