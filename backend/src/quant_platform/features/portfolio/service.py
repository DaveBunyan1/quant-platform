import uuid

from quant_platform.features.portfolio.domain.pnl_and_weights import (
    calculate_portfolio_metrics,
)
from quant_platform.features.portfolio.interfaces.provider import (
    MarketDataProviderProtocol,
)
from quant_platform.features.portfolio.interfaces.repository import (
    PortfolioRepositoryProtocol,
)
from quant_platform.features.portfolio.metrics import (
    PORTFOLIO_LATENCY,
    PORTFOLIO_REQUESTS,
)
from quant_platform.features.portfolio.schemas import PortfolioSummary
from quant_platform.logging import get_logger

logger = get_logger(__name__)


class PortfolioService:
    """Orchestrates portfolio aggregation and real-time market data valuation."""

    def __init__(
        self,
        repository: PortfolioRepositoryProtocol,
        market_data_provider: MarketDataProviderProtocol,
    ):
        self._repo = repository
        self._market_data = market_data_provider

    @PORTFOLIO_LATENCY.time()
    async def get_portfolio_summary(self, user_id: uuid.UUID) -> PortfolioSummary:
        """Fetches user holdings from the DB, enriches them with current market data,

        and computes total valuation, unrealized PnL, and asset allocation weights.
        """
        holdings = await self._repo.get_user_portfolio(user_id)
        if not holdings:
            PORTFOLIO_REQUESTS.labels(result="empty").inc()
            logger.info("No holdings found for user", extra={user_id: str(user_id)})
            return PortfolioSummary(
                portfolio_value=0,
                total_cost_basis=0,
                unrealized_pnl=0,
                unrealized_pnl_pct=0,
                holdings=[],
            )

        tickers = [row.ticker for row in holdings]
        prices = await self._market_data.get_prices(tickers)
        metrics = calculate_portfolio_metrics(holdings, prices)

        PORTFOLIO_REQUESTS.labels(result="success").inc()
        logger.info(
            "Successfully generated portfolio summary",
            extra={
                "user_id": str(user_id),
                "ticker_count": len(metrics.holdings),
            },
        )

        return metrics
