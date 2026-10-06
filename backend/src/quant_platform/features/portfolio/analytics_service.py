import uuid
from datetime import date

from quant_platform.features.portfolio.domain.factor_models import (
    calculate_fama_french_3,
    calculate_fama_french_5,
)
from quant_platform.features.portfolio.domain.returns import calculate_portfolio_returns
from quant_platform.features.portfolio.domain.sharpe import calculate_sharpe_ratio
from quant_platform.features.portfolio.interfaces.factor_provider import (
    FactorDataProviderProtocol,
)
from quant_platform.features.portfolio.interfaces.provider import (
    MarketDataProviderProtocol,
)
from quant_platform.features.portfolio.interfaces.repository import (
    PortfolioRepositoryProtocol,
)
from quant_platform.features.portfolio.schemas import PortfolioAnalytics


class PortfolioAnalyticsService:
    def __init__(
        self,
        repository: PortfolioRepositoryProtocol,
        market_data_provider: MarketDataProviderProtocol,
        factor_provider: FactorDataProviderProtocol,
    ):
        self._repo = repository
        self._market_data = market_data_provider
        self._factor_provider = factor_provider

    async def get_analytics(
        self,
        user_id: uuid.UUID,
        start_date: date,
    ) -> PortfolioAnalytics:

        holdings = await self._repo.get_user_portfolio(user_id)

        if not holdings:
            ...

        tickers = [holding.ticker for holding in holdings]

        prices = await self._market_data.get_historical_prices(
            tickers,
            start_date.isoformat(),
        )

        weights = calculate_weights(holdings)

        portfolio_returns = calculate_portfolio_returns(
            prices,
            weights,
        )

        sharpe = calculate_sharpe_ratio(
            portfolio_returns,
        )

        ff3 = await self._factor_provider.get_fama_french_3(
            start_date,
        )

        ff5 = await self._factor_provider.get_fama_french_5(
            start_date,
        )

        ff3_result = calculate_fama_french_3(
            portfolio_returns,
            ff3,
        )

        ff5_result = calculate_fama_french_5(
            portfolio_returns,
            ff5,
        )

        return PortfolioAnalytics(
            sharpe_ratio=sharpe,
            fama_french_3=ff3_result,
            fama_french_5=ff5_result,
        )
