from typing import Protocol


class MarketDataProviderProtocol(Protocol):
    async def get_prices(self, tickers: list[str]) -> dict[str, float]:
        """Fetches current market prices for a list of tickers."""
        ...
