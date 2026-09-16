from quant_platform.auth.password import (
    hash_password,
    hash_token,
    verify_and_update_password,
    verify_password,
)


def test_hash_password_and_verify():
    password = "SuperSecretPassword123!"
    hashed = hash_password(password)

    assert hashed != password

    # Salt check: hashing the same password twice produces distinct hashes
    assert hash_password(password) != hashed

    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_hash_token_deterministic():
    token = "reset-token-12345"
    expected_hash = "f444e512a1aad80373f5af28e69b455c91ee766a64ed64968ec92d99a6644cd0"

    assert hash_token(token) == expected_hash
    assert hash_token(token) == hash_token(token)


def test_verify_and_update_password():
    password = "MySecurePassword456!"
    hashed = hash_password(password)

    is_valid, new_hash = verify_and_update_password(password, hashed)
    assert is_valid is True
    assert new_hash is None

    is_valid, new_hash = verify_and_update_password("WrongPassword", hashed)
    assert is_valid is False
    assert new_hash is None
