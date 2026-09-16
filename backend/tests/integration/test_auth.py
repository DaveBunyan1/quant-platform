from collections.abc import Callable, Coroutine
from datetime import UTC, datetime, timedelta
from http.cookies import SimpleCookie
from typing import Any

import pytest
from fastapi import status
from httpx2 import AsyncClient, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from quant_platform.auth.password import hash_token, verify_password
from quant_platform.models.token import RefreshToken
from quant_platform.models.user import User
from quant_platform.schemas.users import UserCreate
from quant_platform.settings import settings


def extract_cookie_value(response: Response, name: str) -> str | None:
    """Parse a cookie out of the raw Set-Cookie header(s)."""
    set_cookies = response.headers.get_list("set-cookie") or []
    for header in set_cookies:
        if header.lower().startswith(f"{name.lower()}="):
            cookie = SimpleCookie()
            cookie.load(header)
            return cookie[name].value
    return None


async def get_csrf_token(client: AsyncClient) -> str:
    """Return a valid csrftoken, forcing the middleware to emit one if needed."""
    if "csrftoken" in client.cookies:
        return client.cookies["csrftoken"]

    resp = await client.get("/api/health")
    token = extract_cookie_value(resp, "csrftoken")
    if token is None:
        raise RuntimeError("CSRF cookie was not set by the middleware")
    return token


async def login_and_get_tokens(client: AsyncClient, user: User):
    """Convenience: login and return (refresh_token, csrf_token)."""
    resp = await client.post(
        "/auth/login",
        data={"username": user.email, "password": "SecurePassword123!"},
    )
    assert resp.status_code == status.HTTP_200_OK

    refresh = (
        resp.cookies.get(settings.refresh_token_cookie_name)
        or resp.json().get("refresh_token")
        or extract_cookie_value(resp, settings.refresh_token_cookie_name)
    )
    assert refresh is not None

    csrf = await get_csrf_token(client)
    return refresh, csrf


@pytest.mark.asyncio
class TestLoginEndpoint:
    async def test_login_success(self, client: AsyncClient, initial_user: User):
        """
        Tests successful login with form data and verifies tokens + httpOnly cookies.
        """
        payload = {
            "username": initial_user.email,
            "password": "SecurePassword123!",
        }

        response = await client.post("/auth/login", data=payload)

        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["expires_in"] == settings.access_token_expire_minutes * 60

        assert settings.refresh_token_cookie_name in response.cookies
        cookie_value = response.cookies[settings.refresh_token_cookie_name]
        assert cookie_value == data["refresh_token"]

        set_cookie = response.headers["set-cookie"]

        assert f"{settings.refresh_token_cookie_name}=" in set_cookie
        assert "HttpOnly" in set_cookie
        assert "SameSite=lax" in set_cookie
        assert "Path=/auth" in set_cookie

    async def test_login_invalid_password(
        self, client: AsyncClient, initial_user: User
    ):
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

    async def test_login_nonexistent_user(self, client: AsyncClient):
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

    async def test_login_password_not_returned(
        self, client: AsyncClient, initial_user: User
    ):
        payload = {
            "username": initial_user.email,
            "password": "SecurePassword123!",
        }

        response = await client.post("/auth/login", data=payload)

        assert response.status_code == status.HTTP_200_OK

        data = response.json()

        assert "hashed_password" not in data
        assert "password" not in data

    async def test_login_response_shape(self, client: AsyncClient, initial_user: User):
        payload = {
            "username": initial_user.email,
            "password": "SecurePassword123!",
        }

        response = await client.post("/auth/login", data=payload)

        assert response.status_code == status.HTTP_200_OK

        data = response.json()

        assert set(data) == {
            "access_token",
            "refresh_token",
            "token_type",
            "expires_in",
        }


