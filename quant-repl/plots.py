import matplotlib.pyplot as plt
import pandas as pd

def plot_equity_curve(returns: pd.Series) -> None:
    equity = (1 + returns.dropna()).cumprod()
    plt.style.use("ggplot")

    plt.figure()
    plt.plot(equity)
    plt.title("Equity Curve")
    plt.xlabel("Time")
    plt.ylabel("Growth of $1")
    plt.show()


def plot_price(prices: pd.Series) -> None:
    plt.style.use("ggplot")
    plt.figure()
    plt.plot(prices)
    plt.title("Price")
    plt.xlabel("Time")
    plt.ylabel("Price")
    plt.show()

def plot_sma_strategy(prices: pd.Series, short: int, long: int) -> None:
    short_ma = prices.rolling(short).mean()
    long_ma = prices.rolling(long).mean()

    plt.style.use("ggplot")
    plt.figure()
    plt.plot(prices, label="Price")
    plt.plot(short_ma, label=f"SMA {short}")
    plt.plot(long_ma, label=f"SMA {long}")

    plt.legend()
    plt.title("SMA Crossover Strategy")
    plt.show()

def plot_comparison(prices: pd.Series, strategy_returns: pd.Series) -> None:
    strategy_equity = (1 + strategy_returns).cumprod()

    buy_hold = prices.pct_change()
    buy_hold_equity = (1 + buy_hold).cumprod()

    plt.figure()
    plt.plot(strategy_equity, label="Strategy")
    plt.plot(buy_hold_equity, label="Buy & Hold")
    plt.legend()
    plt.title("Strategy vs Buy & Hold")
    plt.show()