import asyncio
from datetime import UTC, datetime, timedelta

import pandas as pd
import redis.asyncio as aioredis
from redis.exceptions import RedisError

from quant_platform.core.exceptions.exceptions import MarketDataFetchError
from quant_platform.features.portfolio.interfaces.provider import (
    MarketDataProviderProtocol,
)
from quant_platform.features.portfolio.metrics import (
    CACHE_LATENCY,
    CACHE_REQUESTS,
    YFINANCE_LATENCY,
    YFINANCE_REQUESTS,
)
from quant_platform.features.portfolio.schemas import FetchTickerDataFn
from quant_platform.logging import get_logger

logger = get_logger(__name__)


class YFinanceMarketDataProvider:
    """Market data provider that fetches prices via yfinance (run in a thread pool)."""

    def __init__(self, fetch_fn: FetchTickerDataFn):
        self._fetch_fn = fetch_fn

    async def get_prices(self, tickers: list[str]) -> dict[str, float]:
        if not tickers:
            return {}

        start_date = (datetime.now(tz=UTC) - timedelta(days=4)).strftime("%Y-%m-%d")

        try:
            with YFINANCE_LATENCY.time():
                loop = asyncio.get_running_loop()
                raw_data = await loop.run_in_executor(
                    None,
                    self._fetch_fn,
                    tickers,
                    start_date,
                )
        except MarketDataFetchError:
            # Already a well-formed domain error from get_ticker_data
            YFINANCE_REQUESTS.labels(result="error").inc()
            logger.error(
                "yfinance provider failed",
                extra={"tickers": tickers},
                exc_info=True,
            )
            raise
        except Exception as exc:
            # Unexpected error from the executor / yfinance
            YFINANCE_REQUESTS.labels(result="error").inc()
            logger.error(
                "Unexpected error while fetching from yfinance",
                extra={"error": str(exc), "tickers": tickers},
                exc_info=True,
            )
            raise MarketDataFetchError(
                provider="yfinance",
                message=f"Unexpected error fetching tickers {tickers}",
                original_error=exc,
            ) from exc

        if raw_data is None or raw_data.empty:
            YFINANCE_REQUESTS.labels(result="empty").inc()
            logger.warning(
                "yfinance returned empty result",
                extra={"tickers": tickers},
            )
            return {}

        try:
            if isinstance(raw_data, pd.Series):
                latest_prices = raw_data
            else:
                latest_prices = raw_data.iloc[-1]["Close"]
        except (KeyError, IndexError, TypeError) as exc:
            YFINANCE_REQUESTS.labels(result="error").inc()
            logger.error(
                "Unexpected structure in yfinance response",
                extra={
                    "error": str(exc),
                    "tickers": tickers,
                    "raw_type": type(raw_data).__name__,
                },
                exc_info=True,
            )
            return {}

        prices: dict[str, float] = {}
        for ticker in tickers:
            if ticker in latest_prices and pd.notna(latest_prices[ticker]):
                prices[ticker] = float(latest_prices[ticker])

        if len(prices) < len(tickers):
            missing = sorted(set(tickers) - prices.keys())
            logger.warning(
                "Some tickers missing from yfinance response",
                extra={"missing_tickers": missing},
            )

        YFINANCE_REQUESTS.labels(result="success").inc()
        return prices


class CachedMarketDataProvider:
    """Decorator that wraps any MarketDataProviderProtocol with Redis MGET caching."""

    def __init__(
        self,
        fallback_provider: MarketDataProviderProtocol,
        redis_client: aioredis.Redis,
        ttl_seconds: int = 300,
    ):
        self._provider = fallback_provider
        self._redis = redis_client
        self._ttl = ttl_seconds

    async def get_prices(self, tickers: list[str]) -> dict[str, float]:
        if not tickers:
            return {}

        prices: dict[str, float] = {}
        missing_tickers: list[str] = []

        try:
            with CACHE_LATENCY.time():
                cached_values = await self._redis.mget(
                    [f"price:{ticker}" for ticker in tickers]
                )

            for ticker, val in zip(tickers, cached_values, strict=False):
                if val is not None:
                    prices[ticker] = float(val)
                    CACHE_REQUESTS.labels(result="hit").inc()
                else:
                    missing_tickers.append(ticker)
                    CACHE_REQUESTS.labels(result="miss").inc()

        except RedisError as exc:
            logger.error(
                "Redis read failed – falling back to primary provider",
                extra={
                    "error": str(exc),
                    "ticker_count": len(tickers),
                },
                exc_info=True,
            )
            CACHE_REQUESTS.labels(result="error").inc()
            missing_tickers = tickers  # Treat everything as a cache miss

        if missing_tickers:
            fresh_prices = await self._provider.get_prices(missing_tickers)

            if fresh_prices:
                prices.update(fresh_prices)

                try:
                    async with self._redis.pipeline(transaction=True) as pipe:
                        for ticker, price in fresh_prices.items():
                            pipe.setex(f"price:{ticker}", self._ttl, str(price))
                        await pipe.execute()
                except RedisError as exc:
                    logger.warning(
                        "Failed to write fresh prices to Redis cache",
                        extra={
                            "error": str(exc),
                            "fresh_ticker_count": len(fresh_prices),
                        },
                    )

        return prices
