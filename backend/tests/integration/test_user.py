from fastapi import status
from httpx2 import AsyncClient

from quant_platform.models.user import User


async def test_current_user_valid_user(client: AsyncClient, initial_user: User):
    payload = {
        "username": initial_user.email,
        "password": "SecurePassword123!",
    }
    login_res = await client.post("/auth/login", data=payload)

    assert login_res.status_code == status.HTTP_200_OK

    token = login_res.json()["access_token"]

    current_user = await client.get(
        "/users/me", headers={"Authorization": f"Bearer {token}"}
    )

    assert current_user.status_code == status.HTTP_200_OK
