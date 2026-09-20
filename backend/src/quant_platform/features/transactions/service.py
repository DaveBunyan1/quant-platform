from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from quant_platform.features.transactions.exceptions import TransactionNotFound
from quant_platform.features.transactions.repository import TransactionRepository
from quant_platform.features.transactions.schemas import (
    TransactionCreate,
    TransactionRead,
)


class TransactionService:
    def __init__(
        self, repository: TransactionRepository, session: AsyncSession
    ) -> None:
        self._repository = repository
        self._session = session

    async def get_transaction(
        self,
        user_id: UUID,
        transaction_id: UUID,
    ) -> TransactionRead:
        transaction = await self._repository.get_by_id(
            user_id,
            transaction_id,
        )

        if transaction is None:
            raise TransactionNotFound(transaction_id)

        return transaction

    async def get_all_transactions(self, user_id: UUID) -> list[TransactionRead]:
        return await self._repository.get_all_for_user(user_id)

    async def create_transaction(
        self,
        user_id: UUID,
        transaction: TransactionCreate,
    ) -> TransactionRead:
        txn = await self._repository.create(user_id, transaction)

        await self._session.commit()

        return txn
