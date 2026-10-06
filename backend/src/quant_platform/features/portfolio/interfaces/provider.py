from typing import Protocol

import pandas as pd


class MarketDataProviderProtocol(Protocol):
    async def get_prices(self, tickers: list[str]) -> dict[str, float]:
        """Fetches current market prices for a list of tickers."""
        ...

    async def get_historical_prices(
        self, tickers: list[str], start_date: str
    ) -> pd.DataFrame: ...
