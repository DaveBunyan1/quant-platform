def sma_crossover(prices, short=50, long=200):
    short_ma = prices.rolling(short).mean()
    long_ma = prices.rolling(long).mean()

    signals = (short_ma > long_ma).astype(int)
    returns = prices.pct_change()

    strategy_returns = signals.shift(1) * returns
    return strategy_returns