from collections.abc import AsyncGenerator

import redis.asyncio as aioredis

from quant_platform.logging import get_logger
from quant_platform.settings import settings

logger = get_logger(__name__)

redis_pool: aioredis.ConnectionPool | None = None


# TODO: redis_url
async def init_redis_pool() -> None:
    """Initializes the global Redis connection pool during FastAPI startup."""
    global redis_pool
    logger.info("Initializing Redis connection pool", url=settings.redis_url)
    redis_pool = aioredis.ConnectionPool.from_url(
        settings.redis_url,
        max_connections=20,
        decode_responses=True,
    )


async def close_redis_pool() -> None:
    """Closes the global Redis connection pool during FastAPI shutdown."""
    global redis_pool
    if redis_pool:
        logger.info("Closing Redis connection pool")
        await redis_pool.disconnect()


async def get_redis_client() -> AsyncGenerator[aioredis.Redis]:
    """FastAPI dependency yielding a Redis client attached to the connection pool."""
    if redis_pool is None:
        raise RuntimeError("Redis connection pool is not initialized.")

    client = aioredis.Redis(connection_pool=redis_pool)
    try:
        yield client
    finally:
        await client.aclose()
