import redis.asyncio as aioredis
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from quant_platform.core.clients.yfinance_client import get_ticker_data
from quant_platform.core.database import get_async_session
from quant_platform.core.redis import get_redis_client
from quant_platform.features.portfolio.interfaces.provider import (
    MarketDataProviderProtocol,
)
from quant_platform.features.portfolio.interfaces.repository import (
    PortfolioRepositoryProtocol,
)
from quant_platform.features.portfolio.provider import (
    CachedMarketDataProvider,
    YFinanceMarketDataProvider,
)
from quant_platform.features.portfolio.repository import SQLAlchemyPortfolioRepository
from quant_platform.features.portfolio.service import PortfolioService


def get_portfolio_repository(
    session: AsyncSession = Depends(get_async_session),
) -> PortfolioRepositoryProtocol:
    return SQLAlchemyPortfolioRepository(session)


def get_market_data_provider(
    redis: aioredis.Redis = Depends(get_redis_client),
) -> MarketDataProviderProtocol:
    # 1. Base provider
    base_provider = YFinanceMarketDataProvider(fetch_fn=get_ticker_data)

    # 2. Wrap with Redis caching
    return CachedMarketDataProvider(
        fallback_provider=base_provider,
        redis_client=redis,
        ttl_seconds=300,
    )


def get_portfolio_service(
    repo: PortfolioRepositoryProtocol = Depends(get_portfolio_repository),
    market_data: MarketDataProviderProtocol = Depends(get_market_data_provider),
) -> PortfolioService:
    return PortfolioService(
        repository=repo,
        market_data_provider=market_data,
    )
