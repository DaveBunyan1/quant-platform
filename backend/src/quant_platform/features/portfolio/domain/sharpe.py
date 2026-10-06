import numpy as np
import pandas as pd

TRADING_DAYS_PER_YEAR = 252


def calculate_sharpe_ratio(
    portfolio_returns: pd.Series,
    risk_free_returns: pd.Series | None = None,
    periods_per_year: int = TRADING_DAYS_PER_YEAR,
) -> float:
    if risk_free_returns is None:
        excess_returns = portfolio_returns
    else:
        excess_returns = portfolio_returns - risk_free_returns

    if excess_returns.empty:
        raise ValueError("At least one return observation is required")

    volatility = excess_returns.std()

    if volatility == 0:
        return 0.0

    return float(excess_returns.mean() / volatility * np.sqrt(periods_per_year))
