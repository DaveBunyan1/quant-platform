from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from quant_platform.auth.authentication import (
    authenticate,
    create_token_pair,
    rotate_refresh_token,
)
from quant_platform.auth.password import hash_password, hash_token
from quant_platform.core.database import get_async_session
from quant_platform.models.token import RefreshToken
from quant_platform.models.user import User
from quant_platform.schemas.token import Token, TokenPair
from quant_platform.schemas.users import UserCreate, UserRead
from quant_platform.settings import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserRead)
async def register(
    user_create: UserCreate,
    session: AsyncSession = Depends(get_async_session),
) -> User:
    hashed = hash_password(user_create.password)
    user = User(**user_create.model_dump(exclude={"password"}), hashed_password=hashed)

    try:
        session.add(user)
        await session.commit()
        await session.refresh(user)
    except IntegrityError as err:
        await session.rollback()
        raise HTTPException(status_code=400, detail="Email already registered") from err

    return user


@router.post("/login")
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(OAuth2PasswordRequestForm),
    session: AsyncSession = Depends(get_async_session),
) -> TokenPair:
    email = form_data.username
    password = form_data.password
    user = await authenticate(email, password, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token, raw_refresh, _ = await create_token_pair(user, session)

    response.set_cookie(
        key=settings.refresh_token_cookie_name,
        value=raw_refresh,
        max_age=settings.refresh_token_expire_days * 24 * 3600,
        secure=settings.token_cookie_secure,
        httponly=True,
        samesite="lax",
        path="/auth",
    )

    return TokenPair(
        access_token=access_token,
        refresh_token=raw_refresh,
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60,
    )


@router.post("/refresh")
async def refresh(
    response: Response,
    session: AsyncSession = Depends(get_async_session),
    refresh_token: str | None = Cookie(None, alias=settings.refresh_token_cookie_name),
) -> Token:
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    result = await session.execute(
        select(RefreshToken).where(RefreshToken.token_hash == hash_token(refresh_token))
    )
    db_token = result.scalar_one_or_none()

    if not db_token or not db_token.is_valid():
        if db_token:
            await session.execute(
                update(RefreshToken)
                .where(RefreshToken.family_id == db_token.family_id)
                .values(revoked=True)
                .execution_options(synchronize_session=False)
            )
            await session.commit()
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    access_token, new_raw_refresh, _ = await rotate_refresh_token(db_token, session)

    response.set_cookie(
        key=settings.refresh_token_cookie_name,
        value=new_raw_refresh,
        max_age=settings.refresh_token_expire_days * 24 * 3600,
        secure=settings.token_cookie_secure,
        httponly=True,
        samesite="lax",
        path="/auth",
    )

    return Token(
        access_token=access_token,
        expires_in=settings.access_token_expire_minutes * 60,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    session: AsyncSession = Depends(get_async_session),
    refresh_token: str | None = Cookie(None, alias=settings.refresh_token_cookie_name),
) -> None:
    if refresh_token:
        result = await session.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == hash_token(refresh_token)
            )
        )
        db_token = result.scalar_one_or_none()
        if db_token:
            db_token.revoked = True
            await session.commit()

    response.delete_cookie(
        key=settings.refresh_token_cookie_name,
        path="/auth",
        secure=settings.token_cookie_secure,
        httponly=True,
        samesite="lax",
    )
