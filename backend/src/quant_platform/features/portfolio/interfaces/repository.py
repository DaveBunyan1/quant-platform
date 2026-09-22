import uuid
from collections.abc import Sequence
from typing import Any, Protocol


class PortfolioRepositoryProtocol(Protocol):
    async def get_user_portfolio(self, user_id: uuid.UUID) -> Sequence[Any]:
        """Fetches aggregated holdings (ticker, shares, cost_basis, price_per_share)

        from the database.
        """
        ...
