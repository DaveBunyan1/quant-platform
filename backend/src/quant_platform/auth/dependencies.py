from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from quant_platform.auth.token import decode_access_token
from quant_platform.core.database import get_async_session
from quant_platform.models.user import User


async def get_current_user(
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="/auth/login")),
    session: AsyncSession = Depends(get_async_session),
) -> User:
    try:
        payload = decode_access_token(token)
        user_id = payload.sub
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from err

    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=401,
            detail="No user found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
