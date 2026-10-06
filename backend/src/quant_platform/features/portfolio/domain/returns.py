import pandas as pd


def calculate_portfolio_returns(
    prices: pd.DataFrame,
    weights: dict[str, float],
) -> pd.Series:
    asset_returns = prices.pct_change().dropna()

    weights_series = pd.Series(weights)

    portfolio_returns = asset_returns.mul(weights_series).sum(axis=1)

    return portfolio_returns