@pytest.mark.asyncio
class TestRegisterEndpoint:
    async def test_register_success(
        self,
        client: AsyncClient,
        create_user: Callable[..., Coroutine[Any, Any, UserCreate]],
    ):
        user_create = await create_user()

        payload = user_create.model_dump()

        response = await client.post(
            "/auth/register",
            json=payload,
        )

        assert response.status_code == status.HTTP_201_CREATED

        data = response.json()
        assert "password" not in data
        assert "hashed_password" not in data
        assert "access_token" not in data
        assert "refresh_token" not in data

    async def test_register_password_is_hashed(
        self,
        client: AsyncClient,
        create_user: Callable[..., Coroutine[Any, Any, UserCreate]],
        db_session: AsyncSession,
    ):
        user_create = await create_user()

        response = await client.post(
            "/auth/register",
            json=user_create.model_dump(),
        )

        assert response.status_code == status.HTTP_201_CREATED

        result = await db_session.execute(
            select(User).where(User.email == user_create.email)
        )
        user = result.scalar_one()

        assert user.hashed_password != user_create.password
        assert verify_password(
            user_create.password,
            user.hashed_password,
        )

    async def test_register_duplicate_email(
        self,
        client: AsyncClient,
        initial_user: User,
        create_user: Callable[..., Coroutine[Any, Any, UserCreate]],
    ):
        user_create = await create_user(
            email=initial_user.email,
        )

        response = await client.post(
            "/auth/register",
            json=user_create.model_dump(),
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()["detail"] == "Email already registered"

    async def test_register_invalid_email(
        self,
        client: AsyncClient,
    ):
        payload = {
            "username": "Test User",
            "email": "not-an-email",
            "password": "SecurePassword123!",
        }

        response = await client.post(
            "/auth/register",
            json=payload,
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

    async def test_register_missing_email(self, client: AsyncClient):
        payload = {
            "username": "Test User",
            "password": "SecurePassword123!",
        }

        response = await client.post(
            "/auth/register",
            json=payload,
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

    async def test_register_user_login(
        self,
        client: AsyncClient,
        create_user: Callable[..., Coroutine[Any, Any, UserCreate]],
    ):
        user_create = await create_user()

        payload = user_create.model_dump()

        response = await client.post(
            "/auth/register",
            json=payload,
        )

        assert response.status_code == status.HTTP_201_CREATED

        login_response = await client.post(
            "/auth/login",
            data={
                "username": user_create.email,
                "password": user_create.password,
            },
        )

        assert login_response.status_code == 200
        assert login_response.json()["access_token"]


@pytest.mark.asyncio
class TestRefreshEndpoint:
    async def test_refresh_success(
        self,
        client: AsyncClient,
        initial_user: User,
    ):
        login_response = await client.post(
            "/auth/login",
            data={
                "username": initial_user.email,
                "password": "SecurePassword123!",
            },
        )
        assert login_response.status_code == status.HTTP_200_OK

        refresh_token = login_response.cookies.get(settings.refresh_token_cookie_name)
        if refresh_token is None:
            refresh_token = login_response.json().get("refresh_token")
        assert refresh_token is not None

        csrf_token = await get_csrf_token(client)

        response = await client.post(
            "/auth/refresh",
            cookies={
                settings.refresh_token_cookie_name: refresh_token,
                "csrftoken": csrf_token,
            },
            headers={"x-csrftoken": csrf_token},
        )

        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert "access_token" in data
        assert "expires_in" in data
        assert data["expires_in"] == settings.access_token_expire_minutes * 60
        assert "refresh_token" not in data

        new_refresh_token = response.cookies[settings.refresh_token_cookie_name]
        assert new_refresh_token != refresh_token

        set_cookie = response.headers["set-cookie"]
        assert f"{settings.refresh_token_cookie_name}=" in set_cookie
        assert "HttpOnly" in set_cookie
        assert "SameSite=lax" in set_cookie
        assert "Path=/auth" in set_cookie
        if settings.token_cookie_secure:
            assert "Secure" in set_cookie
        else:
            assert "Secure" not in set_cookie

    async def test_refresh_missing_token(self, client: AsyncClient):
        response = await client.post("/auth/refresh")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json()["detail"] == "Refresh token missing"

    async def test_refresh_invalid_token(self, client: AsyncClient):
        csrf_token = await get_csrf_token(client)

        response = await client.post(
            "/auth/refresh",
            cookies={
                settings.refresh_token_cookie_name: "invalid-token",
                "csrftoken": csrf_token,
            },
            headers={"x-csrftoken": csrf_token},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json()["detail"] == "Invalid or expired refresh token"

    async def test_refresh_old_token_rejected_after_rotation(
        self,
        client: AsyncClient,
        initial_user: User,
    ):
        login_response = await client.post(
            "/auth/login",
            data={
                "username": initial_user.email,
                "password": "SecurePassword123!",
            },
        )
        assert login_response.status_code == status.HTTP_200_OK

        old_token = login_response.cookies.get(settings.refresh_token_cookie_name)
        if old_token is None:
            old_token = login_response.json().get("refresh_token")
        assert old_token is not None

        csrf_token = await get_csrf_token(client)
        refresh_response = await client.post(
            "/auth/refresh",
            cookies={
                settings.refresh_token_cookie_name: old_token,
                "csrftoken": csrf_token,
            },
            headers={"x-csrftoken": csrf_token},
        )
        assert refresh_response.status_code == status.HTTP_200_OK

        new_token = refresh_response.cookies[settings.refresh_token_cookie_name]
        assert new_token != old_token

        old_token_response = await client.post(
            "/auth/refresh",
            cookies={
                settings.refresh_token_cookie_name: old_token,
                "csrftoken": csrf_token,
            },
            headers={"x-csrftoken": csrf_token},
        )
        assert old_token_response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_refresh_revokes_entire_family_on_reuse(
        self, client: AsyncClient, initial_user: User, db_session: AsyncSession
    ):
        """
        After a successful rotation the old token must be unusable and the
        whole family must be marked revoked (classic reuse detection).
        """
        old_token, csrf = await login_and_get_tokens(client, initial_user)

        first = await client.post(
            "/auth/refresh",
            cookies={
                settings.refresh_token_cookie_name: old_token,
                "csrftoken": csrf,
            },
            headers={"x-csrftoken": csrf},
        )
        assert first.status_code == status.HTTP_200_OK
        new_token = first.cookies.get(
            settings.refresh_token_cookie_name
        ) or extract_cookie_value(first, settings.refresh_token_cookie_name)
        assert new_token and new_token != old_token

        reuse = await client.post(
            "/auth/refresh",
            cookies={
                settings.refresh_token_cookie_name: old_token,
                "csrftoken": csrf,
            },
            headers={"x-csrftoken": csrf},
        )
        assert reuse.status_code == status.HTTP_401_UNAUTHORIZED

        result = await db_session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == hash_token(old_token))
        )
        old_db = result.scalar_one()
        assert old_db.revoked is True

        result = await db_session.execute(
            select(RefreshToken).where(RefreshToken.family_id == old_db.family_id)
        )
        family_tokens = result.scalars().all()
        assert all(t.revoked for t in family_tokens)

        newest = await client.post(
            "/auth/refresh",
            cookies={
                settings.refresh_token_cookie_name: new_token,
                "csrftoken": csrf,
            },
            headers={"x-csrftoken": csrf},
        )
        assert newest.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_refresh_with_expired_token(
        self, client: AsyncClient, initial_user: User, db_session: AsyncSession
    ):
        """A token whose expires_at is in the past must be rejected."""
        refresh, csrf = await login_and_get_tokens(client, initial_user)

        # Force the token to be expired
        result = await db_session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == hash_token(refresh))
        )
        db_token = result.scalar_one()
        db_token.expires_at = datetime.now(UTC) - timedelta(minutes=1)
        await db_session.commit()

        resp = await client.post(
            "/auth/refresh",
            cookies={
                settings.refresh_token_cookie_name: refresh,
                "csrftoken": csrf,
            },
            headers={"x-csrftoken": csrf},
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED
        assert resp.json()["detail"] == "Invalid or expired refresh token"

    async def test_refresh_with_already_revoked_token(
        self, client: AsyncClient, initial_user: User, db_session: AsyncSession
    ):
        """A token that is already marked revoked must be rejected."""
        refresh, csrf = await login_and_get_tokens(client, initial_user)

        result = await db_session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == hash_token(refresh))
        )
        db_token = result.scalar_one()
        db_token.revoked = True
        await db_session.commit()

        resp = await client.post(
            "/auth/refresh",
            cookies={
                settings.refresh_token_cookie_name: refresh,
                "csrftoken": csrf,
            },
            headers={"x-csrftoken": csrf},
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED
        assert resp.json()["detail"] == "Invalid or expired refresh token"

    async def test_refresh_sets_correct_cookie_attributes(
        self,
        client: AsyncClient,
        initial_user: User,
    ):
        """All security-relevant Set-Cookie attributes must be present."""
        refresh, csrf = await login_and_get_tokens(client, initial_user)

        resp = await client.post(
            "/auth/refresh",
            cookies={
                settings.refresh_token_cookie_name: refresh,
                "csrftoken": csrf,
            },
            headers={"x-csrftoken": csrf},
        )
        assert resp.status_code == status.HTTP_200_OK

        set_cookie = resp.headers.get("set-cookie", "")
        assert f"{settings.refresh_token_cookie_name}=" in set_cookie
        assert "HttpOnly" in set_cookie
        assert "SameSite=lax" in set_cookie or "SameSite=Lax" in set_cookie
        assert "Path=/auth" in set_cookie

        expected_max_age = settings.refresh_token_expire_days * 24 * 3600
        assert f"Max-Age={expected_max_age}" in set_cookie

        if settings.token_cookie_secure:
            assert "Secure" in set_cookie
        else:
            assert "Secure" not in set_cookie

    async def test_refresh_returns_usable_access_token(
        self,
        client: AsyncClient,
        initial_user: User,
    ):
        """The access_token returned by /refresh must work on a protected route."""
        refresh, csrf = await login_and_get_tokens(client, initial_user)

        resp = await client.post(
            "/auth/refresh",
            cookies={
                settings.refresh_token_cookie_name: refresh,
                "csrftoken": csrf,
            },
            headers={"x-csrftoken": csrf},
        )
        assert resp.status_code == status.HTTP_200_OK
        access_token = resp.json()["access_token"]

        # Call any protected endpoint (adjust the path to one you have)
        me = await client.get(
            "/users/me",  # ← change if needed
            headers={"Authorization": f"Bearer {access_token}"},
        )
        assert me.status_code == status.HTTP_200_OK
        assert me.json()["email"] == initial_user.email

    async def test_refresh_missing_csrf_header_when_cookie_present(
        self,
        client: AsyncClient,
        initial_user: User,
    ):
        """CSRF middleware must reject the request when the header is absent."""
        refresh, _ = await login_and_get_tokens(client, initial_user)

        resp = await client.post(
            "/auth/refresh",
            cookies={settings.refresh_token_cookie_name: refresh},
            # deliberately NO x-csrftoken header
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    async def test_refresh_csrf_token_mismatch(
        self,
        client: AsyncClient,
        initial_user: User,
    ):
        """A wrong CSRF value must also be rejected."""
        refresh, csrf = await login_and_get_tokens(client, initial_user)

        resp = await client.post(
            "/auth/refresh",
            cookies={
                settings.refresh_token_cookie_name: refresh,
                "csrftoken": csrf,
            },
            headers={"x-csrftoken": "totally-wrong-value"},
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    async def test_multiple_successful_rotations(
        self,
        client: AsyncClient,
        initial_user: User,
    ):
        """Several successive rotations must keep producing new tokens."""
        token, csrf = await login_and_get_tokens(client, initial_user)
        seen = {token}

        for _ in range(3):
            assert isinstance(token, str)
            assert isinstance(csrf, str)
            resp = await client.post(
                "/auth/refresh",
                cookies={
                    settings.refresh_token_cookie_name: token,
                    "csrftoken": csrf,
                },
                headers={"x-csrftoken": csrf},
            )
            assert resp.status_code == status.HTTP_200_OK
            new_token = resp.cookies.get(
                settings.refresh_token_cookie_name
            ) or extract_cookie_value(resp, settings.refresh_token_cookie_name)
            assert new_token not in seen
            seen.add(new_token)
            token = new_token


@pytest.mark.asyncio
class TestLogoutEndpoint:
    async def test_logout_success(
        self, client: AsyncClient, initial_user: User, db_session: AsyncSession
    ):
        """Happy path: token is revoked in DB and cookie is cleared."""
        refresh, csrf = await login_and_get_tokens(client, initial_user)
        assert refresh is not None

        resp = await client.post(
            "/auth/logout",
            cookies={
                settings.refresh_token_cookie_name: refresh,
                "csrftoken": csrf,
            },
            headers={"x-csrftoken": csrf},
        )

        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert resp.content == b""

        set_cookie = resp.headers.get("set-cookie", "")
        assert settings.refresh_token_cookie_name in set_cookie
        assert (
            "Max-Age=0" in set_cookie
            or f"{settings.refresh_token_cookie_name}=;" in set_cookie
        )
        assert "Path=/auth" in set_cookie
        assert "HttpOnly" in set_cookie
        assert "SameSite=lax" in set_cookie or "SameSite=Lax" in set_cookie
        if settings.token_cookie_secure:
            assert "Secure" in set_cookie

        result = await db_session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == hash_token(refresh))
        )
        db_token = result.scalar_one()
        assert db_token.revoked is True

    async def test_logout_without_cookie(
        self,
        client: AsyncClient,
    ):
        """No refresh cookie → still 204 (idempotent) and no error."""
        resp = await client.post("/auth/logout")
        assert resp.status_code == status.HTTP_204_NO_CONTENT

        set_cookie = resp.headers.get("set-cookie", "")
        assert settings.refresh_token_cookie_name in set_cookie
        assert (
            "Max-Age=0" in set_cookie
            or f"{settings.refresh_token_cookie_name}=;" in set_cookie
        )

    async def test_logout_with_invalid_token(
        self,
        client: AsyncClient,
    ):
        """Invalid / unknown token → still 204, cookie cleared."""
        csrf = await get_csrf_token(client)

        resp = await client.post(
            "/auth/logout",
            cookies={
                settings.refresh_token_cookie_name: "not-a-real-token",
                "csrftoken": csrf,
            },
            headers={"x-csrftoken": csrf},
        )
        assert resp.status_code == status.HTTP_204_NO_CONTENT

        set_cookie = resp.headers.get("set-cookie", "")
        assert settings.refresh_token_cookie_name in set_cookie
        assert (
            "Max-Age=0" in set_cookie
            or f"{settings.refresh_token_cookie_name}=;" in set_cookie
        )

    async def test_logout_already_revoked_token(
        self, client: AsyncClient, initial_user: User, db_session: AsyncSession
    ):
        """Token that is already revoked → still 204 and stays revoked."""
        refresh, csrf = await login_and_get_tokens(client, initial_user)

        result = await db_session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == hash_token(refresh))
        )
        db_token = result.scalar_one()
        db_token.revoked = True
        await db_session.commit()

        resp = await client.post(
            "/auth/logout",
            cookies={
                settings.refresh_token_cookie_name: refresh,
                "csrftoken": csrf,
            },
            headers={"x-csrftoken": csrf},
        )
        assert resp.status_code == status.HTTP_204_NO_CONTENT

        await db_session.refresh(db_token)
        assert db_token.revoked is True

    async def test_logout_then_refresh_fails(
        self,
        client: AsyncClient,
        initial_user: User,
    ):
        """After logout the refresh token must be unusable."""
        refresh, csrf = await login_and_get_tokens(client, initial_user)

        logout_resp = await client.post(
            "/auth/logout",
            cookies={
                settings.refresh_token_cookie_name: refresh,
                "csrftoken": csrf,
            },
            headers={"x-csrftoken": csrf},
        )
        assert logout_resp.status_code == status.HTTP_204_NO_CONTENT

        refresh_resp = await client.post(
            "/auth/refresh",
            cookies={
                settings.refresh_token_cookie_name: refresh,
                "csrftoken": csrf,
            },
            headers={"x-csrftoken": csrf},
        )
        assert refresh_resp.status_code == status.HTTP_401_UNAUTHORIZED
        assert refresh_resp.json()["detail"] == "Invalid or expired refresh token"

    async def test_logout_missing_csrf_when_cookie_present(
        self,
        client: AsyncClient,
        initial_user: User,
    ):
        """
        CSRF middleware must reject the request when the sensitive cookie is present
        but the header is missing.
        """
        refresh, _ = await login_and_get_tokens(client, initial_user)

        resp = await client.post(
            "/auth/logout",
            cookies={settings.refresh_token_cookie_name: refresh},
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    async def test_logout_csrf_token_mismatch(
        self,
        client: AsyncClient,
        initial_user: User,
    ):
        """Wrong CSRF value → 403."""
        refresh, csrf = await login_and_get_tokens(client, initial_user)

        resp = await client.post(
            "/auth/logout",
            cookies={
                settings.refresh_token_cookie_name: refresh,
                "csrftoken": csrf,
            },
            headers={"x-csrftoken": "wrong-value"},
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    async def test_logout_clears_cookie_even_when_token_not_in_db(
        self,
        client: AsyncClient,
    ):
        """Cookie is always deleted, even if the token does not exist in the DB."""
        csrf = await get_csrf_token(client)

        resp = await client.post(
            "/auth/logout",
            cookies={
                settings.refresh_token_cookie_name: "non-existent-token",
                "csrftoken": csrf,
            },
            headers={"x-csrftoken": csrf},
        )
        assert resp.status_code == status.HTTP_204_NO_CONTENT

        set_cookie = resp.headers.get("set-cookie", "")
        assert f"{settings.refresh_token_cookie_name}=" in set_cookie
        assert (
            "Max-Age=0" in set_cookie
            or f"{settings.refresh_token_cookie_name}=;" in set_cookie
        )
        assert "Path=/auth" in set_cookie
