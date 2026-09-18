import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt

from quant_platform.schemas.token import TokenPayload
from quant_platform.settings import settings


def create_access_token(
    user_id: uuid.UUID, extra_claims: dict[str, Any] | None = None
) -> str:
    now = datetime.now(tz=UTC)
    expire = now + timedelta(minutes=settings.access_token_expire_minutes)

    payload = {
        "sub": str(user_id),
        "exp": expire,
        "iat": now,
        "type": "access",
        "jti": secrets.token_urlsafe(16),
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> TokenPayload:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["exp", "iat", "sub", "type"]},
        )
        if payload.get("type") != "access":
            raise jwt.InvalidTokenError("Invalid token type")
        return TokenPayload(**payload)
    except jwt.PyJWTError as e:
        raise ValueError("Invalid or expired access token") from e


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(64)


def get_refresh_expiration() -> datetime:
    return datetime.now(tz=UTC) + timedelta(days=settings.refresh_token_expire_days)
