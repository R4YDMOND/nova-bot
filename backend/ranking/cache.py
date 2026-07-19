from functools import wraps
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, Optional
import hashlib


class CacheLayer:
    def __init__(self):
        self._cache: Dict[str, Any] = {}
        self._ttl: Dict[str, datetime] = {}

    def get(self, key: str) -> Optional[Any]:
        if key in self._cache and datetime.utcnow() < self._ttl.get(key, datetime.min):
            return self._cache[key]
        self.delete(key)
        return None

    def set(self, key: str, value: Any, ttl_seconds: int = 60):
        self._cache[key] = value
        self._ttl[key] = datetime.utcnow() + timedelta(seconds=ttl_seconds)

    def delete(self, key: str):
        self._cache.pop(key, None)
        self._ttl.pop(key, None)

    def stats(self) -> Dict[str, int]:
        now = datetime.utcnow()
        active = sum(1 for k, exp in self._ttl.items() if exp > now)
        return {
            "total_keys": len(self._cache),
            "active_keys": active,
            "expired_keys": len(self._cache) - active,
        }

    def clear(self):
        self._cache.clear()
        self._ttl.clear()


cache = CacheLayer()


def cached(ttl: int = 60, key_prefix: str = ""):
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            key = hashlib.md5(f"{key_prefix}:{func.__name__}:{args}:{kwargs}".encode()).hexdigest()
            hit = cache.get(key)
            if hit is not None:
                return hit
            result = await func(*args, **kwargs)
            cache.set(key, result, ttl)
            return result
        return wrapper
    return decorator