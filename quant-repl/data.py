import yfinance as yf # type: ignore

def load_price_data(ticker: str, start: str="2015-01-01"):
    data = yf.download(ticker, start=start)
    return data["Close"]