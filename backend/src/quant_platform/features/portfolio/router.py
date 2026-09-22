from fastapi import APIRouter, Depends

from quant_platform.auth.dependencies import get_current_user
from quant_platform.features.holdings.first_attempt import get_holdings
from quant_platform.schemas.users import UserRead

router = APIRouter(prefix="/holdings")


@router.get("/")
def get_holdings_for_user(user: UserRead = Depends(get_current_user)):
    holdings = get_holdings(user)
    return holdings
