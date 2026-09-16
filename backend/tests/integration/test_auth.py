import pytest
from fastapi import status
from httpx2 import AsyncClient

from quant_platform.models.user import User
from quant_platform.settings import settings


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, initial_user: User):
    """
    Tests successful login with form data and verifies tokens + httpOnly cookies.
    """
    payload = {
        "username": initial_user.email,
        "password": "SecurePassword123!",  # Default password set in create_user
    }

    # Use data= for form payload (not json=)
    response = await client.post("/auth/login", data=payload)

    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer" if "token_type" in data else True
    assert data["expires_in"] == settings.access_token_expire_minutes * 60

    # Verify refresh token cookie is set
    assert settings.refresh_token_cookie_name in response.cookies
    cookie_value = response.cookies[settings.refresh_token_cookie_name]
    assert cookie_value == data["refresh_token"]


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient, initial_user: User):
    """
    Tests login failure with wrong password.
    """
    payload = {
        "username": initial_user.email,
        "password": "WrongPassword123!",
    }

    response = await client.post("/auth/login", data=payload)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "Incorrect email or password"
    assert settings.refresh_token_cookie_name not in response.cookies


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    """
    Tests login failure for a user that does not exist in DB.
    """
    payload = {
        "username": "nonexistent@example.com",
        "password": "SomePassword123!",
    }

    response = await client.post("/auth/login", data=payload)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "Incorrect email or password"
