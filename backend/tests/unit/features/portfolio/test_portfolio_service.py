import uuid
from unittest.mock import AsyncMock

import pytest

from quant_platform.features.portfolio.schemas import PortfolioSummaryResponse
from quant_platform.features.portfolio.service import PortfolioService


@pytest.fixture
def mock_repository() -> AsyncMock:
    return AsyncMock()


@pytest.fixture
def mock_market_data_provider() -> AsyncMock:
    return AsyncMock()


@pytest.fixture
def portfolio_service(
    mock_repository: AsyncMock, mock_market_data_provider: AsyncMock
) -> PortfolioService:
    return PortfolioService(
        repository=mock_repository,
        market_data_provider=mock_market_data_provider,
    )


async def test_get_portfolio_summary_empty_portfolio(
    portfolio_service: PortfolioService,
    mock_repository: AsyncMock,
    mock_market_data_provider: AsyncMock,
) -> None:
    """Returns an empty summary response when user has no transactions."""
    user_id = uuid.uuid7()
    mock_repository.get_user_portfolio.return_value = []

    result = await portfolio_service.get_portfolio_summary(user_id)

    assert isinstance(result, PortfolioSummaryResponse)
    assert result.holdings == []
    mock_repository.get_user_portfolio.assert_awaited_once_with(user_id)
    # Market data provider should not be called if DB yields zero holdings
    mock_market_data_provider.get_prices.assert_not_called()


async def test_get_portfolio_summary_calculates_metrics_correctly(
    portfolio_service: PortfolioService,
    mock_repository: AsyncMock,
    mock_market_data_provider: AsyncMock,
) -> None:
    """
    Correctly enriches database holdings with live prices and computes PnL and weight.
    """
    user_id = uuid.uuid7()

    # Mock DB row objects (simulating namedtuple / SQLAlchemy Row)
    class DummyRow:
        def __init__(
            self,
            ticker: str,
            shares: float,
            cost_basis: float,
            price_per_share: float,
        ):
            self.ticker = ticker
            self.shares = shares
            self.cost_basis = cost_basis
            self.price_per_share = price_per_share

    mock_repository.get_user_portfolio.return_value = [
        DummyRow(
            ticker="AAPL",
            shares=10.0,
            cost_basis=1500.0,
            price_per_share=150.0,
        ),
        DummyRow(
            ticker="MSFT",
            shares=5.0,
            cost_basis=1000.0,
            price_per_share=200.0,
        ),
    ]

    mock_market_data_provider.get_prices.return_value = {
        "AAPL": 200.0,  # AAPL position value: 10 * 200 = 2000
        "MSFT": 300.0,  # MSFT position value: 5 * 300  = 1500
    }  # Total Portfolio Value = 3500.0

    response = await portfolio_service.get_portfolio_summary(user_id)

    assert isinstance(response, PortfolioSummaryResponse)
    assert len(response.holdings) == 2

    aapl = next(h for h in response.holdings if h["ticker"] == "AAPL")
    assert aapl["shares"] == 10.0
    assert aapl["cost_basis"] == 1500.0
    assert aapl["avg_price_per_share"] == 150.0
    assert aapl["current_price"] == 200.0
    assert aapl["current_value"] == 2000.0
    assert aapl["unrealized_pnl"] == 500.0  # 2000 - 1500
    assert (
        pytest.approx(aapl["unrealized_pnl_pct"], 0.01) == 33.33
    )  # (500 / 1500) * 100
    assert pytest.approx(aapl["weight"], 0.01) == 0.5714  # 2000 / 3500

    msft = next(h for h in response.holdings if h["ticker"] == "MSFT")
    assert msft["current_value"] == 1500.0
    assert msft["unrealized_pnl"] == 500.0  # 1500 - 1000
    assert pytest.approx(msft["weight"], 0.01) == 0.4286  # 1500 / 3500
