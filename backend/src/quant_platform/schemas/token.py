from datetime import datetime

from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class TokenPayload(BaseModel):
    sub: str
    exp: datetime
    iat: datetime
    type: str = "access"
    jti: str | None = None


class TokenPair(Token):
    refresh_token: str | None = None
