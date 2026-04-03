import yfinance as yf # type: ignore
import pandas as pd
from typing import Optional

def load_price_data(ticker: str, start: str="2015-01-01") -> pd.Series:
    data: Optional[pd.DataFrame] = yf.download(ticker, start=start) # type: ignore
    if data is None:
        raise ValueError(f"No data returned for ticker {ticker}")
    return data["Close"]