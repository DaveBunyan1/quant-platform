from fastapi import APIRouter

router = APIRouter(prefix="/api/holdings")


@router.get("/holdings")
def get_holdings(user_id: str):
    """Return all holdings for a user"""
    pass
