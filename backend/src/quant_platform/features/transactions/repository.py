from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from quant_platform.features.transactions.schemas import (
    TransactionCreate,
    TransactionRead,
)
from quant_platform.models.transaction import Transaction


class TransactionRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_by_id(
        self,
        user_id: UUID,
        transaction_id: UUID,
    ) -> TransactionRead | None:
        query = select(Transaction).where(
            Transaction.user_id == user_id, Transaction.id == transaction_id
        )

        transaction = await self._session.scalar(query)

        if transaction is None:
            return None

        return TransactionRead.model_validate(transaction)

    async def get_all_for_user(
        self,
        user_id: UUID,
    ) -> list[TransactionRead]:
        query = select(Transaction).where(Transaction.user_id == user_id)

        result = await self._session.scalars(query)

        transactions = result.all()

        return [
            TransactionRead.model_validate(transaction) for transaction in transactions
        ]

    async def create(
        self,
        user_id: UUID,
        transaction: TransactionCreate,
    ) -> TransactionRead:
        txn = Transaction(**transaction.model_dump(), user_id=user_id)
        self._session.add(txn)

        await self._session.flush()
        await self._session.refresh(txn)
        await self._session.commit()

        return TransactionRead.model_validate(txn)

    async def delete(
        self,
        user_id: UUID,
        transaction_id: UUID,
    ) -> None: ...
