from collections.abc import Sequence

from quant_platform.features.portfolio.schemas import (
    HoldingPosition,
    PortfolioPosition,
)


def calculate_portfolio_metrics(
    holdings: Sequence[HoldingPosition], prices: dict[str, float]
) -> list[PortfolioPosition]:
    portfolio_positions = []
    for row in holdings:
        shares = float(row.shares)
        cost_basis = float(row.cost_basis)
        avg_price = float(row.price_per_share)
        current_price = prices.get(row.ticker, 0.0)

        current_value = shares * current_price
        unrealized_pnl = current_value - cost_basis
        unrealized_pnl_percent = (
            (unrealized_pnl / cost_basis) * 100 if cost_basis > 0 else 0.0
        )

        portfolio_positions.append(
            {
                "ticker": row.ticker,
                "shares": shares,
                "cost_basis": cost_basis,
                "avg_price_per_share": avg_price,
                "current_price": current_price,
                "current_value": current_value,
                "unrealized_pnl": unrealized_pnl,
                "unrealized_pnl_pct": unrealized_pnl_percent,
            }
        )

    total_portfolio_value = sum(p["current_value"] for p in portfolio_positions)

    for position in portfolio_positions:
        position["weight"] = (
            round(position["current_value"] / total_portfolio_value, 4)
            if total_portfolio_value > 0
            else 0.0
        )

    return portfolio_positions
