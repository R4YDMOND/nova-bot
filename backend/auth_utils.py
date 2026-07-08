from passlib.context import CryptContext
import secrets
from datetime import datetime, timedelta

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def generate_verification_token() -> str:
    return secrets.token_urlsafe(32)

def token_expiry(hours: int = 24) -> datetime:
    return datetime.utcnow() + timedelta(hours=hours)