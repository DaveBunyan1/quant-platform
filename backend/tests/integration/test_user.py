import uuid

import pytest
from fastapi import status
from httpx2 import AsyncClient

from quant_platform.auth.token import create_access_token
from quant_platform.models.user import User


@pytest.mark.asyncio
class TestGetCurrentUserFailures:
    async def test_current_user_valid_user(
        self, client: AsyncClient, initial_user: User
    ):
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

    async def test_me_missing_authorization_header(self, client: AsyncClient):
        """No Authorization header → 401 from OAuth2PasswordBearer."""
        resp = await client.get("/users/me")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED
        # FastAPI/OAuth2 default detail
        assert resp.json()["detail"] == "Not authenticated"
        assert "WWW-Authenticate" in resp.headers
        assert resp.headers["WWW-Authenticate"] == "Bearer"

    async def test_me_malformed_authorization_header(self, client: AsyncClient):
        """Header present but not 'Bearer <token>' → 401."""
        resp = await client.get(
            "/users/me",
            headers={"Authorization": "Token some-garbage"},
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED
        assert resp.json()["detail"] == "Not authenticated"
        assert resp.headers.get("WWW-Authenticate") == "Bearer"

    async def test_me_empty_bearer_token(self, client: AsyncClient):
        """'Bearer ' with nothing after it → 401."""
        resp = await client.get(
            "/users/me",
            headers={"Authorization": "Bearer "},
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_me_invalid_token(self, client: AsyncClient):
        """Completely invalid JWT → 401 from decode_access_token."""
        resp = await client.get(
            "/users/me",
            headers={"Authorization": "Bearer this.is.not.a.valid.jwt"},
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED
        assert resp.json()["detail"] == "Invalid or expired access token"
        assert resp.headers.get("WWW-Authenticate") == "Bearer"

    async def test_me_token_for_non_existent_user(
        self,
        client: AsyncClient,
    ):
        """
        Valid JWT whose `sub` points to a user that no longer exists → 401.
        """
        fake_id = uuid.uuid4()
        token = create_access_token(user_id=fake_id)

        resp = await client.get(
            "/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED
        assert resp.json()["detail"] == "No user found"
        assert resp.headers.get("WWW-Authenticate") == "Bearer"
