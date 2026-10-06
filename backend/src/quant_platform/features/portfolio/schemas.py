from collections.abc import Callable
from dataclasses import dataclass
from typing import TypedDict

import pandas as pd
from pydantic import BaseModel


@dataclass(slots=True)
class HoldingPosition:
    ticker: str
    shares: float
    cost_basis: float
    price_per_share: float


class PortfolioPosition(TypedDict):
    ticker: str
    shares: float
    cost_basis: float
    avg_price_per_share: float
    current_price: float
    current_value: float
    unrealized_pnl: float
    unrealized_pnl_pct: float
    weight: float


class PortfolioSummary(BaseModel):
    portfolio_value: float
    total_cost_basis: float
    unrealized_pnl: float
    unrealized_pnl_pct: float
    holdings: list[PortfolioPosition]


FetchTickerDataFn = Callable[[list[str], str], pd.DataFrame | None]


class PortfolioAnalytics(BaseModel):
    sharpe_ratio: float
    fama_french_3: FamaFrenchResult
    fama_french_5: FamaFrenchResult


class FamaFrenchResult(BaseModel):
    alpha: float
    market_beta: float
    smb_beta: float
    hml_beta: float
    profitability_beta: float | None = None
    investment_beta: float | None = None
    r_squared: float
