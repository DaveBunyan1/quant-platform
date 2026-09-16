import os
from collections.abc import AsyncGenerator, Callable, Coroutine
from typing import Any

import pytest
import pytest_asyncio
from asgi_lifespan import LifespanManager
from httpx2 import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    create_async_engine,
)

from quant_platform.auth.password import hash_password
from quant_platform.core.database import get_async_session
from quant_platform.main import app
from quant_platform.models.base import Base
from quant_platform.models.user import User

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://test:test@localhost:5433/quant_platform_test",
)


@pytest_asyncio.fixture
async def create_user(
    db_session: AsyncSession,
) -> Callable[..., Coroutine[None, None, User]]:
    """
    Factory fixture allowing tests to generate unique users on demand.
    """

    async def _create_user(**overrides: Any) -> User:
        defaults = {
            "email": "user@example.com",
            "username": "Test User",
            "hashed_password": hash_password("SecurePassword123!"),
        }
        defaults.update(overrides)
        user = User(**defaults)

        db_session.add(user)
        await db_session.flush()  # Populates user.id without closing transaction
        await db_session.refresh(user)
        return user

    return _create_user


@pytest_asyncio.fixture()
async def initial_user(create_user: Callable[..., Coroutine[Any, Any, User]]) -> User:
    """
    Creates and returns a default initial user for tests.
    """
    return await create_user(email="initial_user@example.com")


@pytest_asyncio.fixture(scope="session")
async def engine() -> AsyncGenerator[AsyncEngine]:
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(engine: AsyncEngine) -> AsyncGenerator[AsyncSession]:
    """
    Creates a new database session wrapped in a SAVEPOINT transaction.
    Guarantees full isolation: every commit in the application is rolled back.
    """
    connection = await engine.connect()
    transaction = await connection.begin()

    # Bind session to the connection wrapped in a transaction
    async_session = AsyncSession(bind=connection, expire_on_commit=False)

    # Begin a nested transaction (SAVEPOINT)
    nested = await connection.begin_nested()

    @pytest.hookimpl(tryfirst=True)
    async def restart_savepoint():
        nonlocal nested
        if not nested.is_active:
            nested = await connection.begin_nested()

    yield async_session

    await async_session.close()
    await transaction.rollback()
    await connection.close()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient]:
    """
    HTTP client configured with FastAPI lifespan support and session override.
    """

    async def override_get_async_session():
        yield db_session

    app.dependency_overrides[get_async_session] = override_get_async_session

    async with (
        LifespanManager(app),
        AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac,
    ):
        yield ac

    app.dependency_overrides.clear()
