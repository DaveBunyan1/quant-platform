from dataclasses import dataclass


@dataclass(slots=True)
class Holding:
    ticker: str
    shares: float
    avg_cost: float
    cost_basis: float
    current_price: float
    current_value: float
    pnl: float
    pct_return: float
    weight: float
