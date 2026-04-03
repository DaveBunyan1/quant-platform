import pandas as pd

def sma_crossover(prices: pd.Series, short: int=50, long: int=200) -> pd.Series:
    short_ma = prices.rolling(short).mean()
    long_ma = prices.rolling(long).mean()

    signals = (short_ma > long_ma).astype(int)
    returns = prices.pct_change()

    strategy_returns = signals.shift(1) * returns
    return strategy_returns