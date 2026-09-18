import uuid

from pydantic import EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from quant_platform.auth.password import hash_token, verify_and_update_password
from quant_platform.auth.token import (
    create_access_token,
    generate_refresh_token,
    get_refresh_expiration,
)
from quant_platform.models.token import RefreshToken
from quant_platform.models.user import User


async def authenticate(
    email: EmailStr, password: str, session: AsyncSession
) -> User | None:
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        return None

    valid, updated_hash = verify_and_update_password(password, user.hashed_password)
    if not valid:
        return None

    if updated_hash:
        user.hashed_password = updated_hash
        session.add(user)

    return user


async def create_token_pair(
    user: User, session: AsyncSession, family_id: uuid.UUID | None = None
) -> tuple[str, str, RefreshToken]:
    """Returns (access_token, raw_refresh_token, refresh_token_model)"""
    access_token = create_access_token(user.id)

    raw_refresh = generate_refresh_token()
    refresh = RefreshToken(
        token_hash=hash_token(raw_refresh),
        user_id=user.id,
        family_id=family_id or uuid.uuid7(),
        expires_at=get_refresh_expiration(),
    )
    session.add(refresh)
    await session.commit()
    await session.refresh(refresh)

    return access_token, raw_refresh, refresh


async def rotate_refresh_token(
    old_refresh: RefreshToken, session: AsyncSession
) -> tuple[str, str, RefreshToken]:
    """Revoke old + issue new."""
    old_refresh.revoked = True
    session.add(old_refresh)

    access_token, raw_refresh, new_refresh = await create_token_pair(
        old_refresh.user, session, family_id=old_refresh.family_id
    )
    old_refresh.replaced_by = new_refresh.id
    await session.commit()

    return access_token, raw_refresh, new_refresh
