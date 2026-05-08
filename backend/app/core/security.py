from datetime import UTC, datetime, timedelta
from uuid import UUID

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
BCRYPT_MAX_PASSWORD_BYTES = 72


def normalize_bcrypt_password(password: str) -> str:
    password_bytes = password.encode("utf-8")[:BCRYPT_MAX_PASSWORD_BYTES]
    return password_bytes.decode("utf-8", errors="ignore")


def hash_password(password: str) -> str:
    return password_context.hash(normalize_bcrypt_password(password))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_context.verify(
        normalize_bcrypt_password(plain_password),
        hashed_password,
    )


def create_access_token(user_id: UUID, role: str) -> str:
    expires_at = datetime.now(UTC) + timedelta(
        minutes=settings.jwt_access_token_expire_minutes,
    )
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expires_at,
    }
    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError as exc:
        raise ValueError("Invalid access token") from exc
