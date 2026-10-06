from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, status

from quant_platform.auth.dependencies import get_current_user
from quant_platform.features.portfolio.dependencies import (
    get_portfolio_service,
)
from quant_platform.features.portfolio.schemas import (
    PortfolioAnalytics,
    PortfolioSummary,
)
from quant_platform.features.portfolio.service import PortfolioService
from quant_platform.schemas.users import UserRead

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio Holdings"])


@router.get(
    "/",
    status_code=status.HTTP_200_OK,
    summary="Get user portfolio holdings with live valuation",
)
async def get_holdings_for_user(
    current_user: UserRead = Depends(get_current_user),
    service: PortfolioService = Depends(get_portfolio_service),
) -> PortfolioSummary:
    """
    Fetches real-time portfolio holdings, current market valuations, and
    unrealized profit/loss metrics for the authenticated user.
    """
    return await service.get_portfolio_summary(user_id=current_user.id)


@router.get(
    "/analytics",
)
async def get_portfolio_analytics(
    start_date: date,
    user_id: UUID = Depends(get_current_user),
    service: PortfolioAnalyticsService = Depends(
        get_portfolio_analytics_service,
    ),
) -> PortfolioAnalytics:
    return await service.get_analytics(
        user_id=user_id,
        start_date=start_date.isoformat(),
    )
