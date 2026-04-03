from data import load_price_data
from strategies import sma_crossover
from metrics import sharpe_ratio, cumulative_return
from plots import plot_price, plot_equity_curve, plot_sma_strategy

prices = None
returns = None
last_short = None
last_long = None

while True:
    command = input("quant> ")

    if command.startswith("load"):
        ticker = command.split()[1]
        prices = load_price_data(ticker)
        print("Loaded", ticker)

    elif command.startswith("sma"):
        short, long = map(int, command.split()[1:])
        last_short, last_long = short, long
        if prices is None:
            print("No data loaded.")
        else:
            returns = sma_crossover(prices, short, long)
            print("Strategy computed")

    elif command == "metrics":
        if returns is not None:
            print("Sharpe:\n", sharpe_ratio(returns))
            print("Return:\n", cumulative_return(returns))
        else:
            print("No returns calculated.")

    elif command == "plot price":
        if prices is not None:
            plot_price(prices)
        else:
            print("No data loaded.")

    elif command == "plot equity":
        if returns is not None:
            plot_equity_curve(returns)
        else:
            print("No returns calculated.")

    elif command == "plot sma":
        if prices is not None and last_short and last_long:
            plot_sma_strategy(prices, last_short, last_long)
        else:
            print("No data loaded.")

    elif command == "exit":
        break