from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from quant_platform.core.database import get_async_session
from quant_platform.features.transactions.repository import TransactionRepository
from quant_platform.features.transactions.service import TransactionService


def _get_transaction_repository(
    session: AsyncSession = Depends(get_async_session),
) -> TransactionRepository:
    return TransactionRepository(session)


def get_transaction_service(
    repository: TransactionRepository = Depends(_get_transaction_repository),
    session: AsyncSession = Depends(get_async_session),
) -> TransactionService:
    return TransactionService(repository, session)
