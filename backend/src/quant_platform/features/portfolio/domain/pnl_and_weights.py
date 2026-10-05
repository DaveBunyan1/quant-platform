from collections.abc import Sequence

from quant_platform.features.portfolio.schemas import (
    HoldingPosition,
    PortfolioPosition,
    PortfolioSummary,
)


def calculate_portfolio_metrics(
    holdings: Sequence[HoldingPosition], prices: dict[str, float]
) -> PortfolioSummary:
    portfolio_positions: list[PortfolioPosition] = []

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
            PortfolioPosition(
                ticker=row.ticker,
                shares=shares,
                cost_basis=cost_basis,
                avg_price_per_share=avg_price,
                current_price=current_price,
                current_value=current_value,
                unrealized_pnl=unrealized_pnl,
                unrealized_pnl_pct=unrealized_pnl_percent,
                weight=0.0,  # Initialize weight
            )
        )

    total_portfolio_value = sum(
        position["current_value"] for position in portfolio_positions
    )
    total_cost_basis = sum(holding["cost_basis"] for holding in portfolio_positions)
    total_unrealized_pnl = total_portfolio_value - total_cost_basis
    total_unrealized_pnl_pct = (
        (total_unrealized_pnl / total_cost_basis) * 100 if total_cost_basis > 0 else 0.0
    )

    for position in portfolio_positions:
        position["weight"] = (
            round(position["current_value"] / total_portfolio_value, 4)
            if total_portfolio_value > 0
            else 0.0
        )

    return PortfolioSummary(
        portfolio_value=total_portfolio_value,
        total_cost_basis=total_cost_basis,
        unrealized_pnl=total_unrealized_pnl,
        unrealized_pnl_pct=total_unrealized_pnl_pct,
        holdings=portfolio_positions,
    )
