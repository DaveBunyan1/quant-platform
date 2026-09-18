import secrets
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    environment: str
    database_url: str
    log_level: str = "INFO"

    jwt_secret_key: str = secrets.token_hex(32)
    jwt_algorithm: str
    access_token_expire_minutes: int

    refresh_token_expire_days: int
    refresh_token_cookie_name: str
    token_cookie_secure: bool = True
    token_cookie_samesite: str = "lax"

    csrf_secret_token: str = secrets.token_hex(32)

    model_config = SettingsConfigDict(env_file=PROJECT_ROOT / ".env")


settings = Settings()  # type: ignore
