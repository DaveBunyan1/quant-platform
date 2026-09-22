import asyncio
import time
from collections import defaultdict
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from quant_platform.core.database import get_async_session
from quant_platform.features.holdings.schemas import Holding
from quant_platform.features.transactions.schemas import TransactionRead
from quant_platform.features.yfinance_api.get_ticker_data import get_ticker_data
from quant_platform.models.transaction import Transaction


def _latest_closes(tickers: list[str], start_date: str) -> dict[str, float]:
    """Sync helper — runs in a thread via asyncio.to_thread."""
    df = get_ticker_data(tickers, start_date=start_date)
    if df is None or df.empty:
        return {}

    close = df["Close"]

    # yfinance: single ticker → Series; multi → DataFrame
    if hasattr(close, "columns"):  # DataFrame
        last = close.iloc[-1]
        return {str(t): float(last[t]) for t in last.index if last[t] == last[t]}
    else:  # Series (one ticker)
        val = float(close.iloc[-1])
        return {tickers[0]: val} if val == val else {}


async def get_holdings(
    user_id: UUID, session: AsyncSession = Depends(get_async_session)
) -> list[Holding]:
    result = await session.scalars(
        select(Transaction).where(Transaction.user_id == user_id)
    )
    txns = [TransactionRead.model_validate(txn) for txn in result.all()]

    if not txns:
        return []

    agg: dict[str, dict[str, float]] = defaultdict(
        lambda: {"shares": 0.0, "cost_basis": 0.0}
    )
    for txn in txns:
        a = agg[txn.ticker]
        a["shares"] += txn.shares
        a["cost_basis"] += txn.shares * txn.price_per_share

    positions = {ticker: data for ticker, data in agg.items() if data["shares"] > 0}
    if not positions:
        return []

    tickers = list(positions.keys())

    # 3. Fetch prices off the event loop (yfinance is sync/blocking)
    start_date = (datetime.now(UTC) - timedelta(days=7)).strftime("%Y-%m-%d")
    closes = await asyncio.to_thread(_latest_closes, tickers, start_date)

    holdings: list[Holding] = []
    total_value = 0.0

    for ticker, data in positions.items():
        shares = data["shares"]
        cost_basis = round(data["cost_basis"], 2)
        avg_cost = round(cost_basis / shares, 4) if shares else 0.0

        price = closes.get(ticker)
        if price is None or price != price:  # None or NaN
            # Skip or surface as “price unavailable” — your choice
            continue

        current_value = round(price * shares, 2)
        pnl = round(current_value - cost_basis, 2)
        pct_return = round((pnl / cost_basis) * 100, 2) if cost_basis else 0.0

        holdings.append(
            Holding(
                ticker=ticker,
                shares=shares,
                avg_cost=avg_cost,
                cost_basis=cost_basis,
                current_price=round(price, 4),
                current_value=current_value,
                pnl=pnl,
                pct_return=pct_return,
                weight=0.0,  # filled below
            )
        )
        total_value += current_value

    # 5. Weights (second short pass)
    if total_value > 0:
        for h in holdings:
            h.weight = round((h.current_value / total_value) * 100, 2)

    return holdings


# --- TESTING EXECUTION BLOCK ---
async def bench(user_id: UUID, runs: int = 5):
    times: list[float] = []
    async for session in get_async_session():
        for i in range(runs):
            start = time.perf_counter()
            holdings = await get_holdings(user_id, session=session)
            elapsed = time.perf_counter() - start
            times.append(elapsed)

            print(f"run {i + 1}: {elapsed * 1000:.1f} ms  →  {len(holdings)} holdings")

        break  # only need one session

    avg = sum(times) / len(times)
    print(
        f"\navg: {avg * 1000:.1f} ms  min: {min(times) * 1000:.1f}  max: {max(times) * 1000:.1f}"
    )


if __name__ == "__main__":
    # 3. Use asyncio to execute the asynchronous runner function
    user_id = UUID("01a0c092-ec07-738e-ae24-c9c587227015")
    asyncio.run(bench(user_id, 100))
