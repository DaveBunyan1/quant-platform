from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    environment: str
    database_url: str

    model_config = SettingsConfigDict(env_file=PROJECT_ROOT / ".env")


settings = Settings()  # type: ignore

print(settings)
