import uuid
from collections.abc import Sequence
from typing import Any

from sqlalchemy import Row, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from quant_platform.core.exceptions.exceptions import DatabaseQueryError
from quant_platform.features.portfolio.metrics import (
    DB_QUERY_LATENCY,
    DB_QUERY_REQUESTS,
)
from quant_platform.logging import get_logger

logger = get_logger(__name__)


class SQLAlchemyPortfolioRepository:
    """Repository for portfolio aggregation queries."""

    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_user_portfolio(self, user_id: uuid.UUID) -> Sequence[Row[Any]]:
        """
        Return aggregated holdings for a user.

        Each row contains:
        - ticker
        - shares (sum)
        - cost_basis (sum of shares * price_per_share)
        - price_per_share (weighted average)

        Returns an empty sequence if the user has no transactions.
        """
        sql = text(
            """
            SELECT
                ticker,
                SUM(shares) AS shares,
                SUM(shares * price_per_share) AS cost_basis,
                CASE
                    WHEN SUM(shares) = 0 THEN 0
                    ELSE SUM(shares * price_per_share) / SUM(shares)
                END AS price_per_share
            FROM transactions
            WHERE user_id = :user_id
            GROUP BY ticker
            """
        )

        try:
            with DB_QUERY_LATENCY.time():
                result = await self._session.execute(sql, {"user_id": user_id})
                rows = result.all()

            DB_QUERY_REQUESTS.labels(result="success").inc()
            return rows

        except SQLAlchemyError as exc:
            DB_QUERY_REQUESTS.labels(result="error").inc()
            logger.error(
                "Failed to fetch user portfolio",
                extra={
                    "user_id": str(user_id),
                    "error": str(exc),
                },
                exc_info=True,
            )
            raise DatabaseQueryError(
                f"Failed to execute portfolio query for user {user_id}"
            ) from exc
