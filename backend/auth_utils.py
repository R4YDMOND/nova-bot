import os
import secrets
from datetime import datetime, timedelta

from passlib.context import CryptContext
from jose import JWTError, jwt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ==================== Пароли ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ==================== Верификация e-mail ====================

def generate_verification_token() -> str:
    return secrets.token_urlsafe(32)


def token_expiry(hours: int = 24) -> datetime:
    return datetime.utcnow() + timedelta(hours=hours)


# ==================== JWT (access + refresh) ====================
# SECRET_KEY обязателен в проде — без него подписи токенов небезопасны.
# Локально/на первом деплое падать не будем, но громко предупредим в логах.

SECRET_KEY = os.getenv("SECRET_KEY", "")
if not SECRET_KEY:
    SECRET_KEY = secrets.token_hex(32)
    print("WARNING: SECRET_KEY не задан в переменных окружения — сгенерирован временный "
          "(на каждый рестарт сервера новый!). Все выданные ранее токены станут "
          "невалидными при перезапуске. Задайте SECRET_KEY на Render как можно скорее.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str, expected_type: str = "access") -> dict | None:
    """Возвращает payload, если токен валиден, подпись верна, срок не истёк
    и тип совпадает (access != refresh — чтобы refresh-токен нельзя было
    подсунуть вместо access, и наоборот)."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
    if payload.get("type") != expected_type:
        return None
    return payload
