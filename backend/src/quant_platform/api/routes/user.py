from fastapi import APIRouter, Depends

from quant_platform.auth.dependencies import get_current_user
from quant_platform.models.user import User
from quant_platform.schemas.users import UserRead

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user
