from datetime import UTC, datetime, timedelta

import pandas as pd
import yfinance as yf  # type: ignore

from quant_platform.core.exceptions.exceptions import (
    MarketDataFetchError,
)


def get_ticker_data(
    tickers: list[str], start_date: str | None = None
) -> pd.DataFrame | None:
    """Synchronous network call to Yahoo Finance returning raw pandas DataFrame."""
    if not tickers:
        return None

    if start_date is None:
        start_date = (datetime.now(tz=UTC) - timedelta(days=4)).strftime("%Y-%m-%d")

    try:
        data = yf.download(
            tickers,
            start=start_date,
            progress=False,
            group_by="column",
            auto_adjust=True,
        )
        return data if data is not None and not data.empty else None
    except Exception as e:
        raise MarketDataFetchError(
            provider="yfinance",
            message=f"Failed to fetch ticker data for {tickers}",
            original_error=e,
        ) from e
