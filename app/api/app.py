from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf

app = FastAPI()

# Allow your Next.js frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # replace "*" with your frontend URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/btc")
def get_btc(period1: str = "2025-01-01", period2: str = "2025-06-01"):
    """
    Fetches historical BTC-USD data using yfinance
    Returns: list of {date, price}
    """
    data = yf.download("BTC-USD", start=period1, end=period2, interval="1d")
    
    # Build list with numbers directly
    result = []
    for index, row in data.iterrows():
        # Use Close price (always present for crypto)
        price = row.get("Adj Close") or row.get("Close")
        if price is not None:
            result.append({
                "date": str(index.date()),  # ISO string
                "value": price             # just the number
            })
    
    return result