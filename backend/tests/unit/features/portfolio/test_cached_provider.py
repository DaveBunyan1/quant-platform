from unittest.mock import AsyncMock, MagicMock

import pytest

from quant_platform.features.portfolio.provider import CachedMarketDataProvider


@pytest.fixture
def mock_fallback_provider() -> AsyncMock:
    return AsyncMock()


@pytest.fixture
def mock_redis_client() -> AsyncMock:
    client = MagicMock()

    client.mget = AsyncMock()
    client.setex = AsyncMock()

    mock_pipe = AsyncMock()
    mock_pipe.__aenter__.return_value = mock_pipe
    mock_pipe.__aexit__.return_value = None

    client.pipeline.return_value = mock_pipe
    return client


@pytest.fixture
def cached_provider(
    mock_fallback_provider: AsyncMock, mock_redis_client: AsyncMock
) -> CachedMarketDataProvider:
    return CachedMarketDataProvider(
        fallback_provider=mock_fallback_provider,
        redis_client=mock_redis_client,
        ttl_seconds=300,
    )


async def test_get_prices_cache_hit_all_keys(
    cached_provider: CachedMarketDataProvider,
    mock_fallback_provider: AsyncMock,
    mock_redis_client: MagicMock,
) -> None:
    """Returns cached prices directly from Redis without calling fallback provider."""
    mock_redis_client.mget.return_value = ["150.25", "310.50"]

    prices = await cached_provider.get_prices(["AAPL", "MSFT"])

    assert prices == {"AAPL": 150.25, "MSFT": 310.50}
    mock_redis_client.mget.assert_awaited_once_with(["price:AAPL", "price:MSFT"])
    mock_fallback_provider.get_prices.assert_not_called()


async def test_get_prices_cache_miss_fetches_and_populates_redis(
    cached_provider: CachedMarketDataProvider,
    mock_fallback_provider: AsyncMock,
    mock_redis_client: AsyncMock,
) -> None:
    """
    Calls fallback provider for missing tickers and writes new prices to Redis with TTL.
    """
    mock_redis_client.mget.return_value = ["150.25", None]
    mock_fallback_provider.get_prices.return_value = {"MSFT": 310.50}

    prices = await cached_provider.get_prices(["AAPL", "MSFT"])

    assert prices == {"AAPL": 150.25, "MSFT": 310.50}

    mock_fallback_provider.get_prices.assert_awaited_once_with(["MSFT"])

    mock_pipe = mock_redis_client.pipeline.return_value
    mock_pipe.setex.assert_called_once_with("price:MSFT", 300, "310.5")
    mock_pipe.execute.assert_awaited_once()
