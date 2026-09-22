import redis.asyncio as aioredis
from fastapi import Depends
from redis_client import get_redis_client
from services import PortfolioService
from sqlalchemy.ext.asyncio import AsyncSession

from quant_platform.core.clients.yfinance_client import get_ticker_data
from quant_platform.core.database import get_async_session
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
    tx_repo: PortfolioRepositoryProtocol = Depends(get_portfolio_repository),
    market_data: MarketDataProviderProtocol = Depends(get_market_data_provider),
) -> PortfolioService:
    return PortfolioService(tx_repo=tx_repo, market_data=market_data)
