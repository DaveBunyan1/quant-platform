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


class PortfolioSummaryResponse(BaseModel):
    holdings: list[PortfolioPosition]


FetchTickerDataFn = Callable[[list[str], str], pd.DataFrame | None]
