from data import load_price_data
from strategies import sma_crossover
from metrics import sharpe_ratio, cumulative_return

prices = None
returns = None

while True:
    command = input("quant> ")

    if command.startswith("load"):
        ticker = command.split()[1]
        prices = load_price_data(ticker)
        print("Loaded", ticker)

    elif command.startswith("sma"):
        short, long = map(int, command.split()[1:])
        returns = sma_crossover(prices, short, long)
        print("Strategy computed")

    elif command == "metrics":
        print("Sharpe:", sharpe_ratio(returns))
        print("Return:", cumulative_return(returns))

    elif command == "exit":
        break