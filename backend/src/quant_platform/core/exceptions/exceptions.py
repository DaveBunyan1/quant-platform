from uuid import UUID


class TransactionNotFound(Exception):
    def __init__(self, transaction_id: UUID):
        self.transaction_id = transaction_id
        super().__init__(f"Transaction {transaction_id} was not found")


class DatabaseQueryError(Exception):
    """Raised when a database query execution fails."""

    def __init__(
        self, repository: str, message: str, original_error: Exception | None = None
    ):
        self.repository = repository
        self.message = message
        self.original_error = original_error
        super().__init__(f"[{repository}] {message}")


class MarketDataFetchError(Exception):
    """Raised when an external market data provider request fails."""

    def __init__(
        self, provider: str, message: str, original_error: Exception | None = None
    ):
        self.provider = provider
        self.message = message
        self.original_error = original_error
        super().__init__(f"[{provider}] {message}")
