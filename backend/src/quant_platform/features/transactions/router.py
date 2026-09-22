from uuid import UUID

from fastapi import APIRouter, Body, Depends

from quant_platform.auth.dependencies import get_current_user
from quant_platform.features.transactions.dependencies import get_transaction_service
from quant_platform.features.transactions.schemas import TransactionCreate
from quant_platform.features.transactions.service import TransactionService
from quant_platform.schemas.users import UserRead

router = APIRouter(prefix="/api/transactions")


@router.get("/")
async def get_transactions(
    user: UserRead = Depends(get_current_user),
    service: TransactionService = Depends(get_transaction_service),
):
    """Return all transactions for a user"""
    txs = await service.get_all_transactions(user_id=user.id)
    return {"holdings": txs}


@router.get("/{transaction_id}")
async def get_transaction(
    transaction_id: UUID,
    user: UserRead = Depends(get_current_user),
    service: TransactionService = Depends(get_transaction_service),
):
    return await service.get_transaction(user_id=user.id, transaction_id=transaction_id)


@router.post("/")
async def create_transaction(
    user: UserRead = Depends(get_current_user),
    service: TransactionService = Depends(get_transaction_service),
    transaction: TransactionCreate = Body(),
):
    """Create a new transaction for a user"""
    return await service.create_transaction(
        transaction=transaction,
        user_id=user.id,
    )


@router.delete("/{transaction_id}")
def delete_transaction(transaction_id: str, user: UserRead = Depends(get_current_user)):
    """Delete a transaction for a user"""
    pass
